import { api } from '@/lib/api/client'
import type { TokenResponse, User } from '@/types/api'

export const authApi = {
  login: (email: string) =>
    api.post<unknown, TokenResponse>('/auth/login', { email }),
  me: () => api.get<unknown, User>('/auth/me'),
}
