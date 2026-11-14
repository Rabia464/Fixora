/**
 * Demo data for `npm run seed`, kept apart from the Firestore writes so it can
 * be checked by tests (src/lib/server/__tests__/seed-data.test.ts).
 *
 * Every complaint is built by replaying the real lifecycle step by step, so
 * its status, audit trail and notifications agree with each other and with the
 * rules in src/lib/server/workflow.ts and complaints.ts.
 *
 * Accounts (all sign in with email only, see the Scope Document X6):
 *   student@giki.edu.pk       Student, Hostel A
 *   student2@giki.edu.pk      Student, Hostel A
 *   student.b@giki.edu.pk     Student, Hostel B
 *   supervisor@giki.edu.pk    Hostel Supervisor, Hostel A
 *   supervisor.b@giki.edu.pk  Hostel Supervisor, Hostel B
 *   maintenance@giki.edu.pk   Maintenance Office (all hostels)
 *
 * Two hostels let the demo show that a supervisor cannot open another
 * hostel's complaint (403).
 */

const HOUR = 3600 * 1000;

const ROLE = {
  Student: { id: 'role-student', name: 'Student' },
  'Hostel Supervisor': { id: 'role-supervisor', name: 'Hostel Supervisor' },
  'Maintenance Office': { id: 'role-maintenance', name: 'Maintenance Office' },
};

const user = (id, email, full_name, roleName, hostel) => ({
  id,
  email,
  full_name,
  hostel,
  role_id: ROLE[roleName].id,
  role: ROLE[roleName],
});

const USER_LIST = [
  user('u-student-01', 'student@giki.edu.pk', 'Demo Student', 'Student', 'Hostel A'),
  user('u-student-02', 'student2@giki.edu.pk', 'Demo Student Two', 'Student', 'Hostel A'),
  user('u-student-03', 'student.b@giki.edu.pk', 'Demo Student (Hostel B)', 'Student', 'Hostel B'),
  user('u-supervisor-01', 'supervisor@giki.edu.pk', 'Demo Hostel Supervisor', 'Hostel Supervisor', 'Hostel A'),
  user('u-supervisor-02', 'supervisor.b@giki.edu.pk', 'Demo Supervisor (Hostel B)', 'Hostel Supervisor', 'Hostel B'),
  user('u-maintenance-01', 'maintenance@giki.edu.pk', 'Demo Maintenance Office', 'Maintenance Office', null),
];

const SUPERVISOR_FOR = { 'Hostel A': 'u-supervisor-01', 'Hostel B': 'u-supervisor-02' };

/**
 * The sample complaints. `ai` is what the keyword rules suggest for the title
 * and description (checked by the seed-data test); `review` is set where the
 * supervisor changes the suggestion. `status` is where the replay stops.
 */
export const SAMPLE_COMPLAINTS = [
  {
    id: 'comp-001', by: 'u-student-01', status: 'Open', ageHours: 5,
    title: 'Water pipe leaking under bathroom washbasin',
    description: 'The pipe has a persistent leak causing water pooling in the washroom.',
    location: 'Room 204, second floor',
    ai: ['Plumbing', 'High', 'Plumbing'],
  },
  {
    id: 'comp-002', by: 'u-student-01', status: 'Forwarded', ageHours: 12,
    title: 'Ceiling fan making grinding noise and sparking',
    description: 'Fan regulator sparks when switched to maximum speed.',
    location: 'Room 108, ground floor',
    ai: ['Electrical', 'Critical', 'Electrical'],
  },
  {
    id: 'comp-003', by: 'u-student-01', status: 'Resolved', ageHours: 60,
    title: 'Wardrobe door hinge broken',
    description: 'The left door of my wardrobe has come off its hinge and will not close.',
    location: 'Room 204, second floor',
    ai: ['Furniture', 'High', 'Maintenance'],
    review: ['Furniture', 'Low', 'Maintenance'],
    resolution: 'Hinge replaced and door realigned.',
  },
  {
    id: 'comp-004', by: 'u-student-01', status: 'Closed', ageHours: 140,
    title: 'Tube light flickering in study area',
    description: 'The tube light above the study table flickers constantly and gives a headache.',
    location: 'Room 204, second floor',
    ai: ['Electrical', 'Medium', 'Electrical'],
    resolution: 'Starter and choke replaced.',
  },
  {
    id: 'comp-005', by: 'u-student-01', status: 'Reopened', ageHours: 96,
    title: 'Shower has no hot water',
    description: 'The shower in the second floor washroom only gives cold water since Monday.',
    location: 'Second floor washroom',
    ai: ['Plumbing', 'Medium', 'Plumbing'],
    review: ['Plumbing', 'High', 'Plumbing'],
    resolution: 'Geyser thermostat reset.',
    reopenReason: 'Hot water worked for one day and stopped again.',
  },
  {
    id: 'comp-006', by: 'u-student-02', status: 'UnderReview', ageHours: 8,
    title: 'Cockroaches in common room',
    description: 'There are cockroaches near the kitchenette in the common room, especially at night.',
    location: 'Ground floor common room',
    ai: ['Sanitation', 'Medium', 'Sanitation'],
  },
  {
    id: 'comp-007', by: 'u-student-02', status: 'InProgress', ageHours: 30,
    title: 'Socket burnt and smells of smoke',
    description: 'The wall socket next to my bed is black and there was a spark when I plugged in my charger.',
    location: 'Room 112, ground floor',
    ai: ['Electrical', 'Critical', 'Electrical'],
  },
  {
    id: 'comp-008', by: 'u-student-02', status: 'Open', ageHours: 2,
    title: 'Room door lock jammed',
    description: 'The key turns but the lock does not open; I have to push hard each time.',
    location: 'Room 112, ground floor',
    ai: ['Furniture', 'Medium', 'Maintenance'],
  },
  {
    id: 'comp-009', by: 'u-student-02', status: 'Closed', ageHours: 200,
    title: 'Garbage not collected from corridor bin',
    description: 'The corridor bin has not been emptied for three days and is overflowing.',
    location: 'First floor corridor',
    ai: ['Sanitation', 'Medium', 'Sanitation'],
    review: ['Sanitation', 'High', 'Sanitation'],
    resolution: 'Bin emptied; collection added to the daily schedule.',
  },
  {
    id: 'comp-010', by: 'u-student-01', status: 'Forwarded', ageHours: 20,
    title: 'Internet not working in room',
    description: 'The LAN port in my room has had no connection for two days.',
    location: 'Room 204, second floor',
    ai: ['General', 'Medium', 'Maintenance'],
    review: ['Electrical', 'Medium', 'Electrical'],
  },
  {
    id: 'comp-011', by: 'u-student-02', status: 'Resolved', ageHours: 50,
    title: 'Toilet flush not working',
    description: 'The flush handle in the first floor toilet is loose and does not flush.',
    location: 'First floor toilet, cubicle 2',
    ai: ['Plumbing', 'Medium', 'Plumbing'],
    resolution: 'Flush mechanism and handle replaced.',
  },
  {
    id: 'comp-012', by: 'u-student-01', status: 'Open', ageHours: 1,
    title: 'Window glass cracked',
    description: 'The window glass in my room cracked during the storm last night.',
    location: 'Room 204, second floor',
    ai: ['Furniture', 'Medium', 'Maintenance'],
  },
  {
    id: 'comp-013', by: 'u-student-02', status: 'InProgress', ageHours: 26,
    title: 'Water leaking from ceiling',
    description: 'Water is dripping from the ceiling onto the corridor floor after rain.',
    location: 'Second floor corridor near stairs',
    ai: ['Plumbing', 'High', 'Plumbing'],
  },
  {
    id: 'comp-014', by: 'u-student-03', status: 'Open', ageHours: 4,
    title: 'Study chair broken',
    description: 'One leg of the study chair is cracked and it wobbles.',
    location: 'Room 15, Block 1',
    ai: ['Furniture', 'High', 'Maintenance'],
  },
  {
    id: 'comp-015', by: 'u-student-03', status: 'UnderReview', ageHours: 10,
    title: 'Drain blocked in washroom',
    description: 'The floor drain is blocked and water stays on the floor after showers.',
    location: 'Block 1 washroom',
    ai: ['Plumbing', 'Medium', 'Plumbing'],
    review: ['Plumbing', 'High', 'Plumbing'],
  },
  {
    id: 'comp-016', by: 'u-student-03', status: 'Forwarded', ageHours: 18,
    title: 'Corridor lights not working',
    description: 'All the lights in the Block 2 corridor are off at night, it is unsafe.',
    location: 'Block 2 corridor',
    ai: ['Electrical', 'High', 'Electrical'],
  },
  {
    id: 'comp-017', by: 'u-student-03', status: 'Closed', ageHours: 170,
    title: 'Bad smell from washroom',
    description: 'There is a strong smell from the washroom that reaches the rooms.',
    location: 'Block 1 washroom',
    ai: ['Plumbing', 'Medium', 'Plumbing'],
    review: ['Sanitation', 'Medium', 'Sanitation'],
    resolution: 'Washroom deep cleaned and exhaust fan repaired.',
  },
  {
    id: 'comp-018', by: 'u-student-03', status: 'Resolved', ageHours: 45,
    title: 'Fan regulator loose',
    description: 'The fan regulator knob is loose and the fan speed changes by itself.',
    location: 'Room 15, Block 1',
    ai: ['Electrical', 'Medium', 'Electrical'],
    resolution: 'Regulator tightened and knob replaced.',
  },
  {
    id: 'comp-019', by: 'u-student-03', status: 'InProgress', ageHours: 34,
    title: 'Gas smell near kitchen',
    description: 'There is a gas smell near the Block 2 pantry stove.',
    location: 'Block 2 pantry',
    ai: ['Sanitation', 'Critical', 'Sanitation'],
    review: ['General', 'Critical', 'Maintenance'],
  },
  {
    id: 'comp-020', by: 'u-student-03', status: 'Open', ageHours: 3,
    title: 'Mattress torn',
    description: 'The mattress cover is torn and the foam is coming out.',
    location: 'Room 22, Block 2',
    ai: ['General', 'Medium', 'Maintenance'],
  },
];

/** Builds users, complaints, audit logs and notifications as of `now`. */
export function buildSeed(now = Date.now()) {
  const iso = (ms) => new Date(ms).toISOString();
  const users = USER_LIST.map((u) => ({ ...u, created_at: iso(now - 400 * HOUR), updated_at: iso(now - 400 * HOUR) }));
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  const maintenanceIds = users.filter((u) => u.role.name === 'Maintenance Office').map((u) => u.id);

  const complaints = [];
  const auditLogs = [];
  const notifications = [];

  for (const sample of SAMPLE_COMPLAINTS) {
    const student = byId[sample.by];
    const hostel = student.hostel;
    const supervisor = byId[SUPERVISOR_FOR[hostel]];
    const [aiCategory, aiPriority, aiDepartment] = sample.ai;
    const start = now - sample.ageHours * HOUR;
    // Steps are spread evenly between filing and an hour ago.
    const stepGap = Math.max((sample.ageHours - 1) / 7, 0.1) * HOUR;
    let step = 0;
    const at = () => iso(start + step++ * stepGap);

    const c = {
      id: sample.id,
      title: sample.title,
      description: sample.description,
      location: sample.location,
      hostel,
      status: 'Open',
      ai_category: aiCategory,
      ai_priority: aiPriority,
      ai_department: aiDepartment,
      supervisor_override: false,
      overridden_category: null,
      overridden_priority: null,
      overridden_department: null,
      created_by: student.id,
      supervisor_id: supervisor.id,
      created_at: iso(start),
      updated_at: iso(start),
    };

    let seq = 0;
    const log = (action, actor, details, ts) => {
      auditLogs.push({
        id: `audit-${sample.id}-${++seq}`,
        action,
        performed_by: actor.id,
        actor_name: actor.full_name,
        actor_email: actor.email,
        complaint_id: c.id,
        details,
        created_at: ts,
      });
    };
    let nseq = 0;
    const notify = (userIds, type, payload, ts) => {
      for (const userId of userIds) {
        notifications.push({
          id: `notif-${sample.id}-${++nseq}`,
          user_id: userId,
          complaint_id: c.id,
          type,
          payload: { complaint_id: c.id, title: c.title, ...payload },
          // Anything older than a day has been seen; recent activity is unread.
          is_read: now - new Date(ts).getTime() > 24 * HOUR,
          created_at: ts,
        });
      }
    };
    const move = (to, ts) => {
      const from = c.status;
      c.status = to;
      c.updated_at = ts;
      return { previous_status: from, new_status: to };
    };

    const path = {
      Open: [],
      UnderReview: ['review'],
      Forwarded: ['review', 'forward'],
      InProgress: ['review', 'forward', 'progress'],
      Resolved: ['review', 'forward', 'progress', 'resolve'],
      Closed: ['review', 'forward', 'progress', 'resolve', 'confirm'],
      Reopened: ['review', 'forward', 'progress', 'resolve', 'reopen'],
    }[sample.status];
    if (!path) throw new Error(`Unknown target status ${sample.status} for ${sample.id}`);

    let ts = at();
    log('TicketCreated', student, {
      title: c.title, location: c.location, hostel,
      ai_category: aiCategory, ai_priority: aiPriority, ai_department: aiDepartment,
    }, ts);
    notify([supervisor.id], 'ComplaintCreated', { location: c.location, hostel }, ts);

    for (const action of path) {
      ts = at();
      switch (action) {
        case 'review': {
          const [category, priority, department] = sample.review ?? sample.ai;
          const override = !!sample.review;
          const changes = {};
          if (category !== aiCategory) changes.category = { from: aiCategory, to: category };
          if (priority !== aiPriority) changes.priority = { from: aiPriority, to: priority };
          if (department !== aiDepartment) changes.department = { from: aiDepartment, to: department };
          Object.assign(c, {
            supervisor_override: override,
            overridden_category: category,
            overridden_priority: priority,
            overridden_department: department,
          });
          const moved = move('UnderReview', ts);
          log(override ? 'SupervisorOverride' : 'SupervisorReviewed', supervisor,
            { category, priority, department, override, changes, ...moved }, ts);
          notify([student.id], 'StatusUpdated', { status: 'UnderReview' }, ts);
          break;
        }
        case 'forward': {
          const moved = move('Forwarded', ts);
          log('ForwardedToMaintenance', supervisor, { ...moved, destination_department: c.overridden_department }, ts);
          const payload = {
            status: 'Forwarded', priority: c.overridden_priority,
            department: c.overridden_department, location: c.location,
          };
          notify(maintenanceIds, 'StatusUpdated', payload, ts);
          notify([student.id], 'StatusUpdated', payload, ts);
          break;
        }
        case 'progress': {
          const note = 'Technician dispatched on site';
          const moved = move('InProgress', ts);
          log('StatusUpdated', byId[maintenanceIds[0]], { ...moved, note }, ts);
          notify([student.id], 'MaintenanceStarted', { status: 'InProgress', note }, ts);
          break;
        }
        case 'resolve': {
          const resolution_note = sample.resolution ?? 'Repair completed.';
          c.resolution_notes = resolution_note;
          const moved = move('Resolved', ts);
          log('StatusUpdated', byId[maintenanceIds[0]], { ...moved, resolution_note }, ts);
          notify([student.id], 'ResolutionPendingConfirmation', { status: 'Resolved', resolution_note }, ts);
          break;
        }
        case 'confirm': {
          const moved = move('Closed', ts);
          log('StudentConfirmed', student, moved, ts);
          notify([supervisor.id, ...maintenanceIds], 'ComplaintClosed', { status: 'Closed' }, ts);
          break;
        }
        case 'reopen': {
          const reason = sample.reopenReason ?? 'The problem is still there.';
          c.reopen_reason = reason;
          const moved = move('Reopened', ts);
          log('StudentReopened', student, { ...moved, reason }, ts);
          notify([supervisor.id, ...maintenanceIds], 'ComplaintReopened', { status: 'Reopened', reason }, ts);
          break;
        }
      }
    }
    complaints.push(c);
  }

  return { users, complaints, auditLogs, notifications };
}
