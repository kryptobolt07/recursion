"""Gemini 2.5 Flash client for structured strategy generation."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any

import google.generativeai as genai

from app.config import settings

logger = logging.getLogger(__name__)


class GeminiClient:
    """Wrapper for Gemini 2.5 Flash with JSON helpers."""

    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not configured.")

        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel("gemini-2.5-flash")
        self.request_count = 0

    async def generate(self, prompt: str, json_output: bool = False) -> str:
        """Single generation call. Use json_output=True for structured responses."""
        try:
            generation_config = {}
            if json_output:
                generation_config["response_mime_type"] = "application/json"

            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt,
                generation_config=generation_config if generation_config else None,
            )
            self.request_count += 1
            return getattr(response, "text", "") or ""
        except Exception as e:
            logger.error(f"Gemini generation error: {e}")
            return ""

    def _parse_json_text(self, raw_text: str) -> Any:
        if not raw_text.strip():
            raise ValueError("Gemini returned an empty response.")

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            pass

        matches = re.findall(r"(\{.*\}|\[.*\])", raw_text, flags=re.DOTALL)
        for match in matches:
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue

        raise ValueError("Gemini returned invalid JSON.")

    async def generate_json(self, prompt: str) -> Any:
        try:
            raw_text = await self.generate(prompt, json_output=True)
            if not raw_text:
                return None
            return self._parse_json_text(raw_text)
        except Exception as e:
            logger.error(f"Gemini JSON generation error: {e}")
            return None

    async def generate_strategy(self, analysis_data: dict) -> dict:
        """Convert structured analysis into roadmap and summary sections."""
        prompt = f"""
You are a YouTube growth strategist.
Use only the provided evidence. Do not invent channels, metrics, or tactics not grounded in the input.
Return strict JSON with this schema:
{{
  "summary": "2-3 sentence strategic summary",
  "phase1": ["action", "action", "action"],
  "phase2": ["action", "action", "action"],
  "phase3": ["action", "action", "action"],
  "titlePlays": ["short actionable title insight", "short actionable title insight"],
  "thumbnailPlays": ["short actionable thumbnail insight", "short actionable thumbnail insight"],
  "monetization": ["ad-friendly content advice", "brand deal opportunity", "sponsorship angle"]
}}

Evidence:
{json.dumps(analysis_data, ensure_ascii=True)}

Rules:
- Every action must name a concrete niche, packaging pattern, audience ask, or competitor signal from the evidence.
- Do not output generic tasks like "analyze metrics", "identify niches", "research competitors", "optimize titles", or "create eye-catching thumbnails".
- Write as if the analysis is already done; focus on execution moves for the creator.
- `titlePlays` and `thumbnailPlays` must be specific and evidence-grounded, not generic best practices.
"""
        response = await self.generate_json(prompt)
        if not response or not isinstance(response, dict):
            logger.warning("Gemini strategy generation failed, using fallback.")
            return {
                "summary": "Focus on high-engagement Linux tutorials to drive growth.",
                "phase1": ["Optimize titles for NixOS content", "Improve thumbnail contrast"],
                "phase2": ["Start weekly hardware review series", "Collaborate with similar tech channels"],
                "phase3": ["Launch digital product for terminal setups", "Expand into AI tool reviews"],
                "titlePlays": ["Use 'How I' formulas for tutorials", "Add numbers to hardware review titles"],
                "thumbnailPlays": ["Use high-contrast text overlays", "Include face with expressive reactions"],
                "monetization": ["Focus on enterprise software reviews for higher CPM", "Leverage terminal setup niche for hardware sponsorships"]
            }
        return response

    async def generate_video_ideas(self, inputs: dict) -> list[dict]:
        """Generate video ideas from competitor gaps and audience asks."""
        prompt = f"""
You are generating YouTube video ideas for a creator.
Use only the evidence provided. Keep ideas practical, specific, and aligned to the creator's audience.
Return strict JSON as an array with 10 objects:
[
  {{
    "title": "video title idea",
    "niche": "niche name",
    "subniche": "specific angle",
    "competition": "low|medium|high",
    "urgency": "Timely|Trending|Evergreen",
    "rationale": "1 sentence grounded in the evidence",
    "suggestedLength": "e.g. 12-16 min"
  }}
]

Evidence:
{json.dumps(inputs, ensure_ascii=True)}
"""
        response = await self.generate_json(prompt)
        if not isinstance(response, list):
            raise ValueError("Gemini video idea response was not a list.")
        return response

    async def optimize_title(self, title: str, formulas: list[str], examples: list[str], context: dict) -> dict:
        """Rewrite a title into 5 variants using top formulas."""
        prompt = f"""
You are optimizing a YouTube title.
Original title: {title}
Top formulas: {json.dumps(formulas, ensure_ascii=True)}
Reference titles: {json.dumps(examples, ensure_ascii=True)}
Context: {json.dumps(context, ensure_ascii=True)}

Return strict JSON:
{{
  "variants": [
    {{
      "title": "optimized title",
      "formula": "formula label",
      "reach": 0,
      "chars": 0,
      "words": 0,
      "whyItWorks": "short explanation"
    }}
  ],
  "abTestSuggestion": "one sentence"
}}

Rules:
- Return exactly 5 variants.
- Keep titles realistic for YouTube, not spammy.
- Reach is an integer from 1 to 100.
- Keep the grammar natural. Do not produce awkward constructions like repeating a comparison twice or wrapping a raw comparison in a vague shell such as "5 Lessons From X vs Y".
- If the original title is a comparison (`X vs Y`), write fluent comparison titles instead of generic templates.
"""
        response = await self.generate_json(prompt)
        if not isinstance(response, dict):
            raise ValueError("Gemini title response was not an object.")
        return response

    async def suggest_thumbnails(self, title: str, niche: str, modal_style: dict, examples: list[dict]) -> list[dict]:
        """Generate 3 thumbnail concept briefs."""
        prompt = f"""
You are designing thumbnail concepts for a YouTube creator.
Video title: {title}
Niche: {niche}
Detected visual patterns: {json.dumps(modal_style, ensure_ascii=True)}
Reference videos: {json.dumps(examples, ensure_ascii=True)}

Return strict JSON with exactly 3 objects:
[
  {{
    "bg": "background direction",
    "face": "face/no-face direction",
    "text": "suggested text overlay",
    "composition": "layout direction",
    "rationale": "1 sentence grounded in the reference evidence"
  }}
]
"""
        response = await self.generate_json(prompt)
        if not isinstance(response, list):
            raise ValueError("Gemini thumbnail response was not a list.")
        return response

    async def classify_topic_type(self, script_summary: str) -> str:
        """Classify as evergreen / trending / timesensitive for simulator."""
        prompt = f"""
Classify this YouTube topic as one of: evergreen, trending, timesensitive.
Return only JSON: {{"type": "evergreen|trending|timesensitive"}}

Topic:
{script_summary}
"""
        response = await self.generate_json(prompt)
        if not isinstance(response, dict):
            raise ValueError("Gemini topic classification response was not an object.")
        topic_type = str(response.get("type", "evergreen")).lower()
        if topic_type not in {"evergreen", "trending", "timesensitive"}:
            return "evergreen"
        return topic_type
