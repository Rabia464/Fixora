import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { markAllNotificationsRead } from '@/lib/server/db';
import { route } from '@/lib/server/http';

export const PATCH = route(async (request) => {
  const user = await requireUser(request);
  await markAllNotificationsRead(user.id);
  return NextResponse.json({ message: 'All notifications marked as read' });
});
