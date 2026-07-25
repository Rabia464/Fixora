import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types/api'

interface AuthState {
  accessToken: string | null
  role: UserRole | null
  user: User | null
  setSession: (session: { accessToken: string; role: UserRole }) => void
  setUser: (user: User | null) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      role: null,
      user: null,
      setSession: ({ accessToken, role }) => set({ accessToken, role }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ accessToken: null, role: null, user: null }),
    }),
    {
      name: 'fixora-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        role: state.role,
      }),
    },
  ),
)

export const selectIsAuthenticated = (state: AuthState) => Boolean(state.accessToken)
