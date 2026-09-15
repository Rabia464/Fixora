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

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}
