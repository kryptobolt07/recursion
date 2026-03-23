"""Strategy generation — structured data → Gemini → strategy report + roadmap."""


class StrategyGenerator:
    """Generate strategy reports, video ideas, and posting recommendations."""

    async def generate_report(self, analysis: dict) -> dict:
        """§5.1 — Niche mix recommendation + 30/60/90 day roadmap."""
        # TODO: Build structured input → Gemini single call → parse JSON output
        return {}

    async def generate_posting_strategy(self, timing_data: dict) -> dict:
        """§5.5 — Best day/time per niche, weekly calendar, Shorts recommendation."""
        return {}
