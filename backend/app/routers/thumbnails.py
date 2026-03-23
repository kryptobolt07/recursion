"""Thumbnail suggestion endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.data.demo_creator import DEMO_CREATOR
from app.services.strategy_engine import StrategyEngineService

router = APIRouter()
service = StrategyEngineService()


class ThumbnailRequest(BaseModel):
    title: str
    niche: str = ""
    script_summary: str = ""
    channel_id: str = DEMO_CREATOR["channel_id"]


@router.post("/suggest")
async def suggest_thumbnails(req: ThumbnailRequest):
    """§5.4 Thumbnail Suggestion — 3 concept briefs with rationale."""
    try:
        return await service.suggest_thumbnails(req.title, req.niche, req.channel_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
