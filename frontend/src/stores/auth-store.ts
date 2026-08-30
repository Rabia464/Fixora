import { create } from 'zustand';
import { UserProfile, authApi } from '../lib/api/auth';

interface AuthState {
  token: string | null;
  role: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  setSession: (token: string, role: string) => void;
  setUser: (user: UserProfile | null) => void;
  login: (email: string) => Promise<string>;
  loadUser: () => Promise<UserProfile | null>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  role: null,
  user: null,
  isLoading: false,
  error: null,

  setSession: (token: string, role: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fixora_token', token);
      localStorage.setItem('fixora_role', role);
      // Set cookie for Next.js middleware
      document.cookie = `auth_role=${encodeURIComponent(role)}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    }
    set({ token, role, error: null });
  },

  setUser: (user: UserProfile | null) => {
    set({ user });
  },

  login: async (email: string): Promise<string> => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(email);
      get().setSession(res.access_token, res.role);
      
      // Hydrate user profile
      try {
        const user = await authApi.me();
        set({ user, isLoading: false });
      } catch {
        set({ isLoading: false });
      }
      return res.role;
    } catch (err: any) {
      const message = err.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  loadUser: async (): Promise<UserProfile | null> => {
    const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('fixora_token') : null);
    if (!token) return null;

    try {
      const user = await authApi.me();
      set({ user, role: user.role.name });
      return user;
    } catch {
      get().logout();
      return null;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fixora_token');
      localStorage.removeItem('fixora_role');
      document.cookie = 'auth_role=; path=/; max-age=0; SameSite=Lax';
    }
    set({ token: null, role: null, user: null, error: null });
  },

  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('fixora_token');
      const role = localStorage.getItem('fixora_role');
      if (token && role) {
        set({ token, role });
        get().loadUser().catch(() => {});
      }
    }
  },
}));
