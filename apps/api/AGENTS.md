# API Workspace Guide

## Scope

`apps/api` is a thin HTTP boundary over the agent layer in `/Users/ricardocunha/dev/personal/travelsync/apps/agents`.

Current implemented routes:

- `GET /health`
- `POST /api/v1/agents/itinerary`

## Local Rules

- Keep request parsing, status codes, and transport concerns here.
- Keep prompts, provider SDK calls, and orchestration logic in `travel_sync_agents`.
- Reuse agent-layer schemas and services instead of duplicating domain models.
- Prefer small, explicit handlers over framework-heavy abstractions unless the API surface grows enough to justify them.

## Current Layout

```text
apps/api/
  src/travel_sync_api/
    app.py
    server.py
  tests/unit/
```

## Local Commands

- `uv run travelsync-api`
- `uv run pytest apps/api/tests/unit`
- `uv run mypy apps/api/src`

## Error Mapping

This package is responsible for mapping:

- invalid JSON -> `400`
- validation failures -> `400`
- agent configuration errors -> `500`
- external provider failures -> `502`

Do not leak raw provider responses or credentials through API errors.
