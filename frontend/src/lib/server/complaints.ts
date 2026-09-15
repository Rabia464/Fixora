import {
  addAuditLog,
  addNotification,
  ComplaintDoc,
  getComplaintById,
  getComplaints,
  getSupervisorByHostel,
  newComplaintId,
  notifyRole,
  saveComplaint,
  UserDoc,
} from './db';
import { badRequest, forbidden, HttpError, notFound } from './http';
import {
  assertRole,
  assertTransition,
  AuditAction,
  ComplaintPriority,
  ComplaintStatus,
  isPriority,
  MAINTENANCE_VISIBLE_STATUSES,
  NotificationType,
  WorkflowAction,
} from './workflow';
import { aiService } from '../ai/classifier';

/**
 * Complaint lifecycle service — the Firestore counterpart of
 * backend/app/services/complaint.py. Every mutation:
 *   1. checks the caller's role and ownership/hostel scope,
 *   2. checks the state transition is legal (409 otherwise),
 *   3. writes the complaint, an audit entry, and any notifications.
 */

const now = () => new Date().toISOString();

function requireHostel(user: UserDoc, label: string): string {
  if (!user.hostel) throw new HttpError(422, `${label} has no hostel assigned.`);
  return user.hostel;
}

function assertSupervisorScope(complaint: ComplaintDoc, user: UserDoc): void {
  if (complaint.hostel !== requireHostel(user, 'Supervisor')) {
    throw forbidden('Supervisors can only access complaints belonging to their assigned hostel.');
  }
}

function assertOwner(complaint: ComplaintDoc, user: UserDoc): void {
  if (complaint.created_by !== user.id) {
    throw forbidden('Students can only perform this action on their own complaints.');
  }
}

async function loadComplaint(id: string): Promise<ComplaintDoc> {
  const complaint = await getComplaintById(id);
  if (!complaint) throw notFound();
  return complaint;
}

function audit(
  action: string,
  user: UserDoc,
  complaint: ComplaintDoc,
  details: Record<string, unknown>
) {
  return addAuditLog({
    action,
    performed_by: user.id,
    actor_name: user.full_name,
    actor_email: user.email,
    complaint_id: complaint.id,
    details,
  });
}

/** Shared preamble for every lifecycle mutation: role → load → transition. */
async function begin(action: WorkflowAction, id: string, user: UserDoc) {
  assertRole(action, user.role.name);
  const complaint = await loadComplaint(id);
  const nextStatus = assertTransition(action, complaint.status);
  return { complaint, nextStatus, previous: complaint.status };
}

// ----------------------------------------------------------------- reads

export async function getVisibleComplaint(id: string, user: UserDoc): Promise<ComplaintDoc> {
  const complaint = await loadComplaint(id);
  switch (user.role.name) {
    case 'Student':
      if (complaint.created_by !== user.id) {
        throw forbidden('Students can only access their own complaints.');
      }
      return complaint;
    case 'Hostel Supervisor':
      assertSupervisorScope(complaint, user);
      return complaint;
    case 'Maintenance Office':
      if (!MAINTENANCE_VISIBLE_STATUSES.includes(complaint.status)) {
        throw forbidden('Maintenance users can only access complaints in the maintenance workflow.');
      }
      return complaint;
  }
}

export async function listComplaintsFor(
  user: UserDoc,
  status?: ComplaintStatus
): Promise<ComplaintDoc[]> {
  switch (user.role.name) {
    case 'Student':
      return getComplaints({ createdBy: user.id, status });
    case 'Hostel Supervisor':
      return getComplaints({ hostel: requireHostel(user, 'Supervisor'), status });
    case 'Maintenance Office':
      return listMaintenanceQueue(user);
  }
}

export async function listMaintenanceQueue(user: UserDoc): Promise<ComplaintDoc[]> {
  if (user.role.name !== 'Maintenance Office') {
    throw forbidden('Only maintenance office can access this endpoint.');
  }
  const all = await getComplaints();
  return all.filter((c) => MAINTENANCE_VISIBLE_STATUSES.includes(c.status));
}

// ---------------------------------------------------------------- create

export interface CreateInput {
  title?: unknown;
  description?: unknown;
  location?: unknown;
}

export async function createComplaint(input: CreateInput, user: UserDoc): Promise<ComplaintDoc> {
  if (user.role.name !== 'Student') throw forbidden('Only students can file complaints.');
  const hostel = requireHostel(user, 'Student');

  const { title, description, location } = input;
  if (
    typeof title !== 'string' || !title.trim() ||
    typeof description !== 'string' || !description.trim() ||
    typeof location !== 'string' || !location.trim()
  ) {
    throw badRequest('Title, description, and location are required.');
  }

  const prediction = aiService.predict(title, description);
  const supervisor = await getSupervisorByHostel(hostel);
  const ts = now();

  const complaint: ComplaintDoc = {
    id: newComplaintId(),
    title: title.trim(),
    description: description.trim(),
    location: location.trim(),
    hostel,
    status: 'Open',
    ai_category: prediction.category,
    ai_priority: prediction.priority,
    ai_department: prediction.department,
    supervisor_override: false,
    overridden_category: null,
    overridden_priority: null,
    overridden_department: null,
    created_by: user.id,
    supervisor_id: supervisor?.id ?? null,
    created_at: ts,
    updated_at: ts,
  };

  await saveComplaint(complaint);
  await audit(AuditAction.TICKET_CREATED, user, complaint, {
    title: complaint.title,
    location: complaint.location,
    hostel,
    ai_category: prediction.category,
    ai_priority: prediction.priority,
    ai_department: prediction.department,
  });

  if (supervisor) {
    await addNotification({
      user_id: supervisor.id,
      complaint_id: complaint.id,
      type: NotificationType.COMPLAINT_CREATED,
      payload: { complaint_id: complaint.id, title: complaint.title, location: complaint.location, hostel },
    });
  }
  return complaint;
}

// ------------------------------------------------------------ supervisor

export interface ReviewInput {
  category?: unknown;
  priority?: unknown;
  department?: unknown;
  override?: unknown;
}

export async function supervisorReview(
  id: string,
  input: ReviewInput,
  user: UserDoc
): Promise<ComplaintDoc> {
  const { complaint, nextStatus, previous } = await begin('review', id, user);
  assertSupervisorScope(complaint, user);

  const { category, department } = input;
  if (typeof category !== 'string' || !category || typeof department !== 'string' || !department) {
    throw badRequest('category and department are required.');
  }
  if (!isPriority(input.priority)) throw badRequest('priority must be Low, Medium, High or Critical.');
  const priority: ComplaintPriority = input.priority;
  const override = input.override === true;

  const updated: ComplaintDoc = {
    ...complaint,
    status: nextStatus,
    supervisor_override: override,
    overridden_category: category,
    overridden_priority: priority,
    overridden_department: department,
    supervisor_id: user.id,
    updated_at: now(),
  };
  await saveComplaint(updated);
  await audit(
    override ? AuditAction.SUPERVISOR_OVERRIDE : AuditAction.SUPERVISOR_REVIEWED,
    user,
    updated,
    { category, priority, department, override, previous_status: previous, new_status: nextStatus }
  );
  return updated;
}

export async function forwardToMaintenance(id: string, user: UserDoc): Promise<ComplaintDoc> {
  const { complaint, nextStatus, previous } = await begin('forward', id, user);
  assertSupervisorScope(complaint, user);

  const updated: ComplaintDoc = { ...complaint, status: nextStatus, supervisor_id: user.id, updated_at: now() };
  await saveComplaint(updated);
  await audit(AuditAction.FORWARDED_TO_MAINTENANCE, user, updated, {
    previous_status: previous,
    new_status: nextStatus,
    destination_department: updated.overridden_department ?? updated.ai_department ?? 'Maintenance',
  });
  await notifyRole('Maintenance Office', {
    complaint_id: updated.id,
    type: NotificationType.STATUS_UPDATED,
    payload: { complaint_id: updated.id, title: updated.title, status: nextStatus },
  });
  return updated;
}

// ----------------------------------------------------------- maintenance

export async function updateProgress(
  id: string,
  note: unknown,
  user: UserDoc
): Promise<ComplaintDoc> {
  const { complaint, nextStatus, previous } = await begin('progress', id, user);
  const progressNote = typeof note === 'string' && note.trim() ? note.trim() : null;

  const updated: ComplaintDoc = { ...complaint, status: nextStatus, updated_at: now() };
  await saveComplaint(updated);
  await audit(AuditAction.STATUS_UPDATED, user, updated, {
    previous_status: previous,
    new_status: nextStatus,
    note: progressNote,
  });
  await addNotification({
    user_id: updated.created_by,
    complaint_id: updated.id,
    type: NotificationType.MAINTENANCE_STARTED,
    payload: { complaint_id: updated.id, title: updated.title, status: nextStatus, note: progressNote },
  });
  return updated;
}

export async function resolveComplaint(
  id: string,
  resolutionNote: unknown,
  user: UserDoc
): Promise<ComplaintDoc> {
  const { complaint, nextStatus, previous } = await begin('resolve', id, user);
  if (typeof resolutionNote !== 'string' || !resolutionNote.trim()) {
    throw badRequest('Resolution note is required.');
  }
  const resolution_note = resolutionNote.trim();

  const updated: ComplaintDoc = {
    ...complaint,
    status: nextStatus,
    resolution_notes: resolution_note,
    updated_at: now(),
  };
  await saveComplaint(updated);
  await audit(AuditAction.STATUS_UPDATED, user, updated, {
    previous_status: previous,
    new_status: nextStatus,
    resolution_note,
  });
  await addNotification({
    user_id: updated.created_by,
    complaint_id: updated.id,
    type: NotificationType.RESOLUTION_PENDING_CONFIRMATION,
    payload: { complaint_id: updated.id, title: updated.title, status: nextStatus, resolution_note },
  });
  return updated;
}

// --------------------------------------------------------------- student

export async function confirmResolution(id: string, user: UserDoc): Promise<ComplaintDoc> {
  const { complaint, nextStatus, previous } = await begin('confirm', id, user);
  assertOwner(complaint, user);

  const updated: ComplaintDoc = { ...complaint, status: nextStatus, updated_at: now() };
  await saveComplaint(updated);
  await audit(AuditAction.STUDENT_CONFIRMED, user, updated, {
    previous_status: previous,
    new_status: nextStatus,
  });
  if (updated.supervisor_id) {
    await addNotification({
      user_id: updated.supervisor_id,
      complaint_id: updated.id,
      type: NotificationType.COMPLAINT_CLOSED,
      payload: { complaint_id: updated.id, title: updated.title, status: nextStatus },
    });
  }
  return updated;
}

export async function reopenComplaint(
  id: string,
  reason: unknown,
  user: UserDoc
): Promise<ComplaintDoc> {
  const { complaint, nextStatus, previous } = await begin('reopen', id, user);
  assertOwner(complaint, user);
  if (typeof reason !== 'string' || !reason.trim()) throw badRequest('Reopen reason is required.');
  const reopen_reason = reason.trim();

  const updated: ComplaintDoc = {
    ...complaint,
    status: nextStatus,
    reopen_reason,
    updated_at: now(),
  };
  await saveComplaint(updated);
  await audit(AuditAction.STUDENT_REOPENED, user, updated, {
    previous_status: previous,
    new_status: nextStatus,
    reason: reopen_reason,
  });
  const payload = { complaint_id: updated.id, title: updated.title, status: nextStatus, reason: reopen_reason };
  if (updated.supervisor_id) {
    await addNotification({
      user_id: updated.supervisor_id,
      complaint_id: updated.id,
      type: NotificationType.COMPLAINT_REOPENED,
      payload,
    });
  }
  await notifyRole('Maintenance Office', {
    complaint_id: updated.id,
    type: NotificationType.COMPLAINT_REOPENED,
    payload,
  });
  return updated;
}
