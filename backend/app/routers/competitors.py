"""Competitor discovery and detail endpoints."""

from fastapi import APIRouter, HTTPException

from app.services.public_analysis import PublicCompetitorAnalysisService
from app.services.thumbnail_analysis import ThumbnailAnalysisService

router = APIRouter()
service = PublicCompetitorAnalysisService()
thumbnail_service = ThumbnailAnalysisService()


@router.get("/discover/{channel_id}")
async def discover_competitors(channel_id: str):
    """§2.1 Auto-discover competitors — search, filter, rank by similarity."""
    try:
        return await service.discover(channel_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/landscape/{channel_id}")
async def competitive_landscape(channel_id: str):
    """§2.1 Competitive Landscape Map — scatter plot data (subs vs engagement)."""
    try:
        return await service.discover(channel_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/{competitor_id}/overview")
async def competitor_overview(competitor_id: str):
    """§2.2 Overview — stat strip, side-by-side comparison, niche block chart."""
    try:
        return await service.competitor_detail(competitor_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/{competitor_id}/similarity")
async def competitor_similarity(competitor_id: str):
    """§2.2 Content Similarity — niche overlap, keyword overlap, exclusive niches."""
    try:
        detail = await service.competitor_detail(competitor_id)
        return detail["similarity"]
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/{competitor_id}/videos")
async def competitor_similar_videos(competitor_id: str):
    """§2.2 Similar Videos Comparison — top 3 vs top 3 per shared niche."""
    try:
        detail = await service.competitor_detail(competitor_id)
        return {"videos": detail["videos"]}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/{competitor_id}/thumbnails")
async def competitor_thumbnails(competitor_id: str):
    """§2.2 Thumbnail Analysis — side-by-side style comparison."""
    try:
        detail = await service.competitor_detail(competitor_id)
        reference_videos = [*detail["viralVideos"], *detail["videos"]][:6]
        analysis = await thumbnail_service.analyze_video_set(reference_videos)
        if not analysis.get("available"):
            return {"available": False, "message": "Could not analyze public thumbnails for this competitor."}
        return analysis
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/{competitor_id}/viral")
async def competitor_viral_patterns(competitor_id: str):
    """§2.2 Viral Pattern Detection — outlier videos + pattern summary."""
    try:
        detail = await service.competitor_detail(competitor_id)
        return {
            "viralVideos": detail["viralVideos"],
            "patternSummary": detail["patternSummary"],
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/{competitor_id}/engagement")
async def competitor_engagement(competitor_id: str):
    """§2.2 Engagement Deep-Dive — engagement over time, comment sentiment."""
    try:
        detail = await service.competitor_detail(competitor_id)
        return {
            "engagementTrend": detail["engagementTrend"],
            "commentSentiment": detail["commentSentiment"],
            "viewerAsks": detail["viewerAsks"],
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
