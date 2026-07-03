1. API Overview
The Fixora API provides the programmatic entry point for the React front‑end to interact with the core business logic of the application. Its primary purpose is to expose the operations required to support the Version 1 complaint workflow—student complaint submission, AI‑generated recommendation, supervisor review and override, forwarding to the maintenance office, maintenance updates, and final student confirmation or automatic closure—while enforcing role‑based access control and preserving data integrity.

Communication between the front‑end and the back‑end is performed over HTTPS using a RESTful style. Each request and response is encoded in JSON, which aligns with the lightweight data interchange format expected by the React client and the FastAPI server. The use of standard HTTP verbs (GET, POST, PATCH, DELETE) maps naturally to Create, Read, Update, and Delete operations on the underlying PostgreSQL tables, ensuring a clear contract between consumer and provider.

A RESTful API was selected because it offers a well‑understood, stateless interaction model that fits cleanly into the layered architecture described in the system documentation. The presentation layer (React) invokes the API services, which delegate to use‑case interactor components that enforce business rules. These interactors then call repository interfaces implemented with SQLAlchemy ORM to persist data in PostgreSQL. This separation of concerns promotes testability, maintainability, and the ability to evolve each layer independently.

Authentication is performed using JWT tokens issued after a successful login, and every request must include a valid token in the Authorization header. The token encodes the user’s identity and role, enabling the API gateway to enforce RBAC policies consistently across all endpoints. Authorization checks are performed early in the request handling pipeline, ensuring that only Students, Hostel Supervisors, or Maintenance Office personnel can access the actions appropriate to their responsibilities.

Scalability and maintainability are addressed through stateless service design, allowing horizontal scaling of the FastAPI application behind a load balancer. The JSON‑based contract simplifies versioning and documentation, while the use of industry‑standard libraries (FastAPI, SQLAlchemy, JWT) reduces technical debt and facilitates future enhancements without requiring changes to the communication protocol. Consequently, the API serves as a robust, secure, and extensible foundation for the Fixora system, fully supporting the defined workflow while remaining adaptable to anticipated growth.

# 2. API Design Principles

### RESTful Resource‑Oriented Design
The API is modeled around logical resources such as `users`, `complaints`, `notifications` and `audit_logs`. Each resource is identified by a stable UUID and is manipulated through a consistent set of operations. This approach mirrors the relational schema defined in the database design and simplifies mapping between API payloads and SQLAlchemy models, reducing transformation overhead and keeping the domain model coherent.

### Stateless Communication
All requests are independent and carry all required context, primarily through JWT tokens and request payloads. No server‑side session state is maintained, which enables horizontal scaling of the FastAPI service and aligns with the stateless nature of the underlying HTTP protocol.

### Consistent Endpoint Naming
Endpoints follow a predictable noun-based pattern such as /complaints, /complaints/{id}, /notifications, and /auth/login.using kebab‑case for readability. Consistency eases client development, documentation generation, and automated testing, and ensures that the API surface remains intuitive for future contributors.

### Proper Use of HTTP Methods
Standard HTTP verbs are employed to express intent: `GET` for retrieval, `POST` for creation, `PATCH` for partial updates, and `DELETE` for removal. Aligning verb semantics with CRUD operations on the PostgreSQL tables reinforces REST principles and provides clear expectations for clients.

### JSON‑Based Request and Response Format
JSON maps naturally to the request and response models used by FastAPI and the underlying domain objects, minimizing serialization complexity while enabling automatic OpenAPI documentation 
### Standard HTTP Status Codes
The API returns appropriate status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`). Consistent use of these codes enables client‑side error handling and aligns with HTTP specifications.

### Input Validation
FastAPI leverages Pydantic models to validate incoming payloads against defined schemas. Validation occurs before business logic execution, preventing malformed data from reaching the database and preserving integrity enforced by the underlying constraints.

### Authentication and Authorization
JWT authentication provides a stateless mechanism for verifying user identity. Role claims embedded in the token are checked against the RBAC matrix defined in the project context, ensuring that only authorized roles can invoke specific resources (e.g., only a Hostel Supervisor may override an AI recommendation).

### API Versioning
The API is versioned via a URL prefix (`/api/v1/...`). Versioning isolates future changes from existing clients, allowing incremental evolution of the contract without breaking current integrations.

### Error Handling and Consistent Error Responses
All errors are captured and transformed into a uniform JSON error object containing `code`, `message`, and optional `details`. This consistency simplifies debugging for front‑end developers and supports automated error reporting.

### Scalability and Maintainability
Stateless design, connection pooling, and the use of asynchronous FastAPI routes enable the service to handle increasing load. The clear separation of concerns—routing, validation, business logic, and data access—facilitates maintainable code bases and eases onboarding of new developers.

The principles above collectively ensure that the Fixora API remains robust, secure, and adaptable, while tightly integrating with the Clean Architecture and database design outlined in the project documentation.

# 3. Authentication & Authorization

### Authentication Overview
The Fixora system authenticates users via their official GIKI email address. After the React client submits the GIKI email, the FastAPI backend validates that the user is registered in the Fixora system, determines the assigned role, and issues a signed JWT containing the user’s identity and role. The token is signed using an HS256 shared secret (`JWT_SECRET_KEY`) stored securely in the deployment environment.

### Login Flow
1. User enters their official GIKI email address in the React login page.
2. The React client sends a POST request to `/auth/login` with the email in the JSON body.
3. The FastAPI backend validates the email against the users table, determines the assigned role, and issues a signed JWT.
4. The JWT is returned in the response body and optionally set as an HttpOnly secure cookie. The client stores the token and includes it in subsequent requests.

### JWT Generation
The token payload follows the structure:

```json
{
  "sub": "<user-uuid>",
  "role": "Student|HostelSupervisor|MaintenanceOffice",
  "iat": 1720000000,
  "exp": 1720000900
}
```

The server signs the payload with the secret key defined in the environment variable `JWT_SECRET_KEY`. The short expiration mitigates token‑leakage risk while preserving a stateless authentication model.

### Authorization Header Format
Clients must transmit the token in the standard HTTP Authorization header:

```
Authorization: Bearer <jwt_token>
```

FastAPI’s dependency injection extracts the header, decodes the token, and makes the user claims available to route handlers.

### JWT Validation
For each incoming request, the authentication middleware:
- Verifies the token signature using `JWT_SECRET_KEY`.
- Checks the `exp` claim to ensure the token has not expired.
- Validates that the `role` claim matches one of the predefined roles.
- Retrieves the corresponding user record from the database to confirm the account is active.

Invalid, missing, or expired tokens result in a **401 Unauthorized** response.

### Role‑Based Access Control (RBAC)

| Role                | Primary Permissions |
|---------------------|---------------------|
| **Student**         | Create complaints, view own complaints, read AI recommendations, receive notifications, confirm or reopen a complaint. |
| **Hostel Supervisor** | View all student complaints within assigned hostel, override AI recommendations, forward complaints to Maintenance Office, update complaint status, access audit logs for supervised complaints. |
| **Maintenance Office** | Access forwarded complaints, update maintenance progress, close complaints, generate notifications, read audit logs for all maintenance activities. |

Permissions are enforced by FastAPI dependencies that compare the role claim in the JWT against the required role for each endpoint. Insufficient privileges yield a **403 Forbidden** response.

### Unauthorized and Forbidden Handling
- **401 Unauthorized** – Returned when a request lacks a valid JWT or the token is expired/invalid. The response includes a JSON error object prompting re‑authentication.  
- **403 Forbidden** – Returned when the token is valid but the user’s role does not grant permission for the requested operation. The error object details the missing privilege.

### Token Expiration and Refresh Strategy
Version 1 uses short‑lived access tokens. The architecture anticipates future support for refresh tokens: a long‑lived refresh token (stored as an HttpOnly cookie) can be exchanged for a new access token via a `POST /auth/refresh` endpoint, extending the session without re‑entering credentials. This design balances security with a seamless user experience.
# 4. API Endpoints

## 4.1 Endpoint Organization

The Fixora API is organized into logical resource groups based on the major functional areas of the system. Each group exposes RESTful endpoints that correspond to a specific domain of the application while following consistent naming conventions and HTTP semantics.

Version 1 consists of the following endpoint groups:

| Endpoint Group | Purpose |
|---------------|---------|
| **Authentication** | Authenticate users and issue JWT access tokens. |
| **Complaints** | Create, retrieve, update, and manage complaint records throughout their lifecycle. |
| **Supervisor** | Review AI recommendations, override AI decisions when necessary, and forward complaints to the Maintenance Office. |
| **Maintenance Office** | View forwarded complaints, update maintenance progress, and resolve complaints. |
| **Notifications** | Retrieve and manage in-app notifications for authenticated users. |
| **Audit Logs** | View audit records generated throughout the complaint lifecycle. |

All endpoints are prefixed with:
`/api/v1`

**Example:**

```http
POST /api/v1/auth/login
GET /api/v1/complaints
PATCH /api/v1/complaints/{id}
```

The API follows REST principles by using resource‑based URLs, standard HTTP methods, appropriate status codes, and JSON request/response bodies.
## 4.2 Authentication Endpoints

### POST /api/v1/auth/login

#### Purpose
Authenticates a registered user using their official GIKI email address and returns a JWT access token that will be used to authorize subsequent API requests.

#### Access
Public (authentication not required).

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Official GIKI email address of the user. |

**Example Request**

```json
{
  "email": "student@giki.edu.pk"
}
```

#### Successful Response

**Status Code:** `200 OK`

```json
{
  "access_token": "<jwt_token>",
  "token_type": "Bearer",
  "role": "Student"
}
```

#### Possible Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 Bad Request | Invalid request format. |
| 401 Unauthorized | User is not registered or authentication failed. |
| 500 Internal Server Error | Unexpected server error. |

#### Business Rules

- Only registered users may authenticate.
- Authentication is performed using the user's official GIKI email account.
- A JWT is generated after successful authentication.
- The JWT contains the user's unique identifier and assigned role.
- The client must include the token in the `Authorization: Bearer <token>` header for all protected endpoints.
- The authenticated user's role is determined by the system and included in the JWT.

# 4.3 Complaint Endpoints

The Complaint API manages the complete lifecycle of a complaint, beginning with student submission and ending with complaint closure. During this lifecycle, the AI module generates recommendations, the Hostel Supervisor reviews and may override those recommendations, the complaint is forwarded to the Maintenance Office, maintenance progress is tracked, and the student is notified of each significant update.

---

## POST /api/v1/complaints

### Purpose
Creates a new complaint submitted by a Student. After the complaint is created, the AI module automatically generates recommendations for category, priority, and department.

### Access
Student

### Request Body

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| title | string | Yes | Short summary of the complaint. |
| description | string | Yes | Detailed explanation of the issue. |
| location | string | Yes | Location of the issue (e.g., Hostel, room number). |

**Example Request**

```json
{
  "title": "Water leakage in washroom",
  "description": "Water has been leaking continuously since yesterday.",
  "location": "Hostel A - Room 212"
}
```

### Successful Response

**Status Code:** `201 Created`

```json
{
  "id": "complaint-uuid",
  "status": "Open",
  "message": "Complaint created successfully.",
  "ai_recommendation_generated": true
}
```

### Possible Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 Bad Request | Invalid request body. |
| 401 Unauthorized | User is not authenticated. |
| 403 Forbidden | User does not have Student privileges. |
| 500 Internal Server Error | Unexpected server error. |

### Business Rules

- Only Students can create complaints.
- Every complaint is associated with the authenticated Student.
- The AI module automatically generates category, priority, and department recommendations.
- The original AI recommendations are stored with the complaint.
- An audit log entry is created.
- A notification is generated for the Hostel Supervisor.

---

## GET /api/v1/complaints

### Purpose
Retrieves complaints visible to the authenticated user.

### Access
Student, Hostel Supervisor, Maintenance Office

### Query Parameters (Optional)

| Parameter | Description |
|-----------|-------------|
| status | Filter complaints by status. |
| page | Page number for pagination. |
| limit | Number of records per page. |

Results are returned in a paginated form to support efficient retrieval of large complaint datasets.

### Successful Response

**Status Code:** `200 OK`

```json
[
  {
    "id": "complaint-uuid",
    "title": "Water leakage",
    "status": "UnderReview"
  }
]
```

### Possible Error Responses

| Status Code | Description |
|-------------|-------------|
| 401 Unauthorized | Authentication required. |
| 403 Forbidden | User lacks permission. |
```

### Business Rules

- Students can view only their own complaints.
- Hostel Supervisors can view complaints assigned to their hostel.
- Maintenance Office can view complaints forwarded to them.
- Complaint records include AI recommendations whenever available.

---

## GET /api/v1/complaints/{id}

### Purpose
Retrieves complete information about a single complaint.

### Access
Student, Hostel Supervisor, Maintenance Office

### Successful Response

**Status Code:** `200 OK`

```json
{
  "id": "complaint-uuid",
  "title": "Water leakage",
  "status": "Forwarded",
  "ai_category": "Plumbing",
  "ai_priority": "High",
  "supervisor_override": false
  
}
```

### Possible Error Responses

| Status Code | Description |
|-------------|-------------|
| 401 Unauthorized | Authentication required. |
| 403 Forbidden | User lacks permission. |
| 404 Not Found | Complaint not found. |

### Business Rules

- Users may only access complaints they are authorized to view.
- AI recommendations remain visible even if overridden.
- Override information is included whenever applicable.

4.4 Supervisor Endpoints

The Supervisor API provides endpoints for Hostel Supervisors to review complaints submitted by students, inspect AI-generated recommendations, override those recommendations when necessary, and forward complaints to the Maintenance Office. These endpoints support the human-in-the-loop philosophy adopted by Fixora, where AI assists decision-making but the Hostel Supervisor retains final authority before a complaint proceeds further in the workflow.

PATCH /api/v1/complaints/{id}/review
Purpose

Allows a Hostel Supervisor to review a complaint, optionally modify the AI-generated category, priority, or department, and save the final recommendation.

Access

Hostel Supervisor

Request Body
Field	Type	Required	Description
category	string	Yes	Final complaint category after review.
priority	string	Yes	Final complaint priority.
department	string	Yes	Department responsible for handling the complaint.
override	boolean	Yes	Indicates whether the AI recommendation was overridden.

Example Request

{
  "category": "Plumbing",
  "priority": "High",
  "department": "Maintenance",
  "override": true
}
Successful Response

Status Code: 200 OK

{
  "message": "Complaint reviewed successfully.",
  "status": "UnderReview",
  "supervisor_override": true
}
Possible Error Responses
Status Code	Description
400 Bad Request	Invalid request body.
401 Unauthorized	Authentication required.
403 Forbidden	User is not a Hostel Supervisor.
404 Not Found	Complaint not found.
500 Internal Server Error	Unexpected server error.
Business Rules
Only Hostel Supervisors can review complaints.
AI recommendations remain stored even if overridden.
The Supervisor's final values become the active recommendation.
Every override generates an audit log entry.
The complaint status becomes UnderReview if it was previously Open.
PATCH /api/v1/complaints/{id}/forward
Purpose

Forwards a reviewed complaint to the Maintenance Office for action.

Access

Hostel Supervisor

Request Body

No request body is required.

Successful Response

Status Code: 200 OK

{
  "message": "Complaint forwarded successfully.",
  "status": "Forwarded"
}
Possible Error Responses
Status Code	Description
401 Unauthorized	Authentication required.
403 Forbidden	User is not a Hostel Supervisor.
404 Not Found	Complaint not found.
409 Conflict	Complaint has not yet been reviewed.
500 Internal Server Error	Unexpected server error.