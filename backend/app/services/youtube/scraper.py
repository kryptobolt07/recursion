"""Scraper utilities — scrapetube for video IDs, yt-dlp fallback for thumbnails."""

import scrapetube


async def get_all_video_ids(channel_url: str) -> list[str]:
    """Get all video IDs from a channel without using API quota."""
    try:
        videos = scrapetube.get_channel(channel_url=channel_url)
        return [video["videoId"] for video in videos]
    except Exception:
        return []


def get_thumbnail_url(video_id: str) -> str:
    """Construct maxresdefault thumbnail URL (no API call needed)."""
    return f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
