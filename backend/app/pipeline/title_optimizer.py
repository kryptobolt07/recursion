"""Title optimizer — spaCy formula parsing + Gemini rewriting."""


class TitleOptimizerPipeline:
    """Analyze and optimize video titles."""

    def score_title(self, title: str, niche_correlations: dict) -> dict:
        """Score a title using local spaCy analysis against niche correlation data."""
        # TODO: spaCy POS parse → check for number, question, formula match → score
        return {"score": 0, "formula": "", "factors": {}}

    async def optimize(self, title: str, top_formulas: list[str], examples: list[str]) -> list[dict]:
        """Generate 5 rewritten variants via Gemini."""
        # TODO: Build prompt with title + formulas + examples → Gemini → parse JSON
        return []

    def rank_for_bulk(self, titles: list[str], niche_correlations: dict) -> list[dict]:
        """Score all titles, rank by optimization potential (no LLM)."""
        return []
