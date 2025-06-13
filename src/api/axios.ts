import axios from 'axios';
import { useAuthStore } from '@/lib/store/auth.store'
import { authService } from '@/services/authService';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, 
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers!.Authorization = `Bearer ${token}`
      console.log("🚀 authed request:", config);
    } else {
      console.log("🚀⚠️ unauthed request:", config);
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("🔁 Refreshing token due to 401...");
        const refreshAuth = await authService.refresh();
        const newToken = refreshAuth.accessToken;

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
