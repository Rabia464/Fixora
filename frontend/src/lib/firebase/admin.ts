import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

/**
 * Credential resolution order:
 *   1. ./serviceAccountKey.json (local dev; gitignored)
 *   2. FIREBASE_SERVICE_ACCOUNT_KEY — the JSON blob as one env var (Vercel)
 *   3. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY + FIREBASE_PROJECT_ID
 *   4. Application Default Credentials (GCP runtimes only)
 * In production, 4 is refused so a misconfigured deploy fails at first request
 * with a clear message instead of every query timing out.
 */
function resolveApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (fs.existsSync(localKeyPath)) {
    const sa = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
    return initializeApp({ credential: cert(sa), projectId: sa.project_id });
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    return initializeApp({
      credential: cert(sa),
      projectId: sa.project_id ?? process.env.FIREBASE_PROJECT_ID,
    });
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return initializeApp({
      credential: cert({
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        projectId: process.env.FIREBASE_PROJECT_ID,
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
    throw new Error(
      'No Firebase credentials configured. Set FIREBASE_SERVICE_ACCOUNT_KEY (see .env.example).'
    );
  }
  return initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
}

let cached: Firestore | undefined;

/** Lazily initialised so a build (which imports routes) never needs credentials. */
export const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    cached ??= getFirestore(resolveApp());
    const value = Reflect.get(cached, prop, receiver);
    return typeof value === 'function' ? value.bind(cached) : value;
  },
});
