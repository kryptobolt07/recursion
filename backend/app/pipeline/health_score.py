"""Weighted composite health score (0–100).

Weights: content engagement (30%), view/sub ratio (25%),
upload consistency (20%), growth trajectory (15%), comment sentiment (10%).
"""


class HealthScoreCalculator:
    """Compute channel and competitor health scores."""

    WEIGHTS = {
        "engagement": 0.30,
        "view_sub_ratio": 0.25,
        "consistency": 0.20,
        "growth": 0.15,
        "sentiment": 0.10,
    }

    def compute(self, metrics: dict) -> dict:
        """Compute overall health score with sub-scores."""
        # TODO: Normalize each metric against niche average, apply weights
        return {"overall": 0, "sub_scores": {}}
