"""
©AngelaMos | 2026
Word.py
"""

from pgvector.sqlalchemy import Vector
from sqlalchemy import Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from core.Base import Base


class Word(Base):
    __tablename__ = "words"

    word: Mapped[str] = mapped_column(Text, primary_key = True)
    subtlex_freq_per_million: Mapped[float | None] = mapped_column(
        Float,
        nullable = True
    )
    subtlex_log_freq: Mapped[float | None] = mapped_column(
        Float,
        nullable = True
    )
    aoa: Mapped[float | None] = mapped_column(Float, nullable = True)
    concreteness: Mapped[float | None] = mapped_column(
        Float,
        nullable = True
    )
    mrc_familiarity: Mapped[float | None] = mapped_column(
        Float,
        nullable = True
    )
    cefr_level: Mapped[str | None] = mapped_column(
        String(2),
        nullable = True
    )
    clarity_score: Mapped[float | None] = mapped_column(
        Float,
        nullable = True,
        index = True
    )
    tier: Mapped[str | None] = mapped_column(
        String(1),
        nullable = True,
        index = True
    )
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(300),
        nullable = True
    )
