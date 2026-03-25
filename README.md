# Travel Sync

Travel Sync helps distributed teams choose the best meeting destination by comparing curated destinations across multiple departure cities, flight burden, and arrival synchronization.

This repository is currently split into:

- [apps/api](/Users/ricardocunha/dev/personal/travelsync/apps/api): Go backend API
- [apps/agents](/Users/ricardocunha/dev/personal/travelsync/apps/agents): Python AI agent layer
- [apps/web](/Users/ricardocunha/dev/personal/travelsync/apps/web): React frontend
- [apps/tests](/Users/ricardocunha/dev/personal/travelsync/apps/tests): Playwright browser tests
- [data/sql/init](/Users/ricardocunha/dev/personal/travelsync/data/sql/init): canonical MySQL init files
- [data/sql/legacy](/Users/ricardocunha/dev/personal/travelsync/data/sql/legacy): archived overlapping SQL, not used by Docker init

## What Works Today

Implemented today:

- local MySQL bootstrapping with ordered schema files
- Go API health, reference data, plan CRUD, and participant CRUD
- Go API destination search kickoff, status, ranked destination results, and destination detail
- React frontend for:
  - landing page
  - plans list
  - create-plan wizard
  - plan detail and participant management
  - running destination search from the plan detail page
  - ranked destination cards, route detail, and side-by-side destination comparison on the plan detail page
- Playwright smoke tests for the first frontend slice

Still scaffolded or pending:

- live Amadeus-backed flight search integration
- recommendation endpoint integration
- destination selection workflow
- final summary workflow
- a running HTTP wrapper around `apps/agents`

## Prerequisites

Install these locally:

- Docker Desktop or Docker Engine with Compose
- Go 1.22+
- Python 3.11+
- `uv`
- Node 18+ and npm

## Environment Setup

Copy the example env file:

```bash
cp .env.example .env
```

Important local values:

- `DB_HOST=127.0.0.1`
- `DB_PORT=3336`
- `API_HOST=127.0.0.1`
- `API_PORT=9081`
- `VITE_API_BASE_URL=http://127.0.0.1:9081/api/v1`
- `WEB_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173`

`VITE_ENABLE_MOCK=false` means the frontend will call the Go API.

If you want frontend-only development without the API, set:

```bash
VITE_ENABLE_MOCK=true
```

## Install Dependencies

Install Python and Node dependencies once:

```bash
uv sync --all-packages --python 3.11
npm install
```

## Start the Database

The local database uses the canonical SQL files under [data/sql/init](/Users/ricardocunha/dev/personal/travelsync/data/sql/init).

Start MySQL:

```bash
docker compose -f data/docker-compose.yaml up -d
```

If you need to reset the database completely:

```bash
docker compose -f data/docker-compose.yaml down -v
docker compose -f data/docker-compose.yaml up -d
```

The MySQL container listens on:

- host: `127.0.0.1`
- port: `3336`
- database: `trip`
- user: `root`
- password: `root`

## Run the Go API

In one terminal:

```bash
set -a
source .env
set +a
cd apps/api
go run ./cmd/server
```

You should see the API listening on `127.0.0.1:9081`.

Quick health check:

```bash
curl http://127.0.0.1:9081/health
```

## Run API And Web Together

After the database is up, the simplest local command is:

```bash
npm run dev
```

That command:

- loads `.env` if it exists
- starts the Go API
- starts the React web app on `http://127.0.0.1:5173`
- stops both when you press `Ctrl-C`

If it exits immediately, the most common cause is that port `9081` or `5173` is already being used by an older local process.

## Run the React Frontend

In a second terminal:

```bash
set -a
source .env
set +a
npm run dev:web
```

Then open the Vite URL shown in the terminal, usually:

- `http://127.0.0.1:5173`

If the frontend shows a reference-data error:

1. confirm the API is running
2. confirm `VITE_API_BASE_URL` points to `http://127.0.0.1:9081/api/v1`
3. confirm `WEB_ALLOWED_ORIGINS` includes the exact Vite origin you opened

## Common Local Flows

### Frontend only

Use mock mode when you only want to work on the UI:

```bash
VITE_ENABLE_MOCK=true npm run dev:web
```

### API-backed frontend

Run both:

```bash
docker compose -f data/docker-compose.yaml up -d
```

```bash
npm run dev
```

Then:

1. create or open a plan
2. add at least one participant with a departure airport
3. open the plan detail page
4. click `Run destination search`

The current local search slice stores and displays ranked destination results, but it still uses the Go-side deterministic search estimator instead of the live Amadeus API.

## Tests

Frontend unit tests:

```bash
npm run test:web
```

Browser smoke tests:

```bash
npm run test:e2e
```

Go API tests:

```bash
cd apps/api && go test ./...
```

Python agent tests:

```bash
uv run pytest apps/agents/tests
```

Full verification:

```bash
zsh scripts/verify_final.sh
```

## Notes About the Agent Layer

`apps/agents` is implemented as a Python package, but it is not yet exposed as a standalone HTTP service in local development. The current Go API does not depend on a running agent server for the implemented plan-management or search-ranking flows.
