"""YouTube Analytics API service utilizing cached OAuth credentials."""

import json
from datetime import datetime, timedelta
from fastapi import Request, HTTPException
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.config import settings


def get_credentials(request: Request) -> Credentials:
    """Extract credentials from cookie."""
    creds_cookie = request.cookies.get("yt_auth_token")
    if not creds_cookie:
        raise HTTPException(status_code=401, detail="Not authenticated. Please login.")
    creds_data = json.loads(creds_cookie)
    return Credentials(
        token=creds_data.get("token"),
        refresh_token=creds_data.get("refresh_token"),
        token_uri=creds_data.get("token_uri"),
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=creds_data.get("scopes"),
    )

def get_analytics_client(request: Request):
    """Return an authenticated YouTube Analytics client."""
    credentials = get_credentials(request)
    return build("youtubeAnalytics", "v2", credentials=credentials)

async def fetch_channel_demographics(request: Request, start_date: str = "2020-01-01", end_date: str = None):
    """Fetch viewer demographics (age, gender)."""
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    client = get_analytics_client(request)
    res = client.reports().query(
        ids="channel==MINE",
        startDate=start_date,
        endDate=end_date,
        dimensions="ageGroup,gender",
        metrics="viewerPercentage",
        sort="-viewerPercentage"
    ).execute()
    
    return res

async def fetch_channel_performance(request: Request, days_back: int = 90):
    """Fetch base channel performance metrics for the past N days."""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    
    client = get_analytics_client(request)
    res = client.reports().query(
        ids="channel==MINE",
        startDate=start_date.strftime("%Y-%m-%d"),
        endDate=end_date.strftime("%Y-%m-%d"),
        dimensions="day",
        metrics="views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost",
        sort="day"
    ).execute()
    
    return res
