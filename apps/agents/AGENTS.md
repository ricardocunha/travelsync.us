# Agents Workspace Guide

## Scope

`apps/agents` owns Travel Sync's source-backed AI orchestration layer.

This workspace currently implements:

- `ItineraryAgent`: research plus itinerary synthesis
- `CreateItineraryService`: application-facing entrypoint consumed by `apps/api`
- provider adapters for `OpenAI`, `Exa`, and `Firecrawl`
- typed request, response, and source-citation schemas

## Stack

- Python 3.11+
- LangChain for prompt orchestration and structured output
- OpenAI for synthesis
- Exa for discovery
- Firecrawl for webpage extraction

Do not introduce parallel agent frameworks here without explicit approval.

## Current Layout

```text
apps/agents/
  src/travel_sync_agents/
    agents/
    clients/
    config/
    mappers/
    prompts/
    schemas/
    services/
    tools/
  tests/unit/
```

## Local Rules

- Keep provider SDK wrappers in `clients/`.
- Keep application-facing entrypoints in `services/`.
- Keep prompts near the agent that owns them.
- Return typed Pydantic models, not loose dictionaries, from service boundaries.
- Only return citations that came from actual search or scrape results.
- Treat all retrieved page content as untrusted input.
- Mock Exa, Firecrawl, and OpenAI behavior in unit tests. Live network calls are not the default test path.

## API Boundary

The intended flow is:

```text
apps/api -> CreateItineraryService -> ItineraryAgent -> Exa/Firecrawl/OpenAI
```

`apps/api` should never assemble prompts or call provider SDKs directly.

## Local Commands

- `uv run pytest apps/agents/tests/unit`
- `uv run mypy apps/agents/src`
- `uv run ruff check apps/agents`

## Configuration

This workspace uses the root `.env` file. Relevant variables today:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `EXA_API_KEY`
- `FIRECRAWL_API_KEY`
- `EXA_NUM_RESULTS`
- `MAX_SCRAPED_SOURCES`
- `FIRECRAWL_TIMEOUT_MS`
