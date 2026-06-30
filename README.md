# Fixora

Fixora is a production-grade, highly scalable hostel complaint management system designed to streamline maintenance requests for university hostels. It serves students, hostel staff (technicians), and administrators.

## Features
- **Student Portal**: Lodge complaints, attach photos, track real-time status updates, and provide feedback/ratings on resolved issues.
- **Staff/Technician Portal**: View assigned tasks, update complaint status, and add work logs.
- **Admin Dashboard**: Oversee complaints, auto-assign tasks (with optional AI-based categorization), manage users and rooms, and view operational analytics.

## Tech Stack
- **Frontend**: React (TypeScript) + Vite
- **Backend**: NestJS (TypeScript) + Prisma ORM + PostgreSQL
- **Infrastructure**: Docker & Docker Compose

## Repository Structure
```text
├── backend/            # NestJS API application (TypeScript)
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── core/       # Business domain rules & entities
│   │   ├── usecases/   # Application use cases
│   │   └── infra/      # Framework, database & delivery layers
│   └── prisma/         # Database schemas & migrations
├── frontend/           # React frontend client (TypeScript)
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Route pages
│   │   ├── services/   # API client services
│   │   └── styles/     # Vanilla CSS modules
├── docker-compose.yml  # Docker infrastructure setup
└── README.md           # This project guide
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose

### Running the Infrastructure
To start the database and administration tools:
```bash
docker-compose up -d
```

Detailed guides for running the frontend and backend applications are available in their respective subdirectories.
