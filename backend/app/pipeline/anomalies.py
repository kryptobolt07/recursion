"""Anomaly detection — viral outliers, growth spikes, content pivots."""


class AnomalyDetector:
    """Detect viral content, growth changes, and strategic pivots."""

    def flag_viral_outliers(self, videos: list[dict], multiplier: float = 2.5) -> list[dict]:
        """Flag videos with views > multiplier × 90-day rolling average."""
        # TODO: pandas rolling(90) mean, filter > multiplier × mean
        return []

    def detect_growth_spike(self, videos: list[dict]) -> bool:
        """Compare 30-day avg views vs 90-day baseline. Spike if ratio > 1.8."""
        return False

    def detect_content_pivot(self, videos: list[dict]) -> list[dict]:
        """Compare niche distribution in recent 3 months vs first 6 months.

        Flag any niche shifting > 15 percentage points.
        """
        return []
