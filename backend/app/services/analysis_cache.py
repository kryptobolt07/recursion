"""Persistent SQLite cache for expensive analysis responses."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

import aiosqlite

from app.config import REPO_ROOT


class AnalysisCacheService:
    """Small SQLite-backed cache shared across backend service instances."""

    def __init__(self):
        self.db_path = REPO_ROOT / ".cache" / "analysis.sqlite3"
        self._initialized = False
        self._init_lock = asyncio.Lock()

    async def init(self) -> None:
        if self._initialized:
            return

        async with self._init_lock:
            if self._initialized:
                return

            self.db_path.parent.mkdir(parents=True, exist_ok=True)
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute(
                    """
                    CREATE TABLE IF NOT EXISTS analysis_cache (
                        cache_key TEXT PRIMARY KEY,
                        payload_json TEXT NOT NULL,
                        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
                await db.commit()

            self._initialized = True

    async def get(self, cache_key: str) -> Any | None:
        await self.init()
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "SELECT payload_json FROM analysis_cache WHERE cache_key = ?",
                (cache_key,),
            )
            row = await cursor.fetchone()

        if not row:
            return None
        return json.loads(row[0])

    async def set(self, cache_key: str, payload: Any) -> None:
        await self.init()
        payload_json = json.dumps(payload, ensure_ascii=True)
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO analysis_cache (cache_key, payload_json, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(cache_key)
                DO UPDATE SET
                    payload_json = excluded.payload_json,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (cache_key, payload_json),
            )
            await db.commit()

    async def delete(self, cache_key: str) -> None:
        await self.init()
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM analysis_cache WHERE cache_key = ?", (cache_key,))
            await db.commit()


analysis_cache = AnalysisCacheService()
