# Repository Guidelines

## Current Repo State

This repository is now a Python `uv` workspace with the first Travel Sync AI slice implemented.

Current visible workspace structure:

- `AGENTS.md`: repo-wide guidance
- `BUSINESS_LOGIC_SPEC.md`: source of truth for product and workflow behavior
- `DESIGN.md`: engineering design and implementation strategy
- `pyproject.toml`: root workspace and tool configuration
- `uv.lock`: locked Python dependency graph
- `.env.example`: local environment template
- `apps/agents`: source-backed AI agent package
- `apps/api`: thin HTTP API package that calls `apps/agents`
- `apps/web`: reserved for frontend work
- `apps/tests`: reserved for shared fixtures and future cross-workspace tests
- `scripts/verify_final.sh`: authoritative verification script

If a workspace contains its own `AGENTS.md`, the closest file to the edited path wins.

## Product Context

Travel Sync helps distributed teams choose the best meeting destination by comparing flight options across multiple origins and optimizing for:

- total cost
- travel burden
- arrival synchronization
- overall practicality for the group

Keep business rules, scoring logic, travel policies, and workflow behavior aligned with `/Users/ricardocunha/dev/personal/travelsync/BUSINESS_LOGIC_SPEC.md`.

## Documentation Hygiene

Whenever you change code or structure in a way that makes these docs inaccurate, update the relevant documentation in the same change.

Required updates:

- update `AGENTS.md` when repo structure, conventions, commands, or responsibilities change
- update `BUSINESS_LOGIC_SPEC.md` when business behavior, workflows, policies, or domain rules change
- keep leaf `AGENTS.md` files focused on local deltas and local context

## Change Approval (Required)

Do not start implementation work without explicit user approval.

This includes:

- code changes
- documentation changes
- dependency changes
- schema changes
- infrastructure changes
- commits

Before editing, propose the intended changes and wait for confirmation.

If the working tree contains large or surprising changes, do not revert or clean them up unless the user explicitly asks you to do so.

Do not run non-read-only commands against shared environments without explicit approval.

## AGENTS.md Hierarchy

- scope: an `AGENTS.md` applies to the directory tree rooted at its folder
- precedence: the closest applicable `AGENTS.md` wins
- root file: keep repo-wide guidance and shared mental models here
- leaf files: keep only workspace-specific rules and local constraints

## Current Workspace Layout

- `apps/agents/src/travel_sync_agents`: agent orchestration, provider clients, prompts, schemas, and services
- `apps/agents/tests`: unit tests for the agent layer
- `apps/api/src/travel_sync_api`: request handling and server entrypoint
- `apps/api/tests`: API boundary tests
- `apps/web`: reserved for frontend implementation
- `apps/tests`: reserved for shared scenarios and fixtures
- `scripts`: shared shell automation

## Engineering Principles

Use these principles across the repo:

- reduce cognitive load
- favor clarity over premature optimization
- use explicit types and interfaces where they improve understanding
- build deep modules with small, stable interfaces
- handle errors close to their source
- organize code by feature or domain where practical
- write comments only when they explain intent, tradeoffs, or non-obvious behavior
- verify the latest stable version before adding a new dependency

## Repo-Wide Conventions

- run shell commands with `zsh -lc`
- use Python `3.11+` for local development in this repo
- use `uv` for dependency and workspace management
- install the workspace with `uv sync --all-packages --python 3.11`
- use the shared root `.env` file for local configuration
- prefer fast read-only search tools such as `rg`
- do not invent scripts or verification commands that do not exist in the repo
- keep secrets, credentials, and tokens out of version control
- keep provider SDK usage inside `apps/agents`; `apps/api` should stay transport-focused

Ask first before:

- adding dependencies
- changing CI or deployment configuration
- changing database schema or persistence approach
- introducing a new external service
- running mutating commands outside the local workspace

## Verification and Handoff

Validate the smallest relevant scope during iteration, then summarize what you actually verified.

Before reporting work as complete:

- run the relevant checks that exist for the affected area
- run `zsh scripts/verify_final.sh` for final handoff
- say clearly if a check could not be run
- do not claim verification for commands that are only planned

## Documentation Style

Write for a developer who is new to the repo.

Prefer writing that is:

- concise
- specific
- operational
- easy to scan
