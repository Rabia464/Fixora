import { describe, expect, it } from 'vitest';
import {
  assertRole,
  assertTransition,
  COMPLAINT_STATUSES,
  TRANSITIONS,
  WorkflowError,
} from '../workflow';

describe('assertTransition', () => {
  it('walks the happy path in order', () => {
    expect(assertTransition('review', 'Open')).toBe('UnderReview');
    expect(assertTransition('forward', 'UnderReview')).toBe('Forwarded');
    expect(assertTransition('progress', 'Forwarded')).toBe('InProgress');
    expect(assertTransition('resolve', 'InProgress')).toBe('Resolved');
    expect(assertTransition('confirm', 'Resolved')).toBe('Closed');
  });

  it('lets a reopened complaint re-enter review', () => {
    expect(assertTransition('reopen', 'Resolved')).toBe('Reopened');
    expect(assertTransition('reopen', 'Closed')).toBe('Reopened');
    expect(assertTransition('review', 'Reopened')).toBe('UnderReview');
  });

  it('rejects every illegal source state with a 409', () => {
    for (const [action, rule] of Object.entries(TRANSITIONS)) {
      for (const status of COMPLAINT_STATUSES) {
        if (rule.from.includes(status)) continue;
        expect(() => assertTransition(action as keyof typeof TRANSITIONS, status)).toThrowError(
          expect.objectContaining({ status: 409, message: rule.message })
        );
      }
    }
  });

  it('specifically blocks the skip-ahead bugs the old routes allowed', () => {
    expect(() => assertTransition('confirm', 'Open')).toThrow(WorkflowError);
    expect(() => assertTransition('forward', 'Open')).toThrow(WorkflowError);
    expect(() => assertTransition('progress', 'Open')).toThrow(WorkflowError);
    expect(() => assertTransition('resolve', 'Forwarded')).toThrow(WorkflowError);
  });
});

describe('assertRole', () => {
  it('maps each action to exactly one role', () => {
    expect(() => assertRole('review', 'Hostel Supervisor')).not.toThrow();
    expect(() => assertRole('review', 'Student')).toThrowError(
      expect.objectContaining({ status: 403 })
    );
    expect(() => assertRole('confirm', 'Maintenance Office')).toThrowError(
      expect.objectContaining({ status: 403 })
    );
    expect(() => assertRole('resolve', 'Maintenance Office')).not.toThrow();
  });
});
