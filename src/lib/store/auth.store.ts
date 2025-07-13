import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { AuthResponse } from "../schemas/auth"
import { authService } from "@/services/authService"

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
  isHydrated: false,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
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
      setHydrated: (hydrated: boolean) =>
        set({ isHydrated: hydrated }),
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
    }),
    {
      name: 'inertia-chat-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userId: state.userId,
        accessToken: state.accessToken,
        username: state.username,
        email: state.email,
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
) 