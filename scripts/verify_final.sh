#!/bin/zsh
set -euo pipefail

uv run ruff check apps/agents
uv run mypy apps/agents/src
uv run pytest apps/agents/tests

cd apps/api
go test ./...
