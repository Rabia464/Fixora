# Fixora — Hostel Complaint Management System

**Fixora** is a full-stack, AI-assisted hostel maintenance and complaint management platform designed for campus residential communities. It streamlines ticket creation, automated category/priority classification, supervisor review and overrides, maintenance queue workflows, in-app notifications, and chronological audit trails.

---

## Architecture Overview

- **Frontend:** Next.js 16 (App Router) + React 19, TypeScript, Zustand state management, Glassmorphic CSS design system, Lucide icons.
- **Backend:** FastAPI (Python 3.11+ / 3.12), SQLAlchemy 2.0 (asyncio + asyncpg), Pydantic v2 validation, JWT-based RBAC authentication.
- **Persistence & Migration:** Dialect-agnostic SQLAlchemy models — runs on a zero-dependency **SQLite** file by default (auto-created tables), or **PostgreSQL 16** with composite indexes and Alembic async migrations for production.
- **AI Triage Module:** Rule-based heuristics classifier automatically assigning category (`Plumbing`, `Electrical`, `Furniture`, `Sanitation`), priority (`Low`, `Medium`, `High`, `Critical`), and destination department (`Maintenance`, etc.).

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

### 1. Run via Docker Compose (Recommended)

Start the entire stack (Postgres + FastAPI Backend + Next.js Frontend) with a single command:

```bash
docker compose up --build
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI Docs:** [http://localhost:8000/api/v1/openapi.json](http://localhost:8000/api/v1/openapi.json)

---

### 2. Run Locally for Development

By default the backend runs on a **zero-dependency local SQLite file** — no
database server, no migrations, nothing to install or host. To use PostgreSQL
instead (e.g. for production), set the `POSTGRES_*` variables in `backend/.env`
(see `backend/.env.example`) and run `alembic upgrade head`.

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

Passwordless authentication is enabled in development. You can log in directly using the quick-role buttons on `/login` or with the following emails:

| Role | Email | Assigned Hostel | Dashboard Route |
| :--- | :--- | :--- | :--- |
| **Student** | `student@giki.edu.pk` | Hostel A | `/dashboard/student` |
| **Hostel Supervisor** | `supervisor@giki.edu.pk` | Hostel A | `/dashboard/supervisor` |
| **Maintenance Office** | `maintenance@giki.edu.pk` | All Hostels | `/dashboard/maintenance` |

---

## Running Tests

Run the backend unit and integration test suite:

```bash
cd backend
./venv/bin/pytest tests/ -v
```

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
│   ├── src/
│   │   ├── app/                # Next.js App Router pages (login, dashboards, about)
│   │   ├── components/         # Glassmorphic UI components, Modals, Drawers
│   │   ├── lib/api/            # Typed API client layer connecting to FastAPI
│   │   ├── middleware.ts       # Route protection & RBAC redirection
│   │   └── stores/             # Zustand auth store
└── docker-compose.yml          # Full-stack Docker orchestration
```
