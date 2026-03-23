"""YouTube API quota tracker — 10,000 units/day."""


class QuotaTracker:
    """Track YouTube Data API quota usage during a session."""

    DAILY_LIMIT = 10_000

    def __init__(self):
        self.used = 0

    def spend(self, units: int):
        self.used += units

    @property
    def remaining(self) -> int:
        return max(0, self.DAILY_LIMIT - self.used)

    @property
    def usage_pct(self) -> float:
        return round(self.used / self.DAILY_LIMIT * 100, 1)

    def can_afford(self, units: int) -> bool:
        return self.remaining >= units

    def reset(self):
        self.used = 0
