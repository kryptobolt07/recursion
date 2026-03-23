"""Persistent SQLite cache for expensive analysis responses with TTL support."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from pathlib import Path
from typing import Any

import aiosqlite

from app.config import REPO_ROOT

logger = logging.getLogger(__name__)


class AnalysisCacheService:
    """Small SQLite-backed cache shared across backend service instances."""

    def __init__(self, ttl_seconds: int = 86400):  # Default 24 hours
        self.db_path = REPO_ROOT / ".cache" / "analysis.sqlite3"
        self.ttl_seconds = ttl_seconds
        self._initialized = False
        self._init_lock = asyncio.Lock()

    async def init(self) -> None:
        if self._initialized:
            return

        async with self._init_lock:
            if self._initialized:
                return

            try:
                self.db_path.parent.mkdir(parents=True, exist_ok=True)
                async with aiosqlite.connect(self.db_path) as db:
                    try:
                        # Test if expires_at column exists
                        await db.execute("SELECT expires_at FROM analysis_cache LIMIT 1")
                    except aiosqlite.OperationalError:
                        # Table doesn't exist or is missing column, let's drop and recreate
                        await db.execute("DROP TABLE IF EXISTS analysis_cache")
                    
                    await db.execute(
                        """
                        CREATE TABLE IF NOT EXISTS analysis_cache (
                            cache_key TEXT PRIMARY KEY,
                            payload_json TEXT NOT NULL,
                            expires_at INTEGER NOT NULL,
                            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                        )
                        """
                    )
                    # Create index for cleanup
                    await db.execute(
                        "CREATE INDEX IF NOT EXISTS idx_expires_at ON analysis_cache(expires_at)"
                    )
                    await db.commit()
                self._initialized = True
            except Exception as e:
                logger.error(f"Failed to initialize AnalysisCacheService: {e}")
                # Don't set _initialized to True so we can retry

    async def get(self, cache_key: str) -> Any | None:
        if not self._initialized:
            await self.init()
        
        if not self._initialized:
            return None

        try:
            now = int(time.time())
            async with aiosqlite.connect(self.db_path) as db:
                cursor = await db.execute(
                    "SELECT payload_json FROM analysis_cache WHERE cache_key = ? AND expires_at > ?",
                    (cache_key, now),
                )
                row = await cursor.fetchone()

            if not row:
                return None
            return json.loads(row[0])
        except Exception as e:
            logger.error(f"Cache get error for {cache_key}: {e}")
            return None

    async def set(self, cache_key: str, payload: Any, ttl: int | None = None) -> None:
        if not self._initialized:
            await self.init()
        
        if not self._initialized:
            return

        try:
            payload_json = json.dumps(payload, ensure_ascii=True)
            expires_at = int(time.time()) + (ttl if ttl is not None else self.ttl_seconds)
            
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """
                    INSERT INTO analysis_cache (cache_key, payload_json, expires_at, updated_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(cache_key)
                    DO UPDATE SET
                        payload_json = excluded.payload_json,
                        expires_at = excluded.expires_at,
                        updated_at = CURRENT_TIMESTAMP
                    """,
                    (cache_key, payload_json, expires_at),
                )
                await db.commit()
        except Exception as e:
            logger.error(f"Cache set error for {cache_key}: {e}")

    async def delete(self, cache_key: str) -> None:
        if not self._initialized:
            await self.init()
        
        if not self._initialized:
            return

        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("DELETE FROM analysis_cache WHERE cache_key = ?", (cache_key,))
                await db.commit()
        except Exception as e:
            logger.error(f"Cache delete error for {cache_key}: {e}")

    async def cleanup_expired(self) -> None:
        """Manually trigger cleanup of expired entries."""
        if not self._initialized:
            await self.init()
        
        if not self._initialized:
            return

        try:
            now = int(time.time())
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("DELETE FROM analysis_cache WHERE expires_at <= ?", (now,))
                await db.commit()
                logger.info("Cleaned up expired cache entries")
        except Exception as e:
            logger.error(f"Cache cleanup error: {e}")


analysis_cache = AnalysisCacheService()
