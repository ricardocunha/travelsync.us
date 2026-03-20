from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from firecrawl import Firecrawl
from pydantic import BaseModel, Field

from travel_sync_agents.errors import AgentConfigurationError, ExternalProviderError
from travel_sync_agents.mappers.source_mapper import map_firecrawl_document
from travel_sync_agents.schemas.source import ResearchDocument


class FirecrawlScrapeRequest(BaseModel):
    url: str = Field(min_length=5)
    timeout_ms: int = Field(default=15_000, ge=1_000)


class FirecrawlClient:
    def __init__(self, *, api_key: str | None = None, client: Any | None = None) -> None:
        if client is not None:
            self._client = client
        elif api_key:
            self._client = Firecrawl(api_key=api_key)
        else:
            raise AgentConfigurationError("FirecrawlClient requires an API key or a prebuilt client.")

    def scrape(self, request: FirecrawlScrapeRequest) -> ResearchDocument | None:
        try:
            document = self._client.scrape(
                request.url,
                formats=["markdown"],
                only_main_content=True,
                timeout=request.timeout_ms,
            )
        except Exception as exc:
            raise ExternalProviderError(f"Firecrawl scrape failed for {request.url}: {exc}") from exc

        if document is None:
            return None

        normalized = map_firecrawl_document(
            request.url,
            document,
            accessed_at=datetime.now(UTC),
        )

        if not normalized.summary and not normalized.markdown:
            return None

        return normalized
