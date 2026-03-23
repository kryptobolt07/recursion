"""Strategy generation endpoints — report, ideas, posting strategy."""

from fastapi import APIRouter, HTTPException

from app.services.strategy_engine import StrategyEngineService

router = APIRouter()
service = StrategyEngineService()


@router.get("/report/{channel_id}")
async def strategy_report(channel_id: str):
    """§5.1 Channel Strategy Report — niche mix reco + 30/60/90 roadmap."""
    try:
        return await service.strategy_report(channel_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/ideas/{channel_id}")
async def generate_video_ideas(channel_id: str):
    """§5.2 Video Idea Generator — 10-20 ideas with rationale and urgency tags."""
    try:
        return await service.video_ideas(channel_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/posting/{channel_id}")
async def posting_strategy(channel_id: str):
    """§5.5 Video Posting Strategy — best day/time, weekly calendar, Shorts reco."""
    try:
        return await service.posting_strategy(channel_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
