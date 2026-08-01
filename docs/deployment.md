# Deployment Strategy

## 1. Local Development
- **Backend:** `uvicorn app.main:app --reload` (FastAPI) running on port 8000.
- **Database:** PostgreSQL running locally or via Docker.
- **Frontend:** `npm run dev` (Next.js) running on port 3000.

## 2. Production Architecture (Future)
- **Frontend Hosting:** Vercel (ideal for Next.js App Router, provides edge caching and global CDN).
- **Backend Hosting:** Render or AWS ECS (Dockerized FastAPI container).
- **Database:** Supabase (managed PostgreSQL with pgvector support for future AI embeddings).

## 3. CI/CD Pipeline
- **GitHub Actions:** 
  - Linting (Flake8, ESLint).
  - Type checking (MyPy, TypeScript).
  - Automated deployment triggers to Vercel/Render upon merging to `main`.
