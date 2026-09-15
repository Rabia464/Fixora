import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserDoc } from '../db';

vi.mock('../db', () => ({ getUserById: vi.fn() }));
vi.mock('../../firebase/admin', () => ({ db: {} }));

import { getUserById } from '../db';
import { createAccessToken, requireUser, verifyAccessToken } from '../auth';

const student: UserDoc = {
  id: 'u-student-01',
  email: 'student@giki.edu.pk',
  full_name: 'Demo Student',
  hostel: 'Hostel A',
  role_id: 'role-student',
  role: { id: 'role-student', name: 'Student' },
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const req = (token?: string) =>
  new Request('http://x/api/v1/auth/me', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

describe('access tokens', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-that-is-definitely-32-chars-long';
    vi.mocked(getUserById).mockReset();
  });

  it('round-trips a signed token', async () => {
    const token = await createAccessToken(student);
    expect(token.split('.')).toHaveLength(3);
    await expect(verifyAccessToken(token)).resolves.toEqual({ sub: student.id, role: 'Student' });
  });

  it('rejects the old unsigned base64 tokens', async () => {
    const forged = Buffer.from(JSON.stringify({ userId: 'u-supervisor-01' })).toString('base64');
    await expect(requireUser(req(forged))).rejects.toMatchObject({ status: 401 });
    expect(getUserById).not.toHaveBeenCalled();
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await createAccessToken(student);
    process.env.JWT_SECRET = 'another-secret-that-is-also-32-chars-long!';
    await expect(requireUser(req(token))).rejects.toMatchObject({ status: 401 });
  });

  it('rejects a token whose role no longer matches the user', async () => {
    const token = await createAccessToken(student);
    vi.mocked(getUserById).mockResolvedValue({
      ...student,
      role: { id: 'role-supervisor', name: 'Hostel Supervisor' },
    });
    await expect(requireUser(req(token))).rejects.toMatchObject({
      status: 401,
      message: 'Token role no longer valid.',
    });
  });

  it('resolves the user for a valid token', async () => {
    const token = await createAccessToken(student);
    vi.mocked(getUserById).mockResolvedValue(student);
    await expect(requireUser(req(token))).resolves.toEqual(student);
  });

  it('401s with no header', async () => {
    await expect(requireUser(req())).rejects.toMatchObject({ status: 401 });
  });
});
