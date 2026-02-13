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
   * Google login
   */
  googleLogin: async (idToken) => {
    const response = await apiClient.post("/auth/google", { idToken });
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
   * Forgot password
   */
  forgotPassword: async (email) => {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return response.data;
  },

  /**
   * Reset password
   */
  resetPassword: async (token, newPassword, confirmPassword) => {
    const response = await apiClient.post("/auth/reset-password", {
      token,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  /**
   * Get active operators (admin)
   */
  getOperators: async () => {
    const response = await apiClient.get("/auth/operators");
    return response.data;
  },

  /**
   * Get all users (admin)
   */
  getAllUsers: async () => {
    const response = await apiClient.get("/auth/users");
    return response.data;
  },

  /**
   * Update user status (admin)
   */
  updateUserStatus: async (userId, status) => {
    const response = await apiClient.put(`/auth/users/${userId}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Create operator (admin)
   */
  createOperator: async (
    name,
    email,
    password,
    passwordConfirm,
    assignedAreas = [],
  ) => {
    const response = await apiClient.post("/auth/operators", {
      name,
      email,
      password,
      passwordConfirm,
      assignedAreas,
    });
    return response.data;
  },

  /**
   * Update operator assigned areas (admin)
   */
  updateOperatorAreas: async (userId, assignedAreas) => {
    const response = await apiClient.put(`/auth/users/${userId}/areas`, {
      assignedAreas,
    });
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
   * Update current user profile photo
   */
  updateProfilePhoto: async (profilePhoto) => {
    const response = await apiClient.put("/auth/profile-photo", {
      profilePhoto,
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
