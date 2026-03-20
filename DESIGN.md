# Engineering Design

## Principles

Travel Sync should stay easy to reason about as the product grows.

Guiding principles:

- reduce cognitive load
- favor clarity over premature optimization
- keep interfaces narrow and explicit
- keep transport, orchestration, and provider integration separated
- let product rules live in business logic docs, not in framework glue
- degrade gracefully when external services fail

## Current Architecture

The repository is now intentionally split by responsibility:

- `apps/api`: Go backend API and orchestration layer
- `apps/agents`: Python AI agent layer
- `data/sql`: schema and seed files
- `apps/web`: future React frontend
- `apps/tests`: future Playwright coverage

Current high-level flow:

```text
client
  -> apps/web (planned)
  -> apps/api (Go)
  -> repository/service layers + Amadeus integration
  -> Python agent boundary when AI support is needed
  -> apps/agents
  -> OpenAI / Exa / Firecrawl
```

## Workspace Strategy

### `apps/api`

Owns:

- HTTP routing
- configuration loading
- request validation
- plan/search orchestration
- database and external API boundaries
- integration with the Python agent layer

Does not own:

- prompt construction
- LangChain orchestration
- provider-specific citation logic

### `apps/agents`

Owns:

- prompts
- provider clients
- LangChain tool wrappers
- request and response schemas
- source normalization
- agent orchestration

Does not own:

- HTTP concerns
- database persistence
- frontend presentation logic

## Runtime and Tooling

- Python `3.11+` for `apps/agents`
- Go `1.22+` for `apps/api`
- `uv` for Python workspace management
- `gofmt` and `go test` for API verification
- shared root `.env` file for local configuration

Local setup today:

```bash
uv sync --all-packages --python 3.11
docker compose -f data/docker-compose.yaml up -d
```

API entrypoint:

```bash
cd apps/api && go run ./cmd/server
```

## Verification

Use narrow checks while iterating, then run the full repo gate before handoff.

Available checks:

- `uv run ruff check apps/agents`
- `uv run mypy apps/agents/src`
- `uv run pytest apps/agents/tests`
- `cd apps/api && go test ./...`
- `zsh scripts/verify_final.sh`

## Near-Term Strategy

The implemented foundation slice establishes:

- ordered SQL setup files through `012_plan_flights.sql`
- a compilable Go API scaffold with the target package layout
- a documented Python agent boundary for later integration

Next steps should fill the scaffold in this order:

- wire the Go repositories and services to MySQL
- implement reference data and plan CRUD endpoints
- add Amadeus client logic and the search orchestrator
- connect the Go API to the Python agent layer for recommendation and itinerary workflows
