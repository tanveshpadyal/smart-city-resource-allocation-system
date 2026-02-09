/**
 * Auth Service
 * API calls for authentication endpoints
 */

import apiClient from "./apiClient";

const authService = {
  /**
   * Register a new user
   */
  register: async (name, email, password, passwordConfirm) => {
    const response = await apiClient.post("/auth/register", {
      name,
      email,
      password,
      passwordConfirm,
    });
    return response.data;
  },

  /**
   * Login user
   */
  login: async (email, password) => {
    const response = await apiClient.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post("/auth/refresh", {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await apiClient.put("/auth/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  /**
   * Logout
   */
  logout: async () => {
    const response = await apiClient.post("/auth/logout");
    return response.data;
  },
};

export default authService;
