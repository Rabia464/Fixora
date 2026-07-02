# Fixora – Project Context

*Document: `docs/project_context.md`*

---

## 1. Project Overview
Fixora is an **AI‑powered Hostel Complaint & Maintenance Management Platform** designed for the Ghulam Ishaq Khan Institute (GIKI) hostels. It modernizes the way students report issues, Hostel Supervisors review and forward complaints, and the Maintenance Office manages maintenance operations until resolution, ensuring every complaint is tracked from creation to resolution.

## 2. Vision
To become the single source of truth for all hostel‑related service requests, providing a transparent, accountable, and efficient maintenance ecosystem for GIKI hostels.

## 3. Mission
- **Digitize** the complaint lifecycle.
- **Eliminate** lost or delayed tickets.
- **Empower** students, staff, and administrators with a clear, auditable workflow.
- **Lay** a scalable foundation for future AI‑driven enhancements and additional campus services.

## 4. Problem Statement
Currently, students report maintenance issues to their hostel supervisor using a manual process.

Once the complaint reaches the hostel office, students have little visibility into its progress. They often do not know whether the complaint has been forwarded to the Maintenance Office, assigned to a technician, or resolved.

This lack of transparency results in repeated follow‑ups, delayed responses, and difficulty tracking maintenance requests.

## 5. Why Fixora?
- **End‑to‑end ticketing**: From submission to closure, every complaint is a traceable ticket.
- **AI assistance**: Immediate classification, priority, and department recommendation reduce triage time.
- **Role‑based security**: Secure login via GIKI email with JWT‑based authentication and fine‑grained permissions.
- **Auditability & analytics**: Full history and dashboards support continuous improvement.
- **Scalable architecture**: Built on FastAPI, PostgreSQL, and a clean, modular design ready for future expansion.

## 6. Project Goals
| Goal | Description |
|------|-------------|
| **Reliability** | No complaint is lost, ignored, or delayed. |
| **Transparency** | All stakeholders can view ticket status and action history. |
| **Accountability** | Actions are logged and auditable. |
| **Security** | Authentication & RBAC protect data and operations. |
| **Scalability** | Design supports growth to other campuses and additional modules. |
| **Maintainability** | Clean architecture and modular code enable rapid iteration. |

## 7. Target Users
- **Students** residing in GIKI hostels.
- **Hostel Supervisors** responsible for managing complaints within their assigned hostels.
- **Maintenance Office** responsible for coordinating maintenance work and updating ticket status.

## 8. User Roles
| Role | Responsibilities |
|------|-------------------|
| **Student** | Submit complaints, track tickets, receive notifications, confirm or reopen tickets. |
| **Hostel Supervisor** | Review complaints for assigned hostel(s), review or override AI recommendations, forward complaints to the Maintenance Office, monitor complaint progress. |
| **Maintenance Office** | Receive complaints from supervisors, coordinate maintenance work, update ticket status, mark tickets as resolved, view maintenance analytics. |

*No additional roles will be introduced in Version 1.*

## 9. Complete System Workflow
1. **Complaint Submission** – Student creates a ticket via the UI.
2. **Ticket Creation** – System generates a unique Ticket ID.
3. **AI Prediction** – AI provides Category, Priority, and Department recommendations.
4. **Routing to Supervisor** – Ticket is automatically routed to the appropriate Hostel Supervisor.
5. **Supervisor Review & Override** – Supervisor reviews AI suggestions, may override, and forwards to the Maintenance Office.
6. **Forward to Maintenance Office** – Maintenance Office receives the complaint and coordinates work.
7. **Maintenance Updates** – Maintenance staff updates ticket status as work progresses.
8. **Student Notification** – Student receives notifications of status changes.
9. **Student Confirmation & Auto‑Close** – Student confirms resolution; if no response within 48 hours, ticket auto‑closes.

> **Note:** All steps generate immutable audit entries for traceability.

## 10. Version 1 Scope
| Core Feature | Description |
|--------------|-------------|
| **Secure Login** | GIKI university email authentication (JWT). |
| **Authentication & RBAC** | Role‑based access control for Student, Hostel Supervisor, Maintenance Office. |
| **Complaint Submission** | Form with required fields, auto‑generated Ticket ID. |
| **Ticket Management** | CRUD operations limited to role permissions. |
| **AI Complaint Classification** | Rule‑based categorization, priority detection. |
| **Admin Override** | Manual edit of AI‑suggested Category, Priority, Department. |
| **Staff Assignment** | Admin assigns tickets; staff accept tasks. |
| **Ticket Tracking** | Real‑time status updates and history view. |
| **In‑app Notifications** | Push‑style alerts within the web UI. |
| **Ticket History & Audit Logs** | Immutable logs of all actions. |
| **Analytics Dashboard** | Basic metrics (open tickets, average resolution time, staff workload). |

*Image upload and any external notification channels (email/SMS) are explicitly excluded from Version 1.*

## 11. Out of Scope
- **Laundry, Parcel Management, Visitor Management, Room Allocation, Mess Management** – May be introduced as separate modules later.
- **Email & SMS notifications** – Future communication channels.
- **Image uploads** – Not part of the initial release.

These items are documented as potential future enhancements.

## 12. Core Features (Detailed)
1. **Secure Login using GIKI University Email**
2. **JWT‑Based Authentication**
3. **Role‑Based Access Control (RBAC)**
4. **Complaint Submission UI**
5. **Ticket Lifecycle Management**
6. **Rule‑Based AI Classification & Priority Detection**
7. **Admin Override Capability**
8. **Staff Task Assignment & Acceptance**
9. **Progress & Resolution Updates**
10. **In‑App Notification System**
11. **Comprehensive Ticket History**
12. **Audit Logging**
13. **Analytics Dashboard (KPIs & Trends)**

## 13. Technology Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React + Tailwind CSS | Component‑driven UI, rapid styling, modern ecosystem. |
| **Backend** | FastAPI | High‑performance async API, easy OpenAPI generation. |
| **Database** | PostgreSQL | Relational, ACID‑compliant, rich querying for analytics. |
| **ORM** | SQLAlchemy | Declarative models, migration‑friendly. |
| **Authentication** | JWT | Stateless, scalable token handling. |
| **AI** | Rule‑based classification (initial) | Simple, deterministic, easily replaceable by ML models later. |

## 14. AI Philosophy
- **Assistant, not decision‑maker** – AI provides *recommendations* only (Category, Priority, Department).
- **Human oversight** – Admins retain final authority and may override any AI suggestion.
- **Replaceability** – Architecture isolates AI logic to allow seamless swap to a machine‑learning model without major refactoring.

## 15. Architecture Principles
- **Simplicity** – Minimal moving parts; clear separation of concerns.
- **Transparency** – All AI recommendations and overrides are logged and viewable.
- **Accountability** – Immutable audit trails for every state transition.
- **Security** – Strict authentication, encrypted data at rest, least‑privilege RBAC.
- **Scalability** – Stateless services, database indexing, asynchronous task handling.
- **Clean Architecture** – Domain‑centric layers (entities, use‑cases, interfaces).
- **Maintainability** – Modular codebase, comprehensive documentation, testability.
- **Modular Design** – Future modules (e.g., laundry) can be added as plug‑in services.

## 16. Success Criteria
| Metric | Target (by launch) |
|--------|--------------------|
| **Ticket Completion Rate** | ≥ 95 % tickets resolved within SLA. |
| **Student Satisfaction** | ≥ 4.5/5 average rating on post‑resolution survey. |
| **Admin Override Frequency** | ≤ 10 % of AI suggestions overridden (indicates AI adequacy). |
| **System Uptime** | 99.5 % for API & UI. |
| **Security Audits** | No critical vulnerabilities identified. |
| **Analytics Adoption** | ≥ 80 % of staff regularly uses dashboard. |

## 17. Future Roadmap
| Phase | Scope |
|-------|-------|
| **Phase 2** | Introduce ML‑based classifiers, email/SMS notifications, image attachments. |
| **Phase 3** | Expand to other GIKI campuses, add Laundry & Parcel Management modules. |
| **Phase 4** | Visitor & Room Allocation systems, integration with campus ERP. |
| **Long‑Term** | Full campus‑wide smart‑facility platform, AI‑driven predictive maintenance. |

## 18. Repository Overview
```
Fixora/
│
├─ docs/                # Documentation (this file, architecture docs, onboarding, etc.)
├─ frontend/            # React + Tailwind source code
├─ backend/             # FastAPI application, SQLAlchemy models
├─ ai/                  # Rule‑based engine (future ML hooks)
├─ database/            # Migration scripts, seed data
└─ configs/             # Environment configs, JWT secrets (encrypted)
```
*Only documentation resides in `docs/` for the initial setup.*

## 19. Development Philosophy
- **Iterative Delivery** – Start with a minimal viable core, then enhance via well‑defined sprints.
- **Test‑Driven** – Unit and integration tests for every new feature.
- **Code Reviews** – Mandatory peer review for all changes.
- **Continuous Integration** – Automated linting, testing, and security scanning on each PR.

## 20. Versioning Strategy
- **Semantic Versioning (MAJOR.MINOR.PATCH)**
  - **MAJOR** – Breaking architectural changes (e.g., switching DB).
  - **MINOR** – Backward‑compatible feature additions (e.g., new AI model).
  - **PATCH** – Bug fixes, documentation updates.

---

*Prepared for the inaugural developers of the Fixora project. All stakeholders should refer to this document as the authoritative source of project context.*
