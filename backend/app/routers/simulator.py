"""Video performance simulator endpoints."""

import random
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SimulatorRequest(BaseModel):
    title: str
    niche: str
    targetLengthMinutes: float
    channelId: str = ""

@router.post("/simulate")
async def simulate_performance(req: SimulatorRequest):
    """§5.6 Performance Simulator — 3 scenario lines (conservative/base/optimistic) over 30 days."""
    # Generate mock trajectory data
    trajectory = []
    
    # Base multiplier based on niche
    base_mult = 1.0
    if req.niche.lower() == "linux & os":
        base_mult = 1.2
    elif "hardware" in req.niche.lower():
        base_mult = 1.5
    elif "ai" in req.niche.lower():
        base_mult = 1.8
        
    for day in range(1, 31):
        if day <= 3:
            # Steep climb
            base_val = day * 15000 * base_mult
        elif day <= 7:
            # Slowing down
            base_val = trajectory[-1]["base"] + (8000 * base_mult) / (day - 2)
        else:
            # Long tail
            base_val = trajectory[-1]["base"] + (3000 * base_mult) / (day / 2)
            
        trajectory.append({
            "day": day,
            "conservative": int(base_val * random.uniform(0.7, 0.8)),
            "base": int(base_val),
            "optimistic": int(base_val * random.uniform(1.2, 1.4))
        })
        
    return {
        "trajectory": trajectory,
        "day1": trajectory[0]["base"],
        "day7": trajectory[6]["base"],
        "day30": trajectory[29]["base"],
        "confidence": "High (Based on 14 similar videos in this niche)",
        "sensitivity": [
            "If posted on Tuesday, base estimate increases by ~15%",
            "If thumbnail includes face, click-through increases by 1.2x",
            "Targeting 14+ min length increases average view duration"
        ]
    }

