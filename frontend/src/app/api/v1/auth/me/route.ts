import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { route } from '@/lib/server/http';

export const GET = route(async (request) => NextResponse.json(await requireUser(request)));
