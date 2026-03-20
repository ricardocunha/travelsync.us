from __future__ import annotations

import json
from typing import Any, Protocol, cast

from pydantic import ValidationError

from travel_sync_agents.errors import AgentConfigurationError, ExternalProviderError
from travel_sync_agents.schemas.itinerary import ItineraryResponse


class ItineraryServiceLike(Protocol):
    def invoke(self, payload: dict[str, Any]) -> ItineraryResponse:
        ...


def _json_error(category: str, message: str, *, details: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "error": {
            "category": category,
            "message": message,
        }
    }
    if details is not None:
        payload["error"]["details"] = details
    return payload


def handle_request(
    method: str,
    path: str,
    raw_body: bytes,
    itinerary_service: ItineraryServiceLike,
) -> tuple[int, dict[str, Any]]:
    if method == "GET" and path == "/health":
        return 200, {"status": "ok"}

    if method == "POST" and path == "/api/v1/agents/itinerary":
        try:
            payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
        except json.JSONDecodeError:
            return 400, _json_error("invalid_json", "Request body must contain valid JSON.")

        try:
            result = itinerary_service.invoke(payload)
        except ValidationError as exc:
            details = cast(list[dict[str, Any]], exc.errors())
            return 400, _json_error(
                "invalid_request",
                "Request validation failed.",
                details=details,
            )
        except AgentConfigurationError as exc:
            return 500, _json_error(exc.category, exc.message)
        except ExternalProviderError as exc:
            return 502, _json_error(exc.category, exc.message)

        return 200, result.model_dump(mode="json")

    return 404, _json_error("not_found", "Route not found.")
