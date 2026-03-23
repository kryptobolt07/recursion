"""Title optimizer — spaCy formula parsing + Gemini rewriting."""

import re
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class TitleOptimizerPipeline:
    """Analyze and optimize video titles."""

    def score_title(self, title: str, niche_correlations: dict) -> dict:
        """Score a title using local analysis against niche correlation data."""
        score = 65  # Base score
        factors = {}
        
        # Heuristics
        if re.search(r"\b\d+\b", title):
            score += 10
            factors["numbered_list"] = "+10"
        
        if "?" in title:
            score += 5
            factors["question"] = "+5"
            
        if len(title) > 70:
            score -= 10
            factors["too_long"] = "-10"
        elif len(title) < 40:
            score -= 5
            factors["too_short"] = "-5"
            
        # Niche correlation mock logic
        if niche_correlations.get("prefers_comparison") and " vs " in title.lower():
            score += 15
            factors["comparison_match"] = "+15"

        return {
            "score": min(100, max(0, score)),
            "formula": self._detect_formula(title),
            "factors": factors
        }

    def _detect_formula(self, title: str) -> str:
        lowered = title.lower()
        if " vs " in lowered: return "Comparison"
        if re.search(r"\b\d+\b", title): return "Numbered list"
        if "?" in title or lowered.startswith(("how ", "why ", "is ", "what ")): return "Question"
        return "Direct promise"

    async def optimize(self, title: str, top_formulas: list[str], examples: list[str]) -> list[dict]:
        """Generate 5 rewritten variants via Gemini (Mock for now, normally called via strategy_engine)."""
        # This is typically handled by StrategyEngineService calling GeminiClient
        # But we implement a fallback here just in case
        return [
            {"title": f"The Ultimate {title} Guide", "formula": "Guide", "reach": 85},
            {"title": f"Why {title} is Changing Everything", "formula": "Curiosity", "reach": 88},
            {"title": f"Top 5 Secrets of {title}", "formula": "Numbered list", "reach": 92},
            {"title": f"{title}: What You Need to Know", "formula": "Direct promise", "reach": 82},
            {"title": f"My Honest Thoughts on {title}", "formula": "Personal story", "reach": 80},
        ]

    def rank_for_bulk(self, titles: list[str], niche_correlations: dict) -> list[dict]:
        """Score all titles, rank by optimization potential."""
        results = []
        for title in titles:
            score_data = self.score_title(title, niche_correlations)
            results.append({
                "title": title,
                "score": score_data["score"],
                "potential": 100 - score_data["score"]
            })
        return sorted(results, key=lambda x: x["potential"], reverse=True)
