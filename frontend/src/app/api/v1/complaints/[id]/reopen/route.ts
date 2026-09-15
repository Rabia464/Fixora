import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { reopenComplaint } from '@/lib/server/complaints';
import { readJson, route } from '@/lib/server/http';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (request, { params }) => {
  const user = await requireUser(request);
  const { id } = await params;
  const { reason } = await readJson<{ reason?: unknown }>(request);
  return NextResponse.json(await reopenComplaint(id, reason, user));
});
