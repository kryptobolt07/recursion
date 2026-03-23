from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Mock data for video ranking
MOCK_RANKING_DATA = [
    {"query": "best linux distro 2024", "rank": 3, "video_id": "vid1", "title": "Top 10 Linux Distros for Beginners", "competitors_ahead": 2},
    {"query": "nix-os guide", "rank": 1, "video_id": "vid2", "title": "NixOS: The Ultimate Guide", "competitors_ahead": 0},
    {"query": "arch linux installation", "rank": 12, "video_id": "vid3", "title": "Arch Linux Install Tutorial", "competitors_ahead": 11},
    {"query": "terminal setup zsh", "rank": 5, "video_id": "vid4", "title": "My Terminal Setup 2024", "competitors_ahead": 4},
]

@router.get("/")
async def get_video_ranking(video_id: str = Query(None)):
    """Get the ranking of our videos for relevant queries."""
    try:
        # In a real app, this would query a search API or scrape results
        if video_id:
            filtered = [r for r in MOCK_RANKING_DATA if r["video_id"] == video_id]
            return filtered
        return MOCK_RANKING_DATA
    except Exception as e:
        logger.error(f"Error fetching video ranking: {e}")
        # Fallback mock data is already returned if logic fails, 
        # but here we'll raise an HTTPException for the API to handle
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/queries")
async def get_suggested_queries():
    """Get suggested queries based on channel niches."""
    return ["best linux distro 2024", "nix-os guide", "arch linux installation", "terminal setup zsh"]
