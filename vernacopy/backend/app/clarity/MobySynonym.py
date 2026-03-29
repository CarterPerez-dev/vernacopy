"""
©AngelaMos | 2026
MobySynonym.py
"""

from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from core.Base import Base


class MobySynonym(Base):
    __tablename__ = "moby_synonyms"

    word: Mapped[str] = mapped_column(Text, primary_key = True)
    synonyms: Mapped[list[str]] = mapped_column(
        ARRAY(Text),
        nullable = False,
        default = list
    )
