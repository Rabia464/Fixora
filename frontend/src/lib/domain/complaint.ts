/**
 * Complaint domain vocabulary shared by the API (lib/server), the API client
 * (lib/api) and the UI. Pure TypeScript: no server or browser imports, so it is
 * safe to use from both sides. Add a status, priority or category here once.
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

export const CATEGORIES = ['Plumbing', 'Electrical', 'Furniture', 'Sanitation', 'General'] as const;
export type ComplaintCategory = (typeof CATEGORIES)[number];

export const DEPARTMENTS = ['Plumbing', 'Electrical', 'Sanitation', 'Maintenance'] as const;
export type ComplaintDepartment = (typeof DEPARTMENTS)[number];

/** Which department handles each category. */
export const CATEGORY_DEPARTMENT: Record<ComplaintCategory, string> = {
  Plumbing: 'Plumbing',
  Electrical: 'Electrical',
  Furniture: 'Maintenance',
  Sanitation: 'Sanitation',
  General: 'Maintenance',
};

export const DEFAULT_CATEGORY: ComplaintCategory = 'General';
export const DEFAULT_PRIORITY: ComplaintPriority = 'Medium';
export const DEFAULT_DEPARTMENT = 'Maintenance';

export function isPriority(value: unknown): value is ComplaintPriority {
  return typeof value === 'string' && (PRIORITIES as readonly string[]).includes(value);
}

export function isStatus(value: unknown): value is ComplaintStatus {
  return typeof value === 'string' && (COMPLAINT_STATUSES as readonly string[]).includes(value);
}

export function isCategory(value: unknown): value is ComplaintCategory {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

export function isDepartment(value: unknown): value is ComplaintDepartment {
  return typeof value === 'string' && (DEPARTMENTS as readonly string[]).includes(value);
}

export function departmentFor(category: string): string {
  return isCategory(category) ? CATEGORY_DEPARTMENT[category] : DEFAULT_DEPARTMENT;
}

/** A complaint as stored in Firestore and returned by the API. */
export interface Complaint {
  id: string;
  title: string;
  description: string;
  location: string;
  hostel: string;
  status: ComplaintStatus;
  ai_category: string | null;
  ai_priority: ComplaintPriority | null;
  ai_department: string | null;
  supervisor_override: boolean;
  overridden_category: string | null;
  overridden_priority: ComplaintPriority | null;
  overridden_department: string | null;
  created_by: string;
  supervisor_id: string | null;
  resolution_notes?: string | null;
  reopen_reason?: string | null;
  created_at: string;
  updated_at: string;
}

type Classified = Pick<
  Complaint,
  | 'overridden_category'
  | 'ai_category'
  | 'overridden_priority'
  | 'ai_priority'
  | 'overridden_department'
  | 'ai_department'
>;

/** The category in force: the supervisor's choice if any, else the AI's. */
export const effectiveCategory = (c: Classified): string =>
  c.overridden_category || c.ai_category || DEFAULT_CATEGORY;

export const effectivePriority = (c: Classified): ComplaintPriority =>
  c.overridden_priority || c.ai_priority || DEFAULT_PRIORITY;

export const effectiveDepartment = (c: Classified): string =>
  c.overridden_department || c.ai_department || DEFAULT_DEPARTMENT;
