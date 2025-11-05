import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  timeout: process.env.NEXT_PUBLIC_API_TIMEOUT || 180000, // ✅ 3 minutes for large PDF files (16 pages ~20MB base64)
  maxContentLength: 100 * 1024 * 1024, // ✅ 100MB max request body size (safe for 16-page PDFs)
  maxBodyLength: 100 * 1024 * 1024, // ✅ 100MB max request body size
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

import { useAuthStore } from "@/stores/auth-store";

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log(`Unauthorized! Clearing user and redirecting to login.`);
      const { clearUser } = useAuthStore.getState();
      clearUser();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
