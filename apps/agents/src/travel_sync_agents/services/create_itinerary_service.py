from __future__ import annotations

from typing import Any

from travel_sync_agents.agents.itinerary_agent import ItineraryAgent, build_itinerary_agent
from travel_sync_agents.schemas.itinerary import ItineraryRequest, ItineraryResponse


class CreateItineraryService:
    def __init__(self, agent: ItineraryAgent) -> None:
        self._agent = agent

    def invoke(self, payload: dict[str, Any] | ItineraryRequest) -> ItineraryResponse:
        request = payload if isinstance(payload, ItineraryRequest) else ItineraryRequest.model_validate(payload)
        return self._agent.plan(request)


def build_create_itinerary_service() -> CreateItineraryService:
    return CreateItineraryService(agent=build_itinerary_agent())
