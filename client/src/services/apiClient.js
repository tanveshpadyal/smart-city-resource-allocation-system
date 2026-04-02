/**
 * API Client
 * Centralized HTTP client using Axios
 * Handles authentication, error handling, and request/response interceptors
 */

import axios from "axios";
import { config } from "../config";
import useAuthStore from "../store/authStore";

const apiClient = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem(config.auth.tokenKey);
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }

    return requestConfig;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";
    const isAuthEndpoint = requestUrl.startsWith("/auth/");
    const statusCode = error.response?.status;
    const errorCode = error.response?.data?.code;
    const isTokenExpiredError =
      statusCode === 401 ||
      (statusCode === 403 && errorCode === "INVALID_TOKEN");

    if (isTokenExpiredError && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);

      if (refreshToken) {
        return apiClient
          .post("/auth/refresh", { refreshToken })
          .then((response) => {
            const { accessToken, refreshToken: newRefreshToken } =
              response.data.data;

            localStorage.setItem(config.auth.tokenKey, accessToken);
            localStorage.setItem(config.auth.refreshTokenKey, newRefreshToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          })
          .catch((refreshError) => {
            useAuthStore.getState().logout();
            window.location.href = config.routes.public.login;
            return Promise.reject(refreshError);
          });
      }

      useAuthStore.getState().logout();
      window.location.href = config.routes.public.login;
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
