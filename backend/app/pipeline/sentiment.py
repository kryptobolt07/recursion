"""Sentiment analysis — VADER (fast) + Gemini (quality).

VADER: rule-based, microsecond-speed, good for per-comment scoring.
Gemini: batched 50-100 comments per call for nuanced analysis.
"""

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


class SentimentAnalyzer:
    """Dual-mode sentiment analysis."""

    def __init__(self):
        self.vader = SentimentIntensityAnalyzer()

    def score_comment(self, text: str) -> dict:
        """Fast VADER scoring for a single comment."""
        scores = self.vader.polarity_scores(text)
        return {
            "positive": scores["pos"],
            "neutral": scores["neu"],
            "negative": scores["neg"],
            "compound": scores["compound"],
        }

    def classify_batch(self, comments: list[str]) -> dict:
        """Classify a batch of comments into positive/neutral/critical %."""
        if not comments:
            return {"positive": 0, "neutral": 0, "critical": 0}

        positive = neutral = critical = 0
        for comment in comments:
            compound = self.vader.polarity_scores(comment)["compound"]
            if compound >= 0.05:
                positive += 1
            elif compound <= -0.05:
                critical += 1
            else:
                neutral += 1

        total = len(comments)
        return {
            "positive": round(positive / total * 100, 1),
            "neutral": round(neutral / total * 100, 1),
            "critical": round(critical / total * 100, 1),
        }
