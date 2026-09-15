import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { listMaintenanceQueue } from '@/lib/server/complaints';
import { route } from '@/lib/server/http';

export const GET = route(async (request) =>
  NextResponse.json(await listMaintenanceQueue(await requireUser(request)))
);
