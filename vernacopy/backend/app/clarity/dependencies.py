"""
©AngelaMos | 2026
dependencies.py
"""

from typing import Annotated

from fastapi import Depends, Request

from clarity.context import OllamaContextService
from clarity.service import ClarityService
from clarity.synonyms import SynonymEngine
from config import settings
from core.dependencies import DBSession


def get_synonym_engine(request: Request) -> SynonymEngine:
    return request.app.state.synonym_engine


def get_context_service() -> OllamaContextService:
    return OllamaContextService(
        base_url=settings.OLLAMA_URL,
        model=settings.OLLAMA_MODEL,
        timeout=settings.OLLAMA_TIMEOUT,
    )


def get_clarity_service(
    session: DBSession,
    synonym_engine: Annotated[SynonymEngine, Depends(get_synonym_engine)],
    context_service: Annotated[OllamaContextService, Depends(get_context_service)],
) -> ClarityService:
    return ClarityService(
        session=session,
        synonym_engine=synonym_engine,
        context_service=context_service,
    )


ClarityServiceDep = Annotated[ClarityService, Depends(get_clarity_service)]
