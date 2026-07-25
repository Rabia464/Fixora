import { api } from '@/lib/api/client'
import type { TokenResponse, User } from '@/types/api'

export const authApi = {
  login: (email: string) =>
    api.post<TokenResponse>('/auth/login', { email }, { auth: false }),
  me: () => api.get<User>('/auth/me'),
}
