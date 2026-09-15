import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/server/db';
import { createAccessToken } from '@/lib/server/auth';
import { badRequest, readJson, route, unauthorized } from '@/lib/server/http';

export const POST = route(async (request) => {
  const { email } = await readJson<{ email?: unknown }>(request);
  if (typeof email !== 'string' || !email.trim()) throw badRequest('Email is required.');

  const user = await getUserByEmail(email);
  if (!user) throw unauthorized('User not registered in the Fixora system.');

  return NextResponse.json({
    access_token: await createAccessToken(user),
    token_type: 'bearer',
    role: user.role.name,
    user_id: user.id,
  });
});
