import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiClient } from '../client';

function mockFetch(status: number, body?: unknown) {
  const fn = vi.fn(async () =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  );
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('apiClient (server side, no window)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('prefixes the API base and normalises the leading slash', async () => {
    const fetch = mockFetch(200, { ok: true });
    await apiClient('complaints');
    await apiClient('/complaints');
    expect(fetch.mock.calls.map((c) => (c as unknown[])[0])).toEqual([
      '/api/v1/complaints',
      '/api/v1/complaints',
    ]);
  });

  it('returns parsed JSON on success', async () => {
    mockFetch(200, { id: 'c1' });
    await expect(apiClient('/complaints/c1')).resolves.toEqual({ id: 'c1' });
  });

  it('returns an empty object for 204', async () => {
    mockFetch(204);
    await expect(apiClient('/x')).resolves.toEqual({});
  });

  it('throws ApiError with the FastAPI-style detail message and status', async () => {
    mockFetch(409, { detail: 'Illegal transition' });
    const err = await apiClient('/x').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ message: 'Illegal transition', code: 409 });
  });

  it('falls back to a generic message when the body has none', async () => {
    mockFetch(502, {});
    await expect(apiClient('/x')).rejects.toMatchObject({
      message: 'Request failed with status 502',
      code: 502,
    });
  });

  it('wraps network failures as a 500 ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed'); }));
    await expect(apiClient('/x')).rejects.toMatchObject({ message: 'fetch failed', code: 500 });
  });
});

describe('apiClient (browser)', () => {
  const storage = new Map<string, string>();
  const location = { pathname: '/dashboard/student', href: '' };

  beforeEach(() => {
    storage.clear();
    location.pathname = '/dashboard/student';
    location.href = '';
    vi.stubGlobal('window', { location });
    vi.stubGlobal('document', { cookie: 'auth_role=Student' });
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v),
      removeItem: (k: string) => storage.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sends the stored token as a bearer header', async () => {
    storage.set('fixora_token', 'abc');
    const fetch = mockFetch(200, {});
    await apiClient('/auth/me');
    const init = (fetch.mock.calls[0] as unknown[])[1] as RequestInit;
    expect(init.headers).toMatchObject({ Authorization: 'Bearer abc', 'Content-Type': 'application/json' });
  });

  it('omits the header when logged out', async () => {
    const fetch = mockFetch(200, {});
    await apiClient('/auth/me');
    const init = (fetch.mock.calls[0] as unknown[])[1] as RequestInit;
    expect(init.headers).not.toHaveProperty('Authorization');
  });

  it('on 401 clears the session and redirects to /login', async () => {
    storage.set('fixora_token', 'expired');
    storage.set('fixora_role', 'Student');
    mockFetch(401, { detail: 'Token has expired.' });
    await expect(apiClient('/complaints')).rejects.toMatchObject({ code: 401 });
    expect(storage.size).toBe(0);
    expect(location.href).toBe('/login');
  });

  it('does not redirect when already on /login', async () => {
    location.pathname = '/login';
    mockFetch(401, { detail: 'User not registered' });
    await expect(apiClient('/auth/login')).rejects.toMatchObject({ code: 401 });
    expect(location.href).toBe('');
  });
});
