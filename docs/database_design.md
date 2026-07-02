# 1. Database Overview

The Fixora application relies on a single relational database that serves as the authoritative source of truth for all operational data. PostgreSQL was selected as the database engine because it provides strong ACID compliance, robust transactional guarantees, and rich relational integrity features such as foreign‑key constraints and expressive indexing—all essential for preserving the consistency of complaint lifecycles, user accounts, and audit trails.  

In Version 1 the database stores:

- **User accounts** and role assignments for Student, Hostel Supervisor, and Maintenance Office.  
- **Complaints** (tickets) together with their status, AI‑generated recommendations, and any overrides performed by the Hostel Supervisor.  
- **Notifications** that drive in‑app alerts for each stakeholder.  
- **Audit logs** that record every state change, AI prediction, and supervisor override for traceability.  
- **System metadata** required for configuration, versioning, and future feature expansion.

PostgreSQL’s proven scalability and mature ecosystem enable the system to handle growth in data volume and concurrent users while remaining maintainable through familiar administration tools and an extensive community support base. Although the schema is optimized for the current Version 1 workflow—Student → AI Recommendation → Hostel Supervisor Review & Override → Forward to Maintenance Office → Maintenance Updates → Student Confirmation → Auto‑Close—it is deliberately designed with extensibility in mind, allowing future modules and additional data entities to be incorporated without disrupting existing functionality.

# 2. Database Design Principles

- **Normalization** – Organize data into logical tables to eliminate redundancy and ensure each piece of information is stored in exactly one place.
- **Referential Integrity** – Use foreign‑key constraints so relationships between tables remain valid, preventing orphaned records.
- **Data Consistency** – Enforce atomic transactions and constraints that keep the database in a correct state across all operations.
- **Scalability** – Design schema and indexing strategies that support growth in data volume and concurrent access without degrading performance.
- **Auditability** – Include immutable audit‑log entries and traceable fields so every change to complaints, overrides, and notifications can be reviewed.
- **Security** – Protect sensitive data with appropriate column encryption, role‑based access controls, and least‑privilege permissions for database users.
- **Maintainability** – Keep the schema clear, well‑documented, and modular to simplify future enhancements and schema migrations.
- **Performance** – Optimize query patterns, indexes, and data types to deliver low‑latency responses for the core complaint workflow.

The schema is deliberately structured to accommodate future expansion—additional entities or attributes can be introduced without breaking existing data or requiring major refactoring.

# 3. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER {
        PK id
        email
    }
    ROLE {
        PK id
        name
    }
    COMPLAINT {
        PK id
        status
        ai_category
        ai_priority
        ai_department
        supervisor_override
    }
    NOTIFICATION {
        PK id
        type
    }
    AUDIT_LOG {
        PK id
        action
    }
    ROLE ||--o{ USER : "assigned_to"
    USER ||--o{ COMPLAINT : "creates"
    USER ||--o{ COMPLAINT : "reviews"
    USER ||--o{ COMPLAINT : "updates"
    USER ||--o{ NOTIFICATION : "receives"
    COMPLAINT ||--o{ NOTIFICATION : "triggers"
    USER ||--o{ AUDIT_LOG : "performs"
    COMPLAINT ||--o{ AUDIT_LOG : "logs"
```

# 4. Table Definitions

## roles

### Purpose
Stores the distinct role names used for RBAC (Student, Hostel Supervisor, Maintenance Office).

### Columns
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Primary key identifier for the role. |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Human‑readable role name (e.g., "Student"). |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Record creation timestamp. |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Record last‑update timestamp. |

### Relationships
- One‑to‑Many: `roles.id` is referenced by `users.role_id`.

### Notes
Roles are static for Version 1; new roles can be added without schema changes.

## users

### Purpose
Represents all authenticated actors in the system and links them to a role.

### Columns
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Primary key identifier for the user. |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Official GIKI email address used for login. |
| full_name | VARCHAR(255) | NOT NULL | User's display name. |
| role_id | UUID | NOT NULL, FK → roles(id) | Role assigned to the user. |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Record creation timestamp. |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Record last‑update timestamp. |

### Relationships
- Many‑to‑One: `users.role_id` → `roles.id`.
- One‑to‑Many: `users.id` is referenced by `complaints.created_by`, `complaints.supervisor_id`, `notifications.user_id`, and `audit_logs.performed_by`.

### Notes
All users authenticate via their GIKI email; no password field is stored.

## complaints

### Purpose
Tracks each student‑submitted ticket and its lifecycle, including AI recommendations and any supervisor overrides.

### Columns
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Primary key for the complaint. |
| title | VARCHAR(255) | NOT NULL | Short summary of the issue. |
| description | TEXT | NOT NULL | Detailed description provided by the student. |
| status | VARCHAR(20) | NOT NULL | Current workflow state (e.g., "Open", "InProgress", "Resolved"). |
| ai_category | VARCHAR(100) | NULLABLE | Category suggested by the AI engine. |
| ai_priority | VARCHAR(50) | NULLABLE | Priority suggested by the AI engine. |
| ai_department | VARCHAR(100) | NULLABLE | Department/area suggested by the AI engine. |
| supervisor_override | BOOLEAN | NOT NULL, DEFAULT FALSE | Indicates whether the supervisor changed any AI recommendation. |
| overridden_category | VARCHAR(100) | NULLABLE | Category after supervisor review (if overridden). |
| overridden_priority | VARCHAR(50) | NULLABLE | Priority after supervisor review. |
| overridden_department | VARCHAR(100) | NULLABLE | Department after supervisor review. |
| created_by | UUID | NOT NULL, FK → users(id) | Student who created the complaint. |
| supervisor_id | UUID | NULLABLE, FK → users(id) | Hostel Supervisor who reviewed/overrode the AI recommendation. |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Record creation timestamp. |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Record last‑update timestamp. |

### Relationships
- Many‑to‑One: `complaints.created_by` → `users.id` (Student).
- Many‑to‑One: `complaints.supervisor_id` → `users.id` (Supervisor, optional).
- One‑to‑Many: `complaints.id` is referenced by `notifications.complaint_id` and `audit_logs.complaint_id`.

### Notes
AI recommendation fields are nullable because they are populated only after the AI module runs.

## notifications

### Purpose
Stores in‑app notification events for users about complaint lifecycle changes.

### Columns
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Primary key for the notification. |
| user_id | UUID | NOT NULL, FK → users(id) | Recipient of the notification. |
| complaint_id | UUID | NOT NULL, FK → complaints(id) | Complaint that triggered the notification. |
| type | VARCHAR(50) | NOT NULL | Category of the notification (e.g., "ComplaintSubmitted", "StatusUpdated"). |
| payload | JSONB | NOT NULL | Additional data required by the UI. |
| is_read | BOOLEAN | NOT NULL, DEFAULT FALSE | Read/unread status. |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Record creation timestamp. |

### Relationships
- Many‑to‑One: `notifications.user_id` → `users.id`.
- Many‑to‑One: `notifications.complaint_id` → `complaints.id`.

### Notes
`payload` allows flexible extension of notification content without schema changes.

## audit_logs

### Purpose
Provides an immutable trail of all important actions for traceability and compliance.

### Columns
| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Primary key for the audit entry. |
| action | VARCHAR(100) | NOT NULL | Type of action (e.g., "TicketCreated", "SupervisorOverride", "StatusUpdated"). |
| performed_by | UUID | NOT NULL, FK → users(id) | User or system component that performed the action. |
| complaint_id | UUID | NULLABLE, FK → complaints(id) | Associated complaint, if applicable. |
| details | JSONB | NOT NULL | Full snapshot of the change (before/after) or additional context. |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Timestamp of the audit event. |

### Relationships
- Many‑to‑One: `audit_logs.performed_by` → `users.id`.
- Many‑to‑One: `audit_logs.complaint_id` → `complaints.id` (optional).

### Notes
All audit entries are write‑once; the table is append‑only to guarantee immutability.
Viewed database_design.md:38-67

# 5. Constraints & Business Rules

## 5.1 Primary Key Constraints
All tables use a **UUID** column as their primary key (e.g., `id UUID PRIMARY KEY`).  
UUIDs were chosen over sequential integers to:

* Guarantee global uniqueness across distributed environments.  
* Prevent information leakage about row counts or insertion order.  
* Simplify data merging or replication without key collisions.

## 5.2 Foreign Key Constraints
The schema enforces referential integrity through the following foreign‑key relationships:

| Parent Table | Child Table | Foreign Key Column | Description |
|--------------|------------|-------------------|-------------|
| **roles** | **users** | `role_id` | Each user must be assigned exactly one role (Student, Hostel Supervisor, or Maintenance Office). |
| **users** | **complaints** | `created_by` | Complaints are always created by a Student user. |
| **users** | **notifications** | `user_id` | Notifications belong to the user who receives them. |
| **users** | **audit_logs** | `performed_by` | Audit records reference the user who performed the action. |
| **complaints** | **notifications** | `complaint_id` | Events on a complaint generate a notification linked to that complaint. |
| **complaints** | **audit_logs** | `complaint_id` | State changes on a complaint are logged with a reference to the affected complaint. |

These foreign keys prevent orphaned rows: a complaint cannot exist without an author, a notification cannot exist without a related user or complaint, and audit entries always reference valid users and complaints.

## 5.3 Unique Constraints
| Table | Column(s) | Reason |
|-------|-----------|--------|
| **users** | `email` (unique) | Guarantees each user can be uniquely identified by their official GIKI email address, avoiding duplicate accounts. |
| **roles** | `name` (unique) | Ensures role names (Student, Hostel Supervisor, Maintenance Office) are distinct and prevents accidental duplication. |

Uniqueness is required to support reliable authentication, role‑based authorization, and clear reporting.

## 5.4 NOT NULL Constraints
Mandatory fields are declared `NOT NULL` to enforce data completeness:

* **complaints** – `title`, `description`, `status` – essential for processing and user communication.  
* **users** – `email`, `role_id` – required for login and permission checks.  
* **roles** – `name` – required to define the role semantics.  
* **notifications** – `type`, `user_id` – needed to route and display the notification.  
* **audit_logs** – `action`, `performed_by` – required for accountability.

These constraints ensure that critical information is never omitted during inserts or updates.

## 5.5 Default Values
The database supplies sensible defaults to reduce client‑side boiler‑plate and keep records consistent:

| Table | Column | Default |
|-------|--------|---------|
| **complaints** | `supervisor_override` | `FALSE` – indicates no manual override has occurred. |
| **notifications** | `is_read` | `FALSE` – new notifications start unread. |
| **complaints**, **notifications**, **audit_logs** | `created_at` | `NOW()` – timestamp of record creation. |
| **complaints**, **notifications**, **audit_logs** | `updated_at` | `NOW()` – timestamp of the most recent modification (updated via application logic). |

Defaults guarantee that new rows start in a predictable state, simplifying business logic.

## 5.6 Complaint Status Rules
Complaints progress through a defined lifecycle. Only the listed status values are permitted, and transitions must follow the allowed flow.

| Status | Description |
|--------|-------------|
| **Open** | Complaint has been submitted by a Student. |
| **UnderReview** | Hostel Supervisor is reviewing the AI recommendation and the complaint details. |
| **Forwarded** | Supervisor has forwarded the complaint to the Maintenance Office. |
| **InProgress** | Maintenance Office has begun work on the issue. |
| **Resolved** | Maintenance work is completed; a resolution is recorded. |
| **Closed** | Student confirms the resolution or the system auto‑closes after a timeout. |
| **Reopened** | Student re‑opens a previously closed complaint (creates a new lifecycle). |

Application logic enforces that a complaint can only move forward according to this sequence (e.g., `Open → UnderReview → Forwarded → …`). Illegal transitions are rejected.

## 5.7 AI Recommendation Rules
* AI recommendations are generated automatically when a complaint is created.  
* AI‑derived fields (`ai_category`, `ai_priority`, `ai_department`) may be **NULL** if the model fails to produce a prediction.  
* Hostel Supervisors can **override** any AI‑suggested values; the override flag (`supervisor_override`) is set to `TRUE`.  
* The original AI values are retained unchanged for auditability.  
* Every override action creates an entry in **audit_logs** linking the supervisor, the complaint, and the nature of the change.

## 5.8 Notification Rules
* Any significant event in the complaint lifecycle (creation, status change, AI generation, supervisor override, maintenance update, closure) triggers a notification.  
* A notification is **owned** by a single user (`user_id`).  
* Notifications carry a `type` describing the event (e.g., `ComplaintCreated`, `StatusUpdated`).  
* The `is_read` flag tracks whether the recipient has viewed the notification; it defaults to `FALSE`.

## 5.9 Audit Log Rules
* Every important state change (complaint status transition, AI generation, supervisor override, maintenance action) results in a new **audit_log** record.  
* Audit records are **immutable** – they are never updated or deleted by the application.  
* The log is **append‑only**, providing a reliable chronological trail for compliance and debugging.  
* Each audit entry records the acting user (`performed_by`), the affected complaint (`complaint_id` when applicable), the action type, and timestamps.

## 5.10 Data Integrity Rules (Summary)

* Every **complaint** must reference a **Student** user (`created_by`).  
* Every **user** must have exactly one **role** (Student, Hostel Supervisor, Maintenance Office).  
* **Notifications** cannot exist without a valid **user** (and, when tied to a complaint, without a valid **complaint**).  
* **Audit logs** must reference existing **users** and, when relevant, existing **complaints**.  
* All foreign‑key constraints enforce these relationships, ensuring that the database remains consistent with the defined workflow and business processes
Edited database_design.md
Viewed database_design.md:228-248

**# 6. Indexing Strategy**

### 6.1 Purpose of Indexing
Indexes are auxiliary data structures that allow PostgreSQL to locate rows without scanning the entire table. By maintaining a sorted reference on selected columns, indexes dramatically reduce query execution time for look‑ups, range scans, and ordered results. Only columns that are frequently used in `WHERE`, `JOIN`, `ORDER BY`, or `GROUP BY` clauses should be indexed, because each additional index incurs extra I/O and CPU overhead on `INSERT`, `UPDATE`, and `DELETE` operations.

### 6.2 Primary Key Indexes
PostgreSQL automatically creates a B‑tree index for every declared primary‑key column. Since all tables use a `UUID` primary key (`id UUID PRIMARY KEY`), each table already benefits from a unique, highly selective index without any manual definition.

### 6.3 Unique Indexes
Unique constraints also generate indexes. The following unique indexes exist by virtue of the constraints defined in Section 5:

| Table | Column |
|-------|--------|
| users | email |
| roles | name |

These indexes support fast authentication look‑ups (`users.email`) and rapid role‑based access checks (`roles.name`).

### 6.4 Foreign Key Indexes
Although PostgreSQL does **not** automatically index foreign‑key columns, adding indexes on them greatly speeds up joins and cascade checks. The recommended foreign‑key indexes are:

| Table | Indexed Column | Reason |
|-------|----------------|--------|
| users | role_id | Quickly resolve a user’s role for RBAC checks. |
| complaints | created_by | Retrieve all complaints submitted by a specific Student. |
| complaints | supervisor_id | Supervisor dashboards filter on assigned complaints. |
| notifications | user_id | Fetch a user’s notification list. |
| notifications | complaint_id | Locate notifications related to a particular complaint. |
| audit_logs | performed_by | Audit queries that filter by the acting user. |
| audit_logs | complaint_id | Audit trails for a specific complaint. |

### 6.5 Frequently Queried Columns
Columns that appear often in filtering or sorting merit individual indexes:

| Table | Column | Benefit |
|-------|--------|---------|
| complaints | status | Fast status‑based list views (e.g., “Open” tickets). |
| complaints | created_at | Efficient ordering by submission time and time‑range scans. |
| notifications | is_read | Quickly retrieve unread notifications for a user. |
| audit_logs | created_at | Enables fast chronological audit queries and retention reporting. |

### 6.6 Composite Indexes
When queries filter on multiple columns simultaneously, a single composite (multi‑column) index can be more efficient than separate single‑column indexes. Recommended composite indexes include:

| Table | Composite Index | Purpose |
|-------|-----------------|---------|
| complaints | (created_by, status) | Student dashboard showing “my open/under‑review” complaints. |
| complaints | (supervisor_id, status) | Supervisor view of pending complaints assigned to them. |
| notifications | (user_id, is_read) | Retrieve a user’s unread notifications in one index scan. |
| audit_logs | (complaint_id, created_at) | Chronological audit trail for a specific complaint. |

Composite indexes are ordered; the leading column should be the one most commonly used for filtering.

### 6.7 Index Maintenance
* **Monitor usage** – Periodically run `pg_stat_user_indexes` to identify rarely used indexes.  
* **Prune** – Remove unused indexes to lower write‑amplification and storage cost.  
* **Rebuild** – If an index becomes heavily fragmented (high `pgstattuple` bloat), consider `REINDEX` or `DROP`/`CREATE`.  
* **Review** – As new features or query patterns emerge, revisit the indexing plan to add or adjust indexes accordingly.

### 6.8 Summary
The indexing strategy balances:

* **Read performance** – Targeted indexes on primary keys, unique keys, foreign keys, and frequently queried columns enable sub‑second response times for the core Fixora workflows.  
* **Write overhead** – By limiting indexes to truly needed columns and using composite indexes where appropriate, the additional cost on inserts/updates remains modest.  
* **Storage efficiency** – B‑tree indexes are compact for UUID and textual columns; unnecessary indexes are avoided.  
* **Future scalability** – The plan is extensible; as the application grows, new query patterns can be accommodated by adding focused composite indexes without disrupting existing performance.

# 7. Database Security & Access Control

## 7.1 Security Objectives
The primary security objectives for the Fixora database are to ensure that data remains confidential, that its integrity is preserved against unauthorized alteration, and that the system stays available to authorized users and services throughout its operational lifecycle.

## 7.2 Authentication
The application establishes a connection to PostgreSQL using a dedicated, non‑superuser database account whose credentials are sourced from environment variables at runtime; this approach eliminates hard‑coded secrets and enforces the principle of least privilege by granting the account only the permissions required for normal operation.

## 7.3 Authorization
Within the database, the application account is granted solely the SELECT, INSERT, UPDATE, and DELETE privileges needed for the defined tables, while superuser rights are withheld; administrative tasks such as schema changes and user management remain the responsibility of designated database administrators.

## 7.4 Data Protection
All client‑server communication is protected with TLS encryption in production, and database interactions are performed through parameterized SQLAlchemy statements to prevent SQL injection; any sensitive configuration files, including TLS certificates and connection strings, are stored outside the source repository and managed securely.

## 7.5 Backup and Recovery Considerations
Regular full and incremental backups are scheduled, with point‑in‑time recovery enabled to allow restoration to any moment prior to a failure; each backup is routinely verified for integrity, and a documented disaster‑recovery plan defines the procedures and recovery‑time objectives for restoring the database.

## 7.6 Audit Support
The schema includes an immutable audit_logs table that records every significant operation; records are inserted in an append‑only fashion and cannot be altered by the application, ensuring a reliable audit trail that supports compliance and forensic analysis.

## 7.7 Summary
# 9. Database Performance & Optimization

## 9.1 Performance Objectives
The primary performance objectives for the Fixora database are to provide fast query execution, efficient utilization of server resources, horizontal scalability, and a responsive user experience across the complaint lifecycle. Meeting these goals ensures that end‑users experience minimal latency when submitting complaints, viewing notifications, or reviewing audit trails.

## 9.2 Query Optimization
Application code should construct efficient SQLAlchemy queries that retrieve only the columns required for a given operation, avoid unnecessary joins, and apply appropriate filtering and pagination. By limiting result sets and reusing query fragments, the system minimizes redundant round‑trips to the database and reduces overall load.

## 9.3 Index Utilization
The indexes introduced in Section 6 accelerate common lookup patterns: primary‑key indexes enable direct row access; foreign‑key indexes support fast joins between users, complaints, notifications, and audit logs; and filtered indexes on frequently queried columns such as `complaints.status` or `notifications.is_read` improve selective scans. These indexes are balanced against write overhead to maintain acceptable insert/update performance.

## 9.4 Transaction Management
All modifications to complaints and related entities are performed within ACID‑compliant PostgreSQL transactions. Each logical operation—such as a supervisor override or status transition—is executed atomically, with automatic rollback on failure, guaranteeing data consistency even under concurrent access.

## 9.5 Connection Management
SQLAlchemy’s built‑in connection pool is configured to maintain a reusable pool of database connections. Reusing connections reduces the cost of establishing new TCP/SSL sessions and prevents resource exhaustion under load.

## 9.6 Monitoring and Maintenance
Operational monitoring tracks slow‑query logs and database statistics to identify performance bottlenecks. Routine maintenance tasks such as `VACUUM` and `ANALYZE` are scheduled to reclaim space and refresh planner statistics. Periodic review of index usage ensures that indexes remain effective as the application evolves.

## 9.7 Future Performance Improvements
Potential future enhancements include the introduction of read replicas for read‑heavy workloads, application‑level caching of static reference data, further query refinements, and partitioning of very large tables. These options are scoped as optional scalability pathways and are not part of the Version 1 implementation.

## 9.8 Summary
A disciplined performance strategy—combining efficient query patterns, appropriate indexing, robust transaction handling, and proactive monitoring—ensures that the Fixora database delivers reliable, scalable, and responsive operation throughout the lifecycle of the university capstone project.

# 8. Database Migration & Schema Evolution

## 8.1 Migration Strategy
Database migrations are essential to evolve the schema safely over the project lifecycle. Alembic provides systematic versioning of schema changes, encapsulating each modification in a distinct migration script. These versioned scripts are committed to the project's version‑control repository, ensuring that development, testing, and production environments can be kept in lockstep and that any database state can be reconstructed reliably.

## 8.2 Development Workflow
The team follows a disciplined workflow: (1) update the SQLAlchemy model definitions; (2) generate a corresponding Alembic migration; (3) review the autogenerated migration for correctness; (4) apply the migration locally; (5) run the full test suite to verify application behavior; and (6) commit both the revised models and the migration files. This iterative process isolates schema evolution from code changes, reduces the risk of accidental data loss, and guarantees that migrations are validated before they are shared.

## 8.3 Deployment Considerations
Migrations are executed as a pre‑deployment step so that the target database schema matches the incoming application code. Wherever possible migrations are written to be backward‑compatible, allowing older application versions to operate during a rollout. Destructive changes (e.g., column drops) are avoided without a clear migration plan, and each release includes a documented rollback procedure to revert to the previous schema state should deployment issues arise. Consistency of the migration version across all environments is enforced by Alembic's version tracking.

## 8.4 Seed Data
During development and testing, an initial seed set populates the essential reference data: the three role records – Student, Hostel Supervisor, and Maintenance Office. This seed data is loaded only in non‑production environments to give developers a predictable starting point and to simplify integration testing of role‑based functionality.

## 8.5 Version Control
All Alembic migration scripts reside alongside the application source tree and are versioned together with code changes. Each migration carries a unique identifier generated by Alembic, which allows developers to trace the evolution of the database schema through the commit history. Reviewing migration history in the repository provides clear insight into when and why each structural change was introduced.

## 8.6 Best Practices
Never amend a migration that has already been applied to any shared environment; instead, create a new migration to reflect additional changes. Keep migrations small and focused on a single logical alteration, and always test them on a copy of the production database before rollout. Significant schema revisions are documented in the migration script header and in the design documentation to preserve institutional knowledge.

## 8.7 Summary
By employing Alembic‑driven migrations within a controlled development workflow, the Fixora project maintains a consistent, reproducible, and auditable database schema. This approach supports maintainability and safe growth of the data layer throughout the university capstone lifecycle.