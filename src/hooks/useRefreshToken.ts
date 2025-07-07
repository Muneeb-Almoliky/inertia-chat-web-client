import { useAuthStore } from '@/lib/store/auth.store';
import { authService } from '@/services/authService';

export function useRefreshToken() {
  const setAuth = useAuthStore(state => state.setAuth);
  const refresh = async () => {
    try {
      const auth = await authService.refresh();
      setAuth(auth);
      return auth;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  return refresh;
} 