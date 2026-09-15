import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComplaintDoc, UserDoc } from '../db';

// In-memory stand-in for Firestore so the service's guards run for real.
const store = {
  complaints: new Map<string, ComplaintDoc>(),
  audit: [] as { action: string; complaint_id?: string | null; details: Record<string, unknown> }[],
  notifications: [] as { user_id: string; type: string }[],
};

vi.mock('../../firebase/admin', () => ({ db: {} }));
vi.mock('../db', () => ({
  getComplaintById: vi.fn(async (id: string) => store.complaints.get(id) ?? null),
  saveComplaint: vi.fn(async (c: ComplaintDoc) => {
    store.complaints.set(c.id, c);
    return c;
  }),
  getComplaints: vi.fn(async () => Array.from(store.complaints.values())),
  addAuditLog: vi.fn(async (log: (typeof store.audit)[number]) => {
    store.audit.push(log);
    return log;
  }),
  addNotification: vi.fn(async (n: (typeof store.notifications)[number]) => {
    store.notifications.push(n);
    return n;
  }),
  notifyRole: vi.fn(async (role: string, n: { type: string }) => {
    store.notifications.push({ user_id: `role:${role}`, type: n.type });
  }),
  getSupervisorByHostel: vi.fn(async (hostel: string) => (hostel === 'Hostel A' ? supervisor : null)),
  newComplaintId: () => 'comp-test',
}));

import {
  confirmResolution,
  createComplaint,
  forwardToMaintenance,
  getVisibleComplaint,
  reopenComplaint,
  resolveComplaint,
  supervisorReview,
  updateProgress,
} from '../complaints';

const mkUser = (id: string, role: UserDoc['role']['name'], hostel: string | null): UserDoc => ({
  id,
  email: `${id}@giki.edu.pk`,
  full_name: id,
  hostel,
  role_id: role,
  role: { id: role, name: role },
  created_at: '',
  updated_at: '',
});

const student = mkUser('u-student-01', 'Student', 'Hostel A');
const otherStudent = mkUser('u-student-02', 'Student', 'Hostel A');
const supervisor = mkUser('u-supervisor-01', 'Hostel Supervisor', 'Hostel A');
const otherHostelSup = mkUser('u-supervisor-02', 'Hostel Supervisor', 'Hostel B');
const maintenance = mkUser('u-maintenance-01', 'Maintenance Office', null);

const review = { category: 'Plumbing', priority: 'High', department: 'Plumbing', override: false };

beforeEach(() => {
  store.complaints.clear();
  store.audit.length = 0;
  store.notifications.length = 0;
});

async function seedOpen(): Promise<ComplaintDoc> {
  return createComplaint(
    { title: 'Leaking tap', description: 'Water everywhere', location: 'Room 1' },
    student
  );
}

describe('full lifecycle', () => {
  it('Open → UnderReview → Forwarded → InProgress → Resolved → Closed', async () => {
    const c = await seedOpen();
    expect(c.status).toBe('Open');
    expect(c.supervisor_id).toBe(supervisor.id);

    expect((await supervisorReview(c.id, review, supervisor)).status).toBe('UnderReview');
    expect((await forwardToMaintenance(c.id, supervisor)).status).toBe('Forwarded');
    expect((await updateProgress(c.id, 'on it', maintenance)).status).toBe('InProgress');
    expect((await resolveComplaint(c.id, 'fixed', maintenance)).status).toBe('Resolved');
    expect((await confirmResolution(c.id, student)).status).toBe('Closed');

    expect(store.audit.map((a) => a.action)).toEqual([
      'TicketCreated',
      'SupervisorReviewed',
      'ForwardedToMaintenance',
      'StatusUpdated',
      'StatusUpdated',
      'StudentConfirmed',
    ]);
    expect(store.notifications.map((n) => n.type)).toEqual([
      'ComplaintCreated',
      'StatusUpdated',
      'MaintenanceStarted',
      'ResolutionPendingConfirmation',
      'ComplaintClosed',
    ]);
  });

  it('reopen goes back through review', async () => {
    const c = await seedOpen();
    await supervisorReview(c.id, review, supervisor);
    await forwardToMaintenance(c.id, supervisor);
    await updateProgress(c.id, null, maintenance);
    await resolveComplaint(c.id, 'done', maintenance);

    expect((await reopenComplaint(c.id, 'still leaking', student)).status).toBe('Reopened');
    expect((await supervisorReview(c.id, review, supervisor)).status).toBe('UnderReview');
    expect(store.audit.at(-2)?.action).toBe('StudentReopened');
  });

  it('records an override distinctly', async () => {
    const c = await seedOpen();
    const r = await supervisorReview(c.id, { ...review, priority: 'Critical', override: true }, supervisor);
    expect(r.supervisor_override).toBe(true);
    expect(r.overridden_priority).toBe('Critical');
    expect(store.audit.at(-1)?.action).toBe('SupervisorOverride');
  });
});

describe('state guards (409)', () => {
  it('student cannot close an Open complaint', async () => {
    const c = await seedOpen();
    await expect(confirmResolution(c.id, student)).rejects.toMatchObject({ status: 409 });
    expect(store.complaints.get(c.id)?.status).toBe('Open');
  });

  it('supervisor cannot forward before reviewing', async () => {
    const c = await seedOpen();
    await expect(forwardToMaintenance(c.id, supervisor)).rejects.toMatchObject({ status: 409 });
  });

  it('maintenance cannot start or resolve out of order', async () => {
    const c = await seedOpen();
    await expect(updateProgress(c.id, null, maintenance)).rejects.toMatchObject({ status: 409 });
    await supervisorReview(c.id, review, supervisor);
    await forwardToMaintenance(c.id, supervisor);
    await expect(resolveComplaint(c.id, 'x', maintenance)).rejects.toMatchObject({ status: 409 });
  });

  it('cannot reopen an in-flight complaint', async () => {
    const c = await seedOpen();
    await expect(reopenComplaint(c.id, 'why', student)).rejects.toMatchObject({ status: 409 });
  });

  it('writes nothing when a transition is rejected', async () => {
    const c = await seedOpen();
    const before = { audit: store.audit.length, notif: store.notifications.length };
    await expect(confirmResolution(c.id, student)).rejects.toBeDefined();
    expect(store.audit.length).toBe(before.audit);
    expect(store.notifications.length).toBe(before.notif);
  });
});

describe('role and scope guards (403)', () => {
  it('wrong role', async () => {
    const c = await seedOpen();
    await expect(supervisorReview(c.id, review, student)).rejects.toMatchObject({ status: 403 });
    await expect(forwardToMaintenance(c.id, maintenance)).rejects.toMatchObject({ status: 403 });
    await expect(updateProgress(c.id, null, supervisor)).rejects.toMatchObject({ status: 403 });
    await expect(confirmResolution(c.id, supervisor)).rejects.toMatchObject({ status: 403 });
    await expect(
      createComplaint({ title: 't', description: 'd', location: 'l' }, supervisor)
    ).rejects.toMatchObject({ status: 403 });
  });

  it('supervisor from another hostel', async () => {
    const c = await seedOpen();
    await expect(supervisorReview(c.id, review, otherHostelSup)).rejects.toMatchObject({ status: 403 });
    await expect(getVisibleComplaint(c.id, otherHostelSup)).rejects.toMatchObject({ status: 403 });
  });

  it('student who does not own the complaint', async () => {
    const c = await seedOpen();
    await expect(getVisibleComplaint(c.id, otherStudent)).rejects.toMatchObject({ status: 403 });
    await supervisorReview(c.id, review, supervisor);
    await forwardToMaintenance(c.id, supervisor);
    await updateProgress(c.id, null, maintenance);
    await resolveComplaint(c.id, 'ok', maintenance);
    await expect(confirmResolution(c.id, otherStudent)).rejects.toMatchObject({ status: 403 });
  });

  it('maintenance cannot see a complaint that has not reached them', async () => {
    const c = await seedOpen();
    await expect(getVisibleComplaint(c.id, maintenance)).rejects.toMatchObject({ status: 403 });
    await supervisorReview(c.id, review, supervisor);
    await forwardToMaintenance(c.id, supervisor);
    await expect(getVisibleComplaint(c.id, maintenance)).resolves.toMatchObject({ status: 'Forwarded' });
  });
});

describe('validation (400/404)', () => {
  it('missing fields', async () => {
    await expect(createComplaint({ title: 't' }, student)).rejects.toMatchObject({ status: 400 });
    const c = await seedOpen();
    await expect(
      supervisorReview(c.id, { ...review, priority: 'Urgent' }, supervisor)
    ).rejects.toMatchObject({ status: 400 });
  });

  it('resolution note and reopen reason are required', async () => {
    const c = await seedOpen();
    await supervisorReview(c.id, review, supervisor);
    await forwardToMaintenance(c.id, supervisor);
    await updateProgress(c.id, null, maintenance);
    await expect(resolveComplaint(c.id, '   ', maintenance)).rejects.toMatchObject({ status: 400 });
    await resolveComplaint(c.id, 'ok', maintenance);
    await expect(reopenComplaint(c.id, '', student)).rejects.toMatchObject({ status: 400 });
  });

  it('unknown id', async () => {
    await expect(getVisibleComplaint('nope', student)).rejects.toMatchObject({ status: 404 });
    await expect(forwardToMaintenance('nope', supervisor)).rejects.toMatchObject({ status: 404 });
  });
});
