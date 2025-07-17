'use client'
import { create } from 'zustand'
import type { AuthResponse } from '../schemas/auth'
import { authService } from '@/services/authService'

interface AuthStore extends AuthResponse {
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean   
  isHydrated: boolean     
  setAuth: (auth: AuthResponse) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  setHydrated: (hydrated: boolean) => void
  hydrateAuth: () => Promise<void>
  logout: () => Promise<void>
}

const initialState = {
  userId: 0,
  accessToken: '',
  username: '',
  email: '',
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  isHydrated: false,
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  setAuth: (auth) =>
    set({
      ...auth,
      isAuthenticated: true,
      isInitialized: true,
    }),

  clearAuth: () =>
    set({
      ...initialState,
      isInitialized: true,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),

  hydrateAuth: async () => {
    set({ isLoading: true })
    try {
      const auth = await authService.refresh()
      get().setAuth(auth)
    } catch {
      get().clearAuth()
    } finally {
      set({ isHydrated: true, isLoading: false })
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authService.logout()
      get().clearAuth()
    } finally {
      set({ isLoading: false })
    }
  },
}))
