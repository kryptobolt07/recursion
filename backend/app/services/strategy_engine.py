"""Real strategy, title, and thumbnail generation built on competitor analysis."""

from __future__ import annotations

import asyncio
import logging
import re
import time
from collections import Counter, defaultdict
from io import BytesIO
from statistics import mean
from typing import Any

import httpx
from colorthief import ColorThief

from app.data.demo_creator import DEMO_CREATOR
from app.services.analysis_cache import analysis_cache
from app.services.gemini import GeminiClient
from app.services.groq import GroqClient
from app.services.public_analysis import PublicCompetitorAnalysisService
from app.services.thumbnail_analysis import ThumbnailAnalysisService

DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MARKET_DATA_TTL_SECONDS = 900
RESULT_TTL_SECONDS = 900
TITLE_RESULT_TTL_SECONDS = 1800
THUMBNAIL_RESULT_TTL_SECONDS = 1800
logger = logging.getLogger(__name__)
DEFAULT_PALETTES = {
    "Linux & OS": ["#ef4444", "#0f172a", "#f8fafc"],
    "Hardware Reviews": ["#f97316", "#111827", "#38bdf8"],
    "Dev Tools & Workflow": ["#22c55e", "#0f172a", "#e2e8f0"],
    "Privacy & Security": ["#f59e0b", "#111827", "#ef4444"],
    "AI & Machine Learning": ["#7c3aed", "#0f172a", "#ef4444"],
}
GENERIC_STRATEGY_PHRASES = {
    "analyze audience engagement metrics",
    "identify top-performing content niches",
    "research competitor channels",
    "develop content around high-scoring opportunities",
    "optimize titles using proven formulas",
    "create eye-catching thumbnails",
    "engage with the audience through comments",
    "address viewer questions and concerns",
    "collaborate with other channels in the niche",
    "use numbered lists to create catchy titles",
    "make direct promises to attract viewers",
    "use visually appealing images to grab attention",
    "include text overlays to highlight key topics",
}

CANONICAL_TERMS = {
    "ai": "AI",
    "api": "API",
    "cli": "CLI",
    "copilot": "Copilot",
    "docker": "Docker",
    "github": "GitHub",
    "gpt": "GPT",
    "ide": "IDE",
    "ios": "iOS",
    "linux": "Linux",
    "llm": "LLM",
    "macos": "macOS",
    "nixos": "NixOS",
    "openai": "OpenAI",
    "vscode": "VS Code",
    "vs": "vs",
    "windows": "Windows",
    "youtube": "YouTube",
}

TOPIC_HINTS = {
    "linux_desktop": {
        "niche": "Linux & OS",
        "trigger_phrases": [
            "desktop environment",
            "desktop environments",
            "window manager",
            "window managers",
            "linux desktop",
        ],
        "tokens": {
            "desktop",
            "environment",
            "environments",
            "gnome",
            "kde",
            "plasma",
            "xfce",
            "cosmic",
            "cinnamon",
            "mate",
            "hyprland",
            "wayland",
            "window",
            "manager",
        },
    },
    "linux_distribution": {
        "niche": "Linux & OS",
        "trigger_phrases": ["linux distro", "linux distros"],
        "tokens": {"distro", "distros", "ubuntu", "fedora", "arch", "nixos", "mint", "debian"},
    },
}


def normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def tokenize(value: str) -> list[str]:
    return [token for token in re.findall(r"[a-z0-9][a-z0-9\+\-]+", value.lower()) if len(token) > 1]


def smart_case_text(value: str) -> str:
    tokens = re.split(r"(\s+|[—:,.!?()/-])", value.strip())
    normalized = []
    capitalize_next = True

    for token in tokens:
        lowered = token.lower()
        if not token or token.isspace():
            normalized.append(token)
            continue
        if re.fullmatch(r"[—:,.!?()/-]", token):
            normalized.append(token)
            capitalize_next = token in {":", "—", ".", "!", "?"}
            continue
        if token in {"I", "I'm", "I've", "I'd"}:
            normalized.append(token)
            capitalize_next = False
            continue
        if lowered in CANONICAL_TERMS:
            normalized.append(CANONICAL_TERMS[lowered])
            capitalize_next = False
            continue
        if any(character.isupper() for character in token[1:]):
            normalized.append(token)
            capitalize_next = False
            continue
        if capitalize_next:
            normalized.append(token.capitalize())
        else:
            normalized.append(token.lower())
        capitalize_next = False

    return "".join(normalized).strip()


def sentence_case(value: str) -> str:
    cleaned = re.sub(r"\s+", " ", value).strip(" -.,!?")
    if not cleaned:
        return ""
    return cleaned[0].upper() + cleaned[1:]


def trim_trailing_punctuation(value: str) -> str:
    return value.strip(" -.,:;!?")


def quantize_color(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(
        min((rgb[0] // 32) * 32, 255),
        min((rgb[1] // 32) * 32, 255),
        min((rgb[2] // 32) * 32, 255),
    )


class StrategyEngineService:
    """Uses real competitor analysis plus Gemini to generate strategy outputs."""

    def __init__(self):
        self.public_analysis = PublicCompetitorAnalysisService()
        try:
            self.gemini = GeminiClient()
            logger.info("LLM provider available: Gemini")
        except Exception as exc:
            self.gemini = None
            logger.warning("LLM provider unavailable: Gemini (%s)", exc)
        try:
            self.groq = GroqClient()
            logger.info("LLM provider available: Groq")
        except Exception as exc:
            self.groq = None
            logger.warning("LLM provider unavailable: Groq (%s)", exc)
        self._disabled_providers: set[str] = set()
        self._thumbnail_palette_cache: dict[str, list[str]] = {}
        self._result_cache: dict[str, tuple[float, Any]] = {}
        self._market_data_tasks: dict[str, asyncio.Task] = {}
        self.thumbnail_analysis = ThumbnailAnalysisService()
        logger.info("LLM provider order: Groq -> Gemini -> deterministic fallback")

    def _cache_get(self, key: str) -> Any | None:
        cached = self._result_cache.get(key)
        if not cached:
            return None

        expires_at, value = cached
        if expires_at <= time.time():
            self._result_cache.pop(key, None)
            return None
        return value

    def _cache_set(self, key: str, value: Any, ttl_seconds: int) -> Any:
        self._result_cache[key] = (time.time() + ttl_seconds, value)
        return value

    async def _persistent_get(self, key: str, ttl_seconds: int, force: bool = False) -> Any | None:
        if not force:
            cached = self._cache_get(key)
            if cached is not None:
                return cached

            cached = await analysis_cache.get(key)
            if cached is not None:
                self._cache_set(key, cached, ttl_seconds)
                return cached
        return None

    async def _persistent_set(self, key: str, value: Any, ttl_seconds: int) -> Any:
        self._cache_set(key, value, ttl_seconds)
        await analysis_cache.set(key, value)
        return value

    async def _call_llm(self, method_name: str, fallback: Any, **kwargs: Any) -> Any:
        for provider_name, client in (("Groq", self.groq), ("Gemini", self.gemini)):
            if provider_name in self._disabled_providers:
                logger.info("LLM provider skipped: %s for %s (disabled)", provider_name, method_name)
                continue
            if client is None:
                logger.info("LLM provider skipped: %s for %s (unavailable)", provider_name, method_name)
                continue
            try:
                method = getattr(client, method_name)
                result = await method(**kwargs)
                logger.info("LLM provider used: %s for %s", provider_name, method_name)
                return result
            except Exception as exc:
                logger.warning("LLM provider failed: %s for %s (%s)", provider_name, method_name, exc)
                if self._should_disable_provider(provider_name, exc):
                    self._disabled_providers.add(provider_name)
                    logger.warning("LLM provider disabled for process: %s", provider_name)
                continue
        logger.warning("All LLM providers unavailable for %s; using deterministic fallback", method_name)
        return fallback

    def _should_disable_provider(self, provider_name: str, exc: Exception) -> bool:
        message = str(exc).lower()
        hard_failure_markers = (
            "api key was reported as leaked",
            "invalid api key",
            "permission denied",
            "authentication",
            "unauthorized",
            "401",
            "403",
        )
        if any(marker in message for marker in hard_failure_markers):
            return True
        return False

    def _creator(self, channel_id: str) -> dict:
        if channel_id != DEMO_CREATOR["channel_id"]:
            raise ValueError(f"Unsupported creator channel '{channel_id}'.")
        return DEMO_CREATOR

    def _classify_creator_niche(self, title: str, creator: dict) -> str:
        lowered = title.lower()
        for topic in TOPIC_HINTS.values():
            if any(phrase in lowered for phrase in topic["trigger_phrases"]):
                return topic["niche"]

        title_tokens = set(tokenize(title))
        scores = []
        for niche in creator["niches"]:
            score = sum(1 for keyword in niche["keywords"] if keyword.lower() in lowered)
            score += sum(1 for keyword in niche["keywords"] if keyword.lower() in title_tokens)
            scores.append((score, niche["name"]))
        best_score, niche_name = max(scores, key=lambda item: item[0], default=(0, creator["niches"][0]["name"]))
        return niche_name if best_score > 0 else creator["niches"][0]["name"]

    def _topic_tokens_for_title(self, title: str) -> set[str]:
        lowered = title.lower()
        tokens = set(tokenize(title))
        for topic in TOPIC_HINTS.values():
            if any(phrase in lowered for phrase in topic["trigger_phrases"]) or tokens & topic["tokens"]:
                tokens |= topic["tokens"]
        return tokens

    def _creator_mix(self, creator: dict) -> list[dict]:
        counts = Counter(self._classify_creator_niche(title, creator) for title in creator["top_video_titles"])
        total = max(sum(counts.values()), 1)
        rows = [
            {"name": niche["name"], "share": round(counts.get(niche["name"], 0) / total * 100)}
            for niche in creator["niches"]
        ]
        difference = 100 - sum(row["share"] for row in rows)
        if rows:
            rows[0]["share"] += difference
        return [row for row in rows if row["share"] > 0]

    def _title_formula(self, title: str) -> str:
        lowered = title.lower()
        if " vs " in lowered:
            return "Comparison"
        if re.search(r"\b\d+\b", title):
            return "Numbered list"
        if "?" in title or lowered.startswith(("why ", "how ", "what ", "is ", "can ")):
            return "Question / curiosity"
        if re.search(r"\b(i|my|we)\b", lowered):
            return "Personal story"
        if any(marker in lowered for marker in ("guide", "review", "setup", "rank", "tier list")):
            return "Guide / review"
        return "Direct promise"

    def _length_band(self, title: str, niche: str) -> str:
        if "guide" in title.lower() or "review" in title.lower():
            return "12-18 min"
        if niche in {"AI & Machine Learning", "Linux & OS"}:
            return "10-16 min"
        return "8-14 min"

    def _urgency_label(self, title: str, niche: str) -> str:
        lowered = title.lower()
        if any(marker in lowered for marker in ("2026", "2025", "new", "latest", "just", "today", "update")):
            return "Timely"
        if niche == "AI & Machine Learning" or any(marker in lowered for marker in ("agent", "copilot", "gpt", "ai")):
            return "Trending"
        return "Evergreen"

    def _normalize_mix(self, rows: list[dict]) -> list[dict]:
        if not rows:
            return []
        total = sum(max(row["score"], 0) for row in rows) or 1
        normalized = []
        running_total = 0
        for index, row in enumerate(rows):
            if index == len(rows) - 1:
                share = 100 - running_total
            else:
                share = round(row["score"] / total * 100)
                running_total += share
            normalized.append({"name": row["name"], "share": max(0, share)})
        return normalized

    async def _fetch_market_data(self, channel_id: str, force: bool = False) -> tuple[dict, dict, list[dict]]:
        creator = self._creator(channel_id)
        discovery = await self.public_analysis.discover(channel_id, force=force)
        competitor_ids = [item["id"] for item in discovery["competitors"][:4]]
        raw_details = await asyncio.gather(
            *(self.public_analysis.competitor_detail(competitor_id, channel_id, force=force) for competitor_id in competitor_ids),
            return_exceptions=True,
        )
        details = [detail for detail in raw_details if isinstance(detail, dict)]
        return creator, discovery, details

    async def _load_market_data(self, channel_id: str, force: bool = False) -> tuple[dict, dict, list[dict]]:
        cache_key = f"market-data:{channel_id}"
        cached = await self._persistent_get(cache_key, MARKET_DATA_TTL_SECONDS, force=force)
        if cached is not None:
            return cached

        existing_task = self._market_data_tasks.get(channel_id)
        if existing_task is not None and not force:
            return await existing_task

        task = asyncio.create_task(self._fetch_market_data(channel_id, force=force))
        self._market_data_tasks[channel_id] = task
        try:
            result = await task
            return await self._persistent_set(cache_key, result, MARKET_DATA_TTL_SECONDS)
        finally:
            self._market_data_tasks.pop(channel_id, None)

    def _niche_opportunities(self, creator: dict, details: list[dict]) -> list[dict]:
        creator_niches = {niche["name"] for niche in creator["niches"]}
        buckets: dict[str, dict] = {}

        for detail in details:
            for niche in detail["nicheDistribution"]:
                name = niche["name"]
                base_score = (
                    niche["avgViews"]
                    * (max(niche["share"], 10) / 100)
                    * max(detail["audienceFitScore"], 25)
                    * max(detail["similarityScore"], 25)
                )
                if name in creator_niches:
                    base_score *= 1.15

                bucket = buckets.setdefault(
                    name,
                    {
                        "name": name,
                        "score": 0.0,
                        "avgViews": [],
                        "audienceFits": [],
                        "channels": set(),
                    },
                )
                bucket["score"] += base_score
                bucket["avgViews"].append(niche["avgViews"])
                bucket["audienceFits"].append(detail["audienceFitScore"])
                bucket["channels"].add(detail["name"])

        rows = []
        for bucket in buckets.values():
            rows.append(
                {
                    "name": bucket["name"],
                    "score": bucket["score"],
                    "avgViews": round(mean(bucket["avgViews"])) if bucket["avgViews"] else 0,
                    "audienceFit": round(mean(bucket["audienceFits"])) if bucket["audienceFits"] else 0,
                    "channels": sorted(bucket["channels"]),
                }
            )

        rows.sort(key=lambda row: row["score"], reverse=True)
        return rows

    def _niche_recommendations(
        self,
        current_mix: list[dict],
        suggested_mix: list[dict],
        opportunities: list[dict],
    ) -> list[dict]:
        current_map = {row["name"]: row["share"] for row in current_mix}
        opportunity_map = {row["name"]: row for row in opportunities}
        recommendations = []

        for row in suggested_mix[:5]:
            current_share = current_map.get(row["name"], 0)
            delta = row["share"] - current_share
            evidence = opportunity_map.get(row["name"], {})
            recommendations.append(
                {
                    "niche": row["name"],
                    "change": f"{delta:+d}%",
                    "reason": (
                        f"{', '.join(evidence.get('channels', [])[:2]) or 'Matched competitors'} average "
                        f"{evidence.get('avgViews', 0):,} views in this lane with ~{evidence.get('audienceFit', 0)}% "
                        f"estimated audience fit."
                    ),
                }
            )

        return recommendations

    def _fallback_opportunities(self, creator: dict, details: list[dict], current_mix: list[dict]) -> list[dict]:
        creator_niches = {niche["name"] for niche in creator["niches"]}
        buckets: dict[str, dict] = {}

        for detail in details:
            candidate_niches = [
                niche["name"]
                for niche in detail.get("nicheDistribution", [])
                if niche.get("name") and niche.get("name") != "Other"
            ]
            if not candidate_niches and detail.get("topNiche") and detail["topNiche"] != "Other":
                candidate_niches = [detail["topNiche"]]

            if not candidate_niches:
                candidate_niches = [row["name"] for row in current_mix[:3]]

            for index, niche_name in enumerate(candidate_niches[:3]):
                weight = 1 / (index + 1)
                base_score = max(detail.get("avgViews", 0), 1) * max(detail.get("similarityScore", 25), 25) * weight
                if niche_name in creator_niches:
                    base_score *= 1.12

                bucket = buckets.setdefault(
                    niche_name,
                    {
                        "name": niche_name,
                        "score": 0.0,
                        "avgViews": [],
                        "audienceFits": [],
                        "channels": set(),
                    },
                )
                bucket["score"] += base_score
                bucket["avgViews"].append(detail.get("avgViews", creator["avg_views"]))
                bucket["audienceFits"].append(detail.get("audienceFitScore", 0))
                bucket["channels"].add(detail.get("name", "Matched competitor"))

        if not buckets:
            estimated_audience_fit = round(
                mean(detail.get("audienceFitScore", 0) for detail in details) if details else 45
            )
            for index, row in enumerate(current_mix):
                boost = 1.0
                if len(current_mix) > 1:
                    if index == 0:
                        boost = 1.2
                    elif index == len(current_mix) - 1:
                        boost = 0.8
                buckets[row["name"]] = {
                    "name": row["name"],
                    "score": max(row["share"], 1) * 1000 * boost,
                    "avgViews": [creator["avg_views"]],
                    "audienceFits": [estimated_audience_fit],
                    "channels": {"Creator baseline"},
                }

        rows = [
            {
                "name": bucket["name"],
                "score": bucket["score"],
                "avgViews": round(mean(bucket["avgViews"])) if bucket["avgViews"] else creator["avg_views"],
                "audienceFit": round(mean(bucket["audienceFits"])) if bucket["audienceFits"] else 0,
                "channels": sorted(bucket["channels"]),
            }
            for bucket in buckets.values()
        ]
        rows.sort(key=lambda row: row["score"], reverse=True)
        return rows

    def _complete_suggested_mix(self, current_mix: list[dict], opportunities: list[dict], limit: int = 5) -> list[dict]:
        selected = [dict(row) for row in opportunities[:limit]]
        seen = {row["name"] for row in selected}

        for row in current_mix:
            if len(selected) >= limit:
                break
            if row["name"] in seen:
                continue
            selected.append(
                {
                    "name": row["name"],
                    "score": max(row["share"], 1) * 100,
                    "avgViews": 0,
                    "audienceFit": 0,
                    "channels": [],
                }
            )
            seen.add(row["name"])

        if not selected:
            selected = [
                {
                    "name": row["name"],
                    "score": max(row["share"], 1) * 100,
                    "avgViews": 0,
                    "audienceFit": 0,
                    "channels": [],
                }
                for row in current_mix[:limit]
            ]

        return self._normalize_mix(selected)

    def _aggregate_formulas(self, details: list[dict], niche: str | None = None) -> list[dict]:
        counts = Counter()
        examples: dict[str, list[str]] = defaultdict(list)

        for detail in details:
            reference_videos = [*detail["videos"], *detail["viralVideos"]]
            for video in reference_videos:
                if niche and video.get("nicheName") != niche and video.get("nicheId") != niche:
                    continue
                formula = self._title_formula(video["title"])
                counts[formula] += 1
                if len(examples[formula]) < 3:
                    examples[formula].append(video["title"])

        return [
            {"formula": formula, "count": count, "examples": examples[formula]}
            for formula, count in counts.most_common(5)
        ]

    def _aggregate_viewer_asks(self, details: list[dict]) -> list[str]:
        phrase_counts: Counter[str] = Counter()
        phrase_samples: dict[str, str] = {}
        for detail in details:
            for ask in detail["viewerAsks"]:
                try:
                    summary = self._summarize_viewer_ask(ask)
                except Exception as exc:
                    logger.warning("Viewer ask summarization failed for '%s' (%s)", ask, exc)
                    summary = sentence_case(ask)
                normalized = normalize_text(summary)
                if not normalized:
                    continue
                phrase_counts[normalized] += 1
                phrase_samples.setdefault(normalized, summary)
        return [phrase_samples[key] for key, _ in phrase_counts.most_common(8)]

    def _summarize_viewer_ask(self, ask: str) -> str:
        cleaned = sentence_case(ask)
        if not cleaned:
            return ""

        cleaned = re.sub(r"https?://\S+", "", cleaned)
        cleaned = cleaned.split("?")[0]
        cleaned = cleaned.split("!")[0]
        cleaned = re.split(r"\s+[.]\s+", cleaned)[0]
        cleaned = re.sub(r"\([^)]*\)", "", cleaned).strip(" -.,:;")

        prefix_patterns = [
            r"^(which method do you thi\w*\s+would be best for)\s+",
            r"^(which method would be best for)\s+",
            r"^(what is your view of comparing)\s+",
            r"^(what is your view of)\s+",
            r"^(do a video on)\s+",
            r"^(make a video on)\s+",
            r"^(can you cover)\s+",
            r"^(could you cover)\s+",
            r"^(can you do)\s+",
            r"^(could you do)\s+",
            r"^(you should cover)\s+",
            r"^(where is the)\s+",
            r"^(why)\s+",
            r"^(how do you)\s+",
            r"^(what about)\s+",
        ]
        lowered = cleaned.lower()
        for pattern in prefix_patterns:
            match = re.match(pattern, lowered, flags=re.IGNORECASE)
            if match:
                cleaned = cleaned[match.end():].strip(" -.,:;")
                lowered = cleaned.lower()
                break

        cleaned = re.split(r",| - | — | too\b| though\b| btw\b", cleaned, maxsplit=1, flags=re.IGNORECASE)[0].strip(" -.,:;")
        if not cleaned:
            return ""

        tokenized = tokenize(cleaned)
        if len(tokenized) >= 2:
            compact = " ".join(tokenized[:6])
            lowered_compact = compact.lower()
            if "repo url" in lowered_compact or "repository url" in lowered_compact:
                return "Repository URL"
            if "embedded development" in lowered_compact:
                return "Embedded Development Workflow"
            if "superpowers" in lowered_compact and "gsd" in lowered_compact:
                return "Superpowers vs GSD Framework"
            if "gm" in tokenized and "cc" in tokenized:
                return "GM-CC"
            return smart_case_text(compact)

        return smart_case_text(cleaned)

    def _reference_videos(self, details: list[dict], niche: str | None = None, limit: int = 6) -> list[dict]:
        rows = []
        for detail in details:
            for video in [*detail["viralVideos"], *detail["videos"]]:
                if niche and video.get("nicheName") != niche and video.get("nicheId") != niche:
                    continue
                rows.append(
                    {
                        "title": video["title"],
                        "channel": detail["name"],
                        "views": video["views"],
                        "thumbnailUrl": video.get("thumbnailUrl", ""),
                        "nicheName": video.get("nicheName", detail["topNiche"]),
                    }
                )
        rows.sort(key=lambda row: row["views"], reverse=True)
        unique = []
        seen = set()
        for row in rows:
            key = normalize_text(row["title"])
            if key in seen:
                continue
            seen.add(key)
            unique.append(row)
            if len(unique) >= limit:
                break
        return unique

    def _reference_videos_for_prompt(self, title: str, details: list[dict], niche: str | None = None, limit: int = 5) -> list[dict]:
        request_tokens = self._topic_tokens_for_title(title)
        rows = []

        for detail in details:
            for video in [*detail["viralVideos"], *detail["videos"]]:
                if niche and video.get("nicheName") != niche and video.get("nicheId") != niche:
                    continue

                haystack = f"{video.get('title', '')} {video.get('nicheName', '')}"
                video_tokens = set(tokenize(haystack))
                overlap = len(request_tokens & video_tokens)
                if request_tokens and overlap == 0:
                    continue

                rows.append(
                    {
                        "title": video["title"],
                        "channel": detail["name"],
                        "views": video["views"],
                        "thumbnailUrl": video.get("thumbnailUrl", ""),
                        "nicheName": video.get("nicheName", detail["topNiche"]),
                        "_overlap": overlap,
                    }
                )

        rows.sort(key=lambda row: (row["_overlap"], row["views"]), reverse=True)
        unique = []
        seen = set()
        for row in rows:
            key = normalize_text(row["title"])
            if key in seen:
                continue
            seen.add(key)
            row.pop("_overlap", None)
            unique.append(row)
            if len(unique) >= limit:
                break

        if len(unique) < limit:
            fallback_rows = self._reference_videos(details, niche=niche, limit=limit * 2)
            existing = {normalize_text(row["title"]) for row in unique}
            for row in fallback_rows:
                key = normalize_text(row["title"])
                if key in existing:
                    continue
                unique.append(row)
                existing.add(key)
                if len(unique) >= limit:
                    break

        return unique[:limit]

    async def _palette_for_thumbnail(self, thumbnail_url: str) -> list[str]:
        if not thumbnail_url:
            return []
        if thumbnail_url in self._thumbnail_palette_cache:
            return self._thumbnail_palette_cache[thumbnail_url]

        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.get(thumbnail_url)
                response.raise_for_status()
            palette = ColorThief(BytesIO(response.content)).get_palette(color_count=4, quality=5)
            colors = [quantize_color(color) for color in palette[:3]]
        except Exception:
            colors = []

        self._thumbnail_palette_cache[thumbnail_url] = colors
        return colors

    async def _modal_thumbnail_style(self, niche: str, references: list[dict]) -> dict:
        analysis = await self.thumbnail_analysis.analyze_video_set(references[:5])
        formula_rows = [self._title_formula(reference["title"]) for reference in references]
        formula_counts = Counter(formula_rows)
        primary_formula = formula_counts.most_common(1)[0][0] if formula_counts else "Direct promise"

        dominant_colors = analysis.get("dominantColors") or DEFAULT_PALETTES.get(niche, ["#ef4444", "#0f172a", "#f8fafc"])
        face_presence_pct = analysis.get("facePresencePct", 0)
        face_bias = "Face-forward reaction" if face_presence_pct >= 55 else "Usually no face; product or UI first"

        return {
            "dominantColors": dominant_colors,
            "primaryFormula": primary_formula,
            "compositionBias": analysis.get("compositionBias", "Single subject with bold focal point"),
            "faceBias": face_bias,
            "facePresencePct": face_presence_pct,
            "avgWordCount": analysis.get("avgWordCount", 0),
            "topOverlayWords": analysis.get("topOverlayWords", []),
            "averageBrightness": analysis.get("averageBrightness", 0),
            "averageEdgeDensity": analysis.get("averageEdgeDensity", 0),
        }

    def _fallback_strategy_copy(self, report_input: dict) -> dict:
        top_niche = report_input["opportunities"][0]["name"] if report_input["opportunities"] else report_input["creator"]["currentMix"][0]["name"]
        second_niche = report_input["opportunities"][1]["name"] if len(report_input["opportunities"]) > 1 else top_niche
        top_formula = report_input["titleFormulas"][0]["formula"] if report_input["titleFormulas"] else "Comparison"
        second_formula = report_input["titleFormulas"][1]["formula"] if len(report_input["titleFormulas"]) > 1 else "Direct promise"
        top_examples = report_input["titleFormulas"][0]["examples"][:2] if report_input["titleFormulas"] else []
        top_ask = report_input["viewerAsks"][0] if report_input["viewerAsks"] else "workflow tradeoffs"
        second_ask = report_input["viewerAsks"][1] if len(report_input["viewerAsks"]) > 1 else f"{second_niche} comparisons"
        competitor_names = [item["name"] for item in report_input["competitors"][:2]]
        competitor_label = " and ".join(competitor_names) if competitor_names else "matched competitors"
        top_avg_views = report_input["opportunities"][0]["avgViews"] if report_input["opportunities"] else (
            round(mean(item["avgViews"] for item in report_input["marketLeaders"])) if report_input["marketLeaders"] else report_input["creator"]["avgViews"]
        )
        top_audience_fit = report_input["opportunities"][0]["audienceFit"] if report_input["opportunities"] else (
            round(mean(item["audienceFitScore"] for item in report_input["competitors"])) if report_input["competitors"] else 45
        )
        strongest_mix_shift = report_input["opportunities"][0]["name"] if report_input["opportunities"] else top_niche
        top_example = top_examples[0] if top_examples else f"Recent {top_niche} winners"
        secondary_example = top_examples[1] if len(top_examples) > 1 else top_example
        audience_fit_text = (
            f"about {top_audience_fit}% estimated audience fit"
            if top_audience_fit > 0
            else "limited audience-fit confidence from public signals"
        )

        return {
            "summary": (
                f"The clearest growth lane is {top_niche}: {competitor_label} are averaging roughly {top_avg_views:,} "
                f"views there with {audience_fit_text}. The strongest packaging edge is "
                f"{top_formula.lower()} titles, and the best demand-side openings cluster around {top_ask.lower()} and "
                f"{second_ask.lower()}."
            ),
            "phase1": [
                f"Shift 2 of your next 4 uploads into {top_niche}; that lane is the strongest immediate upside in the current market snapshot.",
                f"Run a packaging sprint around {top_formula.lower()} titles. Start with the structure behind '{top_example}' and localize it to your creator voice.",
                f"Publish one demand-capture video around {top_ask}, then follow it with a sharper comparison or teardown around {second_ask}.",
            ],
            "phase2": [
                f"Turn the first {top_niche} winner into a 2-3 part series instead of treating it as a one-off upload.",
                f"Rebalance your topic mix toward {strongest_mix_shift} and {second_niche}; trim lower-return formats that are not matching that upside.",
                f"Track which niche-plus-formula pair performs best: {top_formula.lower()} for reach, {second_formula.lower()} when the promise is more tactical.",
            ],
            "phase3": [
                f"Package validated winners into recurring franchises with repeatable hooks, not isolated experiments.",
                f"Systematize titles around {top_formula.lower()} and {second_formula.lower()} patterns so every upload has a clear packaging lane before scripting starts.",
                "Scale publishing into the strongest posting windows once one niche-formula combination clearly lifts your baseline.",
            ],
            "titlePlays": [
                f"{top_formula} is the strongest repeated formula in your matched market. Reference winners: '{top_example}' and '{secondary_example}'.",
                f"Lead with the outcome, tradeoff, or claim in the first 45 characters; do not bury the hook behind generic setup wording.",
                f"Use {second_formula.lower()} when the video is tactical, but keep the title anchored to one concrete promise instead of a broad topic label.",
            ],
            "thumbnailPlays": [
                f"For {top_niche}, keep the thumbnail centered on one proof object or UI moment that makes the title claim immediately legible.",
                "Avoid crowded layouts. One focal subject, one contrast pair, and a short overlay beat multi-element compositions for this market.",
                f"If the title is framed as {top_formula.lower()}, the thumbnail should visualize the contrast or payoff, not restate the whole headline.",
            ],
            "monetization": [
                f"Leverage {top_niche} tutorials to drive higher CPM from enterprise tools.",
                f"Focus on {top_ask.lower()} to attract specialized brand sponsorships.",
                "Incorporate affiliate links for hardware reviewed in your top performing niche.",
            ],
        }

    def _strategy_section_is_generic(self, rows: list[str], generic_phrases: set[str]) -> bool:
        if not rows:
            return True
        generic_hits = 0
        for row in rows[:3]:
            normalized = normalize_text(row)
            if len(normalized.split()) < 5:
                generic_hits += 1
                continue
            if any(phrase in normalized for phrase in generic_phrases):
                generic_hits += 1
        return generic_hits >= 2

    def _strategy_summary_is_generic(self, summary: str) -> bool:
        normalized = normalize_text(summary)
        return len(normalized.split()) < 16 or "engagement metrics" in normalized or "top performing content niches" in normalized

    def _merge_strategy_copy(self, llm_copy: dict, fallback_copy: dict) -> dict:
        merged = dict(fallback_copy)
        if isinstance(llm_copy, dict) and not self._strategy_summary_is_generic(str(llm_copy.get("summary", ""))):
            merged["summary"] = str(llm_copy["summary"]).strip()

        for key in ("phase1", "phase2", "phase3", "titlePlays", "thumbnailPlays", "monetization"):
            candidate = llm_copy.get(key) if isinstance(llm_copy, dict) else None
            normalized_rows = [sentence_case(str(row)) for row in (candidate or []) if str(row).strip()]
            if key == "monetization" or not self._strategy_section_is_generic(normalized_rows, GENERIC_STRATEGY_PHRASES):
                merged[key] = normalized_rows[:3]

        return merged

    async def strategy_report(self, channel_id: str, force: bool = False) -> dict:
        cache_key = f"strategy-report:v3:{channel_id}"
        cached = await self._persistent_get(cache_key, RESULT_TTL_SECONDS, force=force)
        if cached is not None:
            return cached

        creator, discovery, details = await self._load_market_data(channel_id, force=force)
        current_mix = self._creator_mix(creator)
        opportunities = self._niche_opportunities(creator, details)[:5]
        if not opportunities:
            opportunities = self._fallback_opportunities(creator, details, current_mix)[:5]
        suggested_mix = self._complete_suggested_mix(current_mix, opportunities)
        title_formulas = self._aggregate_formulas(details)
        viewer_asks = self._aggregate_viewer_asks(details)
        market_leaders = [
            {
                "name": detail["name"],
                "topNiche": detail["topNiche"],
                "avgViews": detail["avgViews"],
                "audienceFitScore": detail["audienceFitScore"],
            }
            for detail in details[:3]
        ]

        report_input = {
            "creator": {
                "name": creator["name"],
                "subscribers": creator["subscribers"],
                "avgViews": creator["avg_views"],
                "engagementRate": creator["engagement_rate"],
                "currentMix": current_mix,
            },
            "competitors": [
                {
                    "name": item["name"],
                    "similarityScore": item["similarityScore"],
                    "audienceFitScore": item["audienceFitScore"],
                    "topNiche": item["topNiche"],
                }
                for item in discovery["competitors"][:4]
            ],
            "marketLeaders": market_leaders,
            "opportunities": opportunities,
            "titleFormulas": title_formulas,
            "viewerAsks": viewer_asks,
        }

        fallback_copy = self._fallback_strategy_copy(report_input)
        llm_copy = await self._call_llm(
            "generate_strategy",
            fallback_copy,
            analysis_data=report_input,
        )
        merged_copy = self._merge_strategy_copy(llm_copy, fallback_copy)

        result = {
            "summary": merged_copy["summary"],
            "currentMix": current_mix,
            "suggestedMix": suggested_mix,
            "nicheRecommendations": self._niche_recommendations(current_mix, suggested_mix, opportunities),
            "roadmap": {
                "phase1": {"title": "Next 30 Days", "actions": merged_copy["phase1"][:3]},
                "phase2": {"title": "Days 31-60", "actions": merged_copy["phase2"][:3]},
                "phase3": {"title": "Days 61-90", "actions": merged_copy["phase3"][:3]},
            },
            "supportingSignals": {
                "titlePlays": merged_copy["titlePlays"][:3],
                "thumbnailPlays": merged_copy["thumbnailPlays"][:3],
                "monetization": merged_copy.get("monetization", []),
                "viewerAsks": viewer_asks[:5],
                "marketLeaders": market_leaders,
            },
        }
        return await self._persistent_set(cache_key, result, RESULT_TTL_SECONDS)

    async def posting_strategy(self, channel_id: str, force: bool = False) -> dict:
        cache_key = f"posting-strategy:{channel_id}"
        cached = await self._persistent_get(cache_key, RESULT_TTL_SECONDS, force=force)
        if cached is not None:
            return cached

        creator, _discovery, details = await self._load_market_data(channel_id, force=force)
        day_counts = Counter()
        hour_counts = Counter()

        for detail in details:
            for row in detail.get("postingPattern", {}).get("days", []):
                day_counts[row["day"]] += row["count"]
            for row in detail.get("postingPattern", {}).get("hours", []):
                hour_counts[row["hour"]] += row["count"]

        ranked_days = [day for day, _ in day_counts.most_common()] or DAY_ORDER[:3]
        ranked_hours = [hour for hour, _ in hour_counts.most_common()] or [16, 18, 20]
        weekly_calendar = [
            {"day": day, "time": f"{ranked_hours[min(index, len(ranked_hours) - 1)]:02d}:00"}
            for index, day in enumerate(ranked_days[:4])
        ]

        result = {
            "bestDays": ranked_days[:3],
            "bestHours": [f"{hour:02d}:00" for hour in ranked_hours[:3]],
            "weeklyCalendar": weekly_calendar,
            "recommendedCadence": creator["upload_frequency"],
            "shortsRecommendation": (
                "Test 1 Shorts recap per week around trending AI or tool-comparison topics."
                if any(detail["topNiche"] == "AI & Machine Learning" for detail in details)
                else "Use Shorts sparingly; prioritize full-length uploads unless a fast-moving news angle appears."
            ),
        }
        return await self._persistent_set(cache_key, result, RESULT_TTL_SECONDS)

    def _fallback_video_ideas(self, opportunities: list[dict], viewer_asks: list[str], details: list[dict]) -> list[dict]:
        references = self._reference_videos(details, limit=10)
        ideas = []
        used_titles = set()

        for index, opportunity in enumerate(opportunities[:5]):
            ask = viewer_asks[index] if index < len(viewer_asks) else f"{opportunity['name']} workflow upgrades"
            reference_title = references[index]["title"] if index < len(references) else opportunity["name"]
            title = f"{ask} — What Actually Works in 2026"
            normalized = normalize_text(title)
            if normalized in used_titles:
                title = f"{opportunity['name']}: {reference_title}"
                normalized = normalize_text(title)
            used_titles.add(normalized)
            ideas.append(
                {
                    "title": title,
                    "niche": opportunity["name"],
                    "subniche": ask,
                    "competition": "medium",
                    "urgency": self._urgency_label(reference_title, opportunity["name"]),
                    "rationale": (
                        f"Competitors in {opportunity['name']} are averaging {opportunity['avgViews']:,} views and "
                        f"their audience keeps asking for this angle."
                    ),
                    "suggestedLength": self._length_band(reference_title, opportunity["name"]),
                }
            )

        while len(ideas) < 10 and references:
            reference = references[len(ideas) % len(references)]
            title = f"{reference['title']} — But for Power Users"
            if normalize_text(title) in used_titles:
                title = f"Breaking Down {reference['title']}"
            used_titles.add(normalize_text(title))
            ideas.append(
                {
                    "title": title,
                    "niche": reference["nicheName"],
                    "subniche": "Competitor outlier breakdown",
                    "competition": "high",
                    "urgency": self._urgency_label(reference["title"], reference["nicheName"]),
                    "rationale": "Derived from a top-performing competitor outlier you can localize to the creator's audience.",
                    "suggestedLength": self._length_band(reference["title"], reference["nicheName"]),
                }
            )

        return ideas[:10]

    async def video_ideas(self, channel_id: str, force: bool = False) -> dict:
        cache_key = f"video-ideas:{channel_id}"
        cached = await self._persistent_get(cache_key, RESULT_TTL_SECONDS, force=force)
        if cached is not None:
            return cached

        creator, discovery, details = await self._load_market_data(channel_id, force=force)
        opportunities = self._niche_opportunities(creator, details)
        viewer_asks = self._aggregate_viewer_asks(details)
        formulas = self._aggregate_formulas(details)
        reference_videos = self._reference_videos(details, limit=8)

        payload = {
            "creator": {
                "name": creator["name"],
                "audience": creator["target_audience"],
                "currentNiches": [niche["name"] for niche in creator["niches"]],
            },
            "competitors": discovery["competitors"][:4],
            "opportunities": opportunities[:5],
            "viewerAsks": viewer_asks[:6],
            "titleFormulas": formulas[:4],
            "referenceVideos": reference_videos[:6],
        }
        ideas = await self._call_llm(
            "generate_video_ideas",
            self._fallback_video_ideas(opportunities, viewer_asks, details),
            inputs=payload,
        )

        normalized = []
        for index, idea in enumerate(ideas[:10], start=1):
            normalized.append(
                {
                    "id": f"idea-{index}",
                    "title": str(idea.get("title", "")).strip(),
                    "niche": str(idea.get("niche", opportunities[0]["name"] if opportunities else creator["niches"][0]["name"])),
                    "subniche": str(idea.get("subniche", "Audience-requested angle")).strip(),
                    "competition": str(idea.get("competition", "medium")).lower(),
                    "urgency": str(idea.get("urgency", "Evergreen")).title(),
                    "rationale": str(idea.get("rationale", "")).strip(),
                    "suggestedLength": str(idea.get("suggestedLength", "10-14 min")).strip(),
                }
            )
        return await self._persistent_set(cache_key, {"ideas": normalized}, RESULT_TTL_SECONDS)

    def _title_inputs(self, title: str, niche: str, creator: dict, details: list[dict]) -> tuple[str, list[dict], list[str], dict]:
        inferred_niche = niche.strip() or self._classify_creator_niche(title, creator)
        formula_rows = self._aggregate_formulas(details, niche=inferred_niche) or self._aggregate_formulas(details)
        example_titles: list[str] = []
        for row in formula_rows[:3]:
            example_titles.extend(row["examples"])
        example_titles = example_titles[:5]

        context = {
            "creator": creator["name"],
            "niche": inferred_niche,
            "audience": creator["target_audience"],
            "topCompetitorFormulas": formula_rows[:4],
        }
        return inferred_niche, formula_rows, example_titles, context

    def _normalize_title_result(self, title: str, inferred_niche: str, result: dict, example_titles: list[str]) -> dict:
        fallback_variants = self._fallback_title_variants(title, [], example_titles).get("variants", [])
        variants = []
        for index, variant in enumerate(result.get("variants", [])[:5]):
            variant_title = str(variant.get("title", "")).strip()
            if not variant_title:
                continue
            formula = str(variant.get("formula", "Direct promise"))
            if self._is_awkward_title_variant(title, variant_title, formula):
                fallback_variant = fallback_variants[min(index, len(fallback_variants) - 1)] if fallback_variants else None
                if fallback_variant:
                    variant_title = fallback_variant["title"]
                    formula = fallback_variant["formula"]
            variants.append(
                {
                    "title": variant_title,
                    "formula": formula,
                    "reach": max(1, min(int(variant.get("reach", 75)), 100)),
                    "chars": len(variant_title),
                    "words": len(variant_title.split()),
                    "whyItWorks": str(variant.get("whyItWorks", "")).strip(),
                }
            )

        return {
            "original": title,
            "niche": inferred_niche,
            "variants": variants,
            "abTestSuggestion": str(result.get("abTestSuggestion", "")).strip(),
            "referenceTitles": example_titles,
        }

    def _split_comparison_title(self, title: str) -> tuple[str, str] | None:
        cleaned = re.sub(r"\s+", " ", title.strip())
        base = re.split(r"\s+[—:-]\s+", cleaned, maxsplit=1)[0]
        match = re.match(r"^(?P<left>.+?)\s+vs\.?\s+(?P<right>.+)$", base, flags=re.IGNORECASE)
        if not match:
            return None

        left = trim_trailing_punctuation(smart_case_text(match.group("left")))
        right = trim_trailing_punctuation(smart_case_text(match.group("right")))
        if not left or not right:
            return None
        return left, right

    def _is_awkward_title_variant(self, original_title: str, candidate_title: str, formula: str) -> bool:
        normalized_original = normalize_text(original_title)
        normalized_candidate = normalize_text(candidate_title)
        if not normalized_candidate:
            return True

        if normalized_candidate.count(" vs ") > 1:
            return True
        if " vs the old way " in normalized_candidate and " vs " in normalized_original:
            return True
        if formula.lower() == "numbered list" and " lessons from " in normalized_candidate and " vs " in normalized_original:
            return True
        if formula.lower() == "question / curiosity" and " worth your time" in normalized_candidate and " vs " in normalized_original:
            return True
        if formula.lower() == "personal story" and " what changed for me" in normalized_candidate and " vs " in normalized_original:
            return True

        return False

    def _fallback_title_variants(self, title: str, formulas: list[dict], examples: list[str]) -> dict:
        normalized_title = smart_case_text(re.sub(r"\s+", " ", title.strip(" -")))
        top_formula = formulas[0]["formula"] if formulas else "Personal story"
        switch_match = re.match(r"^i switched to (?P<topic>.+?) for (?P<time>.+)$", title.strip(), flags=re.IGNORECASE)
        tried_match = re.match(r"^i tried (?P<topic>.+?) for (?P<time>.+)$", title.strip(), flags=re.IGNORECASE)
        left_match = re.match(r"^why i left (?P<topic>.+)$", title.strip(), flags=re.IGNORECASE)
        comparison_parts = self._split_comparison_title(title)

        if switch_match:
            topic = smart_case_text(switch_match.group("topic"))
            time_frame = smart_case_text(switch_match.group("time"))
            variants = [
                {"title": f"5 Things {topic} Got Right After {time_frame}", "formula": "Numbered list", "reach": 84},
                {"title": f"Is {topic} Actually Better After {time_frame}?", "formula": "Question / curiosity", "reach": 86},
                {"title": f"I Switched to {topic} for {time_frame} — Here's What Changed", "formula": "Personal story", "reach": 92},
                {"title": f"{topic} After {time_frame}: What It Does Better Than My Old Setup", "formula": "Comparison", "reach": 88},
                {"title": f"Switching to {topic}: The Practical Setup Guide", "formula": "Guide / review", "reach": 81},
            ]
        elif tried_match:
            topic = smart_case_text(tried_match.group("topic"))
            time_frame = smart_case_text(tried_match.group("time"))
            variants = [
                {"title": f"5 Surprises I Found Using {topic} for {time_frame}", "formula": "Numbered list", "reach": 83},
                {"title": f"Was {topic} Worth It After {time_frame}?", "formula": "Question / curiosity", "reach": 85},
                {"title": f"I Tried {topic} for {time_frame} — Here's What Happened", "formula": "Personal story", "reach": 90},
                {"title": f"{topic} After {time_frame}: The Honest Tradeoff", "formula": "Comparison", "reach": 86},
                {"title": f"{topic}: The Practical Guide After {time_frame}", "formula": "Guide / review", "reach": 79},
            ]
        elif left_match:
            topic = smart_case_text(left_match.group("topic"))
            variants = [
                {"title": f"5 Reasons I Finally Left {topic}", "formula": "Numbered list", "reach": 83},
                {"title": f"Was Leaving {topic} the Right Move?", "formula": "Question / curiosity", "reach": 85},
                {"title": f"Why I Left {topic} — And What I Use Instead", "formula": "Personal story", "reach": 91},
                {"title": f"{topic} vs My New Setup — What Actually Improved", "formula": "Comparison", "reach": 87},
                {"title": f"Leaving {topic}: The Practical Migration Guide", "formula": "Guide / review", "reach": 80},
            ]
        elif comparison_parts:
            left, right = comparison_parts
            subject = f"{left} vs {right}"
            variants = [
                {"title": f"{subject}: 5 Differences That Actually Matter", "formula": "Numbered list", "reach": 85},
                {"title": f"{subject}: Which One Makes More Sense?", "formula": "Question / curiosity", "reach": 87},
                {"title": f"I Compared {left} and {right} — What I Learned", "formula": "Personal story", "reach": 90},
                {"title": f"{subject}: What Actually Wins for Daily Use?", "formula": "Comparison", "reach": 88},
                {"title": f"{subject}: A Practical Guide to Choosing the Right One", "formula": "Guide / review", "reach": 82},
            ]
        else:
            subject = normalized_title
            variants = [
                {"title": f"5 Lessons From {subject}", "formula": "Numbered list", "reach": 82},
                {"title": f"Is {subject} Actually Worth Your Time?", "formula": "Question / curiosity", "reach": 84},
                {"title": f"{subject} — Here's What Changed for Me", "formula": "Personal story", "reach": 88},
                {"title": f"{subject} vs the Old Way — What Actually Wins?", "formula": "Comparison", "reach": 86},
                {"title": f"{subject}: The Practical Guide for Power Users", "formula": "Guide / review", "reach": 80},
            ]
        for variant in variants:
            variant["chars"] = len(variant["title"])
            variant["words"] = len(variant["title"].split())
            variant["whyItWorks"] = f"Aligned to the {variant['formula'].lower()} pattern seen in top competitor titles."

        return {
            "variants": variants,
            "abTestSuggestion": (
                f"Start by testing the {top_formula.lower()} pattern against a personal-story version. "
                f"Reference winners include {examples[0] if examples else 'recent top competitor uploads'}."
            ),
        }

    async def optimize_title(self, title: str, niche: str, channel_id: str, force: bool = False) -> dict:
        cache_key = f"title-opt:{channel_id}:{normalize_text(niche)}:{normalize_text(title)}"
        cached = await self._persistent_get(cache_key, TITLE_RESULT_TTL_SECONDS, force=force)
        if cached is not None:
            return cached

        creator, _discovery, details = await self._load_market_data(channel_id, force=force)
        inferred_niche, formula_rows, example_titles, context = self._title_inputs(title, niche, creator, details)

        try:
            search_results = await self.public_analysis.search_videos(title, max_results=5, force=force)
            search_titles = [item["title"] for item in search_results if item.get("title")]
            if search_titles:
                seen = set()
                combined_examples = []
                for candidate in search_titles + example_titles:
                    if candidate not in seen:
                        seen.add(candidate)
                        combined_examples.append(candidate)
                example_titles = combined_examples[:8]
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("YouTube video search failed for title optimization: %s", exc)
        result = await self._call_llm(
            "optimize_title",
            self._fallback_title_variants(title, formula_rows, example_titles),
            title=title,
            formulas=[row["formula"] for row in formula_rows[:4]],
            examples=example_titles,
            context=context,
        )

        normalized_result = self._normalize_title_result(title, inferred_niche, result, example_titles)
        return await self._persistent_set(cache_key, normalized_result, TITLE_RESULT_TTL_SECONDS)

    async def bulk_optimize_titles(self, channel_id: str, force: bool = False) -> dict:
        cache_key = f"title-bulk:{channel_id}"
        cached = await self._persistent_get(cache_key, RESULT_TTL_SECONDS, force=force)
        if cached is not None:
            return cached

        creator, _discovery, details = await self._load_market_data(channel_id, force=force)
        optimizable = []
        for title in creator["top_video_titles"][:10]:
            inferred_niche, formula_rows, example_titles, _context = self._title_inputs(title, "", creator, details)
            result = self._fallback_title_variants(title, formula_rows, example_titles)
            normalized_result = self._normalize_title_result(title, inferred_niche, result, example_titles)
            top_variant = normalized_result["variants"][0] if normalized_result["variants"] else None
            optimizable.append(
                {
                    "original": title,
                    "topVariant": top_variant["title"] if top_variant else "",
                    "bestFormula": top_variant["formula"] if top_variant else "",
                    "reach": top_variant["reach"] if top_variant else 0,
                }
            )

        return await self._persistent_set(cache_key, {"optimizable": optimizable}, RESULT_TTL_SECONDS)

    def _fallback_thumbnail_concepts(self, title: str, niche: str, modal_style: dict, references: list[dict]) -> list[dict]:
        dominant_colors = ", ".join(modal_style["dominantColors"][:3])
        primary_formula = modal_style.get("primaryFormula", "Direct promise")
        overlay_words = modal_style.get("topOverlayWords", [])
        overlay_base = " ".join(overlay_words[:2]).upper() or " ".join(word.upper() for word in title.split()[:3])[:26] or "WATCH THIS"
        reference_note = references[0]["title"] if references else "top competitor thumbnails"
        face_direction = (
            "Face-forward reaction crop"
            if modal_style.get("facePresencePct", 0) >= 55
            else "No face; let the object, UI, or result visual do the work"
        )
        text_direction = (
            f"{max(1, round(modal_style.get('avgWordCount', 2)))}-word overlay echoing the high-frequency thumbnail wording"
            if modal_style.get("avgWordCount", 0) > 0
            else "2-4 bold words"
        )

        concepts = [
            {
                "bg": f"Dark, high-contrast background using {dominant_colors}",
                "face": face_direction,
                "text": f"{text_direction}: '{overlay_base}'",
                "composition": modal_style.get("compositionBias", "Single subject with bold focal point"),
                "rationale": f"Grounded in the dominant palette and packaging style around {reference_note}.",
            },
            {
                "bg": f"Minimal background with one bright accent from {dominant_colors}",
                "face": "No face; product, UI, or benchmark visual leads",
                "text": "Short result-focused claim with one focal keyword",
                "composition": "Center-weighted visual with one proof element and clean margins",
                "rationale": f"Fits the strongest {primary_formula.lower()} packaging trend in the reference set.",
            },
            {
                "bg": f"Two-tone contrast using {dominant_colors}",
                "face": "Optional reaction crop if the title is framed as a challenge or comparison",
                "text": "One sharp hook word plus one outcome word",
                "composition": "Object on one side, result cue on the other, avoid clutter",
                "rationale": "Keeps the click promise obvious while staying close to real winning competitor palettes.",
            },
        ]
        return concepts

    async def suggest_thumbnails(self, title: str, niche: str, channel_id: str, force: bool = False) -> dict:
        cache_key = f"thumbnail-suggest:v2:{channel_id}:{normalize_text(niche)}:{normalize_text(title)}"
        cached = await self._persistent_get(cache_key, THUMBNAIL_RESULT_TTL_SECONDS, force=force)
        if cached is not None:
            return cached

        creator, _discovery, details = await self._load_market_data(channel_id, force=force)
        inferred_niche = niche.strip() or self._classify_creator_niche(title, creator)

        try:
            search_results = await self.public_analysis.search_videos(title, max_results=5, force=force)
            references = [
                {
                    "title": item["title"],
                    "channel": item["channel_title"],
                    "views": item.get("view_count", 0),
                    "thumbnailUrl": item["thumbnail_url"],
                    "nicheName": inferred_niche,
                }
                for item in search_results
            ]
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("YouTube video search failed: %s", exc)
            references = []

        if not references:
            references = self._reference_videos_for_prompt(title, details, niche=inferred_niche, limit=5) or self._reference_videos(details, niche=inferred_niche, limit=5)
        modal_style = await self._modal_thumbnail_style(inferred_niche, references)
        thumbnail_analysis = await self.thumbnail_analysis.analyze_video_set(references)

        concepts = await self._call_llm(
            "suggest_thumbnails",
            self._fallback_thumbnail_concepts(title, inferred_niche, modal_style, references),
            title=title,
            niche=inferred_niche,
            modal_style=modal_style,
            examples=references[:4],
        )

        normalized = []
        for index, concept in enumerate(concepts[:3], start=1):
            normalized.append(
                {
                    "id": index,
                    "bg": str(concept.get("bg", "")).strip(),
                    "face": str(concept.get("face", "")).strip(),
                    "text": str(concept.get("text", "")).strip(),
                    "composition": str(concept.get("composition", "")).strip(),
                    "rationale": str(concept.get("rationale", "")).strip(),
                }
            )

        result = {
            "niche": inferred_niche,
            "modalStyle": modal_style,
            "referenceVideos": thumbnail_analysis.get("referenceVideos", references[:4]),
            "concepts": normalized,
        }
        return await self._persistent_set(cache_key, result, THUMBNAIL_RESULT_TTL_SECONDS)
