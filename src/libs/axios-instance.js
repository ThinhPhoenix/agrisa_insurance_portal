import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  timeout: process.env.NEXT_PUBLIC_API_TIMEOUT || 180000, // ✅ 3 minutes for large PDF files (16 pages ~20MB base64)
  maxContentLength: 100 * 1024 * 1024, // ✅ 100MB max request body size (safe for 16-page PDFs)
  maxBodyLength: 100 * 1024 * 1024, // ✅ 100MB max request body size
  headers: {
    "Content-Type": "application/json",
    "Accept-Encoding": "gzip, deflate, br", // ✅ Enable response compression
  },
  withCredentials: false,
  decompress: true, // ✅ Auto decompress response
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Log request size for debugging 413 errors
    if (config.data) {
      const dataStr =
        typeof config.data === "string"
          ? config.data
          : JSON.stringify(config.data);
      const sizeBytes = new Blob([dataStr]).size;
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

      console.log(`📤 Request to ${config.url}:`);
      console.log(
        `   Size: ${sizeMB} MB (${sizeBytes.toLocaleString()} bytes)`
      );
      console.log(`   Method: ${config.method?.toUpperCase()}`);
      console.log(`   Content-Type: ${config.headers["Content-Type"]}`);

      // ⚠️ Warn if > 10MB
      if (sizeBytes > 10 * 1024 * 1024) {
        console.warn(`⚠️ Large request: ${sizeMB} MB - may cause 413 error!`);
        console.warn(
          `💡 Using Content-Type: ${config.headers["Content-Type"]} to match Postman`
        );
      }
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
