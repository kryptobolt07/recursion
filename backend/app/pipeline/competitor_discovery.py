"""Competitor discovery — search, filter, rank by similarity."""


class CompetitorDiscovery:
    """Discover competitors using keyword-based search + niche overlap."""

    async def discover(self, channel_id: str, video_titles: list[str]) -> list[dict]:
        """Full discovery flow: extract keywords → search → filter → score.

        1. TF-IDF top keywords from channel titles/descriptions
        2. YouTube search (100 units per query, budget 3-4 queries)
        3. Filter by subscriber bracket (0.1x to 10x)
        4. Score and rank
        """
        # TODO: Implement full discovery flow
        return []

    def extract_search_keywords(self, titles: list[str], top_n: int = 8) -> list[str]:
        """Extract top TF-IDF keywords for search queries."""
        # TODO: sklearn TfidfVectorizer
        return []
