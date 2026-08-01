# Testing Plan

## 1. Unit Testing
- **Backend (Pytest):** 
  - Test individual `AIEngine.predict` logic with various descriptions.
  - Test `AuthService` token generation.
- **Frontend (Jest/React Testing Library):**
  - Test UI component rendering (Buttons, Cards, Badges).
  - Test custom hooks (e.g., JWT decoding, API fetch wrappers).

## 2. Integration Testing
- **Backend (FastAPI TestClient):**
  - Test the full ticket creation flow, verifying database inserts and AI overrides.
  - Test RBAC boundaries (ensure Student cannot hit `/api/v1/supervisor/*`).

## 3. End-to-End Testing (Cypress / Playwright)
- Simulate full user journeys:
  1. Student logs in -> Submits ticket -> Sees "Open" status.
  2. Supervisor logs in -> Overrides AI priority -> Forwards ticket.
  3. Maintenance logs in -> Marks ticket "In Progress" -> Resolves ticket.
  4. Student logs in -> Confirms resolution -> Ticket "Closed".
