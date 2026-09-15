import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usage: node scripts/seed.mjs [--reset]
//   --reset  wipe complaints, audit_logs and notifications first (users are upserted either way)
const RESET = process.argv.includes('--reset');

const keyPath = path.resolve(__dirname, '../serviceAccountKey.json');
let serviceAccount;
if (fs.existsSync(keyPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} else {
  console.error('Need serviceAccountKey.json next to package.json or FIREBASE_SERVICE_ACCOUNT_KEY in the env.');
  process.exit(1);
}

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = getFirestore(app);

const USERS = [
  {
    id: 'u-student-01',
    email: 'student@giki.edu.pk',
    full_name: 'Demo Student',
    hostel: 'Hostel A',
    role_id: 'role-student',
    role: { id: 'role-student', name: 'Student' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u-supervisor-01',
    email: 'supervisor@giki.edu.pk',
    full_name: 'Demo Hostel Supervisor',
    hostel: 'Hostel A',
    role_id: 'role-supervisor',
    role: { id: 'role-supervisor', name: 'Hostel Supervisor' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u-maintenance-01',
    email: 'maintenance@giki.edu.pk',
    full_name: 'Demo Maintenance Office',
    hostel: null,
    role_id: 'role-maintenance',
    role: { id: 'role-maintenance', name: 'Maintenance Office' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const COMPLAINTS = [
  {
    id: 'comp-001',
    title: 'Water pipe leaking under bathroom washbasin',
    description: 'The pipe has a persistent leak causing water pooling in the washroom.',
    location: 'Hostel A, Room 204',
    hostel: 'Hostel A',
    status: 'Open',
    ai_category: 'Plumbing',
    ai_priority: 'High',
    ai_department: 'Plumbing',
    supervisor_override: false,
    overridden_category: null,
    overridden_priority: null,
    overridden_department: null,
    created_by: 'u-student-01',
    supervisor_id: 'u-supervisor-01',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'comp-002',
    title: 'Ceiling fan making grinding noise and sparking',
    description: 'Fan regulator sparks when switched to maximum speed.',
    location: 'Hostel A, Room 108',
    hostel: 'Hostel A',
    status: 'Forwarded',
    ai_category: 'Electrical',
    ai_priority: 'Critical',
    ai_department: 'Electrical',
    supervisor_override: false,
    overridden_category: 'Electrical',
    overridden_priority: 'Critical',
    overridden_department: 'Electrical',
    created_by: 'u-student-01',
    supervisor_id: 'u-supervisor-01',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

const AUDIT_LOGS = [
  {
    id: 'audit-001',
    action: 'TicketCreated',
    performed_by: 'u-student-01',
    actor_name: 'Demo Student',
    actor_email: 'student@giki.edu.pk',
    complaint_id: 'comp-001',
    details: { title: COMPLAINTS[0].title, ai_category: 'Plumbing', ai_priority: 'High' },
    created_at: COMPLAINTS[0].created_at,
  },
  {
    id: 'audit-002',
    action: 'TicketCreated',
    performed_by: 'u-student-01',
    actor_name: 'Demo Student',
    actor_email: 'student@giki.edu.pk',
    complaint_id: 'comp-002',
    details: { title: COMPLAINTS[1].title, ai_category: 'Electrical', ai_priority: 'Critical' },
    created_at: COMPLAINTS[1].created_at,
  },
  {
    id: 'audit-003',
    action: 'SupervisorReviewed',
    performed_by: 'u-supervisor-01',
    actor_name: 'Demo Hostel Supervisor',
    actor_email: 'supervisor@giki.edu.pk',
    complaint_id: 'comp-002',
    details: { previous_status: 'Open', new_status: 'UnderReview', override: false },
    created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    id: 'audit-004',
    action: 'ForwardedToMaintenance',
    performed_by: 'u-supervisor-01',
    actor_name: 'Demo Hostel Supervisor',
    actor_email: 'supervisor@giki.edu.pk',
    complaint_id: 'comp-002',
    details: { previous_status: 'UnderReview', new_status: 'Forwarded', destination_department: 'Electrical' },
    created_at: COMPLAINTS[1].updated_at,
  },
];

async function wipe(collection) {
  const snap = await db.collection(collection).get();
  if (snap.empty) return 0;
  let batch = db.batch();
  let n = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    if (++n % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
  return snap.size;
}

async function seed() {
  console.log(`Connecting to Firestore project: ${serviceAccount.project_id}...`);

  if (RESET) {
    for (const c of ['complaints', 'audit_logs', 'notifications']) {
      console.log(`✗ Wiped ${await wipe(c)} docs from ${c}`);
    }
  }

  for (const user of USERS) {
    await db.collection('users').doc(user.id).set(user, { merge: true });
    console.log(`✓ Seeded user: ${user.email} (${user.role.name})`);
  }

  for (const comp of COMPLAINTS) {
    await db.collection('complaints').doc(comp.id).set(comp);
    console.log(`✓ Seeded complaint: ${comp.title}`);
  }

  for (const log of AUDIT_LOGS) {
    await db.collection('audit_logs').doc(log.id).set(log);
  }
  console.log(`✓ Seeded ${AUDIT_LOGS.length} audit entries`);

  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
