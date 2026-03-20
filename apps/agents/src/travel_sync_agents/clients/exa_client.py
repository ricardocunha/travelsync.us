from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from exa_py import Exa
from pydantic import BaseModel, Field

from travel_sync_agents.errors import AgentConfigurationError, ExternalProviderError
from travel_sync_agents.mappers.source_mapper import map_exa_result
from travel_sync_agents.schemas.source import SourceCitation


class ExaSearchRequest(BaseModel):
    query: str = Field(min_length=3)
    num_results: int = Field(default=6, ge=1, le=10)
    include_domains: list[str] = Field(default_factory=list)
    exclude_domains: list[str] = Field(default_factory=list)


class ExaSearchClient:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        client: Any | None = None,
        default_num_results: int = 6,
    ) -> None:
        if client is not None:
            self._client = client
        elif api_key:
            self._client = Exa(api_key=api_key)
        else:
            raise AgentConfigurationError("ExaSearchClient requires an API key or a prebuilt client.")

        self._default_num_results = default_num_results

    def search(self, request: ExaSearchRequest) -> list[SourceCitation]:
        try:
            response = self._client.search(
                request.query,
                num_results=request.num_results or self._default_num_results,
                include_domains=request.include_domains or None,
                exclude_domains=request.exclude_domains or None,
                contents={"summary": True},
            )
        except Exception as exc:
            raise ExternalProviderError(f"Exa search failed: {exc}") from exc

        results = getattr(response, "results", [])
        accessed_at = datetime.now(UTC)
        citations: list[SourceCitation] = []
        seen_urls: set[str] = set()

        for result in results:
            url = getattr(result, "url", None)
            if not url or url in seen_urls:
                continue
            seen_urls.add(str(url))
            citations.append(map_exa_result(result, accessed_at=accessed_at))

        return citations
