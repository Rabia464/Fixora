# Contributing to Fixora

## Prerequisites

- Node 22 (`nvm use` reads `.nvmrc`)
- Python 3.12, only if you work on the reference FastAPI backend in `backend/`

## Workflow

1. Branch off `main`.
2. Make the change, with tests (see below).
3. Run the checks locally before pushing:
   ```bash
   cd frontend && npm run check
   # backend changes only:
   cd backend && ruff check app tests && ruff format --check app tests && mypy app && pytest
   ```
4. Open a PR against `main`. CI must be green before merging.

## Where tests go

| Change | Add or extend |
| :--- | :--- |
| New or changed API route | `frontend/src/app/api/v1/__tests__/routes.test.ts`, covering the happy path, the 401 without a token, and each error status the route can return |
| Workflow / permission rule | `frontend/src/lib/server/__tests__/complaints.test.ts` or `workflow.test.ts` |
| Classifier keywords | `frontend/src/lib/ai/__tests__/classifier.test.ts` |
| API client behaviour | `frontend/src/lib/api/__tests__/client.test.ts` |

Tests run against an in-memory stand-in for Firestore (`vi.mock('@/lib/server/db')`),
so they need no credentials or network. If you add a function to `db.ts`, add
it to the mocks in the test files that use it.

## Coverage

`npm run test:coverage` enforces the thresholds in `frontend/vitest.config.ts`.
Treat them as a ratchet: raise them when coverage goes up, and never lower them
to get a PR green.

## Commits

Use short, imperative messages with a conventional prefix where it fits
(`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`).
