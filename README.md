# Fixora — Hostel Complaint Management System

**Fixora** is a full-stack, AI-assisted hostel maintenance and complaint management platform designed for campus residential communities. It streamlines ticket creation, automated category/priority classification, supervisor review and overrides, maintenance queue workflows, in-app notifications, and chronological audit trails.

---

**Live:** https://fixora-portal.vercel.app

---

## Architecture Overview

Fixora ships as a single Next.js app on Vercel. The UI and the API live in the
same deployment; data is in Cloud Firestore.

- **Frontend:** Next.js 16 (App Router) + React 19, TypeScript, Zustand state management, Glassmorphic CSS design system, Lucide icons.
- **API:** Next.js route handlers under `frontend/src/app/api/v1/**`, backed by `firebase-admin` / Firestore. Business rules live in `frontend/src/lib/server/`:
  - `workflow.ts` — the complaint state machine and role table (every transition is checked; illegal ones return `409`).
  - `complaints.ts` — lifecycle service: role + hostel/ownership scoping, audit trail, notifications.
  - `auth.ts` — HS256-signed access tokens (`jose`), role re-validated on every request.
  - `db.ts` — Firestore access. No silent fallback: if Firestore is down, requests fail with `500`.
- **AI Triage Module:** Rule-based heuristics classifier (`frontend/src/lib/ai/classifier.ts`) assigning category (`Plumbing`, `Electrical`, `Furniture`, `Sanitation`), priority (`Low`, `Medium`, `High`, `Critical`), and destination department.
- **Reference backend (`backend/`):** the original FastAPI + SQLAlchemy implementation of the same API. It is **not deployed**; the Firestore service mirrors its rules and is tested against the same transition table. Keep it if you want to self-host on Postgres/SQLite; otherwise it can be removed.

---

## Role-Based Lifecycle & Workflow

```
[Student]
   │
   ├─► 1. Creates Complaint (AI automatically predicts category & priority)
   │
[Hostel Supervisor]
   │
   ├─► 2. Reviews AI recommendation in Review Board (can manually override)
   ├─► 3. Forwards approved complaint to Maintenance Office
   │
[Maintenance Office]
   │
   ├─► 4. Picks up complaint (status: InProgress)
   ├─► 5. Completes work and marks Resolved with resolution notes
   │
[Student]
   │
   ├─► 6. Inspects repair -> Confirms (status: Closed) OR Reopens (status: Reopened)
```

---

## Quickstart Guide

### 1. Run the deployed stack locally (Next.js + Firestore)

```bash
cd frontend
npm install
cp .env.example .env.local           # fill in JWT_SECRET
# drop a Firebase service-account JSON at frontend/serviceAccountKey.json
#   (Firebase console → Project settings → Service accounts → Generate new private key)
npm run seed -- --reset              # demo users + sample complaints
npm run dev                          # http://localhost:3000
```

`npm run seed` upserts the six demo users (two hostels) and writes 20 sample
complaints in every status, each with a matching audit trail and
notifications. With `--reset` it first wipes the existing complaints, audit log
and notifications. The data lives in `frontend/scripts/seed-data.mjs`.

#### Deploying to Vercel

The project is linked to the `fixora-portal` Vercel project. Required env vars:

| Variable | Purpose |
| :--- | :--- |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | The service-account JSON, as one line |
| `JWT_SECRET` | ≥ 32 random chars (`openssl rand -base64 48`) — token signing |

```bash
cd frontend
npx vercel --prod
```

---

### 2. Run the reference FastAPI backend instead (optional)

The Python backend implements the same API on SQLite (default) or PostgreSQL.
Point the UI at it with `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`.

#### Via Docker Compose

```bash
docker compose up --build
```

#### A. Start Backend (SQLite — default)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env

# Seed demo data (tables are auto-created on SQLite)
python -m app.db.seed

# Start dev server
uvicorn app.main:app --reload --port 8000
```

#### B. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Optional: use PostgreSQL instead
```bash
# 1. Start a Postgres instance (or point at a managed one, e.g. Neon/Supabase)
docker compose up -d db
# 2. Set the POSTGRES_* vars in backend/.env, then:
cd backend
alembic upgrade head
python -m app.db.seed
```

---

## Demo Accounts

Authentication is email-only (no passwords) — this is a demo system. Log in with the quick-role buttons on `/login` or with the following emails. Tokens are signed and expire after 8 hours.

| Role | Email | Assigned Hostel | Dashboard Route |
| :--- | :--- | :--- | :--- |
| **Student** | `student@giki.edu.pk` | Hostel A | `/dashboard/student` |
| **Student** | `student2@giki.edu.pk` | Hostel A | `/dashboard/student` |
| **Student** | `student.b@giki.edu.pk` | Hostel B | `/dashboard/student` |
| **Hostel Supervisor** | `supervisor@giki.edu.pk` | Hostel A | `/dashboard/supervisor` |
| **Hostel Supervisor** | `supervisor.b@giki.edu.pk` | Hostel B | `/dashboard/supervisor` |
| **Maintenance Office** | `maintenance@giki.edu.pk` | All Hostels | `/dashboard/maintenance` |

The quick-role buttons on `/login` use the first account of each role. The
Hostel B accounts are there to demonstrate that a supervisor only sees their
own hostel. A step-by-step demo script and the evaluation procedures are in
[docs/evaluation.md](docs/evaluation.md).

---

## Running Tests

Everything CI checks, in one command:

```bash
cd frontend
npm run check            # eslint + tsc + vitest
```

Individual pieces:

| Command | What it runs |
| :--- | :--- |
| `npm test` | All Vitest suites (no Firestore or network needed) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Tests plus a coverage report in `frontend/coverage/` (fails under the thresholds in `vitest.config.ts`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

What the suites cover:

- `src/app/api/v1/__tests__/routes.test.ts` calls every API route handler with real signed tokens against an in-memory Firestore stand-in: status codes, auth on every protected route, the `{ detail }` error shape, the full complaint lifecycle and visibility rules.
- `src/lib/server/__tests__/` covers the state machine, the complaints service guards and token signing.
- `src/lib/ai/__tests__/` covers the triage classifier's category and priority rules.
- `src/lib/api/__tests__/` covers the browser API client (bearer header, error mapping, 401 logout).

Reference backend suite:

```bash
cd backend
ruff check app tests && ruff format --check app tests && mypy app && pytest
```

CI (`.github/workflows/ci.yml`) runs all of the above plus a production build on
every pull request, and posts a coverage table on the run summary. Dependabot
opens weekly grouped update PRs for npm, pip and GitHub Actions.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow.

---

## Project Structure

```
Fixora/
├── backend/
│   ├── alembic/                # Database migrations
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies.py # Role-based authentication dependencies
│   │   │   └── routers/        # Auth, Complaints, Notifications, Audit Logs
│   │   ├── core/               # App config, security JWT helpers, custom exceptions
│   │   ├── db/
│   │   │   ├── models/         # SQLAlchemy 2.0 mapped models
│   │   │   ├── repositories/   # Async repository layer (CRUD + queries)
│   │   │   ├── seed.py         # Database seeding script
│   │   │   └── session.py      # Async SQLAlchemy engine & session factory
│   │   ├── domain/             # Enums & Pydantic request/response schemas
│   │   ├── services/           # Domain business logic (Complaint, Auth, AI, Notifications)
│   │   └── main.py             # FastAPI app factory & standardized exception handlers
│   └── tests/                  # Pytest test suite
├── frontend/
│   ├── scripts/seed.mjs        # Firestore seeding (demo users, sample complaints)
│   ├── src/
│   │   ├── app/                # Next.js App Router pages (login, dashboards, about)
│   │   ├── app/api/v1/         # API route handlers (thin wrappers over lib/server)
│   │   ├── components/         # Glassmorphic UI components, Modals, Drawers
│   │   ├── lib/ai/             # Rule-based triage classifier
│   │   ├── lib/api/            # Typed API client used by the UI
│   │   ├── lib/firebase/       # firebase-admin initialisation
│   │   ├── lib/server/         # workflow, complaints service, auth, db (+ tests)
│   │   ├── proxy.ts            # Route protection & RBAC redirection (Next 16 proxy, formerly middleware.ts)
│   │   └── stores/             # Zustand auth store
│   └── vercel.json
└── docker-compose.yml          # Reference backend orchestration (Postgres + FastAPI + UI)
```
