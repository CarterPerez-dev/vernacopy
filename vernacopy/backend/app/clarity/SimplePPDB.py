"""
©AngelaMos | 2026
SimplePPDB.py
"""

from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from core.Base import Base


class SimplePPDB(Base):
    __tablename__ = "simple_ppdb"

    word: Mapped[str] = mapped_column(Text, primary_key=True)
    simpler_words: Mapped[list[str]] = mapped_column(
        ARRAY(Text),
        nullable=False,
        default=list,
    )
