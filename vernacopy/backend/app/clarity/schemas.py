"""
©AngelaMos | 2026
schemas.py
"""

from uuid import UUID
from datetime import datetime

from pydantic import ConfigDict, Field

from core.base_schema import BaseSchema


class DimensionBreakdown(BaseSchema):
    raw: float | None
    normalized: float | None
    score: float | None


class ScoreBreakdown(BaseSchema):
    frequency: DimensionBreakdown
    aoa: DimensionBreakdown
    concreteness: DimensionBreakdown
    familiarity: DimensionBreakdown


class AlternativeWord(BaseSchema):
    word: str
    clarity_score: float
    tier: str


class WordLookupRequest(BaseSchema):
    word: str = Field(..., min_length = 1, max_length = 100)


class WordLookupResponse(BaseSchema):
    word: str
    clarity_score: float | None
    tier: str | None
    breakdown: ScoreBreakdown | None
    cefr_level: str | None
    alternatives: list[AlternativeWord]
    found: bool


class CopyScanRequest(BaseSchema):
    text: str = Field(..., min_length = 1, max_length = 25000)


class TokenResult(BaseSchema):
    model_config = ConfigDict(
        from_attributes = True,
        str_strip_whitespace = False,
    )

    text: str
    is_stopword: bool = False
    is_whitespace: bool = False
    position: int
    end_position: int
    score: float | None = None
    tier: str | None = None
    suggestions: list[AlternativeWord] | None = None


class PhraseDetection(BaseSchema):
    phrase: str
    position: int
    end_position: int
    replacement: str
    replacement_score: float | None


class CopyScanResponse(BaseSchema):
    overall_score: float | None
    total_words: int
    content_words: int
    tokens: list[TokenResult]
    phrases_detected: list[PhraseDetection]
    tier_distribution: dict[str, int]
    scan_id: UUID


class WordCompareRequest(BaseSchema):
    word_a: str = Field(..., min_length = 1, max_length = 100)
    word_b: str = Field(..., min_length = 1, max_length = 100)


class WordDetail(BaseSchema):
    word: str
    clarity_score: float | None
    tier: str | None
    breakdown: ScoreBreakdown | None
    cefr_level: str | None


class WordCompareResponse(BaseSchema):
    word_a: WordDetail
    word_b: WordDetail
    score_difference: float | None
    recommendation: str | None


class ScanHistoryItem(BaseSchema):
    id: UUID
    input_text_preview: str
    overall_score: float | None
    content_words: int
    created_at: datetime


class ScanHistoryListResponse(BaseSchema):
    items: list[ScanHistoryItem]
    total: int
    page: int
    size: int


class ScanHistoryDetailResponse(CopyScanResponse):
    id: UUID
    created_at: datetime
