"""Gemini 1.5 Flash client — batched multi-task prompts.

Handles: niche labeling, sentiment analysis, viral pattern descriptions,
strategy text generation, title optimization, thumbnail concepts.
"""

import google.generativeai as genai

from app.config import settings


class GeminiClient:
    """Wrapper for Gemini 1.5 Flash with rate-limit awareness."""

    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel("gemini-1.5-flash")
        self.request_count = 0

    async def generate(self, prompt: str, json_output: bool = False) -> str:
        """Single generation call. Use json_output=True for structured responses."""
        generation_config = {}
        if json_output:
            generation_config["response_mime_type"] = "application/json"

        response = self.model.generate_content(
            prompt,
            generation_config=generation_config if generation_config else None,
        )
        self.request_count += 1
        return response.text

    async def label_niches(self, video_title_clusters: list[list[str]]) -> list[str]:
        """Given clusters of video titles, return a 2-4 word label for each."""
        # TODO: Batch all clusters into one prompt
        return []

    async def analyze_sentiment_batch(self, comments: list[str]) -> dict:
        """Analyze 50-100 comments in one call → sentiment + asks + praise + complaints."""
        # TODO: Single multi-task prompt returning structured JSON
        return {}

    async def generate_strategy(self, analysis_data: dict) -> dict:
        """Convert structured analysis into strategy report sections."""
        # TODO: Single large-context call with JSON schema output
        return {}

    async def generate_video_ideas(self, inputs: dict) -> list[dict]:
        """Generate 15 video ideas from gap analysis + trends + audience asks."""
        return []

    async def optimize_title(self, title: str, formulas: list[str], examples: list[str]) -> list[dict]:
        """Rewrite a title into 5 variants using top formulas."""
        return []

    async def suggest_thumbnails(self, title: str, niche: str, modal_style: dict) -> list[dict]:
        """Generate 3 thumbnail concept briefs."""
        return []

    async def classify_topic_type(self, script_summary: str) -> str:
        """Classify as evergreen / trending / timesensitive for simulator."""
        return "evergreen"
