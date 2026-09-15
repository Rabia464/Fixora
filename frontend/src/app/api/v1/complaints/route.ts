import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { createComplaint, listComplaintsFor } from '@/lib/server/complaints';
import { badRequest, readJson, route } from '@/lib/server/http';
import { isStatus } from '@/lib/server/workflow';

export const GET = route(async (request) => {
  const user = await requireUser(request);
  const status = new URL(request.url).searchParams.get('status');
  if (status !== null && !isStatus(status)) throw badRequest(`Unknown status "${status}".`);
  return NextResponse.json(await listComplaintsFor(user, status ?? undefined));
});

export const POST = route(async (request) => {
  const user = await requireUser(request);
  const complaint = await createComplaint(await readJson(request), user);
  return NextResponse.json(complaint, { status: 201 });
});
