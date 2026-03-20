from __future__ import annotations

from typing import Any

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

from travel_sync_agents.clients.exa_client import ExaSearchClient, ExaSearchRequest


class ExaSearchToolInput(BaseModel):
    query: str = Field(min_length=3)
    num_results: int = Field(default=6, ge=1, le=10)
    include_domains: list[str] = Field(default_factory=list)
    exclude_domains: list[str] = Field(default_factory=list)


def build_exa_search_tool(client: ExaSearchClient) -> StructuredTool:
    def run_search(
        query: str,
        num_results: int = 6,
        include_domains: list[str] | None = None,
        exclude_domains: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        request = ExaSearchRequest(
            query=query,
            num_results=num_results,
            include_domains=include_domains or [],
            exclude_domains=exclude_domains or [],
        )
        return [source.model_dump(mode="json") for source in client.search(request)]

    return StructuredTool.from_function(
        func=run_search,
        name="exa_search",
        description=(
            "Search the web for recent and relevant travel-planning sources, including official "
            "destination guides, operating hours, and logistics pages."
        ),
        args_schema=ExaSearchToolInput,
    )
