import { SignJWT, jwtVerify, errors as joseErrors } from 'jose';
import { getUserById, UserDoc } from './db';
import { unauthorized } from './http';

/**
 * HS256-signed access tokens, same shape as the FastAPI backend
 * (`sub` = user id, `role` = role name). The role claim is re-checked
 * against the user record on every request so a stale token can't keep
 * privileges after a role change.
 */

const ALG = 'HS256';
const TOKEN_TTL = '8h';
const DEV_SECRET = 'fixora-dev-only-secret-do-not-use-in-production';

let warnedDevSecret = false;

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return new TextEncoder().encode(secret);

  const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  if (isProd) {
    throw new Error('JWT_SECRET must be set (>= 32 chars) in production.');
  }
  if (!warnedDevSecret) {
    warnedDevSecret = true;
    console.warn('[auth] JWT_SECRET not set — using an insecure development secret.');
  }
  return new TextEncoder().encode(DEV_SECRET);
}

export async function createAccessToken(user: UserDoc): Promise<string> {
  return new SignJWT({ role: user.role.name })
    .setProtectedHeader({ alg: ALG })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secretKey());
}

export async function verifyAccessToken(token: string): Promise<{ sub: string; role?: string }> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: [ALG] });
    if (!payload.sub) throw unauthorized('Invalid token payload.');
    return { sub: payload.sub, role: typeof payload.role === 'string' ? payload.role : undefined };
  } catch (err) {
    if (err instanceof joseErrors.JOSEError) {
      throw unauthorized(
        err instanceof joseErrors.JWTExpired ? 'Token has expired.' : 'Invalid or expired token.'
      );
    }
    throw err;
  }
}

/** Resolves the bearer token on a request to a user, or throws 401. */
export async function requireUser(request: Request): Promise<UserDoc> {
  const header = request.headers.get('authorization') ?? '';
  if (!header.startsWith('Bearer ')) throw unauthorized();

  const { sub, role } = await verifyAccessToken(header.slice(7).trim());
  const user = await getUserById(sub);
  if (!user) throw unauthorized('User not found.');
  if (role && role !== user.role.name) throw unauthorized('Token role no longer valid.');
  return user;
}
