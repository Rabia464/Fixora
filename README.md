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

`npm run seed` upserts the three demo users and, with `--reset`, wipes and
re-creates the sample complaints, audit log and notifications.

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
| **Hostel Supervisor** | `supervisor@giki.edu.pk` | Hostel A | `/dashboard/supervisor` |
| **Maintenance Office** | `maintenance@giki.edu.pk` | All Hostels | `/dashboard/maintenance` |

---

## Running Tests

API / workflow tests (state machine, role & scope guards, token signing):

```bash
cd frontend
npm test
```

Reference backend suite:

```bash
cd backend
./venv/bin/pytest tests/ -v
```

CI runs lint, type-check, tests and a production build for the frontend, and
ruff / mypy / pytest for the backend.

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
│   │   ├── middleware.ts       # Route protection & RBAC redirection
│   │   └── stores/             # Zustand auth store
│   └── vercel.json
└── docker-compose.yml          # Reference backend orchestration (Postgres + FastAPI + UI)
```
