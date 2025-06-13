import { useAuthStore } from '@/lib/store/auth.store';
import axiosInstance from '@/api/axios';
import type { AuthResponse } from '@/lib/schemas/auth';
import { authService } from '@/services/authService';

export function useRefreshToken() {
  const setAuth = useAuthStore(state => state.setAuth);
  console.log('[useRefreshToken] refreshing token')
  console.log('[useRefreshToken] auth store state:', useAuthStore.getState())
  const refresh = async () => {
    try {
      const auth = await authService.refresh();
      setAuth(auth);
      console.log('[useRefreshToken] auth store state after refresh:', useAuthStore.getState())
      return auth;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  return refresh;
} 