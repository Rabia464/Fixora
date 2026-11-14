# Fixora frontend + API

The deployed Fixora app: Next.js 16 (App Router) pages **and** the `/api/v1`
route handlers, backed by Cloud Firestore. See the [root README](../README.md)
for the product overview, demo accounts and deployment.

## Setup

```bash
nvm use                  # Node 22, from the repo's .nvmrc
npm ci
cp .env.example .env.local   # set JWT_SECRET; add Firebase credentials (see the file)
npm run seed -- --reset      # demo users + sample complaints (needs Firebase credentials)
npm run dev                  # http://localhost:3000
```

The tests don't need Firebase credentials, so you can run `npm run check` right
after `npm ci`.

## Scripts

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run check` | Lint + typecheck + tests (what CI runs, minus the build) |
| `npm test` / `npm run test:watch` | Vitest |
| `npm run test:coverage` | Vitest with a coverage report and thresholds |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm run seed` | Seed Firestore (`--reset` wipes sample data first) |

## Layout

- `src/app/` holds pages, and `src/app/api/v1/` holds the API route handlers (thin wrappers).
- `src/lib/server/` holds the business rules: `workflow.ts` (state machine), `complaints.ts` (service), `auth.ts` (tokens), `http.ts` (error mapping), `db.ts` (Firestore).
- `src/lib/ai/classifier.ts` is the rule-based triage classifier.
- `src/lib/api/` is the typed client the UI uses to call the API.
- `src/proxy.ts` redirects dashboard routes by role (Next 16's replacement for `middleware.ts`).

Tests live next to the code in `__tests__/` folders and are named `*.test.ts`.
