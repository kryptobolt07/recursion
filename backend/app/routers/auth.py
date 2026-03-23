"""Google OAuth flow for YouTube Analytics API access."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/login")
async def login():
    """Redirect user to Google OAuth consent screen."""
    # TODO: Build OAuth URL with YouTube Analytics scopes
    return {"url": "https://accounts.google.com/o/oauth2/v2/auth?..."}


@router.get("/callback")
async def callback(code: str):
    """Handle OAuth callback — exchange code for tokens, store session."""
    # TODO: Exchange code for access/refresh tokens
    return {"status": "authenticated"}


@router.get("/me")
async def get_current_user():
    """Return current authenticated user info."""
    # TODO: Verify token, return channel info
    return {"user": None}
