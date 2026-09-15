import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { getNotifications } from '@/lib/server/db';
import { route } from '@/lib/server/http';

export const GET = route(async (request) => {
  const user = await requireUser(request);
  return NextResponse.json(await getNotifications(user.id));
});
