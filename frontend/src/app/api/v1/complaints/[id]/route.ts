import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { getVisibleComplaint } from '@/lib/server/complaints';
import { route } from '@/lib/server/http';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (request, { params }) => {
  const user = await requireUser(request);
  const { id } = await params;
  return NextResponse.json(await getVisibleComplaint(id, user));
});
