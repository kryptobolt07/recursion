"""Pydantic request/response models for all API endpoints."""

from pydantic import BaseModel


# --- Channel Analysis ---

class ChannelAnalyzeRequest(BaseModel):
    channel_url: str


class NicheBlock(BaseModel):
    """Single block in the niche block chart."""
    niche_name: str
    upload_share_pct: float
    avg_views: int
    color: str  # hex


class ChannelOverview(BaseModel):
    avg_views: int = 0
    engagement_rate: float = 0.0
    view_to_sub_ratio: float = 0.0
    upload_frequency: float = 0.0  # uploads per month
    health_score: float = 0.0
    niches: list[NicheBlock] = []


# --- Competitor ---

class CompetitorCard(BaseModel):
    channel_id: str
    channel_name: str
    subscriber_count: int = 0
    niche_match_tags: list[str] = []
    discovery_reason: str = ""
    similarity_score: float = 0.0


class SimilarityBreakdown(BaseModel):
    overall: float = 0.0
    niche_overlap: float = 0.0
    title_formula_overlap: float = 0.0
    keyword_density_overlap: float = 0.0
    subscriber_proximity: float = 0.0


# --- Strategy ---

class VideoIdea(BaseModel):
    title: str
    niche: str
    subniche: str = ""
    rationale: str
    competition_level: str = "medium"  # low / medium / high
    suggested_length: str = ""
    urgency_tag: str = "evergreen"  # evergreen / trending / timely


class TitleVariant(BaseModel):
    title: str
    formula_used: str
    word_count: int
    character_count: int
    predicted_lift_reason: str = ""


class ThumbnailConcept(BaseModel):
    background_approach: str
    face_recommendation: str
    expression: str = ""
    text_overlay: str
    text_word_count: int = 0
    composition: str
    dominant_color_hex: str = ""
    rationale: str


# --- Simulator ---

class SimulatorInput(BaseModel):
    title: str
    niche: str
    planned_length_minutes: float
    upload_day: str = ""
    script_summary: str = ""


class SimulatorOutput(BaseModel):
    conservative: list[float] = []
    base: list[float] = []
    optimistic: list[float] = []
    confidence_score: float = 0.0
    sensitivity: dict = {}


# --- Audience ---

class SentimentBreakdown(BaseModel):
    positive: float = 0.0
    neutral: float = 0.0
    critical: float = 0.0
    summary: str = ""


class AudienceDemographics(BaseModel):
    age_bands: dict = {}  # e.g. {"13-17": 5, "18-24": 35, ...}
    countries: dict = {}  # e.g. {"US": 30, "IN": 25, ...}
    languages: dict = {}  # e.g. {"en": 60, "hi": 15, ...}


# --- Thumbnail Features ---

class ThumbnailFeatures(BaseModel):
    face: bool = False
    face_count: int = 0
    text_present: bool = False
    text_content: str = ""
    word_count: int = 0
    dominant_colors: list[str] = []
    background_complexity: str = "unknown"  # low / medium / high
