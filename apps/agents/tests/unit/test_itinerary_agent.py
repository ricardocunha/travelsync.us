from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any, Callable

from travel_sync_agents.agents.itinerary_agent import ItineraryAgent
from travel_sync_agents.schemas.itinerary import (
    BudgetStyle,
    ItineraryData,
    ItineraryDay,
    ItineraryRequest,
    ItineraryResponse,
    PracticalNotes,
    TravelerProfile,
    TripPace,
)
from travel_sync_agents.schemas.source import SourceCitation, SourceType


class FakeTool:
    def __init__(self, handler: Callable[[dict[str, Any]], Any]) -> None:
        self._handler = handler
        self.calls: list[dict[str, Any]] = []

    def invoke(self, input: dict[str, Any]) -> Any:
        self.calls.append(input)
        return self._handler(input)


class FakePlanner:
    def __init__(self, response: ItineraryResponse) -> None:
        self.response = response
        self.inputs: list[dict[str, Any]] = []

    def invoke(self, input: dict[str, Any]) -> ItineraryResponse:
        self.inputs.append(input)
        return self.response.model_copy(deep=True)


def test_itinerary_agent_merges_sources_and_normalizes_request_fields() -> None:
    exa_tool = FakeTool(
        lambda _: [
            {
                "title": "Visit Lisbon",
                "url": "https://www.visitlisboa.com/en",
                "domain": "visitlisboa.com",
                "source_type": "search",
                "accessed_at": "2026-03-20T12:00:00Z",
                "snippet": "Official guide",
            }
        ]
    )
    firecrawl_tool = FakeTool(
        lambda _: {
            "title": "Visit Lisbon Official Guide",
            "url": "https://www.visitlisboa.com/en",
            "domain": "visitlisboa.com",
            "accessed_at": "2026-03-20T12:05:00Z",
            "summary": "Official destination planning page.",
            "markdown": "Full official destination content.",
            "warning": None,
        }
    )
    planner = FakePlanner(_sample_planner_response(destination="Wrong destination", day_count=1))
    agent = ItineraryAgent(
        exa_tool=exa_tool,
        firecrawl_tool=firecrawl_tool,
        planner=planner,
        max_search_results=6,
        max_scraped_sources=4,
        firecrawl_timeout_ms=15_000,
    )

    request = ItineraryRequest(
        destination="Lisbon",
        start_date=date(2026, 5, 2),
        end_date=date(2026, 5, 4),
        travelers=[TravelerProfile(name="Ana", traveler_type="adult")],
        pace=TripPace.MODERATE,
        budget_style=BudgetStyle.MID_RANGE,
        interests=["food", "walkable neighborhoods"],
        priorities=["easy logistics"],
    )

    response = agent.plan(request)

    assert response.data.destination == "Lisbon"
    assert response.data.start_date == date(2026, 5, 2)
    assert response.data.end_date == date(2026, 5, 4)
    assert response.data.traveler_summary == "1 travelers | 1 adult"
    assert response.data.priorities == ["easy logistics", "food", "walkable neighborhoods"]
    assert response.sources[0].source_type == SourceType.SCRAPE
    assert any("Expected 3 itinerary day plans" in warning for warning in response.warnings)
    assert "Lisbon" in planner.inputs[0]["request_json"]


def test_itinerary_agent_warns_when_research_returns_no_sources() -> None:
    exa_tool = FakeTool(lambda _: [])
    firecrawl_tool = FakeTool(lambda _: None)
    planner = FakePlanner(_sample_planner_response(destination="Lisbon", day_count=1))
    agent = ItineraryAgent(
        exa_tool=exa_tool,
        firecrawl_tool=firecrawl_tool,
        planner=planner,
    )

    request = ItineraryRequest(
        destination="Lisbon",
        start_date=date(2026, 5, 2),
        end_date=date(2026, 5, 2),
        travelers=[TravelerProfile(name="Ana")],
    )

    response = agent.plan(request)

    assert response.sources == []
    assert any("No external sources were retrieved" in warning for warning in response.warnings)
    assert any("manual confirmation" in assumption.lower() for assumption in response.assumptions)
    assert firecrawl_tool.calls == []


def _sample_planner_response(destination: str, day_count: int) -> ItineraryResponse:
    days = [
        ItineraryDay(
            day_number=index + 1,
            date=date(2026, 5, 2 + index),
            day_of_week="Saturday",
        )
        for index in range(day_count)
    ]

    return ItineraryResponse(
        summary="A balanced itinerary.",
        data=ItineraryData(
            destination=destination,
            start_date=date(2026, 5, 2),
            end_date=date(2026, 5, 4),
            traveler_summary="placeholder",
            pace=TripPace.FAST,
            budget_style=BudgetStyle.LUXURY,
            priorities=["placeholder"],
            days=days,
            practical_notes=PracticalNotes(),
        ),
        sources=[
            SourceCitation(
                title="Placeholder",
                url="https://example.com",
                domain="example.com",
                source_type=SourceType.SEARCH,
                accessed_at=datetime(2026, 3, 20, tzinfo=UTC),
            )
        ],
        assumptions=[],
        warnings=[],
    )
