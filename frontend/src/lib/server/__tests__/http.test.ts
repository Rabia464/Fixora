import { describe, expect, it, vi } from 'vitest';

vi.mock('../workflow', () => ({ WorkflowError: class extends Error {} }));

import { MAX_BODY_BYTES, readJson } from '../http';

const req = (body: string, headers: Record<string, string> = {}) =>
  new Request('http://x/api', { method: 'POST', body, headers });

describe('readJson', () => {
  it('parses a JSON object', async () => {
    await expect(readJson(req('{"a":1}'))).resolves.toEqual({ a: 1 });
  });

  it('treats an empty body as {}', async () => {
    await expect(readJson(req(''))).resolves.toEqual({});
  });

  it('rejects malformed JSON and non-objects with 400', async () => {
    await expect(readJson(req('{nope'))).rejects.toMatchObject({ status: 400 });
    await expect(readJson(req('[1,2]'))).rejects.toMatchObject({ status: 400 });
    await expect(readJson(req('"str"'))).rejects.toMatchObject({ status: 400 });
  });

  it('rejects oversized bodies with 413', async () => {
    const big = JSON.stringify({ d: 'x'.repeat(MAX_BODY_BYTES) });
    await expect(readJson(req(big))).rejects.toMatchObject({ status: 413 });
    await expect(
      readJson(req('{}', { 'content-length': String(MAX_BODY_BYTES + 1) }))
    ).rejects.toMatchObject({ status: 413 });
  });
});
