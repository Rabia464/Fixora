import { api } from '@/lib/api/client'
import type {
  Complaint,
  ComplaintCreate,
  ComplaintReopen,
  SupervisorReviewRequest,
  MaintenanceProgressRequest,
  MaintenanceResolveRequest,
  AuditLog,
  PaginatedParams,
} from '@/types/api'

export const complaintsApi = {
  // ─── Student ──────────────────────────────────────────────────────────────

  /** GET /complaints — role-aware: student sees own, supervisor sees hostel */
  list: (params?: PaginatedParams) =>
    api.get<unknown, Complaint[]>('/complaints', { params }),

  /** POST /complaints — student creates a new complaint */
  create: (data: ComplaintCreate) =>
    api.post<unknown, Complaint>('/complaints', data),

  /** GET /complaints/{id} — single complaint by id (all roles) */
  get: (id: string) =>
    api.get<unknown, Complaint>(`/complaints/${id}`),

  /** PATCH /complaints/{id}/confirm — student confirms resolution */
  confirm: (id: string) =>
    api.patch<unknown, Complaint>(`/complaints/${id}/confirm`),

  /** PATCH /complaints/{id}/reopen — student reopens a resolved/closed complaint */
  reopen: (id: string, data: ComplaintReopen) =>
    api.patch<unknown, Complaint>(`/complaints/${id}/reopen`, data),

  /** GET /complaints/{id}/audit_logs — full chronological audit trail */
  auditLogs: (id: string) =>
    api.get<unknown, AuditLog[]>(`/complaints/${id}/audit_logs`),

  // ─── Supervisor ───────────────────────────────────────────────────────────

  /** PATCH /complaints/{id}/review — supervisor reviews and potentially overrides AI */
  review: (id: string, data: SupervisorReviewRequest) =>
    api.patch<unknown, Complaint>(`/complaints/${id}/review`, data),

  /** PATCH /complaints/{id}/forward — supervisor forwards complaint to maintenance */
  forward: (id: string) =>
    api.patch<unknown, Complaint>(`/complaints/${id}/forward`),

  // ─── Maintenance ──────────────────────────────────────────────────────────

  /** GET /maintenance/complaints — maintenance-specific queue */
  maintenanceList: (params?: Pick<PaginatedParams, 'skip' | 'limit'>) =>
    api.get<unknown, Complaint[]>('/maintenance/complaints', { params }),

  /** PATCH /complaints/{id}/progress — maintenance marks in progress */
  progress: (id: string, data: MaintenanceProgressRequest) =>
    api.patch<unknown, Complaint>(`/complaints/${id}/progress`, data),

  /** PATCH /complaints/{id}/resolve — maintenance marks resolved */
  resolve: (id: string, data: MaintenanceResolveRequest) =>
    api.patch<unknown, Complaint>(`/complaints/${id}/resolve`, data),
}
