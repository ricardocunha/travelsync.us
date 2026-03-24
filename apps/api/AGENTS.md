# API Workspace Guide

## Tech Stack

Go

## Scope

`apps/api` is the backend HTTP application for Travel Sync.

This workspace should own:

- HTTP routing and request handling
- configuration loading for the API process
- validation at the transport boundary
- orchestration of backend workflows
- integration with the Python agent layer in `/Users/ricardocunha/dev/personal/travelsync/apps/agents`
- stable JSON contracts returned to the frontend

This workspace should not own:

- prompt construction
- LangChain orchestration
- direct OpenAI, Exa, or Firecrawl SDK usage
- agent-specific citation or source-normalization logic

## Architecture Direction

The expected boundary is:

```text
apps/web -> apps/api (Go) -> apps/agents (Python) -> OpenAI / Exa / Firecrawl
```

Keep `apps/api` focused on transport, application flow, and backend composition.

## Local Rules

- Prefer standard Go project layout under `cmd/` and `internal/`.
- Keep handlers thin; move business orchestration into services.
- Define explicit request and response structs for API payloads.
- Normalize external or agent-layer failures into stable API error categories.
- Do not duplicate prompt or agent logic in Go.
- If the API needs AI functionality, call a narrow service boundary instead of rebuilding the workflow here.

## Expected Layout

Current layout:

```text
apps/api/
  cmd/server/
  internal/
    ai/
    amadeus/
    config/
    database/
    handler/
    models/
    repository/
    router/
    service/
```

Implemented backend slice today:

- health route
- reference data routes for regions, countries, airports, airlines, and destinations
- plan CRUD routes
- plan participant CRUD routes

Still pending in later slices:

- Amadeus-backed flight search orchestration
- destination scoring and ranking
- AI recommendation and itinerary integration via `apps/agents`
- final summary and selection workflows

Keep transport and orchestration concerns separate as the remaining slices fill in.

## Local Commands

- `go run ./cmd/server`
- `go test ./...`
- `gofmt -w ./cmd ./internal`

## Error Handling

This workspace is responsible for mapping backend failures into clear API responses.

Typical categories:

- invalid request
- not found
- conflict
- upstream agent failure
- configuration error
- internal server error

Do not leak provider secrets, raw prompts, or internal tokens in errors.

## Testing

- Keep Go unit tests close to the code they validate.
- Use `apps/tests` for browser and end-to-end validation, not for basic handler unit tests.
- Mock the agent integration boundary in API tests instead of requiring live AI calls.

## Notes

- `apps/agents` remains Python by design.
- `apps/api` should be Go even if temporary scaffolding from earlier iterations exists in the repo.
