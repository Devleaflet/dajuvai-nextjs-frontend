// api/axiosInstance.ts
import axios from "axios";
import { API_BASE_URL } from "@/lib/config";
import logger from "@/lib/utils/logger";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Always send cookies for cross-origin requests
});

export const setupAxiosInterceptors = (getTokenFn: () => string | null) => {
  axiosInstance.interceptors.request.use((config) => {
    const token = getTokenFn?.();
    logger.debug("Axios interceptor - Token", { hasToken: !!token });
    logger.debug("Axios interceptor - Request", { url: config.url, method: config.method });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.debug("Axios interceptor - Authorization header set");
    } else {
      logger.warn("Axios interceptor - No token available for request", { url: config.url });
    }
    
    return config;
  }, (error) => {
    logger.error("Axios interceptor - Request error", error);
    return Promise.reject(error);
  });

  // Add response interceptor to handle 401 errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      };
      
      logger.error("Axios interceptor - Response error", errorDetails);
      
      // Log the full error for debugging
      if (error.response?.status) {
        logger.error(`HTTP ${error.response.status}: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      } else if (error.request) {
        logger.error("No response received from server", { url: error.config?.url });
      } else {
        logger.error("Request setup error", { message: error.message });
      }
      
      // Do not handle vendor 401 redirects here; let the products.ts interceptor handle it
      return Promise.reject(error);
    }
  );
};

export default axiosInstance;
