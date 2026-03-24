# Tests Workspace Guide

## Scope

`apps/tests` owns browser-level validation for Travel Sync.

Current responsibilities:

- Playwright smoke coverage for the React app in `apps/web`
- end-to-end journey checks for plan creation and participant flows
- stable browser artifacts under `apps/tests/output/playwright`

This workspace should not own:

- component unit tests
- backend unit tests
- frontend build configuration

## Current Setup

- Playwright starts the frontend through the root `dev:web:test` script
- browser tests currently run against frontend mock mode
- the first smoke suite covers:
  - landing page
  - create-plan wizard
  - add-participant flow from plan detail

## Local Rules

- Prefer role, label, and text-based locators over brittle CSS selectors.
- Keep tests focused on real user journeys, not implementation details.
- Default to mock mode unless a test explicitly needs the live Go API.
- Store traces and artifacts only inside `apps/tests/output/playwright`.
- Keep test names product-readable so failures explain the broken journey.

## Commands

- `npm run test --workspace @travelsync/tests`
- `npm run test:e2e`
