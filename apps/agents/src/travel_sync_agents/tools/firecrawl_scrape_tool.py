from __future__ import annotations

from typing import Any

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

from travel_sync_agents.clients.firecrawl_client import FirecrawlClient, FirecrawlScrapeRequest


class FirecrawlScrapeToolInput(BaseModel):
    url: str = Field(min_length=5)
    timeout_ms: int = Field(default=15_000, ge=1_000)


def build_firecrawl_scrape_tool(client: FirecrawlClient) -> StructuredTool:
    def run_scrape(url: str, timeout_ms: int = 15_000) -> dict[str, Any] | None:
        document = client.scrape(FirecrawlScrapeRequest(url=url, timeout_ms=timeout_ms))
        if document is None:
            return None
        return document.model_dump(mode="json")

    return StructuredTool.from_function(
        func=run_scrape,
        name="firecrawl_scrape",
        description=(
            "Retrieve and clean webpage content for travel planning, especially official pages that "
            "contain practical details such as opening hours, logistics, and booking notes."
        ),
        args_schema=FirecrawlScrapeToolInput,
    )
