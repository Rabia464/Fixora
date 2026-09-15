/**
 * Complaint lifecycle rules. Mirrors backend/app/domain/enums and
 * backend/app/services/complaint.py so the Firestore API enforces the same
 * state machine the FastAPI reference implementation does.
 *
 *   Open -> UnderReview -> Forwarded -> InProgress -> Resolved -> Closed
 *                                                        \-> Reopened -> UnderReview ...
 */

export const COMPLAINT_STATUSES = [
  'Open',
  'UnderReview',
  'Forwarded',
  'InProgress',
  'Resolved',
  'Closed',
  'Reopened',
] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export type ComplaintPriority = (typeof PRIORITIES)[number];

export const ROLES = ['Student', 'Hostel Supervisor', 'Maintenance Office'] as const;
export type RoleName = (typeof ROLES)[number];

export const AuditAction = {
  TICKET_CREATED: 'TicketCreated',
  SUPERVISOR_REVIEWED: 'SupervisorReviewed',
  SUPERVISOR_OVERRIDE: 'SupervisorOverride',
  FORWARDED_TO_MAINTENANCE: 'ForwardedToMaintenance',
  STATUS_UPDATED: 'StatusUpdated',
  STUDENT_CONFIRMED: 'StudentConfirmed',
  STUDENT_REOPENED: 'StudentReopened',
} as const;

export const NotificationType = {
  COMPLAINT_CREATED: 'ComplaintCreated',
  STATUS_UPDATED: 'StatusUpdated',
  MAINTENANCE_STARTED: 'MaintenanceStarted',
  RESOLUTION_PENDING_CONFIRMATION: 'ResolutionPendingConfirmation',
  COMPLAINT_REOPENED: 'ComplaintReopened',
  COMPLAINT_CLOSED: 'ComplaintClosed',
} as const;

export type WorkflowAction = 'review' | 'forward' | 'progress' | 'resolve' | 'confirm' | 'reopen';

interface TransitionRule {
  from: readonly ComplaintStatus[];
  to: ComplaintStatus;
  role: RoleName;
  message: string;
}

export const TRANSITIONS: Record<WorkflowAction, TransitionRule> = {
  review: {
    from: ['Open', 'Reopened'],
    to: 'UnderReview',
    role: 'Hostel Supervisor',
    message: 'Complaint must be in Open or Reopened status to review.',
  },
  forward: {
    from: ['UnderReview'],
    to: 'Forwarded',
    role: 'Hostel Supervisor',
    message: 'Complaint has not been reviewed and cannot be forwarded.',
  },
  progress: {
    from: ['Forwarded'],
    to: 'InProgress',
    role: 'Maintenance Office',
    message: 'Complaint is not in Forwarded status.',
  },
  resolve: {
    from: ['InProgress'],
    to: 'Resolved',
    role: 'Maintenance Office',
    message: 'Complaint is not in InProgress status.',
  },
  confirm: {
    from: ['Resolved'],
    to: 'Closed',
    role: 'Student',
    message: 'Complaint is not in Resolved status.',
  },
  reopen: {
    from: ['Resolved', 'Closed'],
    to: 'Reopened',
    role: 'Student',
    message: 'Only Resolved or Closed complaints can be reopened.',
  },
};

/** Statuses a Maintenance Office user may see (the maintenance workflow). */
export const MAINTENANCE_VISIBLE_STATUSES: readonly ComplaintStatus[] = [
  'Forwarded',
  'InProgress',
  'Resolved',
  'Closed',
  'Reopened',
];

export class WorkflowError extends Error {
  constructor(
    message: string,
    public readonly status: 403 | 409 | 422
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

/**
 * Throws WorkflowError(409) unless `current` is a legal source state for `action`.
 * Returns the target status so callers can't drift from the rule table.
 */
export function assertTransition(action: WorkflowAction, current: ComplaintStatus): ComplaintStatus {
  const rule = TRANSITIONS[action];
  if (!rule.from.includes(current)) {
    throw new WorkflowError(rule.message, 409);
  }
  return rule.to;
}

export function assertRole(action: WorkflowAction, role: RoleName): void {
  const rule = TRANSITIONS[action];
  if (role !== rule.role) {
    throw new WorkflowError(`Only ${rule.role} users can perform this action.`, 403);
  }
}

export function isPriority(value: unknown): value is ComplaintPriority {
  return typeof value === 'string' && (PRIORITIES as readonly string[]).includes(value);
}

export function isStatus(value: unknown): value is ComplaintStatus {
  return typeof value === 'string' && (COMPLAINT_STATUSES as readonly string[]).includes(value);
}
