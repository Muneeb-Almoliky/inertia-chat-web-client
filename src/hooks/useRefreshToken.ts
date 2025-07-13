import { useAuthStore } from '@/lib/store/auth.store';
import { authService } from '@/services/authService';

export function useRefreshToken() {
  const setAuth = useAuthStore(state => state.setAuth);
  const accessToken = useAuthStore(state => state.accessToken);
  
  const refresh = async () => {
    console.log('accessToken', accessToken);
    if (accessToken) {
      return { accessToken };
    }
    
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