"""Analysis warmup endpoints."""

from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter, HTTPException

from app.services.analysis_cache import analysis_cache
from app.routers.competitors import service as competitor_service, thumbnail_service
from app.routers.strategy import service as strategy_service

router = APIRouter()
logger = logging.getLogger(__name__)
_preload_tasks: dict[str, asyncio.Task] = {}


async def _preload_channel(channel_id: str, force: bool) -> None:
    logger.info("Analysis preload started for channel=%s force=%s", channel_id, force)
    discovery = await competitor_service.discover(channel_id, force=force)
    competitor_ids = [row["id"] for row in discovery.get("competitors", [])[:4]]

    detail_results = await asyncio.gather(
        *(competitor_service.competitor_detail(competitor_id, channel_id, force=force) for competitor_id in competitor_ids),
        return_exceptions=True,
    )

    thumbnail_jobs = []
    for result in detail_results:
        if not isinstance(result, dict):
            continue
        reference_videos = [*result.get("viralVideos", []), *result.get("videos", [])][:6]
        if reference_videos:
            thumbnail_jobs.append((result["id"], thumbnail_service.analyze_video_set(reference_videos)))

    jobs = [
        strategy_service.strategy_report(channel_id, force=force),
        strategy_service.posting_strategy(channel_id, force=force),
        strategy_service.video_ideas(channel_id, force=force),
        strategy_service.bulk_optimize_titles(channel_id, force=force),
    ]
    thumbnail_results = await asyncio.gather(*(job for _, job in thumbnail_jobs), return_exceptions=True)
    for (competitor_id, _job), thumbnail_result in zip(thumbnail_jobs, thumbnail_results):
        if isinstance(thumbnail_result, dict):
            await analysis_cache.set(f"competitors:thumbnails:{competitor_id}", thumbnail_result)

    await asyncio.gather(*jobs, return_exceptions=True)
    logger.info("Analysis preload completed for channel=%s", channel_id)


def _schedule_preload(channel_id: str, force: bool) -> None:
    existing = _preload_tasks.get(channel_id)
    if existing is not None and not existing.done():
        logger.info("Analysis preload already running for channel=%s", channel_id)
        return

    task = asyncio.create_task(_preload_channel(channel_id, force=force))
    _preload_tasks[channel_id] = task

    def _cleanup(_task: asyncio.Task) -> None:
        _preload_tasks.pop(channel_id, None)
        if _task.cancelled():
            logger.warning("Analysis preload cancelled for channel=%s", channel_id)
        elif exc := _task.exception():
            logger.warning("Analysis preload failed for channel=%s (%s)", channel_id, exc)

    task.add_done_callback(_cleanup)


@router.post("/preload/{channel_id}")
async def preload_channel_analysis(channel_id: str, force: bool = False):
    try:
        _schedule_preload(channel_id, force=force)
        return {"status": "scheduled", "channelId": channel_id, "force": force}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
