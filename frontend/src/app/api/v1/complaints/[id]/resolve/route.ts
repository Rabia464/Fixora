import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { resolveComplaint } from '@/lib/server/complaints';
import { readJson, route } from '@/lib/server/http';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (request, { params }) => {
  const user = await requireUser(request);
  const { id } = await params;
  const { resolution_note } = await readJson<{ resolution_note?: unknown }>(request);
  return NextResponse.json(await resolveComplaint(id, resolution_note, user));
});
