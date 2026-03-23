"""SerpAPI fallback for competitor discovery (100 free searches/month)."""

from app.config import settings


class SerpService:
    """Google Search via SerpAPI — quota-free alternative to YouTube search."""

    async def search_channels(self, query: str, exclude_channel: str = "") -> list[str]:
        """Search Google for YouTube channels matching query.

        Example query: site:youtube.com "linux tutorials" -TechMorph
        Returns list of YouTube channel URLs.
        """
        # TODO: Implement SerpAPI call if SERPAPI_KEY is configured
        return []
