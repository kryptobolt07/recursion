"""Thumbnail feature extraction — mediapipe + pytesseract + colorthief.

All local, free, no API calls needed.
"""


class ThumbnailAnalyzer:
    """Extract structured features from YouTube thumbnails."""

    def analyze(self, image_path: str) -> dict:
        """Full analysis: face detection + OCR + color extraction.

        Returns:
            {face: bool, face_count: int, text_present: bool, text_content: str,
             word_count: int, dominant_colors: [hex], background_complexity: str}
        """
        # In a real app, we'd use mediapipe, pytesseract, colorthief
        # For now, we simulate analysis with heuristic-based mock data
        import random
        import hashlib
        
        # Use filename as seed for consistent "mock" results for the same file
        seed = int(hashlib.md5(image_path.encode()).hexdigest(), 16) % 100
        random.seed(seed)
        
        has_face = random.random() > 0.4
        has_text = random.random() > 0.2
        
        result = {
            "face": has_face,
            "face_count": random.randint(1, 3) if has_face else 0,
            "text_present": has_text,
            "text_content": "Simulated OCR Content" if has_text else "",
            "word_count": random.randint(1, 6) if has_text else 0,
            "dominant_colors": ["#ef4444", "#0f172a", "#f8fafc"] if seed % 2 == 0 else ["#7c3aed", "#111827", "#ef4444"],
            "background_complexity": "medium" if seed % 3 == 0 else ("high" if seed % 3 == 1 else "low")
        }
        return result

    def _detect_faces(self, image_path: str) -> dict:
        """Detect faces using mediapipe."""
        # TODO: mediapipe face detection
        return {"face": False, "face_count": 0}

    def _extract_text(self, image_path: str) -> dict:
        """Extract text using pytesseract OCR."""
        # TODO: pytesseract OCR
        return {"text_present": False, "text_content": "", "word_count": 0}

    def _extract_colors(self, image_path: str) -> dict:
        """Extract dominant color palette using colorthief."""
        # TODO: colorthief extraction
        return {"dominant_colors": [], "background_complexity": "unknown"}
