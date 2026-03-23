"""Competitor Spy — FastAPI Application."""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    analysis,
    auth,
    channels,
    competitors,
    niches,
    ranking,
    simulator,
    strategy,
    thumbnails,
    titles,
    hashtags,
)
from app.services.analysis_cache import analysis_cache

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load ML models, connect to Supabase. Shutdown: cleanup."""
    # TODO: Load sentence-transformer model, spaCy model, sklearn models
    await analysis_cache.init()
    yield
    # TODO: Cleanup resources


app = FastAPI(
    title="Competitor Spy",
    description="YouTube competitor analysis and strategy engine",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(channels.router, prefix="/channels", tags=["Channels"])
app.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
app.include_router(niches.router, prefix="/niches", tags=["Niches"])
app.include_router(competitors.router, prefix="/competitors", tags=["Competitors"])
app.include_router(strategy.router, prefix="/strategy", tags=["Strategy"])
app.include_router(titles.router, prefix="/titles", tags=["Titles"])
app.include_router(thumbnails.router, prefix="/thumbnails", tags=["Thumbnails"])
app.include_router(simulator.router, prefix="/simulator", tags=["Simulator"])
app.include_router(ranking.router, prefix="/ranking", tags=["Ranking"])
app.include_router(hashtags.router, prefix="/api/hashtags", tags=["Hashtags"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}
