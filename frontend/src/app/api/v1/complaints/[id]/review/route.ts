import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { supervisorReview } from '@/lib/server/complaints';
import { readJson, route } from '@/lib/server/http';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (request, { params }) => {
  const user = await requireUser(request);
  const { id } = await params;
  return NextResponse.json(await supervisorReview(id, await readJson(request), user));
});
