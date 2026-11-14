import { describe, expect, it } from 'vitest';
import { buildSeed } from '../../../../scripts/seed-data.mjs';
import { classifyComplaint } from '../../ai/classifier';
import { COMPLAINT_STATUSES, TRANSITIONS, type ComplaintStatus, type WorkflowAction } from '../workflow';

interface SeedUser { id: string; email: string; hostel: string | null; role: { name: string } }
interface SeedComplaint {
  id: string; title: string; description: string; hostel: string; status: ComplaintStatus;
  ai_category: string; ai_priority: string; ai_department: string; created_by: string;
  supervisor_id: string; overridden_category: string | null; created_at: string; updated_at: string;
}
interface SeedAudit {
  complaint_id: string; action: string; performed_by: string; created_at: string;
  details: { previous_status?: ComplaintStatus; new_status?: ComplaintStatus };
}
interface SeedNotification { complaint_id: string; user_id: string; type: string; created_at: string }

const NOW = Date.parse('2026-12-01T12:00:00Z');
const seed = buildSeed(NOW) as unknown as {
  users: SeedUser[];
  complaints: SeedComplaint[];
  auditLogs: SeedAudit[];
  notifications: SeedNotification[];
};
const usersById = new Map(seed.users.map((u) => [u.id, u]));

/** The workflow action that moves a complaint from `from` to `to`. */
function actionFor(from: ComplaintStatus, to: ComplaintStatus): WorkflowAction | undefined {
  return (Object.keys(TRANSITIONS) as WorkflowAction[]).find(
    (a) => TRANSITIONS[a].to === to && TRANSITIONS[a].from.includes(from)
  );
}

describe('demo seed data', () => {
  it('has about 20 complaints across two hostels, each with its own supervisor', () => {
    expect(seed.complaints.length).toBeGreaterThanOrEqual(20);
    const hostels = new Set(seed.complaints.map((c) => c.hostel));
    expect(hostels).toEqual(new Set(['Hostel A', 'Hostel B']));
    for (const hostel of hostels) {
      const sups = seed.users.filter((u) => u.role.name === 'Hostel Supervisor' && u.hostel === hostel);
      expect(sups).toHaveLength(1);
    }
  });

  it('covers every status so each screen has something to show', () => {
    const present = new Set(seed.complaints.map((c) => c.status));
    for (const s of COMPLAINT_STATUSES) expect(present.has(s)).toBe(true);
  });

  it('keeps the original demo logins', () => {
    const emails = seed.users.map((u) => u.email);
    for (const e of ['student@giki.edu.pk', 'supervisor@giki.edu.pk', 'maintenance@giki.edu.pk']) {
      expect(emails).toContain(e);
    }
    expect(new Set(emails).size).toBe(emails.length);
  });

  it.each(seed.complaints.map((c) => [c.id, c] as const))(
    '%s: suggestion matches the triage rules',
    (_id, c) => {
      const p = classifyComplaint(c.title, c.description);
      expect([c.ai_category, c.ai_priority, c.ai_department]).toEqual([p.category, p.priority, p.department]);
    }
  );

  it.each(seed.complaints.map((c) => [c.id, c] as const))(
    '%s: belongs to its student\'s hostel and supervisor',
    (_id, c) => {
      const student = usersById.get(c.created_by)!;
      const supervisor = usersById.get(c.supervisor_id)!;
      expect(student.role.name).toBe('Student');
      expect(student.hostel).toBe(c.hostel);
      expect(supervisor.role.name).toBe('Hostel Supervisor');
      expect(supervisor.hostel).toBe(c.hostel);
    }
  );

  it.each(seed.complaints.map((c) => [c.id, c] as const))(
    '%s: audit trail is a legal path to its status, by the right roles',
    (_id, c) => {
      const logs = seed.auditLogs
        .filter((l) => l.complaint_id === c.id)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      expect(logs[0].action).toBe('TicketCreated');
      let status: ComplaintStatus = 'Open';
      for (const log of logs.slice(1)) {
        const { previous_status, new_status } = log.details;
        expect(previous_status).toBe(status);
        const action = actionFor(previous_status!, new_status!);
        expect(action, `${previous_status} -> ${new_status}`).toBeDefined();
        expect(usersById.get(log.performed_by)!.role.name).toBe(TRANSITIONS[action!].role);
        status = new_status!;
      }
      expect(status).toBe(c.status);
      for (const log of logs) expect(Date.parse(log.created_at)).toBeLessThanOrEqual(NOW);
    }
  );

  it('notifies real users about complaints that exist', () => {
    const ids = new Set(seed.complaints.map((c) => c.id));
    for (const n of seed.notifications) {
      expect(usersById.has(n.user_id)).toBe(true);
      expect(ids.has(n.complaint_id)).toBe(true);
    }
  });

  it('notifies the student of each status change they did not make', () => {
    for (const c of seed.complaints) {
      const changesByOthers = seed.auditLogs.filter(
        (l) => l.complaint_id === c.id && l.details.new_status && l.performed_by !== c.created_by
      ).length;
      const toStudent = seed.notifications.filter((n) => n.complaint_id === c.id && n.user_id === c.created_by).length;
      expect(toStudent).toBe(changesByOthers);
    }
  });
});
