import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies
});

export default axiosInstance;