# Engineering Design

## Principles

Travel Sync should stay easy to reason about as the product grows.

Guiding principles:

- reduce cognitive load
- favor clarity over premature optimization
- keep interfaces narrow and explicit
- keep transport, orchestration, and provider integration separated
- return typed data before presentation-friendly prose
- degrade gracefully when external services fail

## Current Architecture

The current implementation is a Python `uv` workspace with two active application packages:

- `apps/agents`: source-backed AI orchestration
- `apps/api`: thin HTTP API layer

Current request flow:

```text
client
  -> apps/api
  -> CreateItineraryService
  -> ItineraryAgent
  -> Exa search
  -> Firecrawl scrape
  -> OpenAI structured synthesis
  -> typed itinerary response with sources, assumptions, and warnings
```

## Workspace Strategy

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
- persistence
- frontend presentation logic

### `apps/api`

Owns:

- request parsing
- route handling
- status code mapping
- serialization of typed agent responses

Does not own:

- prompt construction
- provider SDK calls
- citation logic

## Runtime and Tooling

- Python `3.11+`
- `uv` for workspace management
- shared root `.env` file for local configuration
- `ruff` for linting
- `mypy` for static type checks
- `pytest` for unit tests

Local setup:

```bash
uv sync --all-packages --python 3.11
```

API entrypoint:

```bash
uv run travelsync-api
```

## Verification

Use narrow checks while iterating, then run the full repo gate before handoff.

Available checks:

- `uv run ruff check .`
- `uv run mypy apps/agents/src apps/api/src`
- `uv run pytest`
- `zsh scripts/verify_final.sh`

## Near-Term Strategy

The implemented first slice is itinerary generation with researched source retrieval.

Next layers should follow the same pattern:

- add flight-research agents behind the same `apps/agents` service boundary
- add destination recommendation orchestration without leaking provider details into `apps/api`
- introduce persistence only after the typed service contracts are stable
