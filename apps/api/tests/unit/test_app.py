from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any

from travel_sync_agents.schemas.itinerary import (
    BudgetStyle,
    ItineraryData,
    ItineraryDay,
    ItineraryResponse,
    PracticalNotes,
    TripPace,
)
from travel_sync_agents.schemas.source import SourceCitation, SourceType
from travel_sync_api.app import handle_request


class FakeItineraryService:
    def __init__(self, result: ItineraryResponse) -> None:
        self.result = result
        self.payloads: list[dict[str, Any]] = []

    def invoke(self, payload: dict[str, Any]) -> ItineraryResponse:
        self.payloads.append(payload)
        return self.result


def test_handle_request_returns_healthcheck() -> None:
    status, payload = handle_request("GET", "/health", b"", FakeItineraryService(_sample_response()))

    assert status == 200
    assert payload == {"status": "ok"}


def test_handle_request_returns_validation_error_for_bad_json() -> None:
    status, payload = handle_request(
        "POST",
        "/api/v1/agents/itinerary",
        b"{invalid json",
        FakeItineraryService(_sample_response()),
    )

    assert status == 400
    assert payload["error"]["category"] == "invalid_json"


def test_handle_request_returns_itinerary_payload() -> None:
    service = FakeItineraryService(_sample_response())
    request_body = json.dumps(
        {
            "destination": "Lisbon",
            "start_date": "2026-05-02",
            "end_date": "2026-05-04",
            "travelers": [{"name": "Ana"}],
        }
    ).encode("utf-8")

    status, payload = handle_request("POST", "/api/v1/agents/itinerary", request_body, service)

    assert status == 200
    assert payload["data"]["destination"] == "Lisbon"
    assert service.payloads[0]["destination"] == "Lisbon"


def _sample_response() -> ItineraryResponse:
    return ItineraryResponse(
        summary="A practical city-break itinerary.",
        data=ItineraryData(
            destination="Lisbon",
            start_date=date(2026, 5, 2),
            end_date=date(2026, 5, 4),
            traveler_summary="1 traveler",
            pace=TripPace.MODERATE,
            budget_style=BudgetStyle.MID_RANGE,
            priorities=["food", "walkable neighborhoods"],
            days=[
                ItineraryDay(
                    day_number=1,
                    date=date(2026, 5, 2),
                    day_of_week="Saturday",
                )
            ],
            practical_notes=PracticalNotes(),
        ),
        sources=[
            SourceCitation(
                title="Visit Lisbon",
                url="https://www.visitlisboa.com",
                domain="visitlisboa.com",
                source_type=SourceType.SCRAPE,
                accessed_at=datetime(2026, 3, 20, 12, 0, 0),
            )
        ],
        assumptions=[],
        warnings=[],
    )
