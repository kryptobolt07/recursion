"""Supabase client initialization."""

from supabase import create_client, Client

from app.config import settings


def get_supabase_client() -> Client:
    """Create and return a Supabase client using service role key."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


# Singleton instance — import this where needed
supabase: Client = get_supabase_client() if settings.SUPABASE_URL else None  # type: ignore
