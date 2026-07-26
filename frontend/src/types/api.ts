export type UserRole = 'Student' | 'Hostel Supervisor' | 'Maintenance Office'

export interface TokenResponse {
  access_token: string
  token_type: string
  role: UserRole
}

export interface User {
  id: string
  email: string
  full_name: string
  hostel: string | null
  role_id: string
  created_at: string
  updated_at: string
}

export interface ApiErrorBody {
  detail?: string | { msg: string }[]
}

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

// ─── Complaint Domain ─────────────────────────────────────────────────────────

/** Mirrors backend ComplaintStatus enum exactly. */
export type ComplaintStatus =
  | 'Open'
  | 'UnderReview'
  | 'Forwarded'
  | 'InProgress'
  | 'Resolved'
  | 'Closed'
  | 'Reopened'

/** Mirrors backend ComplaintPriority enum exactly. */
export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical'

/** Full complaint representation returned from the API. */
export interface Complaint {
  id: string
  title: string
  description: string
  location: string
  hostel: string
  status: ComplaintStatus
  ai_category: string | null
  ai_priority: ComplaintPriority | null
  ai_department: string | null
  supervisor_override: boolean
  overridden_category: string | null
  overridden_priority: ComplaintPriority | null
  overridden_department: string | null
  created_by: string
  supervisor_id: string | null
  created_at: string
  updated_at: string
}

/** Payload for creating a new complaint (student only). */
export interface ComplaintCreate {
  title: string
  description: string
  location: string
}

/** Payload for reopening a complaint (student only). */
export interface ComplaintReopen {
  reason: string
}

/** Payload for supervisor reviewing AI recommendation. */
export interface SupervisorReviewRequest {
  category: string
  priority: ComplaintPriority
  department: string
  /** True when supervisor modifies the AI suggestion */
  override: boolean
}

/** Payload for maintenance marking a complaint as in-progress. */
export interface MaintenanceProgressRequest {
  note?: string
}

/** Payload for maintenance resolving a complaint. */
export interface MaintenanceResolveRequest {
  resolution_note: string
}

// ─── Audit Log Domain ─────────────────────────────────────────────────────────

/** Immutable audit trail entry for a complaint. */
export interface AuditLog {
  id: string
  action: string
  performed_by: string
  complaint_id: string | null
  details: Record<string, unknown>
  created_at: string
}

// ─── Notification Domain ──────────────────────────────────────────────────────

/** In-app notification for the current user. */
export interface Notification {
  id: string
  user_id: string
  complaint_id: string
  type: string
  payload: Record<string, unknown>
  is_read: boolean
  created_at: string
}

// ─── Shared Query Helpers ─────────────────────────────────────────────────────

export interface PaginatedParams {
  skip?: number
  limit?: number
  status?: ComplaintStatus
}
