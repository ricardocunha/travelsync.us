# Repository Guidelines

## Current Repo State

This repository is currently docs-first and early-stage.

Do not assume application code, scripts, or package manifests exist unless they are present in the workspace. If you add or remove top-level workspaces or major folders, update this file in the same change.

Current visible workspace structure:

- `AGENTS.md`: repo-wide guidance
- `BUSINESS_LOGIC_SPEC.md`: source of truth for product and business behavior
- `DESIGN.md`: engineering philosophy and design notes
- `apps/agents`: reserved for the AI agents workspace
- `apps/api`: reserved for backend API integration
- `apps/web`: reserved for frontend work
- `apps/tests`: reserved for shared tests and fixtures

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
- keep leaf `AGENTS.md` files focused on local deltas, not generic boilerplate

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
- leaf files: keep only workspace-specific rules, constraints, and local context

## Current Workspace Layout

- `apps/web`: Frontend UI application.
- `apps/api`: Backend API application.
- `apps/data/sql`: Local for sql files
- `apps/tests`: Reusable fixtures for tests and scenarios.
- `apps`: docker-compose files, .env templates
- `tf`: Terraform infrastructure definition
- `scripts`: Shared shell automation for complex root workflows.

## Engineering Principles

Use these principles across the repo:

- reduce cognitive load
- favor clarity over premature optimization
- use explicit types and interfaces where they improve understanding
- prefer `unknown` plus narrowing over `any`
- build deep modules with small, stable interfaces
- handle errors close to their source
- organize code by feature or domain where practical
- write comments only when they explain intent, tradeoffs, or non-obvious behavior
- verify the latest stable version before adding a new dependency

## Repo-Wide Conventions

- run shell commands with `zsh -lc`
- prefer fast read-only search tools such as `rg`
- do not invent scripts or verification commands that do not exist in the repo
- keep secrets, credentials, and tokens out of version control
- do not edit generated dependency folders such as `node_modules/` or `vendor/`

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
- say clearly if a check could not be run because the script or workspace does not exist yet
- do not claim verification for commands that are only planned

## Documentation Style

Write for a developer who is new to the repo.

Prefer writing that is:

- concise
- specific
- operational
- easy to scan

Avoid stale templates copied from unrelated projects. Every `AGENTS.md` should describe this repository, not a generic framework example.

