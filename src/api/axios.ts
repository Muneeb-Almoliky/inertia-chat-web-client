import axios from 'axios';
import { useAuthStore } from '@/lib/store/auth.store';
import { authService } from '@/services/authService';
import { getApiBaseUrl } from '@/utils/api';

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// REQUEST interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${accessToken}`,
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalReq = error.config!;
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error;
    const { accessToken } = useAuthStore.getState();

    const shouldRefresh = (
      (status === 401 || status === 403) &&
      !originalReq._retry &&
      !originalReq.url?.includes('/auth/refresh') &&
      (errorMessage === "Invalid or expired token. Please log in again." || !accessToken)
    );

    if (shouldRefresh) {
      originalReq._retry = true;
      try {
        // call your refresh endpoint directly
        const resp = await authService.refresh();
        const newAccessToken = resp.accessToken;
        if (newAccessToken) {
          // update your store so future requests use the fresh token
          useAuthStore.setState({ accessToken: newAccessToken });

          // patch the original request and retry
          originalReq.headers = {
            ...originalReq.headers,
            Authorization: `Bearer ${newAccessToken}`,
          };
          return axiosInstance(originalReq);
        }
      } catch (refreshError) {
        // if refresh also fails, fall through to reject
        console.error('[Axios] refresh failed:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
