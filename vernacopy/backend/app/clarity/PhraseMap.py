"""
©AngelaMos | 2026
PhraseMap.py
"""

from sqlalchemy import Float, Text
from sqlalchemy.orm import Mapped, mapped_column

from core.Base import Base, TimestampMixin, UUIDMixin


class PhraseMap(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "phrase_map"

    phrase: Mapped[str] = mapped_column(
        Text,
        unique = True,
        nullable = False,
        index = True
    )
    replacement: Mapped[str] = mapped_column(Text, nullable = False)
    clarity_score: Mapped[float | None] = mapped_column(
        Float,
        nullable = True
    )
