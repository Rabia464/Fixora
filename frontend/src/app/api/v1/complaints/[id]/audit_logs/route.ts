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
  return NextResponse.json(await getAuditLogs(id));
});
