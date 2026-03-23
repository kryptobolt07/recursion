"""Title optimizer endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class TitleOptimizeRequest(BaseModel):
    title: str
    niche: str = ""


@router.post("/optimize")
async def optimize_title(req: TitleOptimizeRequest):
    """§5.3 Title Optimizer — 5 rewritten variants using top-performing formulas."""
    return {"original": req.title, "variants": []}


@router.post("/bulk/{channel_id}")
async def bulk_optimize(channel_id: str):
    """§5.3 Bulk mode — score all existing titles, return top 10 with highest improvement potential."""
    return {"optimizable": []}
