import { NextResponse } from 'next/server';
import { WorkflowError } from './workflow';

/** Error whose message is safe to show to the API caller. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const unauthorized = (msg = 'Not authenticated') => new HttpError(401, msg);
export const forbidden = (msg: string) => new HttpError(403, msg);
export const notFound = (msg = 'Complaint not found') => new HttpError(404, msg);
export const badRequest = (msg: string) => new HttpError(400, msg);

type Handler<C> = (request: Request, ctx: C) => Promise<Response>;

/**
 * Wraps a route handler: known errors become `{ detail }` responses with their
 * status (matching FastAPI's error shape); anything else is logged and returned
 * as a 500 so Firestore outages surface instead of being papered over.
 */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (request, ctx) => {
    try {
      return await handler(request, ctx);
    } catch (err) {
      if (err instanceof HttpError || err instanceof WorkflowError) {
        return NextResponse.json({ detail: err.message }, { status: err.status });
      }
      console.error(`[api] ${request.method} ${new URL(request.url).pathname}`, err);
      return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
    }
  };
}

/** Largest JSON body any endpoint accepts. The biggest legit payload is a complaint (~5 KB). */
export const MAX_BODY_BYTES = 32 * 1024;

/**
 * Parses a JSON object body. Rejects bodies over MAX_BODY_BYTES with 413 and
 * anything that isn't a JSON object with 400, so handlers only ever see a
 * plain object.
 */
export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new HttpError(413, 'Request body too large.');
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    throw new HttpError(413, 'Request body too large.');
  }
  if (!raw.trim()) return {} as T;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw badRequest('Request body must be valid JSON.');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw badRequest('Request body must be a JSON object.');
  }
  return parsed as T;
}
