"""
©AngelaMos | 2026
synonyms.py
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import wn
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from clarity.SimplePPDB import SimplePPDB

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class SynonymCandidate:
    word: str
    source: str


class SynonymEngine:
    def __init__(self) -> None:
        self._wordnet: wn.Wordnet | None = None

    def load_wordnet(self) -> None:
        try:
            self._wordnet = wn.Wordnet("oewn:2025")
        except wn.Error:
            logger.warning("WordNet oewn:2025 not found, downloading...")
            wn.download("oewn:2025")
            self._wordnet = wn.Wordnet("oewn:2025")

    def _wordnet_synonyms(self, word: str) -> list[SynonymCandidate]:
        if self._wordnet is None:
            return []

        seen: set[str] = set()
        results: list[SynonymCandidate] = []

        for synset in self._wordnet.synsets(word):
            for lemma in synset.lemmas():
                cleaned = lemma.replace("_", " ")
                lower = cleaned.lower()
                if lower != word.lower() and lower not in seen:
                    seen.add(lower)
                    results.append(SynonymCandidate(word=cleaned, source="wordnet"))

        return results

    async def _simple_ppdb_synonyms(self, word: str, session: AsyncSession) -> list[SynonymCandidate]:
        stmt = select(SimplePPDB.simpler_words).where(SimplePPDB.word == word.lower())
        result = await session.execute(stmt)
        row = result.scalar_one_or_none()

        if row is None:
            return []

        return [
            SynonymCandidate(word=simpler, source="simple_ppdb")
            for simpler in row
            if simpler.lower() != word.lower()
        ]

    async def get_synonyms(
        self,
        word: str,
        session: AsyncSession,
    ) -> list[SynonymCandidate]:
        seen: set[str] = set()
        combined: list[SynonymCandidate] = []

        for candidate in self._wordnet_synonyms(word):
            lower = candidate.word.lower()
            if lower not in seen:
                seen.add(lower)
                combined.append(candidate)

        for candidate in await self._simple_ppdb_synonyms(word, session):
            lower = candidate.word.lower()
            if lower not in seen:
                seen.add(lower)
                combined.append(candidate)

        return combined

    def shutdown(self) -> None:
        self._wordnet = None
