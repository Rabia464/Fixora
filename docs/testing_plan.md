# Testing Plan

What is tested today and what is still missing. Commands are in the
[root README](../README.md#running-tests) and [CONTRIBUTING.md](../CONTRIBUTING.md).

## Tooling

- **Frontend + API:** Vitest (`frontend/vitest.config.ts`), V8 coverage with enforced thresholds.
- **Reference backend:** pytest, ruff and mypy.
- **CI:** `.github/workflows/ci.yml` runs both on every PR, plus a production `next build`.

## Covered

| Layer | Suite | What it checks |
| :--- | :--- | :--- |
| API routes | `src/app/api/v1/__tests__/routes.test.ts` | Every handler: 401 without a token, status codes (200/201/400/403/404/409/500), `{ detail }` error shape, full lifecycle over HTTP, visibility, notifications |
| Workflow | `src/lib/server/__tests__/workflow.test.ts` | Transition table and role table |
| Service | `src/lib/server/__tests__/complaints.test.ts` | Lifecycle, state, role and hostel/ownership guards, validation, audit and notification side effects |
| Auth | `src/lib/server/__tests__/auth.test.ts` | Token signing, expiry, tampering, role re-validation |
| AI triage | `src/lib/ai/__tests__/classifier.test.ts` | Category, department and priority rules and their precedence |
| Triage evaluation | `src/lib/ai/__tests__/evaluation.test.ts` | Agreement, confusion and safety metrics; validity of the 100-complaint sample |
| Seed data | `src/lib/server/__tests__/seed-data.test.ts` | Every seeded complaint follows a legal lifecycle path by the right roles, matches the triage rules and its hostel; the student is notified of each change |
| UI helpers | `src/lib/ui/__tests__/ticket.test.ts` | Status labels, sorting, timeline detail formatting |
| API client | `src/lib/api/__tests__/client.test.ts` | URL building, bearer header, error mapping, 401 logout and redirect |
| Reference backend | `backend/tests/` | Auth, complaints, RBAC and transitions, lifecycle integration |

## Evaluation and demo

The triage accuracy measurement, the usability check, the functional test
count and the end-to-end demo script are described in
[evaluation.md](evaluation.md).

## Not yet covered

1. **Firestore queries (`src/lib/server/db.ts`).** These need the Firestore emulator (`firebase emulators:exec`) in CI.
2. **UI components and hooks.** These would need jsdom and React Testing Library.
3. **End-to-end journeys.** These would use Playwright against `next dev` with the emulator: a student submits a complaint, the supervisor overrides and forwards it, maintenance resolves it, and the student confirms.
