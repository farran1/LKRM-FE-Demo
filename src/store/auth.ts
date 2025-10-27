import { create } from 'zustand';

interface AuthState {
  user: any
  token: string | undefined
  setUser: (user: any) => void
  login: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set: any) => ({
  user: undefined,
  token: undefined,
  company: undefined,
  permissions: [],

  setUser: (user: any) => {
    set({ user })
  },

  login: (token: string) => {
    set({ token });
  },

  logout: () => {
    set({ token: undefined, user: undefined });
    // Note: This store is deprecated in favor of Supabase auth
    // The actual logout should be handled by the AuthProvider
  },
}));
