"""YouTube Data API v3 client.

Handles: channels.list, playlistItems.list, videos.list,
         commentThreads.list, search.list.
"""

from googleapiclient.discovery import build

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

    def _get_service(self):
        if self.service is None:
            self.service = build(
                "youtube", "v3", developerKey=settings.YOUTUBE_API_KEY
            )
        return self.service

    async def get_channel(self, channel_id: str) -> dict:
        """Fetch channel metadata (1 unit)."""
        # TODO: Implement channels.list call
        self.quota_used += QUOTA_COSTS["channels.list"]
        return {}

    async def get_video_ids(self, uploads_playlist_id: str) -> list[str]:
        """Fetch all video IDs from uploads playlist (~1 unit per 50 videos)."""
        # TODO: Paginate through playlistItems.list
        return []

    async def get_videos_batch(self, video_ids: list[str]) -> list[dict]:
        """Batch fetch video metadata, 50 per call (1 unit per call)."""
        # TODO: Batch videos.list calls
        return []

    async def get_comments(self, video_id: str, max_pages: int = 2) -> list[dict]:
        """Fetch top-level comments (1 unit per page of 100)."""
        # TODO: commentThreads.list with pagination
        return []

    async def search_channels(self, query: str, max_results: int = 50) -> list[dict]:
        """Search for competitor channels (100 units per call!)."""
        # TODO: search.list with type=channel
        self.quota_used += QUOTA_COSTS["search.list"]
        return []

    @property
    def remaining_quota(self) -> int:
        return 10_000 - self.quota_used
