# Security Architecture

## 1. Authentication
Fixora uses JSON Web Tokens (JWT) for stateless authentication.
- **Login:** Users authenticate using their GIKI email address. (MVP bypasses password/SSO complexity).
- **Token Format:** The JWT contains the user's `sub` (UUID) and `role` (String) to allow the frontend to render role-specific UIs immediately.
- **Storage:** Tokens should be stored securely on the client (e.g., in HttpOnly cookies for production, or standard local/session storage for MVP).

## 2. Authorization (RBAC)
- **API Level:** FastAPI endpoints are protected by `Depends(get_current_user_role)` which decodes the JWT and validates the role against the required role for the endpoint (e.g., `verify_supervisor`).
- **Data Isolation:** Repository queries inherently filter data. For example, `get_student_complaints` strictly filters by the `created_by` column matching the current user's token ID.

## 3. Database Security
- Passwords (if implemented later) must be hashed using bcrypt.
- Connection strings must be loaded via environment variables and never hardcoded.
- Alembic migrations ensure schema changes are tracked and revertible.
