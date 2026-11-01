import { randomUUID } from 'crypto';
import type { DocumentData, Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { db } from '../firebase/admin';
import type { Complaint, ComplaintStatus, RoleName } from '../domain/complaint';

/**
 * Firestore data access. No fallback store: if Firestore is unreachable the
 * error propagates and the route returns 500, rather than returning 200 while
 * silently dropping writes.
 */

export interface UserDoc {
  id: string;
  email: string;
  full_name: string;
  hostel: string | null;
  role_id: string;
  role: { id: string; name: RoleName };
  created_at: string;
  updated_at: string;
}

export type ComplaintDoc = Complaint;

export interface AuditLogDoc {
  id: string;
  action: string;
  performed_by: string;
  actor_name?: string | null;
  actor_email?: string | null;
  complaint_id?: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface NotificationDoc {
  id: string;
  user_id: string;
  complaint_id: string;
  type: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

const users = () => db.collection('users');
const complaints = () => db.collection('complaints');
const auditLogs = () => db.collection('audit_logs');
const notifications = () => db.collection('notifications');

const byCreatedDesc = <T extends { created_at: string }>(a: T, b: T) =>
  b.created_at.localeCompare(a.created_at);
const byCreatedAsc = <T extends { created_at: string }>(a: T, b: T) =>
  a.created_at.localeCompare(b.created_at);

// ---------------------------------------------------------------- users

export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  const snap = await users().where('email', '==', email.trim().toLowerCase()).limit(1).get();
  return snap.empty ? null : (snap.docs[0].data() as UserDoc);
}

export async function getUserById(id: string): Promise<UserDoc | null> {
  const doc = await users().doc(id).get();
  return doc.exists ? (doc.data() as UserDoc) : null;
}

export async function getUsersByRole(role: RoleName): Promise<UserDoc[]> {
  const snap = await users().where('role.name', '==', role).get();
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as UserDoc);
}

export async function getSupervisorByHostel(hostel: string): Promise<UserDoc | null> {
  const snap = await users()
    .where('role.name', '==', 'Hostel Supervisor')
    .where('hostel', '==', hostel)
    .limit(1)
    .get();
  return snap.empty ? null : (snap.docs[0].data() as UserDoc);
}

// ----------------------------------------------------------- complaints

export async function getComplaints(filters: {
  status?: ComplaintStatus;
  /** Matches any of these statuses (Firestore `in`, max 30 values). */
  statusIn?: readonly ComplaintStatus[];
  hostel?: string;
  createdBy?: string;
} = {}): Promise<ComplaintDoc[]> {
  let query: Query = complaints();
  if (filters.status) query = query.where('status', '==', filters.status);
  else if (filters.statusIn) query = query.where('status', 'in', [...filters.statusIn]);
  if (filters.hostel) query = query.where('hostel', '==', filters.hostel);
  if (filters.createdBy) query = query.where('created_by', '==', filters.createdBy);

  // Sorted in memory so equality filters don't each need a composite index.
  const snap = await query.get();
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as ComplaintDoc).sort(byCreatedDesc);
}

export async function getComplaintById(id: string): Promise<ComplaintDoc | null> {
  const doc = await complaints().doc(id).get();
  return doc.exists ? (doc.data() as ComplaintDoc) : null;
}

/**
 * Read-check-write a complaint atomically. `mutate` sees the current document,
 * may throw to abort (e.g. an illegal transition), and returns the new one.
 * Runs in a Firestore transaction, so two concurrent requests can't both pass
 * the same transition check; Firestore may retry `mutate`, so keep it pure.
 * Returns null if the complaint does not exist.
 */
export async function updateComplaint(
  id: string,
  mutate: (current: ComplaintDoc) => ComplaintDoc
): Promise<{ before: ComplaintDoc; after: ComplaintDoc } | null> {
  const ref = complaints().doc(id);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const before = snap.data() as ComplaintDoc;
    const after = mutate(before);
    tx.set(ref, after);
    return { before, after };
  });
}

export async function saveComplaint(complaint: ComplaintDoc): Promise<ComplaintDoc> {
  await complaints().doc(complaint.id).set(complaint);
  return complaint;
}

export function newComplaintId(): string {
  return `comp-${randomUUID().slice(0, 8)}`;
}

// ------------------------------------------------------------ audit log

export async function addAuditLog(
  log: Omit<AuditLogDoc, 'id' | 'created_at'>
): Promise<AuditLogDoc> {
  const item: AuditLogDoc = { ...log, id: randomUUID(), created_at: new Date().toISOString() };
  await auditLogs().doc(item.id).set(item);
  return item;
}

export async function getAuditLogs(complaintId: string): Promise<AuditLogDoc[]> {
  const snap = await auditLogs().where('complaint_id', '==', complaintId).get();
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as AuditLogDoc).sort(byCreatedAsc);
}

// -------------------------------------------------------- notifications

export async function addNotification(
  notif: Omit<NotificationDoc, 'id' | 'created_at' | 'is_read'>
): Promise<NotificationDoc> {
  const item: NotificationDoc = {
    ...notif,
    id: randomUUID(),
    is_read: false,
    created_at: new Date().toISOString(),
  };
  await notifications().doc(item.id).set(item);
  return item;
}

export async function notifyRole(
  role: RoleName,
  notif: Omit<NotificationDoc, 'id' | 'created_at' | 'is_read' | 'user_id'>
): Promise<void> {
  const recipients = await getUsersByRole(role);
  await Promise.all(recipients.map((u) => addNotification({ ...notif, user_id: u.id })));
}

export async function getNotifications(userId: string): Promise<NotificationDoc[]> {
  const snap = await notifications()
    .where('user_id', '==', userId)
    .where('is_read', '==', false)
    .get();
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as NotificationDoc).sort(byCreatedDesc);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const snap = await notifications()
    .where('user_id', '==', userId)
    .where('is_read', '==', false)
    .get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => batch.update(doc.ref, { is_read: true }));
  await batch.commit();
}
