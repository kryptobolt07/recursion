"""Transcript fetching via youtube-transcript-api.

Free, no quota, no auth. Used for hook type detection,
CTA analysis, and topic classification.
"""

from youtube_transcript_api import YouTubeTranscriptApi


async def get_transcript(video_id: str) -> str | None:
    """Fetch auto-generated captions for a video. Returns None if unavailable."""
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        return " ".join(segment["text"] for segment in transcript_list)
    except Exception:
        # No transcript available — fall back to title + description only
        return None
