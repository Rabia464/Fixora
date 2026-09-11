# Fixora Backend API

This is the FastAPI backend for the Fixora Hostel Complaint Management System. It follows Clean Architecture principles to separate business logic from the web framework and database infrastructure.

## Tech Stack
- **Framework:** FastAPI
- **Database:** SQLite by default (zero-dependency); PostgreSQL optional for production
- **ORM:** SQLAlchemy 2.0 (Async) — aiosqlite / asyncpg drivers
- **Migrations:** Alembic (PostgreSQL); tables auto-created on SQLite
- **Auth:** JWT (HS256)
- **Validation:** Pydantic V2

## Getting Started

1. **Setup Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

3. **Environment Variables:**
   Copy `.env.example` to `.env`. The defaults run on a local SQLite file with no
   further setup; set the `POSTGRES_*` vars only if you want PostgreSQL.
   ```bash
   cp .env.example .env
   ```

4. **Seed Demo Data:** (creates the SQLite schema automatically)
   ```bash
   python -m app.db.seed
   ```

5. **Run the Server (Development):**
   ```bash
   uvicorn app.main:app --reload
   ```

## Architecture Overview

The backend strictly adheres to Clean Architecture:
- `app/api/`: Presentation layer (FastAPI routers). Thin handlers.
- `app/services/`: Application layer. Contains all business logic and orchestrates data access via repositories.
- `app/repositories/`: Infrastructure layer. Database interactions using SQLAlchemy.
- `app/domain/`: Pure domain layer containing ORM models, enums, and schemas. Zero framework dependencies.
- `app/ai/`: Isolated recommendation engine.
