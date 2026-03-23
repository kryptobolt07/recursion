"""Sentence-transformer embedding generation.

Model: all-MiniLM-L6-v2 (90MB, runs on CPU in ~50ms per embedding).
Input per video: title + description (first 200 chars) + top 5 tags.
"""


class EmbeddingService:
    """Generate and cache text embeddings for video clustering."""

    def __init__(self):
        self.model = None  # Lazy-loaded

    def _load_model(self):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def embed_videos(self, texts: list[str]) -> list[list[float]]:
        """Embed a list of video text representations."""
        if self.model is None:
            self._load_model()
        return self.model.encode(texts).tolist()

    def embed_single(self, text: str) -> list[float]:
        """Embed a single text."""
        if self.model is None:
            self._load_model()
        return self.model.encode([text])[0].tolist()
