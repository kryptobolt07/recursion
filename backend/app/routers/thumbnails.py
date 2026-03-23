"""Thumbnail suggestion endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ThumbnailRequest(BaseModel):
    title: str
    niche: str
    script_summary: str = ""


@router.post("/suggest")
async def suggest_thumbnails(req: ThumbnailRequest):
    """§5.4 Thumbnail Suggestion — 3 concept briefs with rationale."""
    return {"concepts": []}
