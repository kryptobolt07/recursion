"""Supabase client wrapper for database operations."""

from supabase import create_client, Client

from app.config import settings


class SupabaseService:
    """Handles all Supabase DB reads/writes and auth verification."""

    def __init__(self):
        self._client: Client | None = None

    @property
    def client(self) -> Client:
        if self._client is None:
            self._client = create_client(
                settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY
            )
        return self._client

    # --- Channel operations ---

    async def upsert_channel(self, channel_data: dict) -> dict:
        """Insert or update a channel record."""
        return self.client.table("channels").upsert(channel_data).execute().data

    async def get_channel(self, channel_id: str) -> dict | None:
        resp = self.client.table("channels").select("*").eq("id", channel_id).execute()
        return resp.data[0] if resp.data else None

    # --- Video operations ---

    async def upsert_videos(self, videos: list[dict]) -> list[dict]:
        return self.client.table("videos").upsert(videos).execute().data

    async def get_videos_by_channel(self, channel_id: str) -> list[dict]:
        return self.client.table("videos").select("*").eq("channel_id", channel_id).execute().data

    # --- Competitor operations ---

    async def upsert_competitor(self, relationship: dict) -> dict:
        return self.client.table("competitor_relationships").upsert(relationship).execute().data

    async def get_competitors(self, channel_id: str) -> list[dict]:
        return self.client.table("competitor_relationships").select("*").eq("your_channel_id", channel_id).execute().data

    # --- Niche cluster operations ---

    async def upsert_niche_clusters(self, clusters: list[dict]) -> list[dict]:
        return self.client.table("niche_clusters").upsert(clusters).execute().data

    # --- Audience signal operations ---

    async def upsert_audience_signals(self, signals: list[dict]) -> list[dict]:
        return self.client.table("audience_signals").upsert(signals).execute().data
