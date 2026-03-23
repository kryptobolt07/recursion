"""Rate limiter for Gemini API — 15 RPM + exponential backoff."""

import asyncio
import time


class RateLimiter:
    """Token-bucket rate limiter for API calls."""

    def __init__(self, max_per_minute: int = 15):
        self.max_per_minute = max_per_minute
        self.timestamps: list[float] = []

    async def acquire(self):
        """Wait until a request slot is available."""
        now = time.time()
        # Remove timestamps older than 60 seconds
        self.timestamps = [t for t in self.timestamps if now - t < 60]

        if len(self.timestamps) >= self.max_per_minute:
            # Wait until the oldest timestamp exits the window
            wait_time = 60 - (now - self.timestamps[0]) + 0.1
            await asyncio.sleep(wait_time)

        self.timestamps.append(time.time())


async def exponential_backoff(attempt: int, base_delay: float = 1.0, max_delay: float = 60.0):
    """Wait with exponential backoff."""
    delay = min(base_delay * (2 ** attempt), max_delay)
    await asyncio.sleep(delay)
