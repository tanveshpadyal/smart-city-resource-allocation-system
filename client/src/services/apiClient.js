/**
 * API Client
 * Centralized HTTP client using Axios
 * Handles authentication, error handling, and request/response interceptors
 */

import axios from "axios";
import { config } from "../config";
import { useAuthStore } from "../store/authStore";

// Create axios instance
const apiClient = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * REQUEST INTERCEPTOR
 * Adds authentication token to every request
 */
apiClient.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem(config.auth.tokenKey);

    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }

    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * RESPONSE INTERCEPTOR
 * Handles errors and token refresh logic
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Handle 401 (Unauthorized) - Token might be expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);

      if (refreshToken) {
        return apiClient
          .post("/auth/refresh", { refreshToken })
          .then((response) => {
            const { accessToken, refreshToken: newRefreshToken } =
              response.data.data;

            // Update tokens in storage
            localStorage.setItem(config.auth.tokenKey, accessToken);
            localStorage.setItem(config.auth.refreshTokenKey, newRefreshToken);

            // Update header
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            // Retry original request
            return apiClient(originalRequest);
          })
          .catch((refreshError) => {
            // Refresh failed, logout user
            useAuthStore.getState().logout();

            // Redirect to login
            window.location.href = config.routes.public.login;

            return Promise.reject(refreshError);
          });
      } else {
        // No refresh token, logout
        useAuthStore.getState().logout();
        window.location.href = config.routes.public.login;
      }
    }

    // Handle 403 (Forbidden) - User doesn't have permission
    if (error.response?.status === 403) {
      window.location.href = "/unauthorized";
    }

    return Promise.reject(error);
  },
);

export default apiClient;
