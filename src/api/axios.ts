import axios from 'axios';
import { useAuthStore } from '@/lib/store/auth.store'

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
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)


export default axiosInstance

