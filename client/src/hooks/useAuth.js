/**
 * useAuth Hook
 * Custom hook for authentication operations
 */

import useAuthStore from "../store/authStore";

export const useAuth = () => {
  const {
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    refreshAccessToken,
    changePassword,
    updateUser,
    clearError,
    hasRole,
    hasAnyRole,
  } = useAuthStore();

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    isAuthenticated,

    // Actions
    register,
    login,
    logout,
    refreshAccessToken,
    changePassword,
    updateUser,
    clearError,
    hasRole,
    hasAnyRole,
  };
};

export default useAuth;
