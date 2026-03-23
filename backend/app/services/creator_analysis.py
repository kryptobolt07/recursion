"""Creator-side channel and niche analysis backed by the demo dataset."""

from __future__ import annotations

import asyncio
import json
import logging
import re
import subprocess
from pathlib import Path
from statistics import mean
from typing import Any

from app.config import REPO_ROOT
from app.data.demo_creator import DEMO_CREATOR
from app.services.analysis_cache import analysis_cache
from app.services.public_analysis import PublicCompetitorAnalysisService


MOCK_DATA_PATH = REPO_ROOT / "frontend" / "src" / "data" / "mockData.ts"
AGE_BANDS = ["13–17", "18–24", "25–34", "35–44", "45–54", "55+"]
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


class CreatorAnalysisService:
    """Expose creator-side analysis views from the shared demo dataset."""

    def __init__(self) -> None:
        self.logger = logging.getLogger(__name__)
        self.public_analysis = PublicCompetitorAnalysisService()
        self._dataset: dict[str, Any] | None = None
        self._dataset_mtime_ns: int | None = None
        self._dataset_lock = asyncio.Lock()

    def _require_channel(self, channel_id: str) -> str:
        if channel_id != DEMO_CREATOR["channel_id"]:
            raise ValueError(f"Unsupported creator channel '{channel_id}'.")
        return channel_id

    def _find_export_start(self, text: str, export_name: str) -> int:
        match = re.search(rf"export const {re.escape(export_name)}[^=]*= ", text)
        if not match:
            raise ValueError(f"Could not locate export '{export_name}' in mock dataset.")
        return match.end()

    def _extract_expression(self, text: str, export_name: str, open_char: str, close_char: str) -> str:
        start = self._find_export_start(text, export_name)
        index = start
        depth = 0
        in_string: str | None = None
        escaped = False
        started = False

        while index < len(text):
            char = text[index]
            if in_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == in_string:
                    in_string = None
            else:
                if char in {'"', "'", "`"}:
                    in_string = char
                elif char == open_char:
                    depth += 1
                    started = True
                elif char == close_char:
                    depth -= 1
                    if started and depth == 0:
                        return text[start:index + 1]
            index += 1

        raise ValueError(f"Could not parse export '{export_name}'.")

    async def _load_dataset(self, force: bool = False) -> dict[str, Any]:
        if not MOCK_DATA_PATH.exists():
            raise FileNotFoundError(f"Mock dataset not found at {MOCK_DATA_PATH}")

        mtime_ns = MOCK_DATA_PATH.stat().st_mtime_ns
        if not force and self._dataset is not None and self._dataset_mtime_ns == mtime_ns:
            return self._dataset

        async with self._dataset_lock:
            mtime_ns = MOCK_DATA_PATH.stat().st_mtime_ns
            if not force and self._dataset is not None and self._dataset_mtime_ns == mtime_ns:
                return self._dataset

            text = MOCK_DATA_PATH.read_text(encoding="utf-8")
            channel_expr = self._extract_expression(text, "channelStats", "{", "}")
            niches_expr = self._extract_expression(text, "niches", "[", "]")
            script = (
                "console.log(JSON.stringify({"
                f"channelStats: {channel_expr}, "
                f"niches: {niches_expr}"
                "}))"
            )
            result = subprocess.run(
                ["node", "--input-type=module", "-e", script],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=True,
            )
            dataset = json.loads(result.stdout)
            self._dataset = dataset
            self._dataset_mtime_ns = mtime_ns
            return dataset

    async def _get_dataset(self, channel_id: str, force: bool = False) -> dict[str, Any]:
        self._require_channel(channel_id)
        return await self._load_dataset(force=force)

    async def _cached(self, cache_key: str, force: bool, builder) -> Any:
        if not force:
            cached = await analysis_cache.get(cache_key)
            if cached is not None:
                return cached
        payload = await builder()
        await analysis_cache.set(cache_key, payload)
        return payload

    def _all_top_videos(self, niches: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return sorted(
            [
                {
                    **video,
                    "nicheName": niche["name"],
                    "nicheColor": niche["colorIndex"],
                }
                for niche in niches
                for video in niche["topVideos"]
            ],
            key=lambda item: item["views"],
            reverse=True,
        )

    def _global_sentiment_summary(self, sentiment: dict[str, int], top_niche_name: str, weakest_niche_name: str) -> str:
        return (
            f"Audience response stays strongest in {top_niche_name}, while {weakest_niche_name} draws the most skeptical reactions. "
            f"Overall sentiment remains {sentiment['positive']}% positive, which supports bolder packaging tests without drifting too far from the channel's core tone."
        )

    async def channel_overview(self, channel_id: str, force: bool = False) -> dict[str, Any]:
        cache_key = f"creator:channel:overview:{channel_id}"

        async def build() -> dict[str, Any]:
            dataset = await self._get_dataset(channel_id, force=force)
            channel = dataset["channelStats"]
            niches = dataset["niches"]
            return {
                "channel": channel,
                "niches": [
                    {
                        "id": niche["id"],
                        "name": niche["name"],
                        "colorIndex": niche["colorIndex"],
                        "uploadShare": niche["uploadShare"],
                        "avgViews": niche["avgViews"],
                        "avgLength": niche["avgLength"],
                        "retention": niche["retention"],
                        "viewShare": niche["viewShare"],
                        "totalVideos": niche["totalVideos"],
                    }
                    for niche in niches
                ],
                "topVideos": self._all_top_videos(niches)[:8],
            }

        return await self._cached(cache_key, force, build)

    async def channel_views_breakdown(self, channel_id: str, force: bool = False) -> dict[str, Any]:
        cache_key = f"creator:channel:views:{channel_id}"

        async def build() -> dict[str, Any]:
            dataset = await self._get_dataset(channel_id, force=force)
            niches = dataset["niches"]
            niches_payload = []
            for niche in niches:
                estimated_views = niche["avgViews"] * niche["totalVideos"]
                niches_payload.append(
                    {
                        "id": niche["id"],
                        "name": niche["name"],
                        "colorIndex": niche["colorIndex"],
                        "uploadShare": niche["uploadShare"],
                        "viewShare": niche["viewShare"],
                        "avgViews": niche["avgViews"],
                        "totalVideos": niche["totalVideos"],
                        "estimatedViews12mo": estimated_views,
                        "surplus": niche["viewShare"] - niche["uploadShare"],
                        "topVideos": niche["topVideos"][:3],
                    }
                )
            return {
                "niches": niches_payload,
                "totalViews": sum(item["estimatedViews12mo"] for item in niches_payload),
            }

        return await self._cached(cache_key, force, build)

    async def channel_content_dna(self, channel_id: str, force: bool = False) -> dict[str, Any]:
        cache_key = f"creator:channel:dna:{channel_id}"

        async def build() -> dict[str, Any]:
            dataset = await self._get_dataset(channel_id, force=force)
            niches = dataset["niches"]
            global_title_patterns = {
                "numbers": round(sum(niche["contentDNA"]["titlePatterns"]["numbers"] * niche["uploadShare"] for niche in niches) / 100),
                "powerVerbs": round(sum(niche["contentDNA"]["titlePatterns"]["powerVerbs"] * niche["uploadShare"] for niche in niches) / 100),
                "questionFormat": round(sum(niche["contentDNA"]["titlePatterns"]["questionFormat"] * niche["uploadShare"] for niche in niches) / 100),
                "howIStructure": round(sum(niche["contentDNA"]["titlePatterns"]["howIStructure"] * niche["uploadShare"] for niche in niches) / 100),
            }
            global_length_dist = [
                {
                    "bucket": bucket,
                    "count": sum(
                        next((row["count"] for row in niche["contentDNA"]["videoLengthDist"] if row["bucket"] == bucket), 0)
                        for niche in niches
                    ),
                }
                for bucket in ["<5m", "5–10m", "10–20m", "20–30m", "30m+"]
            ]
            longest_videos = max(niches, key=lambda niche: niche["avgLengthMinutes"])
            most_face = max(niches, key=lambda niche: niche["contentDNA"]["thumbnailStyle"]["facePresent"])
            most_numbers = max(niches, key=lambda niche: niche["contentDNA"]["titlePatterns"]["numbers"])
            return {
                "globalTitlePatterns": global_title_patterns,
                "globalLengthDist": global_length_dist,
                "peakBucket": max(global_length_dist, key=lambda item: item["count"]),
                "niches": [
                    {
                        "id": niche["id"],
                        "name": niche["name"],
                        "colorIndex": niche["colorIndex"],
                        "avgLength": niche["avgLength"],
                        "avgLengthMinutes": niche["avgLengthMinutes"],
                        "contentDNA": niche["contentDNA"],
                    }
                    for niche in niches
                ],
                "crossNiche": {
                    "longestVideos": {
                        "name": longest_videos["name"],
                        "value": longest_videos["avgLength"],
                    },
                    "mostFaceInThumbnail": {
                        "name": most_face["name"],
                        "value": most_face["contentDNA"]["thumbnailStyle"]["facePresent"],
                    },
                    "mostNumberBasedTitles": {
                        "name": most_numbers["name"],
                        "value": most_numbers["contentDNA"]["titlePatterns"]["numbers"],
                    },
                },
            }

        return await self._cached(cache_key, force, build)

    async def channel_cadence(self, channel_id: str, force: bool = False) -> dict[str, Any]:
        cache_key = f"creator:channel:cadence:{channel_id}"

        async def build() -> dict[str, Any]:
            dataset = await self._get_dataset(channel_id, force=force)
            niches = dataset["niches"]
            global_monthly = []
            for month in MONTHS:
                row: dict[str, Any] = {"month": month}
                for niche in niches:
                    row[niche["id"]] = next((item["count"] for item in niche["cadence"]["monthlyUploads"] if item["month"] == month), 0)
                global_monthly.append(row)

            global_day_dist = [
                {
                    "day": day,
                    "count": sum(
                        next((item["count"] for item in niche["cadence"]["uploadDayHeatmap"] if item["day"] == day), 0)
                        for niche in niches
                    ),
                }
                for day in DAYS
            ]
            best_global_day = max(global_day_dist, key=lambda item: item["count"])
            longest_gap_niche = max(niches, key=lambda niche: niche["cadence"]["avgGapDays"])
            return {
                "globalMonthly": global_monthly,
                "globalDayDist": global_day_dist,
                "bestGlobalDay": best_global_day,
                "globalAvgGap": round(sum(niche["cadence"]["avgGapDays"] * niche["uploadShare"] for niche in niches) / 100, 1),
                "globalConsistency": round(sum(niche["cadence"]["consistencyIndex"] * niche["uploadShare"] for niche in niches) / 100),
                "longestGap": longest_gap_niche["cadence"]["avgGapDays"],
                "longestGapImpact": (
                    f"The biggest cadence risk sits in {longest_gap_niche['name']}, where upload gaps stretch to "
                    f"{longest_gap_niche['cadence']['avgGapDays']} days and reduce repeat audience momentum."
                ),
                "niches": [
                    {
                        "id": niche["id"],
                        "name": niche["name"],
                        "colorIndex": niche["colorIndex"],
                        "uploadShare": niche["uploadShare"],
                        "cadence": niche["cadence"],
                    }
                    for niche in niches
                ],
            }

        return await self._cached(cache_key, force, build)

    async def channel_audience(self, channel_id: str, force: bool = False) -> dict[str, Any]:
        cache_key = f"creator:channel:audience:{channel_id}"

        async def build() -> dict[str, Any]:
            dataset = await self._get_dataset(channel_id, force=force)
            niches = dataset["niches"]
            global_sentiment = {
                "positive": round(sum(niche["audience"]["sentiment"]["positive"] * niche["viewShare"] for niche in niches) / 100),
                "neutral": round(sum(niche["audience"]["sentiment"]["neutral"] * niche["viewShare"] for niche in niches) / 100),
                "critical": round(sum(niche["audience"]["sentiment"]["critical"] * niche["viewShare"] for niche in niches) / 100),
            }
            global_age = [
                {
                    "band": band,
                    "percentage": round(
                        sum(
                            next((row["percentage"] for row in niche["audience"]["ageBreakdown"] if row["band"] == band), 0) * niche["viewShare"]
                            for niche in niches
                        ) / 100
                    ),
                }
                for band in AGE_BANDS
            ]

            countries: dict[str, float] = {}
            languages: dict[str, float] = {}
            for niche in niches:
                weight = niche["viewShare"] / 100
                for row in niche["audience"]["countryBreakdown"]:
                    countries[row["country"]] = countries.get(row["country"], 0.0) + (row["percentage"] * weight)
                for row in niche["audience"]["languageDistribution"]:
                    languages[row["language"]] = languages.get(row["language"], 0.0) + (row["percentage"] * weight)

            sorted_countries = sorted(countries.items(), key=lambda item: item[1], reverse=True)
            global_countries = [
                {"country": country, "percentage": round(value)}
                for country, value in sorted_countries[:7]
            ]
            other_country_pct = sum(value for _, value in sorted_countries[7:])
            if other_country_pct > 0.5:
                global_countries.append({"country": "Other", "percentage": round(other_country_pct)})

            sorted_languages = sorted(languages.items(), key=lambda item: item[1], reverse=True)
            global_languages = []
            other_lang_pct = 0.0
            for i, (lang, value) in enumerate(sorted_languages):
                if lang == "Other":
                    other_lang_pct += value
                elif len(global_languages) < 6:
                    global_languages.append({"language": lang, "percentage": round(value)})
                else:
                    other_lang_pct += value

            if other_lang_pct > 0.5:
                global_languages.append({"language": "Other", "percentage": round(other_lang_pct)})
            all_asks = list(dict.fromkeys(item for niche in niches for item in niche["audience"]["viewerAsks"]))
            all_praises = list(dict.fromkeys(item for niche in niches for item in niche["audience"]["praises"]))
            all_complaints = list(dict.fromkeys(item for niche in niches for item in niche["audience"]["complaints"]))
            top_sentiment_niche = max(niches, key=lambda niche: niche["audience"]["sentiment"]["positive"])
            weakest_sentiment_niche = max(niches, key=lambda niche: niche["audience"]["sentiment"]["critical"])
            return {
                "globalSentiment": global_sentiment,
                "sentimentSummary": self._global_sentiment_summary(
                    global_sentiment,
                    top_sentiment_niche["name"],
                    weakest_sentiment_niche["name"],
                ),
                "globalAge": global_age,
                "globalCountries": global_countries,
                "globalLanguages": global_languages,
                "allAsks": all_asks,
                "allPraises": all_praises,
                "allComplaints": all_complaints,
                "niches": [
                    {
                        "id": niche["id"],
                        "name": niche["name"],
                        "colorIndex": niche["colorIndex"],
                        "audience": niche["audience"],
                    }
                    for niche in niches
                ],
            }

        return await self._cached(cache_key, force, build)

    async def niche_overview(self, niche_id: str, force: bool = False) -> dict[str, Any]:
        cache_key = f"creator:niche:overview:{niche_id}"

        async def build() -> dict[str, Any]:
            niche = await self._get_niche(niche_id, force=force)
            return {
                "id": niche["id"],
                "name": niche["name"],
                "uploadShare": niche["uploadShare"],
                "totalVideos": niche["totalVideos"],
                "avgViews": niche["avgViews"],
                "avgLength": niche["avgLength"],
                "retention": niche["retention"],
                "viewShare": niche["viewShare"],
                "topVideos": niche["topVideos"],
                "sentiment": niche["sentiment"],
                "healthSummary": niche["healthSummary"],
                "audience": niche["audience"],
            }

        return await self._cached(cache_key, force, build)

    async def niche_subniches(self, niche_id: str, force: bool = False) -> dict[str, Any]:
        cache_key = f"creator:niche:subniches:{niche_id}"

        async def build() -> dict[str, Any]:
            niche = await self._get_niche(niche_id, force=force)
            return {"id": niche["id"], "name": niche["name"], "subniches": niche["subniches"]}

        return await self._cached(cache_key, force, build)

    async def niche_content_dna(self, niche_id: str, force: bool = False) -> dict[str, Any]:
        cache_key = f"creator:niche:dna:{niche_id}"

        async def build() -> dict[str, Any]:
            niche = await self._get_niche(niche_id, force=force)
            return {"id": niche["id"], "name": niche["name"], "contentDNA": niche["contentDNA"]}

        return await self._cached(cache_key, force, build)

    async def niche_cadence(self, niche_id: str, force: bool = False) -> dict[str, Any]:
        cache_key = f"creator:niche:cadence:{niche_id}"

        async def build() -> dict[str, Any]:
            niche = await self._get_niche(niche_id, force=force)
            return {"id": niche["id"], "name": niche["name"], "cadence": niche["cadence"]}

        return await self._cached(cache_key, force, build)

    async def niche_audience(self, niche_id: str, force: bool = False) -> dict[str, Any]:
        cache_key = f"creator:niche:audience:{niche_id}"

        async def build() -> dict[str, Any]:
            niche = await self._get_niche(niche_id, force=force)
            return {"id": niche["id"], "name": niche["name"], "audience": niche["audience"]}

        return await self._cached(cache_key, force, build)

    async def niche_competitors(self, niche_id: str, force: bool = False) -> dict[str, Any]:
        cache_key = f"creator:niche:competitors:{niche_id}"

        async def build() -> dict[str, Any]:
            niche = await self._get_niche(niche_id, force=force)
            discovery = await self.public_analysis.discover(DEMO_CREATOR["channel_id"], force=force)
            competitors = []

            for card in discovery.get("competitors", []):
                detail = await self.public_analysis.competitor_detail(card["id"], force=force)
                matched_niche = next(
                    (
                        row for row in detail.get("nicheDistribution", [])
                        if row["nicheId"] == niche_id or row["name"] == niche["name"]
                    ),
                    None,
                )
                if not matched_niche:
                    continue
                top_video = next(
                    (
                        video for video in detail.get("videos", [])
                        if video["nicheId"] == matched_niche["nicheId"] or video["nicheName"] == matched_niche["name"]
                    ),
                    detail.get("videos", [{}])[0],
                )
                niche_similarity_score = round(
                    min(
                        100,
                        (detail["similarityScore"] * 0.7)
                        + (matched_niche["share"] * 0.2)
                        + (10 if matched_niche["avgViews"] >= niche["avgViews"] else 0),
                    )
                )
                competitors.append(
                    {
                        "id": detail["id"],
                        "name": detail["name"],
                        "handle": detail["handle"],
                        "thumbnailUrl": detail["thumbnailUrl"],
                        "subscribers": detail["subscribers"],
                        "uploadFrequency": detail["uploadFrequency"],
                        "avgViews": detail["avgViews"],
                        "nicheAvgViews": matched_niche["avgViews"],
                        "nicheShare": matched_niche["share"],
                        "similarityScore": detail["similarityScore"],
                        "nicheSimilarityScore": niche_similarity_score,
                        "topVideo": top_video,
                        "yourTopVideo": niche["topVideos"][0],
                    }
                )

            competitors.sort(
                key=lambda item: (item["nicheSimilarityScore"], item["nicheAvgViews"], item["subscribers"]),
                reverse=True,
            )
            return {
                "nicheId": niche["id"],
                "nicheName": niche["name"],
                "competitors": competitors[:5],
            }

        return await self._cached(cache_key, force, build)

    async def analyze_channel(self, channel_id: str, force: bool = False) -> dict[str, Any]:
        self._require_channel(channel_id)
        await asyncio.gather(
            self.channel_overview(channel_id, force=force),
            self.channel_views_breakdown(channel_id, force=force),
            self.channel_content_dna(channel_id, force=force),
            self.channel_cadence(channel_id, force=force),
            self.channel_audience(channel_id, force=force),
            *(self.niche_overview(niche["id"], force=force) for niche in (await self._get_dataset(channel_id, force=force))["niches"]),
        )
        return {
            "channelId": channel_id,
            "status": "completed",
        }

    async def _get_niche(self, niche_id: str, force: bool = False) -> dict[str, Any]:
        dataset = await self._get_dataset(DEMO_CREATOR["channel_id"], force=force)
        for niche in dataset["niches"]:
            if niche["id"] == niche_id:
                return niche
        raise ValueError(f"Unknown niche '{niche_id}'.")


creator_analysis_service = CreatorAnalysisService()
