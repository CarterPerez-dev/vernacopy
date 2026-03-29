"""
©AngelaMos | 2026
routes.py
"""

from uuid import UUID

from fastapi import APIRouter, Query
from starlette.requests import Request
from starlette.responses import Response

from clarity.dependencies import ClarityServiceDep
from clarity.schemas import (
    CopyScanRequest,
    CopyScanResponse,
    ScanHistoryDetailResponse,
    ScanHistoryListResponse,
    WordCompareRequest,
    WordCompareResponse,
    WordLookupRequest,
    WordLookupResponse,
)
from config import settings
from core.dependencies import CurrentUser
from core.rate_limit import limiter


router = APIRouter(prefix = "/clarity", tags = ["clarity"])


@router.post("/lookup", response_model = WordLookupResponse)
@limiter.limit(settings.CLARITY_RATE_LIMIT_LOOKUP)
async def lookup_word(
    request: Request,
    response: Response,
    data: WordLookupRequest,
    service: ClarityServiceDep,
    current_user: CurrentUser,
) -> WordLookupResponse:
    return await service.lookup_word(data.word)


@router.post("/scan", response_model = CopyScanResponse)
@limiter.limit(settings.CLARITY_RATE_LIMIT_SCAN)
async def scan_copy(
    request: Request,
    response: Response,
    data: CopyScanRequest,
    service: ClarityServiceDep,
    current_user: CurrentUser,
) -> CopyScanResponse:
    return await service.scan_copy(data.text, current_user.id)


@router.post("/compare", response_model = WordCompareResponse)
@limiter.limit(settings.CLARITY_RATE_LIMIT_COMPARE)
async def compare_words(
    request: Request,
    response: Response,
    data: WordCompareRequest,
    service: ClarityServiceDep,
    current_user: CurrentUser,
) -> WordCompareResponse:
    return await service.compare_words(data.word_a, data.word_b)


@router.get("/history", response_model = ScanHistoryListResponse)
@limiter.limit(settings.CLARITY_RATE_LIMIT_HISTORY)
async def get_history(
    request: Request,
    response: Response,
    service: ClarityServiceDep,
    current_user: CurrentUser,
    page: int = Query(1,
                      ge = 1),
    size: int = Query(20,
                      ge = 1,
                      le = 100),
) -> ScanHistoryListResponse:
    return await service.get_history(current_user.id, page, size)


@router.get(
    "/history/{scan_id}",
    response_model = ScanHistoryDetailResponse
)
async def get_scan_detail(
    scan_id: UUID,
    service: ClarityServiceDep,
    current_user: CurrentUser,
) -> ScanHistoryDetailResponse:
    return await service.get_scan_detail(scan_id, current_user.id)


@router.delete("/history/{scan_id}", status_code = 204)
async def delete_scan(
    scan_id: UUID,
    service: ClarityServiceDep,
    current_user: CurrentUser,
) -> None:
    await service.delete_scan(scan_id, current_user.id)
