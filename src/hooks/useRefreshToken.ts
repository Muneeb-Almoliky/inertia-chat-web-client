import { useAuthStore } from '@/lib/store/auth.store';
import axiosInstance from '@/api/axios';
import type { AuthResponse } from '@/lib/schemas/auth';

export function useRefreshToken() {
  const setAuth = useAuthStore(state => state.setAuth);

  const refresh = async () => {
    try {
      const response = await axiosInstance.post<{ data: AuthResponse }>('/auth/refresh');
      const auth = response.data.data;
      setAuth(auth);
      return auth;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  return refresh;
} 