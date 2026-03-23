"""YouTube Data API v3 client.

Handles: channels.list, playlistItems.list, videos.list,
         commentThreads.list, search.list.
"""

from collections.abc import Iterable

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.config import settings

# Quota costs per endpoint
QUOTA_COSTS = {
    "channels.list": 1,
    "playlistItems.list": 1,
    "videos.list": 1,
    "commentThreads.list": 1,
    "search.list": 100,
}


class YouTubeDataAPI:
    """Wrapper around YouTube Data API v3 with quota tracking."""

    def __init__(self):
        self.service = None
        self.quota_used = 0

    @staticmethod
    def _chunks(values: list[str], size: int) -> Iterable[list[str]]:
        for index in range(0, len(values), size):
            yield values[index:index + size]

    def _get_service(self):
        if self.service is None:
            if not settings.YOUTUBE_API_KEY:
                raise RuntimeError("YOUTUBE_API_KEY is not configured.")
            self.service = build("youtube", "v3", developerKey=settings.YOUTUBE_API_KEY)
        return self.service

    async def get_channel(self, channel_id: str) -> dict:
        """Fetch channel metadata (1 unit)."""
        channels = await self.get_channels_batch([channel_id])
        return channels[0] if channels else {}

    async def get_channels_batch(self, channel_ids: list[str]) -> list[dict]:
        """Fetch channel metadata for up to 50 channels per request."""
        if not channel_ids:
            return []

        service = self._get_service()
        items: list[dict] = []
        for batch in self._chunks(channel_ids, 50):
            request = service.channels().list(
                part="snippet,statistics,contentDetails",
                id=",".join(batch),
                maxResults=len(batch),
            )
            try:
                response = request.execute()
            except Exception:
                response = {"items": []}
            self.quota_used += QUOTA_COSTS["channels.list"]
            items.extend(response.get("items", []))

        channels: list[dict] = []
        for item in items:
            snippet = item.get("snippet", {})
            statistics = item.get("statistics", {})
            uploads_playlist_id = (
                item.get("contentDetails", {})
                .get("relatedPlaylists", {})
                .get("uploads", "")
            )
            handle = snippet.get("customUrl") or snippet.get("title", "")
            if handle and not handle.startswith("@"):
                handle = f"@{handle}"

            channels.append(
                {
                    "id": item.get("id", ""),
                    "title": snippet.get("title", ""),
                    "description": snippet.get("description", ""),
                    "handle": handle,
                    "subscriber_count": int(statistics.get("subscriberCount", 0) or 0),
                    "video_count": int(statistics.get("videoCount", 0) or 0),
                    "view_count": int(statistics.get("viewCount", 0) or 0),
                    "thumbnail_url": (
                        snippet.get("thumbnails", {})
                        .get("default", {})
                        .get("url", "")
                    ),
                    "uploads_playlist_id": uploads_playlist_id,
                }
            )
        return channels

    async def get_video_ids(self, uploads_playlist_id: str) -> list[str]:
        """Fetch all video IDs from uploads playlist (~1 unit per 50 videos)."""
        return await self.get_playlist_video_ids(uploads_playlist_id)

    async def get_playlist_video_ids(
        self,
        uploads_playlist_id: str,
        limit: int | None = None,
    ) -> list[str]:
        """Paginate through playlistItems.list."""
        if not uploads_playlist_id:
            return []

        service = self._get_service()
        page_token = None
        video_ids: list[str] = []
        while True:
            request = service.playlistItems().list(
                part="contentDetails",
                playlistId=uploads_playlist_id,
                maxResults=50,
                pageToken=page_token,
            )
            try:
                response = request.execute()
            except Exception:
                break
            self.quota_used += QUOTA_COSTS["playlistItems.list"]

            for item in response.get("items", []):
                video_id = item.get("contentDetails", {}).get("videoId")
                if video_id:
                    video_ids.append(video_id)
                    if limit is not None and len(video_ids) >= limit:
                        return video_ids

            page_token = response.get("nextPageToken")
            if not page_token:
                break

        return video_ids

    async def get_videos_batch(self, video_ids: list[str]) -> list[dict]:
        """Batch fetch video metadata, 50 per call (1 unit per call)."""
        if not video_ids:
            return []

        service = self._get_service()
        videos: list[dict] = []
        for batch in self._chunks(video_ids, 50):
            request = service.videos().list(
                part="snippet,statistics,contentDetails",
                id=",".join(batch),
                maxResults=len(batch),
            )
            try:
                response = request.execute()
            except Exception:
                response = {"items": []}
            self.quota_used += QUOTA_COSTS["videos.list"]

            for item in response.get("items", []):
                snippet = item.get("snippet", {})
                statistics = item.get("statistics", {})
                videos.append(
                    {
                        "id": item.get("id", ""),
                        "title": snippet.get("title", ""),
                        "description": snippet.get("description", ""),
                        "published_at": snippet.get("publishedAt", ""),
                        "channel_id": snippet.get("channelId", ""),
                        "channel_title": snippet.get("channelTitle", ""),
                        "tags": snippet.get("tags", []),
                        "duration": item.get("contentDetails", {}).get("duration", ""),
                        "view_count": int(statistics.get("viewCount", 0) or 0),
                        "like_count": int(statistics.get("likeCount", 0) or 0),
                        "comment_count": int(statistics.get("commentCount", 0) or 0),
                        "thumbnail_url": (
                            snippet.get("thumbnails", {})
                            .get("high", {})
                            .get("url", "")
                            or snippet.get("thumbnails", {})
                            .get("default", {})
                            .get("url", "")
                        ),
                    }
                )
        return videos

    async def get_comments(self, video_id: str, max_pages: int = 2) -> list[dict]:
        """Fetch top-level comments (1 unit per page of 100)."""
        if not video_id:
            return []

        service = self._get_service()
        comments: list[dict] = []
        page_token = None
        for _ in range(max_pages):
            request = service.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=100,
                pageToken=page_token,
                order="relevance",
                textFormat="plainText",
            )
            try:
                response = request.execute()
            except Exception:
                break
            self.quota_used += QUOTA_COSTS["commentThreads.list"]

            for item in response.get("items", []):
                snippet = (
                    item.get("snippet", {})
                    .get("topLevelComment", {})
                    .get("snippet", {})
                )
                comments.append(
                    {
                        "text": snippet.get("textDisplay", ""),
                        "like_count": int(snippet.get("likeCount", 0) or 0),
                        "published_at": snippet.get("publishedAt", ""),
                        "author": snippet.get("authorDisplayName", ""),
                    }
                )

            page_token = response.get("nextPageToken")
            if not page_token:
                break

        return comments

    async def search_channels(self, query: str, max_results: int = 50) -> list[dict]:
        """Search for competitor channels (100 units per call!)."""
        service = self._get_service()
        request = service.search().list(
            part="snippet",
            q=query,
            type="channel",
            maxResults=max_results,
        )
        try:
            response = request.execute()
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"YouTube API call failed: {e}")
            response = {"items": []}

        self.quota_used += QUOTA_COSTS["search.list"]
        results: list[dict] = []
        for item in response.get("items", []):
            channel_id = (
                item.get("id", {}).get("channelId")
                or item.get("snippet", {}).get("channelId", "")
            )
            if not channel_id:
                continue
            results.append(
                {
                    "channel_id": channel_id,
                    "title": item.get("snippet", {}).get("title", ""),
                    "description": item.get("snippet", {}).get("description", ""),
                }
            )
        return results

    async def search_videos(self, query: str, max_results: int = 5) -> list[dict]:
        """Search for videos (100 units per call!)."""
        service = self._get_service()
        request = service.search().list(
            part="snippet",
            q=query,
            type="video",
            maxResults=max_results,
            order="relevance",
        )
        try:
            response = request.execute()
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"YouTube API call failed: {e}")
            response = {"items": []}

        self.quota_used += QUOTA_COSTS["search.list"]
        video_ids: list[str] = []
        for item in response.get("items", []):
            video_id = item.get("id", {}).get("videoId")
            if video_id:
                video_ids.append(video_id)

        if not video_ids:
            return []

        # Fetch full video details to get accurate view_count and durations
        return await self.get_videos_batch(video_ids)

    @property
    def remaining_quota(self) -> int:
        return 10_000 - self.quota_used
