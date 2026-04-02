/**
 * Authentication Store
 * Zustand store for auth state management
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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

            try {
              const response = await authService.getCurrentUser();
              const userData = {
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                role: response.data.role,
                profilePhoto: response.data.profile_photo || null,
                profile_photo: response.data.profile_photo || null,
              };
              set({ user: userData, error: null });
            } catch {
              if (storedRefreshToken) {
                try {
                  const refreshResponse =
                    await authService.refreshToken(storedRefreshToken);
                  const {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                  } = refreshResponse.data;

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

      register: async (name, email, password, passwordConfirm) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(
            name,
            email,
            password,
            passwordConfirm,
          );

          const { data } = response;
          const userData = {
            id: data.userId,
            name: data.name,
            email: data.email,
            role: data.role,
            profilePhoto: data.profilePhoto || null,
            profile_photo: data.profilePhoto || null,
          };

          set({
            user: userData,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          localStorage.setItem(config.auth.userKey, JSON.stringify(userData));
          localStorage.setItem(config.auth.tokenKey, data.accessToken);
          localStorage.setItem(config.auth.refreshTokenKey, data.refreshToken);

          return response;
        } catch (error) {
          const errorMessage =
            error.response?.data?.error || "Registration failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);

          const { data } = response;
          const userData = {
            id: data.userId,
            name: data.name,
            email: data.email,
            role: data.role,
            profilePhoto: data.profilePhoto || null,
            profile_photo: data.profilePhoto || null,
          };

          set({
            user: userData,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          localStorage.setItem(config.auth.userKey, JSON.stringify(userData));
          localStorage.setItem(config.auth.tokenKey, data.accessToken);
          localStorage.setItem(config.auth.refreshTokenKey, data.refreshToken);

          return response;
        } catch (error) {
          const errorMessage = error.response?.data?.error || "Login failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      googleLogin: async (idToken) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.googleLogin(idToken);
          const { data } = response;
          const userData = {
            id: data.userId,
            name: data.name,
            email: data.email,
            role: data.role,
            profilePhoto: data.profilePhoto || null,
            profile_photo: data.profilePhoto || null,
          };

          set({
            user: userData,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          localStorage.setItem(config.auth.userKey, JSON.stringify(userData));
          localStorage.setItem(config.auth.tokenKey, data.accessToken);
          localStorage.setItem(config.auth.refreshTokenKey, data.refreshToken);

          return response;
        } catch (error) {
          const errorMessage =
            error.response?.data?.error || "Google login failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          try {
            await authService.logout();
          } catch (error) {
            console.warn("Logout endpoint error:", error);
          }

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          localStorage.removeItem(config.auth.userKey);
          localStorage.removeItem(config.auth.tokenKey);
          localStorage.removeItem(config.auth.refreshTokenKey);
          localStorage.removeItem(config.auth.expirationKey);
        } catch (error) {
          console.error("Logout error:", error);
          set({ error: "Logout failed", isLoading: false });
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await authService.refreshToken(refreshToken);
          const { data } = response;
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            data;

          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            error: null,
          });

          localStorage.setItem(config.auth.tokenKey, newAccessToken);
          localStorage.setItem(config.auth.refreshTokenKey, newRefreshToken);

          return response;
        } catch (error) {
          get().logout();
          throw error;
        }
      },

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
            error.response?.data?.error || "Password change failed";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
        localStorage.setItem(config.auth.userKey, JSON.stringify(get().user));
      },

      clearError: () => {
        set({ error: null });
      },

      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },

      hasAnyRole: (roles) => {
        const { user } = get();
        return user && roles.includes(user.role);
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
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
