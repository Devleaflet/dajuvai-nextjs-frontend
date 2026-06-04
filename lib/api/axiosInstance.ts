// api/axiosInstance.ts
import axios from "axios";
import { API_BASE_URL } from "@/lib/config";
import logger from "@/lib/utils/logger";
import { secureStorage } from "@/lib/utils/secureStorage";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Always send cookies for cross-origin requests
});

axiosInstance.interceptors.request.use((config) => {
  // If authorization header is already set manually, don't overwrite it
  const hasAuthHeader = config.headers && (
    config.headers['Authorization'] || 
    config.headers['authorization'] || 
    (typeof config.headers.has === 'function' && config.headers.has('Authorization'))
  );

  if (hasAuthHeader) {
    return config;
  }

  let token: string | null = null;
  
  if (typeof window !== 'undefined') {
    // Determine token based on the endpoint
    const url = config.url || '';
    if (url.includes('/vendor/') || url.includes('/vendors/')) {
      token = localStorage.getItem('vendorToken');
    } else {
      token = secureStorage.getItem('authToken');
    }
  }

  // Detailed debug logging only in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug("Axios request", { 
      url: config.url, 
      method: config.method,
      hasToken: !!token,
      isVendorRoute: config.url?.includes('/vendor/') || config.url?.includes('/vendors/')
    });
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  logger.error("Axios interceptor - Request error", error);
  return Promise.reject(error);
});

// Add response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    // Don't log 404s for common probes or expected failures to reduce noise
    // but DO log them for application API calls as requested by the user
    if (status === 404) {
      logger.error(`HTTP 404: ${method} ${url}`, {
        data: error.response?.data,
        message: error.message
      });
    } else if (status !== 401 && status !== 403) {
      // Log other non-auth errors
      logger.error(`Axios response error ${status}: ${method} ${url}`, {
        message: error.message,
        data: error.response?.data
      });
    }
    
    return Promise.reject(error);
  }
);

// We keep this as a no-op function so that files importing it don't break
export const setupAxiosInterceptors = () => {};

export default axiosInstance;
