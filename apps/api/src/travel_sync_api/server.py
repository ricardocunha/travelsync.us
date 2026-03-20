from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from travel_sync_agents.config import get_api_settings
from travel_sync_agents.services import CreateItineraryService, build_create_itinerary_service
from travel_sync_api.app import handle_request

_SERVICE: CreateItineraryService | None = None


def get_service() -> CreateItineraryService:
    global _SERVICE
    if _SERVICE is None:
        _SERVICE = build_create_itinerary_service()
    return _SERVICE


class TravelSyncApiHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        self._dispatch()

    def do_POST(self) -> None:
        self._dispatch()

    def log_message(self, format: str, *args: object) -> None:
        return

    def _dispatch(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length) if content_length else b""
        status, payload = handle_request(self.command, self.path, raw_body, get_service())
        encoded = json.dumps(payload).encode("utf-8")

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def main() -> None:
    settings = get_api_settings()
    server = ThreadingHTTPServer((settings.host, settings.port), TravelSyncApiHandler)
    print(f"Travel Sync API listening on http://{settings.host}:{settings.port}")
    server.serve_forever()
