"""
©AngelaMos | 2026
repository.py
"""

from uuid import UUID

from pgvector.sqlalchemy import Vector
from sqlalchemy import cast, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from clarity.PhraseMap import PhraseMap
from clarity.ScanHistory import ScanHistory
from clarity.Word import Word


class WordRepository:
    @classmethod
    async def get_by_word(
        cls,
        session: AsyncSession,
        word: str
    ) -> Word | None:
        return await session.get(Word, word.lower())

    @classmethod
    async def get_batch(cls,
                        session: AsyncSession,
                        words: list[str]) -> list[Word]:
        lower_words = [w.lower() for w in words]
        result = await session.execute(
            select(Word).where(Word.word.in_(lower_words))
        )
        return list(result.scalars().all())

    @classmethod
    async def get_by_score_range(
        cls,
        session: AsyncSession,
        min_score: float,
        max_score: float,
        limit: int = 10,
    ) -> list[Word]:
        result = await session.execute(
            select(Word).where(
                Word.clarity_score >= min_score,
                Word.clarity_score <= max_score
            ).order_by(Word.clarity_score.desc()).limit(limit)
        )
        return list(result.scalars().all())

    @classmethod
    async def get_similar_by_embedding(
        cls,
        session: AsyncSession,
        embedding: list[float],
        min_score: float,
        exclude: set[str],
        limit: int = 25,
    ) -> list[Word]:
        vec = cast(embedding, Vector(300))
        result = await session.execute(
            select(Word)
            .where(
                Word.clarity_score > min_score,
                Word.embedding.is_not(None),
                ~Word.word.in_(list(exclude)),
            )
            .order_by(Word.embedding.op("<=>")(vec))
            .limit(limit)
        )
        return list(result.scalars().all())


class PhraseMapRepository:
    @classmethod
    async def get_all(cls, session: AsyncSession) -> list[PhraseMap]:
        result = await session.execute(
            select(PhraseMap).order_by(
                func.length(PhraseMap.phrase).desc()
            )
        )
        return list(result.scalars().all())


class ScanHistoryRepository:
    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        user_id: UUID,
        input_text: str,
        overall_score: float | None,
        content_words: int,
        flagged_words: list[dict],
    ) -> ScanHistory:
        scan = ScanHistory(
            user_id = user_id,
            input_text = input_text,
            overall_score = overall_score,
            content_words = content_words,
            flagged_words = flagged_words,
        )
        session.add(scan)
        await session.flush()
        return scan

    @classmethod
    async def get_by_id(
        cls,
        session: AsyncSession,
        scan_id: UUID
    ) -> ScanHistory | None:
        return await session.get(ScanHistory, scan_id)

    @classmethod
    async def get_user_history(
        cls,
        session: AsyncSession,
        user_id: UUID,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[ScanHistory],
               int]:
        count_result = await session.execute(
            select(func.count()).select_from(ScanHistory).where(
                ScanHistory.user_id == user_id
            )
        )
        total = count_result.scalar_one()

        result = await session.execute(
            select(ScanHistory).where(
                ScanHistory.user_id == user_id
            ).order_by(ScanHistory.created_at.desc()).offset(
                (page - 1) * size
            ).limit(size)
        )
        items = list(result.scalars().all())
        return items, total

    @classmethod
    async def delete(cls, session: AsyncSession, scan_id: UUID) -> bool:
        result = await session.execute(
            delete(ScanHistory).where(ScanHistory.id == scan_id)
        )
        return result.rowcount > 0
