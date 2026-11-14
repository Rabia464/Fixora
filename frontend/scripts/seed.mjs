import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSeed } from './seed-data.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usage: node scripts/seed.mjs [--reset]
//   --reset  wipe complaints, audit_logs and notifications first (users are upserted either way)
// The demo accounts and the 20 sample complaints are defined in seed-data.mjs.
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

const { users: USERS, complaints: COMPLAINTS, auditLogs: AUDIT_LOGS, notifications: NOTIFICATIONS } = buildSeed();

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

async function writeAll(collection, docs) {
  let batch = db.batch();
  let n = 0;
  for (const doc of docs) {
    batch.set(db.collection(collection).doc(doc.id), doc);
    if (++n % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
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

  await writeAll('complaints', COMPLAINTS);
  console.log(`✓ Seeded ${COMPLAINTS.length} complaints across ${new Set(COMPLAINTS.map((c) => c.hostel)).size} hostels`);

  await writeAll('audit_logs', AUDIT_LOGS);
  console.log(`✓ Seeded ${AUDIT_LOGS.length} audit entries`);

  await writeAll('notifications', NOTIFICATIONS);
  console.log(`✓ Seeded ${NOTIFICATIONS.length} notifications`);

  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
