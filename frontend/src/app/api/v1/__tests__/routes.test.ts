/**
 * HTTP-level tests for the /api/v1 route handlers.
 *
 * The handlers, auth (real signed tokens) and the complaints service all run
 * for real; only Firestore is replaced by an in-memory store. This catches
 * what the service tests can't: wrong status codes, missing auth checks,
 * request-body parsing and the `{ detail }` error shape.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuditLogDoc, ComplaintDoc, NotificationDoc, UserDoc } from '@/lib/server/db';

const mkUser = (id: string, role: UserDoc['role']['name'], hostel: string | null): UserDoc => ({
  id,
  email: `${id}@giki.edu.pk`,
  full_name: id,
  hostel,
  role_id: role,
  role: { id: role, name: role },
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
});

const student = mkUser('student', 'Student', 'Hostel A');
const otherStudent = mkUser('student2', 'Student', 'Hostel A');
const supervisor = mkUser('supervisor', 'Hostel Supervisor', 'Hostel A');
const maintenance = mkUser('maintenance', 'Maintenance Office', null);
const users = [student, otherStudent, supervisor, maintenance];

const store = {
  complaints: new Map<string, ComplaintDoc>(),
  audit: [] as AuditLogDoc[],
  notifications: [] as NotificationDoc[],
  seq: 0,
};

vi.mock('@/lib/firebase/admin', () => ({ db: {} }));
vi.mock('@/lib/server/db', () => ({
  getUserById: vi.fn(async (id: string) => users.find((u) => u.id === id) ?? null),
  getUserByEmail: vi.fn(
    async (email: string) => users.find((u) => u.email === email.trim().toLowerCase()) ?? null
  ),
  getSupervisorByHostel: vi.fn(
    async (hostel: string) =>
      users.find((u) => u.role.name === 'Hostel Supervisor' && u.hostel === hostel) ?? null
  ),
  getComplaintById: vi.fn(async (id: string) => store.complaints.get(id) ?? null),
  // Applies the same equality filters as the Firestore query in db.ts.
  getComplaints: vi.fn(
    async (
      f: { status?: string; statusIn?: readonly string[]; hostel?: string; createdBy?: string } = {}
    ) =>
      Array.from(store.complaints.values()).filter(
        (c) =>
          (!f.status || c.status === f.status) &&
          (f.status || !f.statusIn || f.statusIn.includes(c.status)) &&
          (!f.hostel || c.hostel === f.hostel) &&
          (!f.createdBy || c.created_by === f.createdBy)
      )
  ),
  // Same contract as the Firestore transaction in db.ts, minus the retries.
  updateComplaint: vi.fn(async (id: string, mutate: (c: ComplaintDoc) => ComplaintDoc) => {
    const current = store.complaints.get(id);
    if (!current) return null;
    const before = structuredClone(current);
    const after = mutate(structuredClone(current));
    store.complaints.set(id, structuredClone(after));
    return { before, after };
  }),
  saveComplaint: vi.fn(async (c: ComplaintDoc) => {
    store.complaints.set(c.id, structuredClone(c));
    return c;
  }),
  newComplaintId: () => `comp-${++store.seq}`,
  addAuditLog: vi.fn(async (log: Omit<AuditLogDoc, 'id' | 'created_at'>) => {
    const item = { ...log, id: `a${store.audit.length}`, created_at: new Date().toISOString() };
    store.audit.push(item);
    return item;
  }),
  getAuditLogs: vi.fn(async (id: string) => store.audit.filter((a) => a.complaint_id === id)),
  addNotification: vi.fn(async (n: Omit<NotificationDoc, 'id' | 'created_at' | 'is_read'>) => {
    const item = { ...n, id: `n${store.notifications.length}`, is_read: false, created_at: '' };
    store.notifications.push(item);
    return item;
  }),
  notifyRole: vi.fn(async (role: string, n: Omit<NotificationDoc, 'id' | 'created_at' | 'is_read' | 'user_id'>) => {
    for (const u of users.filter((x) => x.role.name === role)) {
      store.notifications.push({ ...n, user_id: u.id, id: `n${store.notifications.length}`, is_read: false, created_at: '' });
    }
  }),
  getNotifications: vi.fn(async (userId: string) =>
    store.notifications.filter((n) => n.user_id === userId && !n.is_read)
  ),
  markAllNotificationsRead: vi.fn(async (userId: string) => {
    store.notifications.filter((n) => n.user_id === userId).forEach((n) => (n.is_read = true));
  }),
}));

import { POST as login } from '../auth/login/route';
import { GET as me } from '../auth/me/route';
import { GET as listComplaints, POST as createComplaint } from '../complaints/route';
import { GET as getComplaint } from '../complaints/[id]/route';
import { GET as auditLogs } from '../complaints/[id]/audit_logs/route';
import { PATCH as confirm } from '../complaints/[id]/confirm/route';
import { PATCH as forward } from '../complaints/[id]/forward/route';
import { PATCH as progress } from '../complaints/[id]/progress/route';
import { PATCH as reopen } from '../complaints/[id]/reopen/route';
import { PATCH as resolve } from '../complaints/[id]/resolve/route';
import { PATCH as review } from '../complaints/[id]/review/route';
import { GET as maintenanceQueue } from '../maintenance/complaints/route';
import { GET as notifications } from '../notifications/route';
import { PATCH as readNotifications } from '../notifications/read/route';

const BASE = 'http://localhost/api/v1';

function req(method: string, path: string, opts: { token?: string; body?: unknown; raw?: string } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  const body = opts.raw ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body));
  return new Request(`${BASE}${path}`, { method, headers, body });
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

async function tokenFor(user: UserDoc): Promise<string> {
  const res = await login(req('POST', '/auth/login', { body: { email: user.email } }), undefined);
  expect(res.status).toBe(200);
  return (await res.json()).access_token;
}

const tokens = {} as Record<'student' | 'otherStudent' | 'supervisor' | 'maintenance', string>;

beforeEach(async () => {
  process.env.JWT_SECRET = 'route-test-secret-that-is-at-least-32-chars';
  store.complaints.clear();
  store.audit.length = 0;
  store.notifications.length = 0;
  store.seq = 0;
  tokens.student = await tokenFor(student);
  tokens.otherStudent = await tokenFor(otherStudent);
  tokens.supervisor = await tokenFor(supervisor);
  tokens.maintenance = await tokenFor(maintenance);
});

const newComplaint = { title: 'Leaking tap', description: 'Water everywhere', location: 'Room 12' };

async function create(): Promise<ComplaintDoc> {
  const res = await createComplaint(req('POST', '/complaints', { token: tokens.student, body: newComplaint }), undefined);
  expect(res.status).toBe(201);
  return res.json();
}

describe('POST /auth/login', () => {
  it('returns a bearer token and role for a known email', async () => {
    const res = await login(req('POST', '/auth/login', { body: { email: supervisor.email } }), undefined);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ token_type: 'bearer', role: 'Hostel Supervisor', user_id: 'supervisor' });
    expect(body.access_token).toEqual(expect.any(String));
  });

  it('400 when email is missing, blank or not a string', async () => {
    for (const body of [{}, { email: '  ' }, { email: 42 }]) {
      const res = await login(req('POST', '/auth/login', { body }), undefined);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ detail: 'Email is required.' });
    }
  });

  it('400 on a malformed JSON body instead of crashing', async () => {
    const res = await login(req('POST', '/auth/login', { raw: '{not json' }), undefined);
    expect(res.status).toBe(400);
  });

  it('401 for an unknown email', async () => {
    const res = await login(req('POST', '/auth/login', { body: { email: 'nobody@giki.edu.pk' } }), undefined);
    expect(res.status).toBe(401);
  });
});

describe('authentication on protected routes', () => {
  const protectedCalls: [string, () => Promise<Response>][] = [
    ['GET /auth/me', () => me(req('GET', '/auth/me'), undefined)],
    ['GET /complaints', () => listComplaints(req('GET', '/complaints'), undefined)],
    ['POST /complaints', () => createComplaint(req('POST', '/complaints', { body: newComplaint }), undefined)],
    ['GET /complaints/:id', () => getComplaint(req('GET', '/complaints/x'), ctx('x'))],
    ['GET /complaints/:id/audit_logs', () => auditLogs(req('GET', '/complaints/x/audit_logs'), ctx('x'))],
    ['PATCH /complaints/:id/review', () => review(req('PATCH', '/complaints/x/review', { body: {} }), ctx('x'))],
    ['PATCH /complaints/:id/forward', () => forward(req('PATCH', '/complaints/x/forward'), ctx('x'))],
    ['PATCH /complaints/:id/progress', () => progress(req('PATCH', '/complaints/x/progress'), ctx('x'))],
    ['PATCH /complaints/:id/resolve', () => resolve(req('PATCH', '/complaints/x/resolve'), ctx('x'))],
    ['PATCH /complaints/:id/confirm', () => confirm(req('PATCH', '/complaints/x/confirm'), ctx('x'))],
    ['PATCH /complaints/:id/reopen', () => reopen(req('PATCH', '/complaints/x/reopen'), ctx('x'))],
    ['GET /maintenance/complaints', () => maintenanceQueue(req('GET', '/maintenance/complaints'), undefined)],
    ['GET /notifications', () => notifications(req('GET', '/notifications'), undefined)],
    ['PATCH /notifications/read', () => readNotifications(req('PATCH', '/notifications/read'), undefined)],
  ];

  it.each(protectedCalls)('%s returns 401 without a token', async (_name, call) => {
    const res = await call();
    expect(res.status).toBe(401);
    expect(await res.json()).toHaveProperty('detail');
  });

  it('rejects a tampered token', async () => {
    const res = await me(req('GET', '/auth/me', { token: `${tokens.student}x` }), undefined);
    expect(res.status).toBe(401);
  });

  it('GET /auth/me returns the caller', async () => {
    const res = await me(req('GET', '/auth/me', { token: tokens.student }), undefined);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 'student', role: { name: 'Student' } });
  });
});

describe('complaint lifecycle over HTTP', () => {
  it('runs Open → Closed with the right status codes and audit trail', async () => {
    const c = await create();
    expect(c).toMatchObject({ status: 'Open', ai_category: 'Plumbing', ai_priority: 'Medium' });

    const reviewBody = { category: 'Plumbing', priority: 'High', department: 'Plumbing', override: false };
    const steps: [string, Response][] = [];
    steps.push(['review', await review(req('PATCH', `/complaints/${c.id}/review`, { token: tokens.supervisor, body: reviewBody }), ctx(c.id))]);
    steps.push(['forward', await forward(req('PATCH', `/complaints/${c.id}/forward`, { token: tokens.supervisor }), ctx(c.id))]);
    steps.push(['progress', await progress(req('PATCH', `/complaints/${c.id}/progress`, { token: tokens.maintenance, body: { note: 'on it' } }), ctx(c.id))]);
    steps.push(['resolve', await resolve(req('PATCH', `/complaints/${c.id}/resolve`, { token: tokens.maintenance, body: { resolution_note: 'replaced washer' } }), ctx(c.id))]);
    steps.push(['confirm', await confirm(req('PATCH', `/complaints/${c.id}/confirm`, { token: tokens.student }), ctx(c.id))]);

    const statuses = [];
    for (const [, res] of steps) {
      expect(res.status).toBe(200);
      statuses.push((await res.json()).status);
    }
    expect(statuses).toEqual(['UnderReview', 'Forwarded', 'InProgress', 'Resolved', 'Closed']);

    const logs = await auditLogs(req('GET', `/complaints/${c.id}/audit_logs`, { token: tokens.student }), ctx(c.id));
    expect(logs.status).toBe(200);
    expect((await logs.json()).map((l: AuditLogDoc) => l.action)).toEqual([
      'TicketCreated',
      'SupervisorReviewed',
      'ForwardedToMaintenance',
      'StatusUpdated',
      'StatusUpdated',
      'StudentConfirmed',
    ]);
  });

  it('reopen requires a reason and returns 400 without one', async () => {
    const c = await create();
    store.complaints.get(c.id)!.status = 'Resolved';
    const bad = await reopen(req('PATCH', `/complaints/${c.id}/reopen`, { token: tokens.student, body: {} }), ctx(c.id));
    expect(bad.status).toBe(400);
    const ok = await reopen(req('PATCH', `/complaints/${c.id}/reopen`, { token: tokens.student, body: { reason: 'still leaking' } }), ctx(c.id));
    expect(ok.status).toBe(200);
    expect((await ok.json()).status).toBe('Reopened');
  });
});

describe('error mapping', () => {
  it('409 with a detail message for an illegal transition', async () => {
    const c = await create();
    const res = await confirm(req('PATCH', `/complaints/${c.id}/confirm`, { token: tokens.student }), ctx(c.id));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ detail: expect.any(String) });
  });

  it('403 for the wrong role', async () => {
    const c = await create();
    const res = await forward(req('PATCH', `/complaints/${c.id}/forward`, { token: tokens.student }), ctx(c.id));
    expect(res.status).toBe(403);
  });

  it("403 when a student reads someone else's complaint", async () => {
    const c = await create();
    const res = await getComplaint(req('GET', `/complaints/${c.id}`, { token: tokens.otherStudent }), ctx(c.id));
    expect(res.status).toBe(403);
    const logs = await auditLogs(req('GET', `/complaints/${c.id}/audit_logs`, { token: tokens.otherStudent }), ctx(c.id));
    expect(logs.status).toBe(403);
  });

  it('404 for an unknown complaint', async () => {
    const res = await getComplaint(req('GET', '/complaints/missing', { token: tokens.student }), ctx('missing'));
    expect(res.status).toBe(404);
  });

  it('400 for an unknown status filter', async () => {
    const res = await listComplaints(req('GET', '/complaints?status=Bogus', { token: tokens.student }), undefined);
    expect(res.status).toBe(400);
  });

  it('400 when creating a complaint with missing fields', async () => {
    const res = await createComplaint(req('POST', '/complaints', { token: tokens.student, body: { title: 'x' } }), undefined);
    expect(res.status).toBe(400);
  });

  it('500 with a generic message when the database fails', async () => {
    const db = await import('@/lib/server/db');
    vi.mocked(db.getComplaints).mockRejectedValueOnce(new Error('firestore unavailable'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await listComplaints(req('GET', '/complaints', { token: tokens.student }), undefined);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ detail: 'Internal server error' });
    spy.mockRestore();
  });
});

describe('listing and visibility', () => {
  it('students only see their own complaints', async () => {
    await create();
    const mine = await listComplaints(req('GET', '/complaints', { token: tokens.student }), undefined);
    expect(await mine.json()).toHaveLength(1);
    const theirs = await listComplaints(req('GET', '/complaints', { token: tokens.otherStudent }), undefined);
    expect(await theirs.json()).toHaveLength(0);
  });

  it('maintenance queue is empty until a complaint is forwarded, and closed to students', async () => {
    const c = await create();
    const empty = await maintenanceQueue(req('GET', '/maintenance/complaints', { token: tokens.maintenance }), undefined);
    expect(await empty.json()).toHaveLength(0);

    store.complaints.get(c.id)!.status = 'Forwarded';
    const queue = await maintenanceQueue(req('GET', '/maintenance/complaints', { token: tokens.maintenance }), undefined);
    expect(await queue.json()).toHaveLength(1);

    const denied = await maintenanceQueue(req('GET', '/maintenance/complaints', { token: tokens.student }), undefined);
    expect(denied.status).toBe(403);
  });
});

describe('notifications', () => {
  it('supervisor is notified of a new complaint and can mark all read', async () => {
    await create();
    const list = await notifications(req('GET', '/notifications', { token: tokens.supervisor }), undefined);
    expect(list.status).toBe(200);
    expect((await list.json()).length).toBeGreaterThan(0);

    const read = await readNotifications(req('PATCH', '/notifications/read', { token: tokens.supervisor }), undefined);
    expect(read.status).toBe(200);
    const after = await notifications(req('GET', '/notifications', { token: tokens.supervisor }), undefined);
    expect(await after.json()).toHaveLength(0);
  });
});
