from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from datetime import datetime, timezone

from app.services.analysis_cache import analysis_cache
from app.services.gemini import GeminiClient
from app.data.demo_creator import DEMO_CREATOR

router = APIRouter()
gemini = GeminiClient()

class HashtagDetail(BaseModel):
    hashtag: str
    niche_id: str
    rank: int
    score: int
    video_count: int
    sample_video_ids: List[str]
    velocity: str
    fetched_at: str

class HashtagReasoning(BaseModel):
    hashtag: str
    niche_id: str
    reasoning: str
    key_signals: dict
    generated_at: str

@router.get("/trending")
async def get_trending_hashtags():
    """GET /hashtags/trending - Top 5 hashtags per niche"""
    # For hackathon/demo purposes we mock the background job data
    # In a real system this would query a supabase trending_hashtags table updated via cron.
    niches = [n["name"] for n in DEMO_CREATOR["niches"]][:4]
    
    # Mock data based on the spec
    mock_data = []
    
    linux_tags = [("nixos", 95, 12, "rising"), ("archlinux", 88, 10, "stable"), ("linuxgaming", 75, 8, "rising"), ("ubuntu2404", 60, 5, "stable"), ("terminalsetup", 55, 4, "stable")]
    hardware_tags = [("rtx5090", 98, 25, "rising"), ("pcbuild", 85, 15, "stable"), ("minipc", 82, 14, "rising"), ("mechkeyboard", 70, 9, "stable"), ("oledgaming", 65, 8, "stable")]
    
    for tag_data in linux_tags:
        mock_data.append({
            "hashtag": f"#{tag_data[0]}",
            "niche_id": "Linux & OS",
            "rank": linux_tags.index(tag_data) + 1,
            "score": tag_data[1],
            "video_count": tag_data[2],
            "sample_video_ids": ["vid1", "vid2", "vid3"],
            "velocity": tag_data[3],
            "fetched_at": datetime.now(timezone.utc).isoformat()
        })
        
    for tag_data in hardware_tags:
        mock_data.append({
            "hashtag": f"#{tag_data[0]}",
            "niche_id": "Hardware Reviews",
            "rank": hardware_tags.index(tag_data) + 1,
            "score": tag_data[1],
            "video_count": tag_data[2],
            "sample_video_ids": ["vid4", "vid5", "vid6"],
            "velocity": tag_data[3],
            "fetched_at": datetime.now(timezone.utc).isoformat()
        })

    return {"hashtags": mock_data, "niches": ["Linux & OS", "Hardware Reviews"]}

@router.get("/{hashtag}/reasoning")
async def get_hashtag_reasoning(hashtag: str, niche_id: str):
    """GET /hashtags/{hashtag}/reasoning"""
    cache_key = f"hashtag_reasoning:{hashtag}:{niche_id}"
    cached = await analysis_cache.get(cache_key)
    if cached:
        return cached

    prompt = f"""
You are a YouTube analytics expert. Explain why the hashtag {hashtag} is currently trending 
in the {niche_id} niche on YouTube.

Context:
- It appears in several recent high-performing videos
- Velocity: rising
- Sample videos using this hashtag are getting 100K+ views.

Respond in strict JSON with this exact schema (no markdown formatting):
{{
  "reasoning": "2-3 sentence explanation of why this is trending",
  "key_signals": [
    {{"signal": "signal name", "detail": "specific detail"}}
  ],
  "trend_type": "seasonal | platform_push | community_driven | viral_spillover | product_launch",
  "momentum": "accelerating | peaking | stable",
  "time_sensitivity": "post within 48h | post within 1 week | evergreen"
}}
"""
    result = await gemini.generate_json(prompt)
    if not result:
        # Fallback mock
        result = {
            "reasoning": f"The hashtag {hashtag} is currently experiencing a surge in engagement due to recent community discussions and product updates within the {niche_id} space.",
            "key_signals": [
                {"signal": "View Spike", "detail": "Videos using this tag are seeing a 1.5x velocity increase."},
                {"signal": "Competitor Usage", "detail": "3 top competitors adopted this tag in the last 48 hours."}
            ],
            "trend_type": "community_driven",
            "momentum": "accelerating",
            "time_sensitivity": "post within 48h"
        }
        
    row = {
        "hashtag": hashtag,
        "niche_id": niche_id,
        "reasoning": result.get("reasoning", ""),
        "key_signals": result,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await analysis_cache.set(cache_key, row, ttl=21600) # 6 hours
    return row

@router.post("/{hashtag}/strategy")
async def generate_hashtag_strategy(hashtag: str, niche_id: str):
    """POST /hashtags/{hashtag}/strategy"""
    prompt = f"""
You are a YouTube growth strategist. Generate a personalized step-by-step action plan for 
a creator to leverage the trending hashtag {hashtag}.

Creator context:
- Channel: TechForge (482000 subscribers)
- Primary niche: {niche_id}

Respond in strict JSON:
{{
  "urgency_banner": "one-line urgency message",
  "steps": [
    {{
      "step_number": 1,
      "title": "step title",
      "action": "specific action to take",
      "detail": "why this works for their channel specifically",
      "time_required": "15 min",
      "priority": "high | medium | low"
    }}
  ],
  "title_suggestions": [
    "Full video title using {hashtag}"
  ],
  "description_template": "Video description template with {hashtag} placement",
  "optimal_post_day": "Tuesday",
  "optimal_post_time": "10:00 AM IST",
  "expected_reach_lift": "estimated % boost in reach",
  "hashtag_cluster": ["related hashtag 1", "related hashtag 2"]
}}
"""
    result = await gemini.generate_json(prompt)
    if not result:
        result = {
            "urgency_banner": "Post within 48h for maximum impact",
            "steps": [
                {
                    "step_number": 1,
                    "title": "Draft Topic",
                    "action": f"Create a short video specifically addressing {hashtag}",
                    "detail": "Captures the current search velocity.",
                    "time_required": "1 hr",
                    "priority": "high"
                }
            ],
            "title_suggestions": [f"Why Everyone is Talking About {hashtag}"],
            "description_template": f"In this video we explore {hashtag}...",
            "optimal_post_day": "Friday",
            "optimal_post_time": "3:00 PM EST",
            "expected_reach_lift": "25%",
            "hashtag_cluster": [f"{hashtag}2024", f"{hashtag}explained"]
        }
        
    return result
