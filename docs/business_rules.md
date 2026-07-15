# Business Rules & Logic

This document defines the strict operational rules for Fixora.

## 1. Complaint Lifecycle State Machine
A complaint strictly follows this path:
- `Open`: Default state upon creation by a Student.
- `UnderReview`: The Hostel Supervisor has opened the ticket to review the AI predictions.
- `Forwarded`: The Supervisor has approved and sent the ticket to Maintenance.
- `InProgress`: Maintenance has begun work.
- `Resolved`: Maintenance marks the physical work as complete.
- `Closed`: The Student confirms the resolution.
- `Reopened`: The Student rejects the resolution. (Transitions back to `Open` or `UnderReview`).

## 2. Role-Based Access Control (RBAC)
- **Student:** Can only CREATE tickets and READ their own tickets. Can transition `Resolved` tickets to `Closed` or `Reopened`.
- **Hostel Supervisor:** Can READ all tickets in their assigned hostel. Can OVERRIDE AI-generated category, priority, and department. Can transition tickets from `Open` -> `UnderReview` -> `Forwarded`.
- **Maintenance Office:** Can READ all `Forwarded` tickets. Can transition tickets to `InProgress` and `Resolved`. Cannot delete tickets.

## 3. AI Prediction & Override Rules
- The AI Engine automatically suggests `Category`, `Priority`, and `Department` upon ticket creation.
- These are *suggestions*. The system stores the original AI predictions immutably.
- If a Supervisor disagrees, they use the `override` action. The system stores `overridden_category`, etc., and sets a `supervisor_override` boolean flag to true. This data is critical for future ML model retraining.

## 4. Audit Logging
- Every state transition must generate an immutable `AuditLog` entry detailing the `action`, `performed_by`, and a JSON payload of the changes. This ensures accountability.
