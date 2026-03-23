"""Real strategy, title, and thumbnail generation built on competitor analysis."""

from __future__ import annotations

import re
from collections import Counter, defaultdict
from io import BytesIO
from statistics import mean

import httpx
from colorthief import ColorThief

from app.data.demo_creator import DEMO_CREATOR
from app.services.gemini import GeminiClient
from app.services.public_analysis import PublicCompetitorAnalysisService

DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
DEFAULT_PALETTES = {
    "Linux & OS": ["#ef4444", "#0f172a", "#f8fafc"],
    "Hardware Reviews": ["#f97316", "#111827", "#38bdf8"],
    "Dev Tools & Workflow": ["#22c55e", "#0f172a", "#e2e8f0"],
    "Privacy & Security": ["#f59e0b", "#111827", "#ef4444"],
    "AI & Machine Learning": ["#7c3aed", "#0f172a", "#ef4444"],
}


def normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


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
        except Exception:
            self.gemini = None
        self._thumbnail_palette_cache: dict[str, list[str]] = {}

    def _creator(self, channel_id: str) -> dict:
        if channel_id != DEMO_CREATOR["channel_id"]:
            raise ValueError(f"Unsupported creator channel '{channel_id}'.")
        return DEMO_CREATOR

    def _classify_creator_niche(self, title: str, creator: dict) -> str:
        lowered = title.lower()
        scores = []
        for niche in creator["niches"]:
            score = sum(1 for keyword in niche["keywords"] if keyword.lower() in lowered)
            scores.append((score, niche["name"]))
        best_score, niche_name = max(scores, key=lambda item: item[0], default=(0, creator["niches"][0]["name"]))
        return niche_name if best_score > 0 else creator["niches"][0]["name"]

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

    async def _load_market_data(self, channel_id: str) -> tuple[dict, dict, list[dict]]:
        creator = self._creator(channel_id)
        discovery = await self.public_analysis.discover(channel_id)
        competitor_ids = [item["id"] for item in discovery["competitors"][:4]]
        details = [
            await self.public_analysis.competitor_detail(competitor_id, channel_id)
            for competitor_id in competitor_ids
        ]
        return creator, discovery, details

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
        seen = set()
        asks = []
        for detail in details:
            for ask in detail["viewerAsks"]:
                normalized = normalize_text(ask)
                if not normalized or normalized in seen:
                    continue
                seen.add(normalized)
                asks.append(ask)
        return asks[:8]

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
        color_counts = Counter()
        for reference in references[:4]:
            for color in await self._palette_for_thumbnail(reference.get("thumbnailUrl", "")):
                color_counts[color] += 1

        formula_rows = [self._title_formula(reference["title"]) for reference in references]
        formula_counts = Counter(formula_rows)
        dominant_colors = [color for color, _ in color_counts.most_common(3)]
        if not dominant_colors:
            dominant_colors = DEFAULT_PALETTES.get(niche, ["#ef4444", "#0f172a", "#f8fafc"])

        primary_formula = formula_counts.most_common(1)[0][0] if formula_counts else "Direct promise"
        if primary_formula == "Comparison":
            composition = "Split-screen comparison"
            face = "Usually no face; product or UI first"
        elif primary_formula == "Personal story":
            composition = "Face-led framing with one proof visual"
            face = "Face-forward reaction"
        else:
            composition = "Single subject with bold focal point"
            face = "Mixed; use a face only when the story is personal"

        return {
            "dominantColors": dominant_colors,
            "primaryFormula": primary_formula,
            "compositionBias": composition,
            "faceBias": face,
        }

    def _fallback_strategy_copy(self, report_input: dict) -> dict:
        top_niche = report_input["opportunities"][0]["name"] if report_input["opportunities"] else "your strongest niche"
        top_formula = report_input["titleFormulas"][0]["formula"] if report_input["titleFormulas"] else "Comparison"
        top_ask = report_input["viewerAsks"][0] if report_input["viewerAsks"] else "deeper workflow breakdowns"

        return {
            "summary": (
                f"The strongest near-term growth lane is {top_niche}, where matched competitors are outperforming on "
                f"views and audience fit. The clearest execution gap is packaging: {top_formula.lower()} titles and "
                f"direct audience-request topics are showing the best pull."
            ),
            "phase1": [
                f"Reallocate the next 4 uploads toward {top_niche} angles with the highest competitor upside.",
                f"Ship two title tests built around the {top_formula.lower()} pattern.",
                f"Publish one response-to-demand video around '{top_ask}'.",
            ],
            "phase2": [
                "Turn the best-performing topic into a 3-part series instead of isolated uploads.",
                "Standardize thumbnail color contrast and framing based on the winning competitor palette.",
                "Track which niche-formula pair produces the best view-to-sub ratio lift.",
            ],
            "phase3": [
                "Double down on the top two validated niches and trim underperforming formats.",
                "Package repeat winners into recurring franchises with predictable hooks.",
                "Scale the posting schedule around the strongest weekday/time windows from competitor patterns.",
            ],
            "titlePlays": [
                f"Your highest-upside packaging pattern right now is {top_formula.lower()}.",
                "Keep titles concrete and outcome-led; avoid vague setup-style phrasing.",
            ],
            "thumbnailPlays": [
                "Use one dominant contrast pair and one focal subject instead of crowded layouts.",
                "Match thumbnail framing to the title promise so the click is easy to justify.",
            ],
        }

    async def strategy_report(self, channel_id: str) -> dict:
        creator, discovery, details = await self._load_market_data(channel_id)
        current_mix = self._creator_mix(creator)
        opportunities = self._niche_opportunities(creator, details)[:5]
        suggested_mix = self._normalize_mix(opportunities)
        title_formulas = self._aggregate_formulas(details)
        viewer_asks = self._aggregate_viewer_asks(details)

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
            "opportunities": opportunities,
            "titleFormulas": title_formulas,
            "viewerAsks": viewer_asks,
        }

        llm_copy = self._fallback_strategy_copy(report_input)
        if self.gemini is not None:
            try:
                llm_copy = await self.gemini.generate_strategy(report_input)
            except Exception:
                pass

        return {
            "summary": llm_copy["summary"],
            "currentMix": current_mix,
            "suggestedMix": suggested_mix,
            "nicheRecommendations": self._niche_recommendations(current_mix, suggested_mix, opportunities),
            "roadmap": {
                "phase1": {"title": "Next 30 Days", "actions": llm_copy["phase1"][:3]},
                "phase2": {"title": "Days 31-60", "actions": llm_copy["phase2"][:3]},
                "phase3": {"title": "Days 61-90", "actions": llm_copy["phase3"][:3]},
            },
            "supportingSignals": {
                "titlePlays": llm_copy["titlePlays"][:3],
                "thumbnailPlays": llm_copy["thumbnailPlays"][:3],
                "viewerAsks": viewer_asks[:5],
                "marketLeaders": [
                    {
                        "name": detail["name"],
                        "topNiche": detail["topNiche"],
                        "avgViews": detail["avgViews"],
                        "audienceFitScore": detail["audienceFitScore"],
                    }
                    for detail in details[:3]
                ],
            },
        }

    async def posting_strategy(self, channel_id: str) -> dict:
        creator, _discovery, details = await self._load_market_data(channel_id)
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

        return {
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

    async def video_ideas(self, channel_id: str) -> dict:
        creator, discovery, details = await self._load_market_data(channel_id)
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

        ideas = self._fallback_video_ideas(opportunities, viewer_asks, details)
        if self.gemini is not None:
            try:
                ideas = await self.gemini.generate_video_ideas(payload)
            except Exception:
                pass

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
        return {"ideas": normalized}

    def _fallback_title_variants(self, title: str, formulas: list[dict], examples: list[str]) -> dict:
        subject = re.sub(r"\s+", " ", title.strip(" -"))
        top_formula = formulas[0]["formula"] if formulas else "Personal story"
        variants = [
            {"title": f"5 {subject} Lessons That Changed My Workflow", "formula": "Numbered list", "reach": 82},
            {"title": f"Why {subject} Is Suddenly Worth Your Time", "formula": "Question / curiosity", "reach": 84},
            {"title": f"I Tried {subject} for 30 Days — Here's What Happened", "formula": "Personal story", "reach": 90},
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

    async def optimize_title(self, title: str, niche: str, channel_id: str) -> dict:
        creator, _discovery, details = await self._load_market_data(channel_id)
        inferred_niche = niche.strip() or self._classify_creator_niche(title, creator)
        formula_rows = self._aggregate_formulas(details, niche=inferred_niche) or self._aggregate_formulas(details)
        example_titles = []
        for row in formula_rows[:3]:
            example_titles.extend(row["examples"])
        example_titles = example_titles[:5]

        context = {
            "creator": creator["name"],
            "niche": inferred_niche,
            "audience": creator["target_audience"],
            "topCompetitorFormulas": formula_rows[:4],
        }

        result = self._fallback_title_variants(title, formula_rows, example_titles)
        if self.gemini is not None:
            try:
                result = await self.gemini.optimize_title(
                    title=title,
                    formulas=[row["formula"] for row in formula_rows[:4]],
                    examples=example_titles,
                    context=context,
                )
            except Exception:
                pass

        variants = []
        for variant in result.get("variants", [])[:5]:
            variant_title = str(variant.get("title", "")).strip()
            if not variant_title:
                continue
            variants.append(
                {
                    "title": variant_title,
                    "formula": str(variant.get("formula", "Direct promise")),
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

    def _fallback_thumbnail_concepts(self, title: str, niche: str, modal_style: dict, references: list[dict]) -> list[dict]:
        dominant_colors = ", ".join(modal_style["dominantColors"][:3])
        primary_formula = modal_style.get("primaryFormula", "Direct promise")
        overlay_base = " ".join(word.upper() for word in title.split()[:3])[:26] or "WATCH THIS"
        reference_note = references[0]["title"] if references else "top competitor thumbnails"

        concepts = [
            {
                "bg": f"Dark, high-contrast background using {dominant_colors}",
                "face": "Face-forward if the video is a personal opinion or review",
                "text": f"2-4 bold words: '{overlay_base}'",
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

    async def suggest_thumbnails(self, title: str, niche: str, channel_id: str) -> dict:
        creator, _discovery, details = await self._load_market_data(channel_id)
        inferred_niche = niche.strip() or self._classify_creator_niche(title, creator)
        references = self._reference_videos(details, niche=inferred_niche, limit=5) or self._reference_videos(details, limit=5)
        modal_style = await self._modal_thumbnail_style(inferred_niche, references)

        concepts = self._fallback_thumbnail_concepts(title, inferred_niche, modal_style, references)
        if self.gemini is not None:
            try:
                concepts = await self.gemini.suggest_thumbnails(
                    title=title,
                    niche=inferred_niche,
                    modal_style=modal_style,
                    examples=references[:4],
                )
            except Exception:
                pass

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

        return {
            "niche": inferred_niche,
            "modalStyle": modal_style,
            "referenceVideos": references[:4],
            "concepts": normalized,
        }
