import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { getVisibleComplaint } from '@/lib/server/complaints';
import { getAuditLogs } from '@/lib/server/db';
import { route } from '@/lib/server/http';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (request, { params }) => {
  const user = await requireUser(request);
  const { id } = await params;
  // Same visibility rules as reading the complaint itself.
  await getVisibleComplaint(id, user);
  // actor_email stays in Firestore for admins but isn't sent to clients: the UI
  // shows names only, and students shouldn't be able to harvest staff emails.
  const logs = await getAuditLogs(id);
  return NextResponse.json(logs.map((log) => ({ ...log, actor_email: undefined })));
});
