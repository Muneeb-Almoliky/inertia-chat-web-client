import { create } from "zustand"
import type { AuthResponse } from "../schemas/auth"
import { authService } from "@/services/authService"

interface AuthStore extends AuthResponse {
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  setAuth: (auth: AuthResponse) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  logout: () => Promise<void>
}

const initialState = {
  userId: 0,
  accessToken: "",
  username: "",
  email: "",
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
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
  logout: async () => {
    try {
      set({ isLoading: true });
      await authService.logout();
      get().clearAuth();
    } catch (error) {
      console.error('Error logging out', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  }
})) 