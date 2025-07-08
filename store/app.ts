import { create } from 'zustand'

interface AppState {
  loading: boolean
  setLoading: (loading: boolean) => void
}

const useAppStore = create<AppState>((set) => ({
  loading: false,
  setLoading: (loading: boolean) => set({ loading })
}))

export default useAppStore 