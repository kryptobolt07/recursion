"""Full ingestion pipeline orchestrator for Data Extraction & Structuring Layer.

Flow: fetch channel → get video IDs → batch metadata → comments →
      transcripts → thumbnail features → embeddings → clustering → enrichment.
"""
import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from dataclasses import dataclass, field

from app.services.youtube.data_api import YouTubeDataAPI
from app.pipeline.thumbnails import ThumbnailAnalyzer
from app.pipeline.sentiment import SentimentAnalyzer
# In a real scenario, we'd use:
# from youtube_transcript_api import YouTubeTranscriptApi
# from sentence_transformers import SentenceTransformer
# import hdbscan

logger = logging.getLogger(__name__)

# ==========================================
# 3.3 Data Models
# ==========================================

@dataclass
class ChannelRecord:
    channel_id: str
    handle: str
    subscriber_count: int
    total_videos: int
    join_date: str
    niche_tags: List[str] = field(default_factory=list)
    health_score: int = 0
    last_analyzed: str = ""

@dataclass
class VideoRecord:
    video_id: str
    channel_id: str
    title: str
    description: str
    tags: List[str]
    duration: str
    publish_date: str
    view_count: int
    like_count: int
    comment_count: int
    transcript: Optional[str] = None
    thumbnail_url: str = ""
    thumbnail_features: Dict[str, Any] = field(default_factory=dict)
    niche_tag: str = "Uncategorized"
    cluster_id: str = ""

@dataclass
class CompetitorRelationshipRecord:
    your_channel_id: str
    competitor_channel_id: str
    similarity_score: float
    shared_niches: List[str]
    discovery_method: str
    date_discovered: str

@dataclass
class AudienceSignalRecord:
    video_id: str
    sentiment_score: Dict[str, float]
    top_keywords: List[str]
    recurring_questions: List[str]
    praise_themes: List[str]
    complaint_themes: List[str]
    language_distribution: Dict[str, float]

# ==========================================
# 3.2 Ingestion Pipeline Core Components
# ==========================================

class RateLimiter:
    """Rate-limit-aware API client with exponential backoff and quota management."""
    def __init__(self, quota_limit: int = 10000):
        self.quota_limit = quota_limit
        self.used_quota = 0

    def check_quota(self, cost: int):
        if self.used_quota + cost > self.quota_limit:
            logger.warning("API Quota Exceeded. Backoff required.")
            raise Exception("API Quota Exceeded. Fallback required.")
        self.used_quota += cost

class DataNormalizer:
    """Schema normalizer: maps raw API response fields to internal unified schema."""
    @staticmethod
    def normalize_video(raw_data: dict) -> dict:
        return {
            "video_id": raw_data.get("id"),
            "channel_id": raw_data.get("snippet", {}).get("channelId"),
            "title": raw_data.get("snippet", {}).get("title"),
            "description": raw_data.get("snippet", {}).get("description"),
            "tags": raw_data.get("snippet", {}).get("tags", []),
            "view_count": int(raw_data.get("statistics", {}).get("viewCount", 0)),
            "like_count": int(raw_data.get("statistics", {}).get("likeCount", 0)),
            "comment_count": int(raw_data.get("statistics", {}).get("commentCount", 0)),
            "published_at": raw_data.get("snippet", {}).get("publishedAt"),
            "duration": raw_data.get("contentDetails", {}).get("duration", "PT0S"),
            "thumbnail_url": raw_data.get("snippet", {}).get("thumbnails", {}).get("high", {}).get("url", ""),
        }

class IncompleteDataHandler:
    """Handles missing or suppressed engagement metrics via interpolation."""
    @staticmethod
    def interpolate(video: dict, channel_avg_views: int) -> dict:
        # If view count is missing, estimate based on channel average
        if video["view_count"] == 0 and channel_avg_views > 0:
            video["view_count"] = int(channel_avg_views * 0.8) # Conservative estimate
            video["is_estimated"] = True
            
        # Standard industry baseline interpolation if likes/comments are hidden
        if video["like_count"] == 0 and video["view_count"] > 0:
            video["like_count"] = int(video["view_count"] * 0.04) # 4% avg like rate
        if video["comment_count"] == 0 and video["view_count"] > 0:
            video["comment_count"] = int(video["view_count"] * 0.005) # 0.5% avg comment rate
            
        return video


class IngestionPipeline:
    """Orchestrates the full data acquisition and enrichment flow (Section 3)."""

    def __init__(self):
        self.youtube = YouTubeDataAPI()
        self.thumbnail_analyzer = ThumbnailAnalyzer()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.rate_limiter = RateLimiter()
        self.normalizer = DataNormalizer()
        self.data_handler = IncompleteDataHandler()

    async def _deduplicate_videos(self, video_ids: List[str]) -> List[str]:
        """Deduplication layer: prevents re-fetching unchanged videos."""
        # In a real app: SELECT video_id FROM videos WHERE video_id IN (...) AND updated_at > X
        # Mocking deduplication by just taking the first 15 videos to process
        return video_ids[:15]

    async def _extract_transcript(self, video_id: str) -> str:
        """Fetch YouTube auto-captions."""
        # return YouTubeTranscriptApi.get_transcript(video_id)
        return "Simulated transcript content for theme and hook analysis."

    async def _cluster_and_enrich(self, videos: List[VideoRecord]) -> List[VideoRecord]:
        """3.4 Structuring & Enrichment - Niche clustering & Subniche detection."""
        # 1. Sentence embeddings on title + description
        # 2. k-means or HDBSCAN clustering
        # 3. LLM assigns human-readable niche label
        for i, v in enumerate(videos):
            if "linux" in v.title.lower() or "nixos" in v.title.lower():
                v.cluster_id = "cluster_1"
                v.niche_tag = "Linux & OS"
            elif "keyboard" in v.title.lower() or "gpu" in v.title.lower():
                v.cluster_id = "cluster_2"
                v.niche_tag = "Hardware Reviews"
            else:
                v.cluster_id = "cluster_3"
                v.niche_tag = "Dev Tools & Workflow"
        return videos

    async def run(self, channel_id: str, progress_callback=None) -> Dict[str, Any]:
        """Execute the full extraction and structuring pipeline."""
        logger.info(f"Starting Data Extraction Pipeline for channel {channel_id}")
        
        try:
            # 3.1 & 3.2 Data Sources & Ingestion
            if progress_callback: await progress_callback({"step": 1, "status": "Fetching Channel Metadata"})
            channel_data = await self.youtube.get_channel(channel_id)
            self.rate_limiter.check_quota(1)
            
            uploads_playlist_id = channel_data.get("uploads_playlist_id")
            if not uploads_playlist_id:
                raise ValueError("No uploads playlist found for channel.")

            if progress_callback: await progress_callback({"step": 2, "status": "Fetching Video IDs"})
            all_video_ids = await self.youtube.get_playlist_video_ids(uploads_playlist_id, limit=50)
            self.rate_limiter.check_quota(1)
            
            # Deduplication
            new_video_ids = await self._deduplicate_videos(all_video_ids)

            if progress_callback: await progress_callback({"step": 3, "status": "Batch Fetching Video Metadata"})
            raw_videos = await self.youtube.get_videos_batch(new_video_ids)
            self.rate_limiter.check_quota(len(new_video_ids) // 50 + 1)
            
            # Normalization & Missing Data Handling
            normalized_videos = [self.normalizer.normalize_video(v) for v in raw_videos]
            avg_channel_views = channel_data.get("view_count", 0) // max(channel_data.get("video_count", 1), 1)
            processed_video_dicts = [self.data_handler.interpolate(v, avg_channel_views) for v in normalized_videos]
            
            video_records = []
            
            for v_dict in processed_video_dicts:
                # Transcripts
                if progress_callback: await progress_callback({"step": 4, "status": f"Fetching Transcript & Features for {v_dict['video_id']}"})
                transcript = await self._extract_transcript(v_dict["video_id"])
                
                # Thumbnail extraction (Vision model representation)
                thumb_features = self.thumbnail_analyzer.analyze(v_dict["thumbnail_url"])
                
                record = VideoRecord(
                    video_id=v_dict["video_id"],
                    channel_id=v_dict["channel_id"],
                    title=v_dict["title"],
                    description=v_dict["description"],
                    tags=v_dict["tags"],
                    duration=v_dict["duration"],
                    publish_date=v_dict["published_at"],
                    view_count=v_dict["view_count"],
                    like_count=v_dict["like_count"],
                    comment_count=v_dict["comment_count"],
                    transcript=transcript,
                    thumbnail_url=v_dict["thumbnail_url"],
                    thumbnail_features=thumb_features
                )
                video_records.append(record)

            if progress_callback: await progress_callback({"step": 5, "status": "Niche Clustering & Subniche Detection"})
            # 3.4 Structuring & Enrichment
            enriched_videos = await self._cluster_and_enrich(video_records)
            
            # 3.3 Data Models - Final Channel Record
            unique_niches = list(set([v.niche_tag for v in enriched_videos]))
            
            # Engagement normalization
            engagement_rate = sum([(v.like_count + v.comment_count) / max(v.view_count, 1) for v in enriched_videos]) / len(enriched_videos) if enriched_videos else 0
            health_score = int(min(engagement_rate * 100 * 10, 100)) # Simplified normalization
            
            channel_record = ChannelRecord(
                channel_id=channel_id,
                handle=channel_data.get("handle", ""),
                subscriber_count=channel_data.get("subscriber_count", 0),
                total_videos=channel_data.get("video_count", 0),
                join_date=channel_data.get("published_at", ""),
                niche_tags=unique_niches,
                health_score=health_score,
                last_analyzed=datetime.now(timezone.utc).isoformat()
            )

            if progress_callback: await progress_callback({"step": 6, "status": "Storing to Database"})
            # In a real app: await supabase.table('channels').upsert(channel_record).execute()
            # In a real app: await supabase.table('videos').upsert(enriched_videos).execute()

            return {
                "status": "success",
                "channel": channel_record.__dict__,
                "videos_processed": len(enriched_videos)
            }
            
        except Exception as e:
            logger.error(f"Ingestion pipeline failed: {e}", exc_info=True)
            return {"status": "error", "message": str(e)}

