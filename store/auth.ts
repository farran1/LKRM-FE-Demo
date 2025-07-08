import { create } from 'zustand';

interface AuthState {
  user: any
  token: string | undefined
  setUser: (user: any) => void
  login: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
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
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
}));
