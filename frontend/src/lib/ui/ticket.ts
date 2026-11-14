import type { KeyboardEvent } from 'react';
import type { Complaint, ComplaintPriority, ComplaintStatus } from '../api/complaints';

/** Human-readable labels for the raw workflow status codes. */
export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  Open: 'Submitted',
  UnderReview: 'Under review',
  Forwarded: 'Sent to maintenance',
  InProgress: 'Repair in progress',
  Resolved: 'Awaiting your confirmation',
  Closed: 'Closed',
  Reopened: 'Reopened',
};

/** Labels for staff, where "your confirmation" would be misleading. */
const STAFF_STATUS_LABELS: Partial<Record<ComplaintStatus, string>> = {
  Resolved: 'Awaiting student confirmation',
};

export function statusLabel(status: ComplaintStatus, role?: string | null): string {
  if (role && role !== 'Student' && STAFF_STATUS_LABELS[status]) {
    return STAFF_STATUS_LABELS[status] as string;
  }
  return STATUS_LABELS[status] ?? status;
}

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

export function statusTone(status: ComplaintStatus): BadgeTone {
  switch (status) {
    case 'Closed':
      return 'success';
    case 'Resolved':
      return 'warning';
    case 'Reopened':
      return 'danger';
    case 'InProgress':
    case 'Forwarded':
      return 'purple';
    default:
      return 'info';
  }
}

export function priorityTone(priority: ComplaintPriority | null | undefined): BadgeTone {
  if (priority === 'Critical') return 'danger';
  if (priority === 'High') return 'warning';
  return 'neutral';
}

/**
 * The stages a student sees on the progress tracker. "Reopened" loops back to
 * review, so it maps onto the review step.
 */
export const PROGRESS_STEPS = ['Submitted', 'Reviewed', 'With maintenance', 'Repaired', 'Closed'] as const;

export function progressStepIndex(status: ComplaintStatus): number {
  switch (status) {
    case 'Open':
      return 0;
    case 'UnderReview':
    case 'Reopened':
      return 1;
    case 'Forwarded':
    case 'InProgress':
      return 2;
    case 'Resolved':
      return 3;
    case 'Closed':
      return 4;
    default:
      return 0;
  }
}

export const effectiveCategory = (t: Complaint): string =>
  t.overridden_category || t.ai_category || 'General';

export const effectivePriority = (t: Complaint): ComplaintPriority =>
  t.overridden_priority || t.ai_priority || 'Medium';

const PRIORITY_RANK: Record<ComplaintPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const createdMs = (t: Complaint) => new Date(t.created_at).getTime() || 0;

/** Most urgent first; within the same priority, the oldest ticket first. */
export function byUrgency(a: Complaint, b: Complaint): number {
  const p = PRIORITY_RANK[effectivePriority(a)] - PRIORITY_RANK[effectivePriority(b)];
  return p !== 0 ? p : createdMs(a) - createdMs(b);
}

/** Tickets that need the student to act come first, then newest first. */
export function byStudentAttention(a: Complaint, b: Complaint): number {
  const needsA = a.status === 'Resolved' ? 0 : 1;
  const needsB = b.status === 'Resolved' ? 0 : 1;
  return needsA !== needsB ? needsA - needsB : createdMs(b) - createdMs(a);
}

/** Compact relative time such as "just now", "5 min ago", "3 days ago". */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!then) return '';
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(then).toLocaleDateString();
}

/** Props that make a clickable card reachable and operable from the keyboard. */
export function clickableCardProps(onActivate: () => void, label: string) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': label,
    onKeyDown: (e: KeyboardEvent) => {
      // Only react when the card itself has focus, not a nested input/button.
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
  };
}

const isStatusCode = (v: unknown): v is ComplaintStatus =>
  typeof v === 'string' && v in STATUS_LABELS;

/**
 * Turns one entry of an audit log's `details` into a readable line, or null
 * when it shouldn't be shown (ids, empty values, an empty change set).
 * `changes` ({ field: { from, to } }) becomes "Category: Plumbing → Electrical".
 */
export function formatAuditDetail(key: string, val: unknown): { label: string; value: string } | null {
  if (key === 'id' || key.endsWith('_id') || val === null || val === undefined || val === '') return null;
  const label = key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

  if (key === 'changes') {
    if (!val || typeof val !== 'object') return null;
    const parts = Object.entries(val as Record<string, { from?: unknown; to?: unknown }>)
      .filter(([, c]) => c && typeof c === 'object')
      .map(([field, c]) => `${field.replace(/^./, (x) => x.toUpperCase())}: ${String(c.from)} → ${String(c.to)}`);
    return parts.length ? { label: 'Changed', value: parts.join('; ') } : null;
  }
  if (typeof val === 'boolean') return { label, value: val ? 'Yes' : 'No' };
  if ((key === 'previous_status' || key === 'new_status') && isStatusCode(val)) {
    return { label, value: STATUS_LABELS[val] };
  }
  if (typeof val === 'object') return { label, value: JSON.stringify(val) };
  return { label, value: String(val) };
}
