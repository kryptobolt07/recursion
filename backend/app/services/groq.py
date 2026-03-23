"""Groq chat client used as a fallback when Gemini is unavailable."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class GroqClient:
    """Wrapper for Groq chat completions with JSON helpers."""

    def __init__(self):
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not configured.")

        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    async def generate(self, prompt: str) -> str:
        logger.info("Groq request starting with model=%s", self.model)
        payload = {
            "model": self.model,
            "temperature": 0.35,
            "messages": [
                {
                    "role": "system",
                    "content": "Return only valid JSON that exactly matches the requested schema.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(self.base_url, json=payload, headers=headers)
            response.raise_for_status()
            body = response.json()
        logger.info("Groq request completed with model=%s", self.model)

        try:
            return body["choices"][0]["message"]["content"] or ""
        except (KeyError, IndexError, TypeError) as exc:
            logger.warning("Groq returned an invalid completion payload")
            raise ValueError("Groq returned an invalid completion payload.") from exc

    def _parse_json_text(self, raw_text: str) -> Any:
        if not raw_text.strip():
            raise ValueError("Groq returned an empty response.")

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            pass

        fenced = re.findall(r"```(?:json)?\s*(.*?)```", raw_text, flags=re.DOTALL | re.IGNORECASE)
        for block in fenced:
            try:
                return json.loads(block)
            except json.JSONDecodeError:
                continue

        matches = re.findall(r"(\{.*\}|\[.*\])", raw_text, flags=re.DOTALL)
        for match in matches:
            try:
                return json.loads(match)
            except json.JSONDecodeError:
                continue

        raise ValueError("Groq returned invalid JSON.")

    async def generate_json(self, prompt: str) -> Any:
        raw_text = await self.generate(prompt)
        return self._parse_json_text(raw_text)

    async def generate_strategy(self, analysis_data: dict) -> dict:
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
        if not isinstance(response, dict):
            raise ValueError("Groq strategy response was not an object.")
        return response

    async def generate_video_ideas(self, inputs: dict) -> list[dict]:
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
            raise ValueError("Groq video idea response was not a list.")
        return response

    async def optimize_title(self, title: str, formulas: list[str], examples: list[str], context: dict) -> dict:
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
            raise ValueError("Groq title response was not an object.")
        return response

    async def suggest_thumbnails(self, title: str, niche: str, modal_style: dict, examples: list[dict]) -> list[dict]:
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
            raise ValueError("Groq thumbnail response was not a list.")
        return response

    async def classify_topic_type(self, script_summary: str) -> str:
        prompt = f"""
Classify this YouTube topic as one of: evergreen, trending, timesensitive.
Return only JSON: {{"type": "evergreen|trending|timesensitive"}}

Topic:
{script_summary}
"""
        response = await self.generate_json(prompt)
        if not isinstance(response, dict):
            raise ValueError("Groq topic classification response was not an object.")
        topic_type = str(response.get("type", "evergreen")).lower()
        if topic_type not in {"evergreen", "trending", "timesensitive"}:
            return "evergreen"
        return topic_type
