#!/bin/zsh
set -euo pipefail

uv run ruff check .
uv run mypy apps/agents/src apps/api/src
uv run pytest
