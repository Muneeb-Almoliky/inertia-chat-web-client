'use client'

import { useEffect } from 'react';
import { useRefreshToken } from './useRefreshToken';
import axiosInstance from '@/api/axios';
import { useAuthStore } from '@/lib/store/auth.store';
export function useAxios() {
  const refresh = useRefreshToken();
  const auth = useAuthStore.getState();

  useEffect(() => {
    console.log(auth.accessToken);
    const interceptors = {
      request: axiosInstance.interceptors.request.use(
        config => {
          console.info('API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: config.headers,
            data: config.data
          });

          if (!config.headers!['Authorization']) {
            console.log(auth?.accessToken);
            config.headers!['Authorization'] = `Bearer ${auth?.accessToken}`;
          }
          return config;
        },
        error => Promise.reject(error)
      ),
      response: axiosInstance.interceptors.response.use(
        response => {
          console.info('API Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data
          });
          return response;
        },
        async error => {
          const prevRequest = error?.config;
          
          // Prevent infinite refresh token loop
          if (error?.response?.status === 401 && !prevRequest?.sent && !prevRequest?.url?.includes('/auth/refresh')) {
            prevRequest.sent = true;
            try {
              const auth = await refresh();
              if (auth.accessToken) {
                prevRequest.headers['Authorization'] = `Bearer ${auth.accessToken}`;
                return axiosInstance(prevRequest);
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
            }
          }
          return Promise.reject(error);
        }
      )
    };

    return () => {
      axiosInstance.interceptors.request.eject(interceptors.request);
      axiosInstance.interceptors.response.eject(interceptors.response);
    };
  }, [auth, refresh]);

  return axiosInstance;
} 