from __future__ import annotations

import json
from datetime import date
from typing import Any, Protocol, cast

from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from travel_sync_agents.clients.exa_client import ExaSearchClient
from travel_sync_agents.clients.firecrawl_client import FirecrawlClient
from travel_sync_agents.config.env import AgentSettings, get_agent_settings
from travel_sync_agents.mappers.source_mapper import deduplicate_strings, merge_sources
from travel_sync_agents.prompts.itinerary_prompt import build_itinerary_prompt
from travel_sync_agents.schemas.itinerary import ItineraryRequest, ItineraryResponse
from travel_sync_agents.schemas.source import ResearchDocument, ResearchDossier, SourceCitation
from travel_sync_agents.tools.exa_search_tool import build_exa_search_tool
from travel_sync_agents.tools.firecrawl_scrape_tool import build_firecrawl_scrape_tool


class ToolLike(Protocol):
    def invoke(self, input: dict[str, Any]) -> Any:
        ...


class PlannerLike(Protocol):
    def invoke(self, input: dict[str, Any]) -> ItineraryResponse:
        ...


class ItineraryAgent:
    def __init__(
        self,
        *,
        exa_tool: ToolLike,
        firecrawl_tool: ToolLike,
        planner: PlannerLike,
        max_search_results: int = 6,
        max_scraped_sources: int = 4,
        firecrawl_timeout_ms: int = 15_000,
    ) -> None:
        self._exa_tool = exa_tool
        self._firecrawl_tool = firecrawl_tool
        self._planner = planner
        self._max_search_results = max_search_results
        self._max_scraped_sources = max_scraped_sources
        self._firecrawl_timeout_ms = firecrawl_timeout_ms

    def plan(self, request: ItineraryRequest) -> ItineraryResponse:
        dossier = self._build_research_dossier(request)
        response = self._planner.invoke(
            {
                "today": date.today().isoformat(),
                "request_json": json.dumps(request.model_dump(mode="json"), indent=2),
                "research_json": json.dumps(dossier.to_prompt_payload(), indent=2),
            }
        )

        response.data.destination = request.destination
        response.data.start_date = request.start_date
        response.data.end_date = request.end_date
        response.data.pace = request.pace
        response.data.budget_style = request.budget_style
        response.data.traveler_summary = request.traveler_summary
        response.data.priorities = self._effective_priorities(request)
        response.sources = merge_sources(dossier.search_sources, dossier.documents)
        response.assumptions = deduplicate_strings([*dossier.assumptions, *response.assumptions])
        response.warnings = deduplicate_strings(
            [
                *dossier.warnings,
                *response.warnings,
                *self._day_count_warning(request, response),
            ]
        )
        return response

    def _build_research_dossier(self, request: ItineraryRequest) -> ResearchDossier:
        search_query = self._build_search_query(request)
        warnings: list[str] = []
        assumptions: list[str] = []

        raw_search_sources = cast(
            list[dict[str, Any]],
            self._exa_tool.invoke(
                {
                    "query": search_query,
                    "num_results": self._max_search_results,
                }
            ),
        )
        search_sources = [SourceCitation.model_validate(source) for source in raw_search_sources]

        documents: list[ResearchDocument] = []
        for source in search_sources[: self._max_scraped_sources]:
            try:
                raw_document = cast(
                    dict[str, Any] | None,
                    self._firecrawl_tool.invoke(
                        {
                            "url": source.url,
                            "timeout_ms": self._firecrawl_timeout_ms,
                        }
                    ),
                )
            except Exception as exc:
                warnings.append(f"Could not retrieve {source.url}: {exc}")
                continue

            if raw_document is None:
                warnings.append(f"Could not extract readable content from {source.url}.")
                continue

            document = ResearchDocument.model_validate(raw_document)
            documents.append(document)
            if document.warning:
                warnings.append(document.warning)

        if not search_sources:
            warnings.append(
                "No external sources were retrieved. This itinerary should be treated as a draft until details are verified."
            )
            assumptions.append(
                "Operating hours, transit conditions, and reservation requirements need manual confirmation."
            )
        elif not documents:
            warnings.append(
                "Search results were found, but page extraction was limited. Verify practical details before booking."
            )

        return ResearchDossier(
            query=search_query,
            search_sources=search_sources,
            documents=documents,
            assumptions=assumptions,
            warnings=deduplicate_strings(warnings),
        )

    def _build_search_query(self, request: ItineraryRequest) -> str:
        topical_focus = deduplicate_strings(
            [
                "official tourism",
                "opening hours",
                "transportation",
                *request.interests,
                *request.must_include,
            ]
        )
        return " ".join(
            [
                request.destination,
                f"{request.start_date:%B %Y}",
                "travel planning itinerary logistics",
                " ".join(topical_focus),
            ]
        ).strip()

    def _effective_priorities(self, request: ItineraryRequest) -> list[str]:
        return deduplicate_strings([*request.priorities, *request.interests, *request.must_include])

    def _day_count_warning(
        self,
        request: ItineraryRequest,
        response: ItineraryResponse,
    ) -> list[str]:
        actual_days = len(response.data.days)
        if actual_days == request.day_count:
            return []
        return [
            f"Expected {request.day_count} itinerary day plans from the request window, but received {actual_days}."
        ]


def build_itinerary_agent(settings: AgentSettings | None = None) -> ItineraryAgent:
    resolved_settings = settings or get_agent_settings()
    exa_client = ExaSearchClient(
        api_key=resolved_settings.exa_api_key,
        default_num_results=resolved_settings.exa_num_results,
    )
    firecrawl_client = FirecrawlClient(api_key=resolved_settings.firecrawl_api_key)
    llm = ChatOpenAI(
        api_key=SecretStr(resolved_settings.openai_api_key),
        model=resolved_settings.openai_model,
        temperature=0.2,
        max_retries=2,
    )
    planner = cast(PlannerLike, build_itinerary_prompt() | llm.with_structured_output(ItineraryResponse))

    return ItineraryAgent(
        exa_tool=build_exa_search_tool(exa_client),
        firecrawl_tool=build_firecrawl_scrape_tool(firecrawl_client),
        planner=planner,
        max_search_results=resolved_settings.exa_num_results,
        max_scraped_sources=resolved_settings.max_scraped_sources,
        firecrawl_timeout_ms=resolved_settings.firecrawl_timeout_ms,
    )
