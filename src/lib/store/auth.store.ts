import { create } from "zustand"
import type { AuthResponse } from "../schemas/auth"

interface AuthStore extends AuthResponse {
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  setAuth: (auth: AuthResponse) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
}

const initialState = {
  accessToken: "",
  username: "",
  email: "",
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
}

export const useAuthStore = create<AuthStore>()((set) => ({
  ...initialState,
  setAuth: (auth: AuthResponse) =>
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
  setLoading: (loading: boolean) => 
    set({ isLoading: loading }),
  setInitialized: (initialized: boolean) =>
    set({ isInitialized: initialized }),
})) 