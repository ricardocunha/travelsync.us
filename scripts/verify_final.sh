#!/bin/zsh
set -euo pipefail

uv run ruff check apps/agents
uv run mypy apps/agents/src
uv run pytest apps/agents/tests

npm run build:web
npm run test:web

cd apps/api
go test ./...
