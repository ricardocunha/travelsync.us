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
- `apps/web`: React frontend for planning flows
- `apps/tests`: Playwright browser coverage
- `data/sql/init`: schema and seed files used for local MySQL initialization
- `data/sql/legacy`: archived legacy SQL kept outside the init path

Current high-level flow:

```text
client
  -> apps/web (React)
  -> apps/api (Go)
  -> repository/service layers + Amadeus integration
  -> Python agent boundary when AI support is needed
  -> apps/agents
  -> OpenAI / Exa / Firecrawl
```

Current implemented backend slice:

- ordered SQL schema files through plan flights
- a running Go HTTP server entrypoint
- MySQL-backed reference data queries
- plan CRUD
- participant CRUD

Current implemented frontend slice:

- a Vite React app for landing, plans list, plan creation, and plan detail flows
- a mock-capable frontend API layer aligned with the current Go endpoints
- Playwright smoke tests for the first browser journeys

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
- npm workspaces for the frontend and browser tests
- `gofmt` and `go test` for API verification
- shared root `.env` file for local configuration

Local setup today:

```bash
uv sync --all-packages --python 3.11
npm install
docker compose -f data/docker-compose.yaml up -d
```

API entrypoint:

```bash
cd apps/api && go run ./cmd/server
```

Frontend entrypoint:

```bash
npm run dev:web
```

## Verification

Use narrow checks while iterating, then run the full repo gate before handoff.

Available checks:

- `uv run ruff check apps/agents`
- `uv run mypy apps/agents/src`
- `uv run pytest apps/agents/tests`
- `npm run build:web`
- `npm run test:web`
- `npm run test:e2e`
- `cd apps/api && go test ./...`
- `zsh scripts/verify_final.sh`

## Near-Term Strategy

The implemented backend foundation now includes:

- ordered SQL setup files through `data/sql/init/012_plan_flights.sql`
- a compilable Go API with the target package layout
- repository and service wiring to MySQL for reference data, plans, and participants
- a documented Python agent boundary for later integration

Next steps should extend the backend in this order:

- add Amadeus OAuth, token caching, and flight search client logic
- build the concurrent outbound and return search orchestrator
- implement destination scoring and ranking
- connect the Go API to the Python agent layer for recommendation and itinerary workflows
- add final summary and destination-selection flows
