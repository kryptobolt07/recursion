"""Google OAuth flow for YouTube Analytics API access."""

import base64
import json
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from requests.exceptions import RequestException

from app.config import settings

router = APIRouter()
OAUTH_SESSION_COOKIE = "yt_oauth_session"
COOKIE_SECURE = settings.ENVIRONMENT.lower() == "production"

SCOPES = [
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/youtube.readonly"
]

def build_credentials(creds_data: dict) -> Credentials:
    """Rebuild credentials using the configured OAuth client."""
    return Credentials(
        token=creds_data.get("token"),
        refresh_token=creds_data.get("refresh_token"),
        token_uri=creds_data.get("token_uri"),
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=creds_data.get("scopes"),
    )


def encode_oauth_session(state: str, code_verifier: str) -> str:
    payload = {"state": state, "code_verifier": code_verifier}
    return base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("ascii")


def decode_oauth_session(raw_value: str | None) -> dict[str, str] | None:
    if not raw_value:
        return None

    try:
        payload = base64.urlsafe_b64decode(raw_value.encode("ascii"))
        data = json.loads(payload.decode("utf-8"))
    except Exception:
        return None

    if not isinstance(data, dict):
        return None

    state = data.get("state")
    code_verifier = data.get("code_verifier")
    if not state or not code_verifier:
        return None

    return {"state": state, "code_verifier": code_verifier}


def get_flow(state: str | None = None, code_verifier: str | None = None):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        )

    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "project_id": "competitor-spy",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uris": [f"{settings.BACKEND_URL}/auth/callback"]
        }
    }
    return Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        state=state,
        code_verifier=code_verifier,
        redirect_uri=f"{settings.BACKEND_URL}/auth/callback"
    )

@router.get("/login")
async def login():
    """Redirect user to Google OAuth consent screen."""
    flow = get_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"
    )
    response = RedirectResponse(auth_url)
    response.set_cookie(
        key=OAUTH_SESSION_COOKIE,
        value=encode_oauth_session(state, flow.code_verifier),
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        max_age=600,
    )
    return response


@router.get("/callback")
async def callback(code: str, state: str, request: Request):
    """Handle OAuth callback — exchange code for tokens, store session."""
    oauth_session = decode_oauth_session(request.cookies.get(OAUTH_SESSION_COOKIE))
    if not oauth_session or oauth_session["state"] != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state.")

    flow = get_flow(
        state=oauth_session["state"],
        code_verifier=oauth_session["code_verifier"],
    )
    try:
        flow.fetch_token(code=code)
    except RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="Failed to reach Google OAuth token endpoint. Check outbound internet access from the backend process.",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Google OAuth token exchange failed: {exc}") from exc
    credentials = flow.credentials
    
    creds_data = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "scopes": credentials.scopes
    }
    
    redirect = RedirectResponse(f"{settings.FRONTEND_URL}/")
    redirect.set_cookie(
        key="yt_auth_token",
        value=json.dumps(creds_data),
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
    )
    redirect.delete_cookie(OAUTH_SESSION_COOKIE, secure=COOKIE_SECURE, samesite="lax")
    return redirect


@router.get("/me")
async def get_current_user(request: Request):
    """Return current authenticated user info."""
    creds_cookie = request.cookies.get("yt_auth_token")
    if not creds_cookie:
        return {"user": None}
    
    try:
        creds_data = json.loads(creds_cookie)
        credentials = build_credentials(creds_data)
        
        youtube = build("youtube", "v3", credentials=credentials)
        yt_request = youtube.channels().list(part="snippet,statistics", mine=True)
        response = yt_request.execute()
        
        if not response.get("items"):
            return {"user": None}
            
        channel = response["items"][0]
        return {
            "user": {
                "id": channel["id"],
                "title": channel["snippet"]["title"],
                "thumbnail": channel["snippet"]["thumbnails"]["default"]["url"],
                "subscriberCount": channel["statistics"]["subscriberCount"],
            }
        }
    except Exception as e:
        return {"user": None, "error": str(e)}

@router.post("/logout")
async def logout(response: Response):
    """Logout by clearing the auth cookie."""
    response.delete_cookie("yt_auth_token")
    return {"status": "logged_out"}
