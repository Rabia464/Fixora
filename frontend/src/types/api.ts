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
