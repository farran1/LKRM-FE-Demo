import { create } from 'zustand';

interface AppState {
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set: any) => ({
  loading: false,
  setLoading: (loading: boolean) => set({ loading })
}));

export default useAppStore; 