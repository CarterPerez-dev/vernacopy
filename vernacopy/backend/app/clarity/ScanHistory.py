"""
©AngelaMos | 2026
ScanHistory.py
"""

from uuid import UUID

from sqlalchemy import Float, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from core.Base import Base, TimestampMixin, UUIDMixin


class ScanHistory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "scan_history"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable = False,
        index = True
    )
    input_text: Mapped[str] = mapped_column(Text, nullable = False)
    overall_score: Mapped[float | None] = mapped_column(
        Float,
        nullable = True
    )
    content_words: Mapped[int] = mapped_column(
        Integer,
        nullable = False,
        default = 0
    )
    flagged_words: Mapped[dict] = mapped_column(
        JSONB,
        nullable = False,
        default = list
    )
