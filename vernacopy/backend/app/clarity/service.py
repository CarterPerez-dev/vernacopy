"""
©AngelaMos | 2026
service.py
"""

import re
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from clarity.context import OllamaContextService
from clarity.repository import (
    PhraseMapRepository,
    ScanHistoryRepository,
    WordRepository,
)
from clarity.schemas import (
    AlternativeWord,
    CopyScanResponse,
    DimensionBreakdown,
    PhraseDetection,
    ScanHistoryDetailResponse,
    ScanHistoryItem,
    ScanHistoryListResponse,
    ScoreBreakdown,
    TokenResult,
    WordCompareResponse,
    WordDetail,
    WordLookupResponse,
)
from clarity.stopwords import is_stopword
from clarity.synonyms import SynonymEngine
from clarity.Word import Word
from config import settings
from core.exceptions import ResourceNotFound


TOKEN_PATTERN = re.compile(r"(\s+|\S+)")


def _assign_tier(score: float | None) -> str | None:
    if score is None:
        return None
    if score >= 90:
        return "S"
    if score >= 75:
        return "A"
    if score >= 60:
        return "B"
    if score >= 40:
        return "C"
    return "D"


def _build_breakdown(word_row: Word) -> ScoreBreakdown:
    freq_norm = None
    aoa_norm = None
    conc_norm = None
    fam_norm = None

    if word_row.clarity_score is not None:
        freq_norm = word_row.subtlex_log_freq
        aoa_norm = word_row.aoa
        conc_norm = word_row.concreteness
        fam_norm = word_row.mrc_familiarity

    return ScoreBreakdown(
        frequency = DimensionBreakdown(
            raw = word_row.subtlex_log_freq,
            normalized = freq_norm,
            score = round(freq_norm * 100,
                          1) if freq_norm is not None else None,
        ),
        aoa = DimensionBreakdown(
            raw = word_row.aoa,
            normalized = aoa_norm,
            score = round(aoa_norm * 100,
                          1) if aoa_norm is not None else None,
        ),
        concreteness = DimensionBreakdown(
            raw = word_row.concreteness,
            normalized = conc_norm,
            score = round(conc_norm * 100,
                          1) if conc_norm is not None else None,
        ),
        familiarity = DimensionBreakdown(
            raw = word_row.mrc_familiarity,
            normalized = fam_norm,
            score = round(fam_norm * 100,
                          1) if fam_norm is not None else None,
        ),
    )


def _word_detail(word_row: Word | None, original: str) -> WordDetail:
    if word_row is None:
        return WordDetail(
            word = original,
            clarity_score = None,
            tier = None,
            breakdown = None,
            cefr_level = None,
        )
    return WordDetail(
        word = word_row.word,
        clarity_score = round(word_row.clarity_score,
                              1) if word_row.clarity_score else None,
        tier = word_row.tier,
        breakdown = _build_breakdown(word_row),
        cefr_level = word_row.cefr_level,
    )


def _tokenize(text: str) -> list[dict]:
    tokens = []
    for match in TOKEN_PATTERN.finditer(text):
        raw = match.group(0)
        start = match.start()
        end = match.end()

        if raw.isspace():
            tokens.append(
                {
                    "text": raw,
                    "is_whitespace": True,
                    "is_stopword": False,
                    "position": start,
                    "end_position": end,
                }
            )
        else:
            clean = re.sub(r"[^\w'-]", "", raw).lower()
            tokens.append(
                {
                    "text": raw,
                    "is_whitespace": False,
                    "is_stopword": is_stopword(clean) if clean else True,
                    "position": start,
                    "end_position": end,
                    "clean": clean,
                }
            )
    return tokens


class ClarityService:
    def __init__(
        self,
        session: AsyncSession,
        synonym_engine: SynonymEngine,
        context_service: OllamaContextService,
    ) -> None:
        self.session = session
        self.synonym_engine = synonym_engine
        self.context_service = context_service

    async def _get_alternatives(
        self,
        word: str,
        original_score: float | None,
        sentence: str | None = None,
        limit: int = 5,
    ) -> list[AlternativeWord]:
        curated_candidates = await self.synonym_engine.get_synonyms(word, self.session)

        vector_words: list[Word] = []
        word_row = await WordRepository.get_by_word(self.session, word)
        if word_row is not None and word_row.embedding is not None:
            vector_words = await WordRepository.get_similar_by_embedding(
                self.session,
                word_row.embedding,
                original_score or 0.0,
                exclude={word.lower()},
                limit=25,
            )

        seen: set[str] = {word.lower()}
        all_candidate_words: list[str] = []
        for c in curated_candidates:
            lower = c.word.lower()
            if lower not in seen:
                seen.add(lower)
                all_candidate_words.append(c.word)
        for vw in vector_words:
            if vw.word not in seen:
                seen.add(vw.word)
                all_candidate_words.append(vw.word)

        if sentence and settings.OLLAMA_CONTEXT_ENABLED and all_candidate_words:
            context_result = await self.context_service.filter_and_augment(
                sentence, word, all_candidate_words[:15]
            )
            final_words = list(dict.fromkeys(
                context_result.valid_candidates + context_result.generated_candidates
            ))
        else:
            final_words = all_candidate_words

        if not final_words:
            return []

        word_rows = await WordRepository.get_batch(self.session, final_words)
        word_map = {r.word: r for r in word_rows}

        alternatives: list[AlternativeWord] = []
        for cand in final_words:
            row = word_map.get(cand)
            if row is None:
                continue
            if row.clarity_score is None:
                continue
            if original_score is not None and row.clarity_score <= original_score:
                continue
            alternatives.append(
                AlternativeWord(
                    word=row.word,
                    clarity_score=round(row.clarity_score, 1),
                    tier=row.tier or _assign_tier(row.clarity_score),
                )
            )

        alternatives.sort(key=lambda a: a.clarity_score, reverse=True)
        return alternatives[:limit]

    async def lookup_word(self, word: str) -> WordLookupResponse:
        word_row = await WordRepository.get_by_word(self.session, word)

        if word_row is None:
            alternatives = await self._get_alternatives(word, None)
            return WordLookupResponse(
                word = word.lower(),
                clarity_score = None,
                tier = None,
                breakdown = None,
                cefr_level = None,
                alternatives = alternatives,
                found = False,
            )

        alternatives = await self._get_alternatives(
            word,
            word_row.clarity_score
        )

        return WordLookupResponse(
            word = word_row.word,
            clarity_score = round(word_row.clarity_score,
                                  1) if word_row.clarity_score else None,
            tier = word_row.tier,
            breakdown = _build_breakdown(word_row),
            cefr_level = word_row.cefr_level,
            alternatives = alternatives,
            found = True,
        )

    async def scan_copy(
        self,
        text: str,
        user_id: UUID
    ) -> CopyScanResponse:
        phrases = await PhraseMapRepository.get_all(self.session)

        phrase_detections: list[PhraseDetection] = []
        consumed_ranges: list[tuple[int, int]] = []
        text_lower = text.lower()

        for pm in phrases:
            start = 0
            while True:
                idx = text_lower.find(pm.phrase, start)
                if idx == -1:
                    break
                end = idx + len(pm.phrase)
                overlaps = any(
                    not (end <= cs or idx >= ce)
                    for cs, ce in consumed_ranges
                )
                if not overlaps:
                    phrase_detections.append(
                        PhraseDetection(
                            phrase = pm.phrase,
                            position = idx,
                            end_position = end,
                            replacement = pm.replacement,
                            replacement_score = pm.clarity_score,
                        )
                    )
                    consumed_ranges.append((idx, end))
                start = end

        raw_tokens = _tokenize(text)

        content_word_set: set[str] = set()
        for tok in raw_tokens:
            if tok["is_whitespace"] or tok["is_stopword"]:
                continue
            clean = tok.get("clean", "")
            if not clean:
                continue
            in_phrase = any(
                not (tok["end_position"] <= cs or tok["position"] >= ce)
                for cs, ce in consumed_ranges
            )
            if not in_phrase and clean:
                content_word_set.add(clean)

        word_rows = await WordRepository.get_batch(
            self.session,
            list(content_word_set)
        )
        word_map = {w.word: w for w in word_rows}

        tokens: list[TokenResult] = []
        scores: list[float] = []
        tier_dist: dict[str,
                        int] = {
                            "S": 0,
                            "A": 0,
                            "B": 0,
                            "C": 0,
                            "D": 0
                        }

        for tok in raw_tokens:
            if tok["is_whitespace"]:
                tokens.append(
                    TokenResult(
                        text = tok["text"],
                        is_whitespace = True,
                        position = tok["position"],
                        end_position = tok["end_position"],
                    )
                )
                continue

            clean = tok.get("clean", "")
            in_phrase = any(
                not (tok["end_position"] <= cs or tok["position"] >= ce)
                for cs, ce in consumed_ranges
            )

            if tok["is_stopword"] or not clean or in_phrase:
                tokens.append(
                    TokenResult(
                        text = tok["text"],
                        is_stopword = tok["is_stopword"],
                        position = tok["position"],
                        end_position = tok["end_position"],
                    )
                )
                continue

            row = word_map.get(clean)
            if row and row.clarity_score is not None:
                tier = row.tier or _assign_tier(row.clarity_score)
                scores.append(row.clarity_score)
                if tier in tier_dist:
                    tier_dist[tier] += 1

                suggestions = None
                if tier in ("C", "D"):
                    suggestions = await self._get_alternatives(
                        clean,
                        row.clarity_score,
                        sentence=text,
                        limit=3,
                    )

                tokens.append(
                    TokenResult(
                        text = tok["text"],
                        position = tok["position"],
                        end_position = tok["end_position"],
                        score = round(row.clarity_score,
                                      1),
                        tier = tier,
                        suggestions = suggestions if suggestions else None,
                    )
                )
            else:
                tokens.append(
                    TokenResult(
                        text = tok["text"],
                        position = tok["position"],
                        end_position = tok["end_position"],
                    )
                )

        overall_score = round(
            sum(scores) / len(scores),
            1
        ) if scores else None
        total_words = sum(1 for t in raw_tokens if not t["is_whitespace"])
        content_words_count = len(scores)

        flagged = [
            {
                "word":
                t.text,
                "position":
                t.position,
                "end_position":
                t.end_position,
                "score":
                t.score,
                "tier":
                t.tier,
                "suggestions":
                [s.model_dump()
                 for s in t.suggestions] if t.suggestions else [],
            }
            for t in tokens
            if t.tier in ("C", "D") and t.suggestions
        ]

        scan = await ScanHistoryRepository.create(
            session = self.session,
            user_id = user_id,
            input_text = text,
            overall_score = overall_score,
            content_words = content_words_count,
            flagged_words = flagged,
        )
        await self.session.commit()

        return CopyScanResponse(
            overall_score = overall_score,
            total_words = total_words,
            content_words = content_words_count,
            tokens = tokens,
            phrases_detected = phrase_detections,
            tier_distribution = tier_dist,
            scan_id = scan.id,
        )

    async def compare_words(
        self,
        word_a: str,
        word_b: str
    ) -> WordCompareResponse:
        rows = await WordRepository.get_batch(
            self.session,
            [word_a,
             word_b]
        )
        row_map = {r.word: r for r in rows}

        a_row = row_map.get(word_a.lower())
        b_row = row_map.get(word_b.lower())

        a_detail = _word_detail(a_row, word_a)
        b_detail = _word_detail(b_row, word_b)

        score_diff = None
        recommendation = None
        if a_detail.clarity_score is not None and b_detail.clarity_score is not None:
            score_diff = round(
                abs(a_detail.clarity_score - b_detail.clarity_score),
                1
            )
            if a_detail.clarity_score > b_detail.clarity_score:
                recommendation = "word_a"
            elif b_detail.clarity_score > a_detail.clarity_score:
                recommendation = "word_b"

        return WordCompareResponse(
            word_a = a_detail,
            word_b = b_detail,
            score_difference = score_diff,
            recommendation = recommendation,
        )

    async def get_history(
        self,
        user_id: UUID,
        page: int = 1,
        size: int = 20
    ) -> ScanHistoryListResponse:
        items, total = await ScanHistoryRepository.get_user_history(
            self.session, user_id, page, size
        )
        return ScanHistoryListResponse(
            items = [
                ScanHistoryItem(
                    id = item.id,
                    input_text_preview = item.input_text[: 100],
                    overall_score = item.overall_score,
                    content_words = item.content_words,
                    created_at = item.created_at,
                ) for item in items
            ],
            total = total,
            page = page,
            size = size,
        )

    async def get_scan_detail(
        self,
        scan_id: UUID,
        user_id: UUID
    ) -> ScanHistoryDetailResponse:
        scan = await ScanHistoryRepository.get_by_id(self.session, scan_id)
        if scan is None or scan.user_id != user_id:
            raise ResourceNotFound("Scan not found")

        tokens: list[TokenResult] = []
        raw_tokens = _tokenize(scan.input_text)
        content_word_set = {
            tok.get("clean",
                    "")
            for tok in raw_tokens
            if not tok["is_whitespace"] and not tok["is_stopword"]
            and tok.get("clean")
        }
        word_rows = await WordRepository.get_batch(
            self.session,
            list(content_word_set)
        )
        word_map = {w.word: w for w in word_rows}

        tier_dist: dict[str,
                        int] = {
                            "S": 0,
                            "A": 0,
                            "B": 0,
                            "C": 0,
                            "D": 0
                        }
        for tok in raw_tokens:
            if tok["is_whitespace"]:
                tokens.append(
                    TokenResult(
                        text = tok["text"],
                        is_whitespace = True,
                        position = tok["position"],
                        end_position = tok["end_position"],
                    )
                )
                continue

            clean = tok.get("clean", "")
            if tok["is_stopword"] or not clean:
                tokens.append(
                    TokenResult(
                        text = tok["text"],
                        is_stopword = tok["is_stopword"],
                        position = tok["position"],
                        end_position = tok["end_position"],
                    )
                )
                continue

            row = word_map.get(clean)
            if row and row.clarity_score is not None:
                tier = row.tier or _assign_tier(row.clarity_score)
                if tier in tier_dist:
                    tier_dist[tier] += 1
                flagged_entry = next(
                    (
                        f for f in scan.flagged_words
                        if f.get("position") == tok["position"]
                    ),
                    None,
                )
                suggestions = None
                if flagged_entry and flagged_entry.get("suggestions"):
                    suggestions = [
                        AlternativeWord(**s)
                        for s in flagged_entry["suggestions"]
                    ]
                tokens.append(
                    TokenResult(
                        text = tok["text"],
                        position = tok["position"],
                        end_position = tok["end_position"],
                        score = round(row.clarity_score,
                                      1),
                        tier = tier,
                        suggestions = suggestions,
                    )
                )
            else:
                tokens.append(
                    TokenResult(
                        text = tok["text"],
                        position = tok["position"],
                        end_position = tok["end_position"],
                    )
                )

        phrases = await PhraseMapRepository.get_all(self.session)
        phrase_detections: list[PhraseDetection] = []
        text_lower = scan.input_text.lower()
        for pm in phrases:
            idx = text_lower.find(pm.phrase)
            if idx != -1:
                phrase_detections.append(
                    PhraseDetection(
                        phrase = pm.phrase,
                        position = idx,
                        end_position = idx + len(pm.phrase),
                        replacement = pm.replacement,
                        replacement_score = pm.clarity_score,
                    )
                )

        return ScanHistoryDetailResponse(
            id = scan.id,
            created_at = scan.created_at,
            overall_score = scan.overall_score,
            total_words = sum(
                1 for t in raw_tokens if not t["is_whitespace"]
            ),
            content_words = scan.content_words,
            tokens = tokens,
            phrases_detected = phrase_detections,
            tier_distribution = tier_dist,
            scan_id = scan.id,
        )

    async def delete_scan(self, scan_id: UUID, user_id: UUID) -> None:
        scan = await ScanHistoryRepository.get_by_id(self.session, scan_id)
        if scan is None or scan.user_id != user_id:
            raise ResourceNotFound("Scan not found")
        await ScanHistoryRepository.delete(self.session, scan_id)
        await self.session.commit()
