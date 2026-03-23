"""Title optimizer endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.data.demo_creator import DEMO_CREATOR
from app.services.strategy_engine import StrategyEngineService

router = APIRouter()
service = StrategyEngineService()


class TitleOptimizeRequest(BaseModel):
    title: str
    niche: str = ""
    channel_id: str = DEMO_CREATOR["channel_id"]


@router.post("/optimize")
async def optimize_title(req: TitleOptimizeRequest, force: bool = False):
    """§5.3 Title Optimizer — 5 rewritten variants using top-performing formulas."""
    try:
        return await service.optimize_title(req.title, req.niche, req.channel_id, force=force)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/bulk/{channel_id}")
async def bulk_optimize(channel_id: str, force: bool = False):
    """§5.3 Bulk mode — score all existing titles, return top 10 with highest improvement potential."""
    try:
        return await service.bulk_optimize_titles(channel_id, force=force)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
