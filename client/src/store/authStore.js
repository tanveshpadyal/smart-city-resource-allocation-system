/**
 * Authentication Store
 * Zustand store for auth state management
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import config from "../config";
import authService from "../services/authService";

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      // Actions

      /**
       * Initialize auth state from localStorage (on app load)
       */
      initializeAuth: async () => {
        try {
          const storedUser = localStorage.getItem(config.auth.userKey);
          const storedAccessToken = localStorage.getItem(config.auth.tokenKey);
          const storedRefreshToken = localStorage.getItem(
            config.auth.refreshTokenKey,
          );

          if (storedUser && storedAccessToken) {
            set({
              user: JSON.parse(storedUser),
              accessToken: storedAccessToken,
              refreshToken: storedRefreshToken,
              isAuthenticated: true,
              error: null,
            });

            // Verify token is still valid by fetching user profile
            try {
              const response = await authService.getCurrentUser();
              set({
                user: response.user,
                error: null,
              });
            } catch {
              // Token might be expired, try to refresh
              if (storedRefreshToken) {
                try {
                  const refreshResponse =
                    await authService.refreshToken(storedRefreshToken);
                  const {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                  } = refreshResponse;

                  localStorage.setItem(config.auth.tokenKey, newAccessToken);
                  localStorage.setItem(
                    config.auth.refreshTokenKey,
                    newRefreshToken,
                  );

                  set({
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                    error: null,
                  });
                } catch {
                  // Refresh failed, logout
                  get().logout();
                }
              } else {
                get().logout();
              }
            }
          }
        } catch (error) {
          console.error("Failed to initialize auth:", error);
          set({ error: "Failed to initialize authentication" });
        }
      },

      /**
       * Register new user
       */
      register: async (name, email, password, passwordConfirm) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(
            name,
            email,
            password,
            passwordConfirm,
          );

          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Store in localStorage
          localStorage.setItem(
            config.auth.userKey,
            JSON.stringify(response.user),
          );
          localStorage.setItem(config.auth.tokenKey, response.accessToken);
          localStorage.setItem(
            config.auth.refreshTokenKey,
            response.refreshToken,
          );

          return response;
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || "Registration failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      /**
       * Login user
       */
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);

          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Store in localStorage
          localStorage.setItem(
            config.auth.userKey,
            JSON.stringify(response.user),
          );
          localStorage.setItem(config.auth.tokenKey, response.accessToken);
          localStorage.setItem(
            config.auth.refreshTokenKey,
            response.refreshToken,
          );

          return response;
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Login failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      /**
       * Logout user
       */
      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          // Optional: Call logout endpoint if backend requires it
          try {
            await authService.logout();
          } catch (error) {
            // Logout endpoint might fail, but we still clear local state
            console.warn("Logout endpoint error:", error);
          }

          // Clear all auth state
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Clear localStorage
          localStorage.removeItem(config.auth.userKey);
          localStorage.removeItem(config.auth.tokenKey);
          localStorage.removeItem(config.auth.refreshTokenKey);
          localStorage.removeItem(config.auth.expirationKey);
        } catch (error) {
          console.error("Logout error:", error);
          set({ error: "Logout failed", isLoading: false });
        }
      },

      /**
       * Refresh access token
       */
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await authService.refreshToken(refreshToken);
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            response;

          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            error: null,
          });

          // Update localStorage
          localStorage.setItem(config.auth.tokenKey, newAccessToken);
          localStorage.setItem(config.auth.refreshTokenKey, newRefreshToken);

          return response;
        } catch (error) {
          // Refresh failed, logout user
          get().logout();
          throw error;
        }
      },

      /**
       * Change password
       */
      changePassword: async (currentPassword, newPassword, confirmPassword) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.changePassword(
            currentPassword,
            newPassword,
            confirmPassword,
          );
          set({ isLoading: false, error: null });
          return response;
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || "Password change failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      /**
       * Update user profile
       */
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
        localStorage.setItem(config.auth.userKey, JSON.stringify(get().user));
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Check if user has a specific role
       */
      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },

      /**
       * Check if user has one of multiple roles
       */
      hasAnyRole: (roles) => {
        const { user } = get();
        return user && roles.includes(user.role);
      },
    }),
    {
      name: "auth-store", // localStorage key
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
