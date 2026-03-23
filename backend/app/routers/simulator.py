"""Video performance simulator endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SimulatorRequest(BaseModel):
    title: str
    niche: str
    planned_length_minutes: float
    upload_day: str = ""
    script_summary: str = ""


@router.post("/predict")
async def predict_performance(req: SimulatorRequest):
    """§5.6 Performance Simulator — 3 scenario lines (conservative/base/optimistic) over 30 days."""
    return {
        "conservative": [],
        "base": [],
        "optimistic": [],
        "confidence_score": 0.0,
    }
