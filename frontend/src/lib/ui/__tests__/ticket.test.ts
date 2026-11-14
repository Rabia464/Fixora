import { describe, expect, it } from 'vitest';
import type { Complaint } from '../../api/complaints';
import {
  byStudentAttention,
  byUrgency,
  progressStepIndex,
  statusLabel,
  timeAgo,
} from '../ticket';

const ticket = (over: Partial<Complaint>): Complaint => ({
  id: 'x',
  title: 't',
  description: 'd',
  location: 'l',
  hostel: 'H1',
  status: 'Open',
  ai_category: null,
  ai_priority: null,
  ai_department: null,
  supervisor_override: false,
  overridden_category: null,
  overridden_priority: null,
  overridden_department: null,
  created_by: 'u',
  supervisor_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
});

describe('statusLabel', () => {
  it('uses plain language instead of raw codes', () => {
    expect(statusLabel('UnderReview')).toBe('Under review');
    expect(statusLabel('InProgress')).toBe('Repair in progress');
  });

  it('only asks the student for confirmation', () => {
    expect(statusLabel('Resolved', 'Student')).toBe('Awaiting your confirmation');
    expect(statusLabel('Resolved', 'Maintenance Office')).toBe('Awaiting student confirmation');
  });
});

describe('progressStepIndex', () => {
  it('maps reopened tickets back to the review step', () => {
    expect(progressStepIndex('Reopened')).toBe(progressStepIndex('UnderReview'));
    expect(progressStepIndex('Closed')).toBe(4);
  });
});

describe('byUrgency', () => {
  it('puts critical first, and the oldest first within a priority', () => {
    const lowOld = ticket({ id: 'lowOld', ai_priority: 'Low', created_at: '2026-01-01T00:00:00Z' });
    const highNew = ticket({ id: 'highNew', ai_priority: 'High', created_at: '2026-01-03T00:00:00Z' });
    const highOld = ticket({ id: 'highOld', ai_priority: 'High', created_at: '2026-01-02T00:00:00Z' });
    const critOverride = ticket({ id: 'crit', ai_priority: 'Low', overridden_priority: 'Critical' });
    const ids = [lowOld, highNew, highOld, critOverride].sort(byUrgency).map(t => t.id);
    expect(ids).toEqual(['crit', 'highOld', 'highNew', 'lowOld']);
  });
});

describe('byStudentAttention', () => {
  it('surfaces tickets awaiting confirmation, then newest first', () => {
    const older = ticket({ id: 'older', created_at: '2026-01-01T00:00:00Z' });
    const newer = ticket({ id: 'newer', created_at: '2026-01-05T00:00:00Z' });
    const resolved = ticket({ id: 'resolved', status: 'Resolved', created_at: '2025-12-01T00:00:00Z' });
    expect([older, newer, resolved].sort(byStudentAttention).map(t => t.id)).toEqual(['resolved', 'newer', 'older']);
  });
});

describe('timeAgo', () => {
  const now = Date.parse('2026-01-10T12:00:00Z');
  it('formats recent times compactly', () => {
    expect(timeAgo('2026-01-10T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-01-10T11:55:00Z', now)).toBe('5 min ago');
    expect(timeAgo('2026-01-10T09:00:00Z', now)).toBe('3 hrs ago');
    expect(timeAgo('2026-01-09T12:00:00Z', now)).toBe('1 day ago');
  });

  it('returns an empty string for invalid dates', () => {
    expect(timeAgo('not a date', now)).toBe('');
  });
});
