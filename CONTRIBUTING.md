# Contributing to bazario-web

## Setup

- Node 20 (see `.nvmrc`).
- `npm ci`, then `npm run dev` (needs the API on `VITE_API_URL`, see `.env.example`).
- The API client is generated: `npm run api:generate` after `npm run api:sync`.

## Before you open a pull request

    npm run lint
    npm run typecheck
    npm test             # unit tests (Vitest)
    npm run test:e2e     # Playwright; needs ../bazario-api with dependencies installed and `npm run e2e:db`

CI also runs `npm run api:check`, builds the production bundle and posts a bundle size report. Lighthouse runs report-only.

## Conventions

- Branches: `fix/BZR-123-short-name`, `feat/...`, `perf/...`, `chore/...`.
- Conventional Commits; reference the ticket as `BZR-123`.
- The web app consumes the API contract in `openapi/openapi.json`. If the API changes, sync a pinned version (`npm run api:sync -- --ref <tag or sha>`) and fix what the type checker reports.
- Pull requests use the template: root cause, change, evidence, risk and rollback, migration notes, test plan.
- Architecture decisions go in `docs/adr/` (copy `0000-template.md`).
