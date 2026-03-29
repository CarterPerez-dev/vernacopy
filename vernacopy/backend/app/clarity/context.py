"""
©AngelaMos | 2026
context.py
"""

import json
import logging
from dataclasses import dataclass, field

import httpx

logger = logging.getLogger(__name__)


@dataclass
class ContextResult:
    valid_candidates: list[str] = field(default_factory=list)
    generated_candidates: list[str] = field(default_factory=list)


class OllamaContextService:
    def __init__(self, base_url: str, model: str, timeout: int = 30) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout = timeout

    def _chat(self, prompt: str) -> dict:
        return {
            "model": self._model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
        }

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            timeout=self._timeout,
            headers={"Connection": "close"},
        )

    async def filter_and_augment(
        self,
        sentence: str,
        word: str,
        candidates: list[str],
    ) -> ContextResult:
        if not candidates:
            return ContextResult(generated_candidates=await self._generate_only(sentence, word))

        prompt = (
            f'Sentence: "{sentence}"\n'
            f'Word to replace: "{word}"\n'
            f'Candidates: {json.dumps(candidates)}\n\n'
            f'Task: Which candidates can replace "{word}" in the sentence above WITHOUT changing the meaning?\n'
            f'Rules:\n'
            f'- The replacement must mean the same thing as "{word}" in this exact context\n'
            f'- It must be grammatically correct in the same position\n'
            f'- If the meaning changes even slightly, exclude it\n'
            f'- If no candidates qualify, return an empty valid list\n\n'
            f'Also suggest up to 3 single-word alternatives that are simpler and mean the same as "{word}" here.\n'
            f'Respond with JSON only: {{"valid": [...], "suggestions": [...]}}'
        )

        try:
            async with self._client() as client:
                response = await client.post(
                    f"{self._base_url}/v1/chat/completions",
                    json=self._chat(prompt),
                )
                response.raise_for_status()
                data = response.json()
                raw_text = data["choices"][0]["message"]["content"]
                parsed = json.loads(raw_text)

                valid = [w.lower() for w in parsed.get("valid", []) if isinstance(w, str)]
                suggestions = [w.lower() for w in parsed.get("suggestions", []) if isinstance(w, str)]

                return ContextResult(
                    valid_candidates=valid,
                    generated_candidates=suggestions,
                )
        except Exception:
            logger.warning("ollama_context_failed", exc_info=True)
            return ContextResult()

    async def _generate_only(self, sentence: str, word: str) -> list[str]:
        prompt = (
            f'Sentence: "{sentence}"\n'
            f'Word to replace: "{word}"\n\n'
            f'Suggest up to 3 single-word alternatives that are simpler than "{word}" and mean the same thing in this sentence.\n'
            f'Only include words that fit grammatically and preserve the meaning exactly.\n'
            f'Respond with JSON only: {{"suggestions": [...]}}'
        )
        try:
            async with self._client() as client:
                response = await client.post(
                    f"{self._base_url}/v1/chat/completions",
                    json=self._chat(prompt),
                )
                response.raise_for_status()
                data = response.json()
                raw_text = data["choices"][0]["message"]["content"]
                parsed = json.loads(raw_text)
                return [w.lower() for w in parsed.get("suggestions", []) if isinstance(w, str)]
        except Exception:
            logger.warning("ollama_generate_failed", exc_info=True)
            return []
