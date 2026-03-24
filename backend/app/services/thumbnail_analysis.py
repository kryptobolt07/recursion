"""Public thumbnail analysis from fetched YouTube thumbnails."""

from __future__ import annotations

import re
import logging
from collections import Counter
from io import BytesIO

import httpx
from colorthief import ColorThief
from PIL import Image, ImageFilter, ImageStat

from app.services.analysis_cache import analysis_cache

logger = logging.getLogger(__name__)

try:
    import mediapipe as mp
except Exception:  # pragma: no cover - environment-dependent import
    mp = None

try:
    import pytesseract
except Exception:  # pragma: no cover - environment-dependent import
    pytesseract = None


def _quantize_color(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(
        min((rgb[0] // 32) * 32, 255),
        min((rgb[1] // 32) * 32, 255),
        min((rgb[2] // 32) * 32, 255),
    )


class ThumbnailAnalysisService:
    """Analyze thumbnail image URLs into reusable style signals."""

    def __init__(self):
        self._feature_cache: dict[str, dict] = {}

    async def _download_image(self, url: str) -> bytes:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content

    def _open_image(self, content: bytes) -> Image.Image:
        image = Image.open(BytesIO(content))
        return image.convert("RGB")

    def _dominant_colors(self, content: bytes) -> list[str]:
        try:
            palette = ColorThief(BytesIO(content)).get_palette(color_count=4, quality=5)
            return [_quantize_color(color) for color in palette[:3]]
        except Exception:
            return []

    def _brightness(self, image: Image.Image) -> float:
        grayscale = image.convert("L")
        mean_value = ImageStat.Stat(grayscale).mean[0]
        return round((mean_value / 255) * 100, 1)

    def _edge_density(self, image: Image.Image) -> float:
        grayscale = image.convert("L")
        edged = grayscale.filter(ImageFilter.FIND_EDGES)
        histogram = edged.histogram()
        edge_pixels = sum(histogram[80:])
        total_pixels = max(sum(histogram), 1)
        return round((edge_pixels / total_pixels) * 100, 1)

    def _ocr_words(self, image: Image.Image) -> list[str]:
        if pytesseract is None:
            return []

        try:
            text = pytesseract.image_to_string(image)
        except Exception:
            return []

        words = []
        for word in re.findall(r"[A-Za-z0-9]{2,}", text.upper()):
            if len(word) > 14:
                continue
            words.append(word)
        return words

    def _has_face(self, image: Image.Image) -> bool:
        if mp is None:
            return False

        try:
            detector_cls = mp.solutions.face_detection.FaceDetection
            with detector_cls(model_selection=0, min_detection_confidence=0.5) as detector:
                result = detector.process(image)
                return bool(result.detections)
        except Exception:
            return False

    async def analyze_thumbnail(self, url: str) -> dict:
        if not url:
            return {}

        # 1. Check in-memory cache
        if url in self._feature_cache:
            return self._feature_cache[url]

        # 2. Check persistent cache
        cache_key = f"thumb-features:{url}"
        cached = await analysis_cache.get(cache_key)
        if cached:
            self._feature_cache[url] = cached
            return cached

        try:
            content = await self._download_image(url)
            image = self._open_image(content)
        except Exception as exc:
            logger.warning("Failed to download or open image for %s: %s", url, exc)
            return {}

        features = {
            "dominantColors": self._dominant_colors(content),
            "brightness": self._brightness(image),
            "edgeDensity": self._edge_density(image),
            "ocrWords": self._ocr_words(image),
            "hasFace": self._has_face(image),
            "width": image.width,
            "height": image.height,
        }
        
        # 3. Store in caches
        self._feature_cache[url] = features
        await analysis_cache.set(cache_key, features, ttl=86400 * 7)  # Cache for 1 week
        
        return features

    def _composition_bias(self, face_presence_pct: int, avg_word_count: float, edge_density: float) -> str:
        if face_presence_pct >= 55:
            return "Face-led focal composition with one dominant subject."
        if avg_word_count >= 3:
            return "Text-forward packaging with a strong overlay and cleaner supporting visual."
        if edge_density >= 18:
            return "Dense comparison or benchmark frame with multiple visual anchors."
        return "Single subject with minimal clutter and one obvious click cue."

    async def analyze_video_set(self, videos: list[dict]) -> dict:
        analyzed_rows = []
        for video in videos:
            thumbnail_url = video.get("thumbnailUrl") or video.get("thumbnail_url") or ""
            features = await self.analyze_thumbnail(thumbnail_url)
            if not features:
                continue
            analyzed_rows.append(
                {
                    "id": video.get("id", ""),
                    "title": video.get("title", ""),
                    "views": int(video.get("views", 0) or 0),
                    "thumbnailUrl": thumbnail_url,
                    "features": features,
                }
            )

        if not analyzed_rows:
            return {"available": False, "referenceVideos": []}

        color_counts = Counter()
        word_counts = Counter()
        face_hits = 0
        total_words = 0
        brightness_values = []
        edge_values = []

        for row in analyzed_rows:
            features = row["features"]
            color_counts.update(features["dominantColors"])
            word_counts.update(features["ocrWords"])
            face_hits += 1 if features["hasFace"] else 0
            total_words += len(features["ocrWords"])
            brightness_values.append(features["brightness"])
            edge_values.append(features["edgeDensity"])

        total = len(analyzed_rows)
        face_presence_pct = round((face_hits / total) * 100)
        avg_word_count = round(total_words / total, 1)
        avg_brightness = round(sum(brightness_values) / total, 1)
        avg_edge_density = round(sum(edge_values) / total, 1)

        return {
            "available": True,
            "facePresencePct": face_presence_pct,
            "avgWordCount": avg_word_count,
            "dominantColors": [color for color, _ in color_counts.most_common(3)],
            "topOverlayWords": [word.title() for word, _ in word_counts.most_common(8)],
            "averageBrightness": avg_brightness,
            "averageEdgeDensity": avg_edge_density,
            "compositionBias": self._composition_bias(face_presence_pct, avg_word_count, avg_edge_density),
            "referenceVideos": [
                {
                    "id": row["id"],
                    "title": row["title"],
                    "thumbnailUrl": row["thumbnailUrl"],
                    "views": row["views"],
                }
                for row in analyzed_rows[:4]
            ],
        }
