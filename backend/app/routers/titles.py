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
async def optimize_title(req: TitleOptimizeRequest):
    """§5.3 Title Optimizer — 5 rewritten variants using top-performing formulas."""
    try:
        return await service.optimize_title(req.title, req.niche, req.channel_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/bulk/{channel_id}")
async def bulk_optimize(channel_id: str):
    """§5.3 Bulk mode — score all existing titles, return top 10 with highest improvement potential."""
    try:
        creator = DEMO_CREATOR
        optimizable = []
        for title in creator["top_video_titles"][:10]:
            result = await service.optimize_title(title, "", channel_id)
            top_variant = result["variants"][0] if result["variants"] else None
            optimizable.append(
                {
                    "original": title,
                    "topVariant": top_variant["title"] if top_variant else "",
                    "bestFormula": top_variant["formula"] if top_variant else "",
                    "reach": top_variant["reach"] if top_variant else 0,
                }
            )
        return {"optimizable": optimizable}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
