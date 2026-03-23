"""Public-channel competitor analysis using YouTube Data API."""

from __future__ import annotations

import math
import re
from collections import Counter, defaultdict
from datetime import datetime
from statistics import mean

from langdetect import LangDetectException, detect_langs

from app.data.demo_creator import DEMO_CREATOR
from app.pipeline.sentiment import SentimentAnalyzer
from app.services.youtube.data_api import YouTubeDataAPI

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "best", "but", "by", "for",
    "from", "full", "getting", "guide", "here", "how", "i", "if", "in",
    "into", "is", "it", "its", "my", "need", "of", "on", "or", "out", "real",
    "review", "setup", "take", "that", "the", "their", "this", "to", "tools",
    "top", "vs", "what", "why", "with", "you", "your", "2025", "video",
    "videos", "channel", "content", "make", "made", "using", "use",
}

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "de": "German",
    "pt": "Portuguese",
    "es": "Spanish",
    "fr": "French",
}

COUNTRY_ALIASES = {
    "United States": ["united states", "usa", "us", "america", "american"],
    "India": ["india", "indian", "hindi"],
    "Germany": ["germany", "german", "deutsch"],
    "United Kingdom": ["united kingdom", "uk", "britain", "british", "england"],
    "Canada": ["canada", "canadian"],
    "Brazil": ["brazil", "brazilian", "portuguese"],
}

LANGUAGE_COUNTRY_HINTS = {
    "English": ["United States", "United Kingdom", "Canada"],
    "Hindi": ["India"],
    "German": ["Germany"],
    "Portuguese": ["Brazil"],
}

AGE_HINTS = {
    "linux": {"18-24": 18, "25-34": 46, "35-44": 24, "45-54": 8, "55+": 4},
    "hardware": {"18-24": 24, "25-34": 42, "35-44": 20, "45-54": 9, "55+": 5},
    "privacy": {"18-24": 14, "25-34": 38, "35-44": 28, "45-54": 14, "55+": 6},
    "dev tools": {"18-24": 30, "25-34": 44, "35-44": 17, "45-54": 6, "55+": 3},
    "ai": {"18-24": 28, "25-34": 43, "35-44": 18, "45-54": 7, "55+": 4},
}


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def parse_iso_date(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def tokenize(text: str) -> list[str]:
    return [
        token
        for token in re.findall(r"[a-z0-9][a-z0-9\+\-]+", text.lower())
        if len(token) > 2 and token not in STOPWORDS
    ]


def titleize_phrase(value: str) -> str:
    cleaned = re.sub(r"\s+", " ", value).strip(" -.,!?")
    if not cleaned:
        return ""
    return cleaned[0].upper() + cleaned[1:]


class PublicCompetitorAnalysisService:
    """Compute real competitor discovery from public YouTube data."""

    def __init__(self):
        self.youtube = YouTubeDataAPI()
        self.sentiment = SentimentAnalyzer()
        self._detail_cache: dict[str, dict] = {}
        self._discover_cache: dict[str, dict] = {}

    def _creator(self, channel_id: str) -> dict:
        if channel_id != DEMO_CREATOR["channel_id"]:
            raise ValueError(f"Unsupported creator channel '{channel_id}'.")
        return DEMO_CREATOR

    def _creator_keywords(self, creator: dict) -> set[str]:
        tokens = set()
        for title in creator["top_video_titles"]:
            tokens.update(tokenize(title))
        for niche in creator["niches"]:
            tokens.update(tokenize(niche["name"]))
            tokens.update(tokenize(" ".join(niche["keywords"])))
        return tokens

    def _classify_niche(self, text: str, creator: dict) -> str:
        haystack = text.lower()
        scored: list[tuple[int, str]] = []
        for niche in creator["niches"]:
            score = 0
            for keyword in niche["keywords"]:
                if keyword.lower() in haystack:
                    score += 1
            scored.append((score, niche["name"]))
        score, niche_name = max(scored, key=lambda item: item[0], default=(0, "Other"))
        return niche_name if score > 0 else "Other"

    def _extract_keywords(self, texts: list[str], limit: int = 12) -> list[str]:
        counts = Counter()
        for text in texts:
            counts.update(tokenize(text))
        return [word for word, _ in counts.most_common(limit)]

    def _extract_ngram_phrases(self, comments: list[str], limit: int = 6) -> list[str]:
        ngrams = Counter()
        for comment in comments:
            words = tokenize(comment)
            for size in (2, 3):
                for index in range(0, max(len(words) - size + 1, 0)):
                    phrase = " ".join(words[index:index + size])
                    ngrams[phrase] += 1
        return [titleize_phrase(phrase) for phrase, _ in ngrams.most_common(limit)]

    def _extract_viewer_asks(self, comments: list[str], limit: int = 6) -> list[str]:
        ask_starters = (
            "can you", "could you", "would you", "please", "what about", "why don't you",
            "make a video on", "do a video on", "cover", "talk about",
        )
        asks: list[str] = []
        seen = set()

        for raw_comment in comments:
            comment = re.sub(r"\s+", " ", raw_comment).strip()
            if len(comment) < 12:
                continue
            if "?" not in comment and not any(starter in comment.lower() for starter in ask_starters):
                continue

            comment = comment.split("?")[0]
            lowered = comment.lower()
            for starter in ask_starters:
                if lowered.startswith(starter):
                    comment = comment[len(starter):].strip(" :-,")
                    lowered = comment.lower()
                    break

            comment = re.sub(r"^(hey|hi|hello|bro|pls|please)\s+", "", comment, flags=re.IGNORECASE)
            comment = re.sub(r"https?://\S+", "", comment)
            comment = titleize_phrase(comment)
            if len(comment) < 8:
                continue

            normalized = re.sub(r"[^a-z0-9]+", " ", comment.lower()).strip()
            if normalized in seen:
                continue
            if len(tokenize(comment)) < 2:
                continue

            seen.add(normalized)
            asks.append(comment)
            if len(asks) >= limit:
                return asks

        return self._extract_ngram_phrases(comments, limit=limit)[:limit]

    def _estimate_language_distribution(self, texts: list[str], limit: int = 80) -> list[dict]:
        scores = defaultdict(float)
        for text in texts[:limit]:
            if len(text.strip()) < 20:
                continue
            try:
                detected = detect_langs(text)
            except LangDetectException:
                continue
            for candidate in detected[:2]:
                language_name = LANGUAGE_NAMES.get(candidate.lang)
                if not language_name:
                    continue
                scores[language_name] += candidate.prob

        total = sum(scores.values())
        if total <= 0:
            return []

        return [
            {"language": language, "percentage": round((score / total) * 100, 1)}
            for language, score in sorted(scores.items(), key=lambda item: item[1], reverse=True)
        ]

    def _estimate_country_distribution(self, texts: list[str], languages: list[dict], creator: dict) -> list[dict]:
        target_countries = creator.get("target_audience", {}).get("countries", [])
        scores = defaultdict(float)
        corpus = " ".join(texts).lower()

        for country in target_countries:
            for alias in COUNTRY_ALIASES.get(country, []):
                scores[country] += corpus.count(alias) * 2.0

        for language_entry in languages:
            for country in LANGUAGE_COUNTRY_HINTS.get(language_entry["language"], []):
                if country in target_countries:
                    scores[country] += language_entry["percentage"] / 100

        total = sum(scores.values())
        if total <= 0:
            return []

        return [
            {"country": country, "percentage": round((score / total) * 100, 1)}
            for country, score in sorted(scores.items(), key=lambda item: item[1], reverse=True)
        ]

    def _estimate_age_distribution(self, niche_distribution: list[dict]) -> list[dict]:
        weights = defaultdict(float)
        for niche in niche_distribution:
            profile = None
            lowered = niche["name"].lower()
            for hint, age_profile in AGE_HINTS.items():
                if hint in lowered:
                    profile = age_profile
                    break
            if not profile:
                profile = {"18-24": 22, "25-34": 40, "35-44": 22, "45-54": 10, "55+": 6}

            for age_band, percentage in profile.items():
                weights[age_band] += percentage * max(niche["share"], 1)

        total = sum(weights.values())
        if total <= 0:
            return []

        return [
            {"band": band, "percentage": round((score / total) * 100, 1)}
            for band, score in sorted(weights.items(), key=lambda item: item[1], reverse=True)
        ]

    def _audience_fit_score(self, creator: dict, languages: list[dict], countries: list[dict], ages: list[dict]) -> float:
        target = creator.get("target_audience", {})
        target_languages = {value.lower() for value in target.get("languages", [])}
        target_countries = {value.lower() for value in target.get("countries", [])}
        target_ages = set(target.get("age_bands", []))

        language_score = sum(
            entry["percentage"] for entry in languages
            if entry["language"].lower() in target_languages
        )
        country_score = sum(
            entry["percentage"] for entry in countries
            if entry["country"].lower() in target_countries
        )
        age_score = sum(
            entry["percentage"] for entry in ages
            if entry["band"] in target_ages
        )

        return round((language_score * 0.45) + (country_score * 0.35) + (age_score * 0.20), 1)

    def _build_engagement_trend(self, videos: list[dict]) -> list[dict]:
        monthly: dict[str, list[float]] = defaultdict(list)
        for video in videos:
            published = parse_iso_date(video.get("published_at", ""))
            if not published or not video["view_count"]:
                continue
            rate = ((video["like_count"] + video["comment_count"]) / video["view_count"]) * 100
            monthly[published.strftime("%b")].append(rate)

        return [
            {"month": month, "rate": round(mean(values), 2)}
            for month, values in sorted(
                monthly.items(),
                key=lambda item: datetime.strptime(item[0], "%b").month,
            )
        ]

    def _upload_frequency_label(self, videos: list[dict]) -> str:
        dated = [parse_iso_date(video.get("published_at", "")) for video in videos]
        dated = [value for value in dated if value is not None]
        if len(dated) < 2:
            return "n/a"

        span_days = max((max(dated) - min(dated)).days, 1)
        per_week = len(dated) / max(span_days / 7, 1)
        return f"{per_week:.1f} videos/week"

    def _health_score(self, avg_views: float, subscribers: int, engagement_rate: float, sentiment: dict) -> int:
        view_sub_ratio = (avg_views / subscribers * 100) if subscribers else 0
        engagement_score = min(engagement_rate * 10, 100)
        ratio_score = min(view_sub_ratio * 4, 100)
        sentiment_score = min(sentiment.get("positive", 0), 100)
        return round((engagement_score * 0.45) + (ratio_score * 0.35) + (sentiment_score * 0.20))

    def _similarity_breakdown(self, creator: dict, detail: dict) -> dict:
        creator_niches = {niche["name"] for niche in creator["niches"]}
        competitor_niches = {niche["name"] for niche in detail["nicheDistribution"]}
        shared = creator_niches & competitor_niches
        union = creator_niches | competitor_niches
        niche_overlap = (len(shared) / len(union) * 100) if union else 0.0

        creator_keywords = self._creator_keywords(creator)
        competitor_keywords = set(detail["keywords"])
        keyword_overlap = (
            len(creator_keywords & competitor_keywords) / len(creator_keywords | competitor_keywords) * 100
            if (creator_keywords or competitor_keywords)
            else 0.0
        )

        creator_styles = {"review", "comparison", "guide", "ranked", "setup", "switched"}
        competitor_styles = set(detail["titleStyleKeywords"])
        title_formula_overlap = (
            len(creator_styles & competitor_styles) / len(creator_styles | competitor_styles) * 100
            if (creator_styles or competitor_styles)
            else 0.0
        )

        creator_subs = max(creator["subscribers"], 1)
        competitor_subs = max(detail["subscribers"], 1)
        distance = abs(math.log10(creator_subs) - math.log10(competitor_subs))
        subscriber_proximity = max(0.0, 100 - (distance * 50))

        overall = (
            niche_overlap * 0.32
            + keyword_overlap * 0.24
            + title_formula_overlap * 0.14
            + subscriber_proximity * 0.10
            + detail["audienceFitScore"] * 0.20
        )
        return {
            "overall": round(overall, 1),
            "niche_overlap": round(niche_overlap, 1),
            "title_formula_overlap": round(title_formula_overlap, 1),
            "keyword_density_overlap": round(keyword_overlap, 1),
            "subscriber_proximity": round(subscriber_proximity, 1),
            "audience_fit": round(detail["audienceFitScore"], 1),
        }

    def _discovery_reason(self, detail: dict, similarity: dict) -> str:
        if detail["sharedNiches"]:
            return (
                f"Shares {len(detail['sharedNiches'])} niche(s) with the demo creator; "
                f"audience fit {round(similarity['audience_fit'])}%."
            )
        return (
            f"Estimated audience fit {round(similarity['audience_fit'])}% and "
            f"keyword overlap {round(similarity['keyword_density_overlap'])}%."
        )

    async def _load_channel_detail(self, channel_id: str, creator: dict) -> dict:
        if channel_id in self._detail_cache:
            return self._detail_cache[channel_id]

        channel = await self.youtube.get_channel(channel_id)
        if not channel:
            raise ValueError(f"Channel '{channel_id}' was not found.")

        video_ids = await self.youtube.get_playlist_video_ids(channel.get("uploads_playlist_id", ""), limit=15)
        videos = await self.youtube.get_videos_batch(video_ids)
        if not videos:
            raise ValueError(f"Channel '{channel_id}' has no public videos to analyze.")

        videos.sort(key=lambda video: video["view_count"], reverse=True)
        top_videos = videos[:6]
        keywords = self._extract_keywords(
            [f"{video['title']} {video['description']} {' '.join(video.get('tags', []))}" for video in videos[:12]]
        )

        niche_buckets: dict[str, list[dict]] = defaultdict(list)
        title_style_keywords: set[str] = set()
        for video in videos[:12]:
            niche_name = self._classify_niche(
                f"{video['title']} {video['description']} {' '.join(video.get('tags', []))}",
                creator,
            )
            video["niche_name"] = niche_name
            niche_buckets[niche_name].append(video)

            lowered = video["title"].lower()
            for marker, label in (
                ("review", "review"),
                (" vs ", "comparison"),
                ("guide", "guide"),
                ("ranked", "ranked"),
                ("setup", "setup"),
                ("switched", "switched"),
            ):
                if marker in lowered:
                    title_style_keywords.add(label)

        niche_distribution = []
        for niche_name, niche_videos in sorted(
            niche_buckets.items(),
            key=lambda item: sum(video["view_count"] for video in item[1]),
            reverse=True,
        ):
            if niche_name == "Other":
                continue
            niche_distribution.append(
                {
                    "nicheId": slugify(niche_name),
                    "name": niche_name,
                    "share": round(len(niche_videos) / len(videos[:12]) * 100),
                    "avgViews": round(mean(video["view_count"] for video in niche_videos)),
                }
            )

        avg_views = mean(video["view_count"] for video in videos[:12])
        engagement_rate = mean(
            ((video["like_count"] + video["comment_count"]) / video["view_count"]) * 100
            if video["view_count"] else 0.0
            for video in videos[:12]
        )

        top_comment_videos = sorted(videos[:8], key=lambda video: video["comment_count"], reverse=True)[:3]
        comment_rows: list[dict] = []
        for video in top_comment_videos:
            comment_rows.extend(await self.youtube.get_comments(video["id"], max_pages=1))
        comment_texts = [row["text"] for row in comment_rows if row.get("text")]
        sentiment = self.sentiment.classify_batch(comment_texts)
        viewer_asks = self._extract_viewer_asks(comment_texts)
        audience_corpus = comment_texts + [
            channel.get("title", ""),
            channel.get("description", ""),
            *[video["title"] for video in videos[:12]],
        ]
        language_distribution = self._estimate_language_distribution(audience_corpus)
        country_distribution = self._estimate_country_distribution(audience_corpus, language_distribution, creator)
        age_distribution = self._estimate_age_distribution(niche_distribution)
        audience_fit_score = self._audience_fit_score(
            creator,
            language_distribution,
            country_distribution,
            age_distribution,
        )

        viral_videos = [
            {
                "id": video["id"],
                "title": video["title"],
                "views": video["view_count"],
                "duration": video["duration"],
                "publishDate": video["published_at"][:10],
                "thumbnailUrl": video["thumbnail_url"],
            }
            for video in videos
            if video["view_count"] >= avg_views * 2
        ][:5]

        creator_niche_names = {item["name"] for item in creator["niches"]}
        shared_niches = [niche["name"] for niche in niche_distribution if niche["name"] in creator_niche_names]
        exclusive_niches = [niche["name"] for niche in niche_distribution if niche["name"] not in creator_niche_names]

        detail = {
            "id": channel["id"],
            "name": channel["title"],
            "handle": channel["handle"] or "",
            "thumbnailUrl": channel["thumbnail_url"],
            "subscribers": channel["subscriber_count"],
            "avgViews": round(avg_views),
            "engagementRate": round(engagement_rate, 2),
            "uploadFrequency": self._upload_frequency_label(videos[:12]),
            "topNiche": niche_distribution[0]["name"] if niche_distribution else "Other",
            "nicheDistribution": niche_distribution,
            "videos": [
                {
                    "id": video["id"],
                    "title": video["title"],
                    "views": video["view_count"],
                    "duration": video["duration"],
                    "publishDate": video["published_at"][:10],
                    "nicheId": slugify(video.get("niche_name", "other")),
                    "nicheName": video.get("niche_name", "Other"),
                    "thumbnailUrl": video["thumbnail_url"],
                }
                for video in top_videos
            ],
            "viralVideos": viral_videos,
            "engagementTrend": self._build_engagement_trend(videos[:12]),
            "commentSentiment": sentiment,
            "viewerAsks": viewer_asks,
            "sharedNiches": shared_niches,
            "exclusiveNiches": exclusive_niches,
            "keywords": keywords,
            "titleStyleKeywords": sorted(title_style_keywords),
            "estimatedAudience": {
                "languages": language_distribution,
                "countries": country_distribution,
                "ages": age_distribution,
            },
            "audienceFitScore": audience_fit_score,
        }
        detail["similarity"] = self._similarity_breakdown(creator, detail)
        detail["similarityScore"] = detail["similarity"]["overall"]
        detail["discoveryReason"] = self._discovery_reason(detail, detail["similarity"])
        detail["nicheMatchTags"] = (
            shared_niches[:2]
            + [entry["language"] for entry in language_distribution[:1]]
            + [entry["country"] for entry in country_distribution[:1]]
        )[:4]
        detail["healthScore"] = self._health_score(
            avg_views=detail["avgViews"],
            subscribers=detail["subscribers"],
            engagement_rate=detail["engagementRate"],
            sentiment=sentiment,
        )
        detail["patternSummary"] = (
            f"Recent outliers concentrate in {detail['topNiche']}. "
            f"Estimated audience fit is {detail['audienceFitScore']}% based on public language/country/comment signals."
        )

        self._detail_cache[channel_id] = detail
        return detail

    async def discover(self, channel_id: str) -> dict:
        creator = self._creator(channel_id)
        if channel_id in self._discover_cache:
            return self._discover_cache[channel_id]

        candidate_ids: list[str] = []
        seen = set()
        for query in creator["search_queries"]:
            results = await self.youtube.search_channels(query, max_results=8)
            for result in results:
                candidate_id = result["channel_id"]
                if candidate_id not in seen:
                    seen.add(candidate_id)
                    candidate_ids.append(candidate_id)

        channels = await self.youtube.get_channels_batch(candidate_ids)
        min_subs = int(creator["subscribers"] * 0.1)
        max_subs = int(creator["subscribers"] * 10)
        filtered = [
            channel for channel in channels
            if min_subs <= channel["subscriber_count"] <= max_subs
            and channel["title"].lower() != creator["name"].lower()
        ]
        filtered.sort(key=lambda channel: abs(channel["subscriber_count"] - creator["subscribers"]))

        details = []
        for channel in filtered[:10]:
            try:
                details.append(await self._load_channel_detail(channel["id"], creator))
            except Exception:
                continue

        details = [detail for detail in details if detail["audienceFitScore"] >= 25]
        details.sort(
            key=lambda detail: (
                detail["audienceFitScore"],
                detail["similarityScore"],
                detail["avgViews"],
            ),
            reverse=True,
        )
        discovery = {
            "your_channel": {
                "id": creator["channel_id"],
                "name": creator["name"],
                "handle": creator["handle"],
                "subscribers": creator["subscribers"],
                "avgViews": creator["avg_views"],
                "engagementRate": creator["engagement_rate"],
                "uploadFrequency": creator["upload_frequency"],
                "topNiche": creator["niches"][0]["name"],
            },
            "competitors": [
                {
                    "id": detail["id"],
                    "name": detail["name"],
                    "handle": detail["handle"],
                    "thumbnailUrl": detail["thumbnailUrl"],
                    "subscribers": detail["subscribers"],
                    "avgViews": detail["avgViews"],
                    "engagementRate": detail["engagementRate"],
                    "uploadFrequency": detail["uploadFrequency"],
                    "topNiche": detail["topNiche"],
                    "similarityScore": detail["similarityScore"],
                    "audienceFitScore": detail["audienceFitScore"],
                    "discoveryReason": detail["discoveryReason"],
                    "nicheMatchTags": detail["nicheMatchTags"],
                }
                for detail in details[:6]
            ],
        }
        self._discover_cache[channel_id] = discovery
        return discovery

    async def competitor_detail(self, competitor_id: str, creator_id: str = DEMO_CREATOR["channel_id"]) -> dict:
        creator = self._creator(creator_id)
        return await self._load_channel_detail(competitor_id, creator)
