"""Trend detection — rising/declining topics, cross-channel spikes.

Uses pandas + scipy for time-series analysis on keyword frequency.
"""


class TrendDetector:
    """Detect content trends from indexed video data."""

    def detect_rising_topics(self, videos: list[dict], window_days: int = 90) -> list[dict]:
        """Track keyword frequency over time, surface rising topics.

        Flag as rising if slope > 0.2 (normalized) and r² > 0.6.
        """
        # TODO: pandas groupby month + scipy.stats.linregress
        return []

    def detect_declining_topics(self, videos: list[dict], window_days: int = 90) -> list[dict]:
        """Flag topics dropping in frequency."""
        return []

    def detect_cross_channel_spike(self, competitor_videos: list[dict]) -> list[dict]:
        """Flag topics where 3+ competitors posted within 14 days, all >1.5× baseline."""
        # TODO: pandas groupby topic + upload_week
        return []
