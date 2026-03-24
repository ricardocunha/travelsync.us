# Web Workspace Guide

## Scope

`apps/web` is the React frontend for Travel Sync.

Current responsibilities:

- landing and product framing
- plan list and plan detail screens
- create-plan wizard
- typed HTTP access to the Go API
- mock-mode support for local frontend and Playwright flows

This workspace should not own:

- flight ranking logic
- Amadeus orchestration
- prompt construction or agent workflows
- backend persistence rules

## Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS v4
- Vitest

## Current Routes

- `/`
- `/plans`
- `/plans/new`
- `/plans/:planId`

Result-ranking, recommendation, and summary screens are still future slices and should remain clearly marked when referenced in the UI.

## Local Rules

- Keep code feature-oriented under `src/features`.
- Keep transport logic in `src/lib/api.ts` or feature-specific wrappers, not inside page components.
- Prefer deliberate, high-character interfaces over generic admin-dashboard styling.
- Use Tailwind utilities as the primary styling layer and keep custom CSS concentrated in `src/styles.css`.
- Support both API-backed mode and mock mode through Vite env flags.
- Keep forms semantic and accessible so Playwright can use role and label locators.

## Commands

- `npm run dev --workspace @travelsync/web`
- `npm run build --workspace @travelsync/web`
- `npm run test --workspace @travelsync/web`

## Testing

- Keep fast unit coverage in this workspace with Vitest.
- Put browser journey tests in `apps/tests`, not here.
- Avoid coupling unit tests to a live backend; use mock mode or mocked API boundaries.
