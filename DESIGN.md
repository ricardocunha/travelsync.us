
## Development Standards & Philosophy

Our primary goal is to create a codebase that is intuitive and easy to understand, minimizing cognitive load.

### Guiding Principles

- Reduce cognitive load: Every decision should make the codebase easier to grasp and modify.
- Clarity over premature optimization: Write clear code first. Optimize only when proven necessary.
- Type discipline: Define explicit types and interfaces where useful; prefer `unknown` plus narrowing over `any`.

### Code Design & Architecture

- Deep modules: Encapsulate significant functionality behind minimal interfaces.
- Local error handling: Handle errors close to their source and avoid bubbling raw errors unnecessarily.

### Code Organization

- Feature-based co-location: Group files by feature or domain rather than file type.

### Commenting

- Purposeful comments: Explain why something is done or clarify complex logic. Avoid comments that restate obvious code behavior.

### Dependencies

- Verify latest stable versions before adding new dependencies.

## Coding Style & Naming Conventions

- Keep formatting consistent (Prettier defaults where applicable).
- Components/classes use `PascalCase`; functions/variables use `camelCase`; environment flags use `SCREAMING_SNAKE_CASE`.
- Prefer workspace/module aliases over deep relative imports when available.
- In `apps/web`, use TailwindCSS utility classes as the primary styling approach; keep custom global CSS minimal.

## Shell Environment Requirements

- Run commands with `zsh -lc` to preserve environment behavior and output consistency.
- Use a shared root `.env` file (see `.env.example`) for local environment variables; root scripts forward these vars to app/package commands.
- Scheduler optimization requires `uv` plus a local Python 3.11+ runtime to execute the CP-SAT bridge in `packages/scheduler/python`.

## Build, Test, and Verification

Before declaring work complete, run formatting/linting and build/type checks for the affected scope. During iteration, use narrower package/module checks to keep feedback loops fast.
Before reporting to the user that work is finished, `yarn verify:final` must be executed successfully.
`yarn verify:final` is the authoritative completion gate and already includes root `typecheck`; do not run extra workspace `typecheck` commands for handoff unless debugging failures.
Unit tests in `verify:final` must run in parallel where viable (use workspace-parallel execution).
`verify:final` runs only unit tests (`yarn test:unit`); integration tests are intentionally excluded from the completion gate.
Scheduler test files are typechecked via the workspace `yarn typecheck` flow (tests are included in `packages/scheduler/tsconfig.json`).
When a root script becomes multi-step or requires output filtering/flow control, move it to `scripts/*.sh` and keep `package.json` entries thin wrappers.
Use `yarn dev` to run `apps/api` and `apps/web` in parallel for local interactive development.
Use `yarn db:up` to start local Postgres, `yarn db:migrate` to apply migrations, and `yarn db:seed` to seed local admin/test data.
Use `yarn local:up` to install deps, start Postgres, run migrations+seed, and boot dev servers in the background; use `yarn local:stop` to stop servers and containers (DB volume persists).

## Testing Guidelines

- Keep tests close to code (`__tests__` folders).
- Use explicit suffixes for scheduler tests: `*.unit.test.ts` for unit tests and `*.integration.test.ts` for integration tests.
- Root `yarn test:integration` always clears `artifacts/` and runs scheduler integration tests with `WRITE_REPORT=1`, so reports are regenerated each run.
- Run the smallest relevant test scope while iterating, then run broader verification before handoff.
- Clearly mark infrastructure-dependent tests so they can be gated appropriately in CI.

## Commit & Pull Request Guidelines

- Use Conventional Commit prefixes (`feat:`, `fix:`, `refactor:`, `chore:`).
- Keep commits small, coherent, and reviewable.
- Avoid mixing unrelated concerns in one commit.
- PRs should include a concise summary, test evidence, and notes on migrations or environment impacts when relevant.