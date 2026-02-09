/**
 * Environment Configuration
 * Centralized configuration for API endpoints, timeouts, etc.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const config = {
  // API Configuration
  api: {
    baseURL: API_BASE_URL,
    timeout: 10000,
    retries: 3,
  },

  // Auth Configuration
  auth: {
    tokenKey: "smartcity_access_token",
    refreshTokenKey: "smartcity_refresh_token",
    userKey: "smartcity_user",
    expirationKey: "smartcity_token_expiry",
  },

  // Client Configuration
  client: {
    name: "Smart City Resource Allocation System",
    version: "1.0.0",
    environment: import.meta.env.MODE,
  },

  // Feature Flags
  features: {
    enableAutoAllocation: true,
    enableOperatorDashboard: true,
    enableAdminPanel: true,
  },

  // Routes
  routes: {
    public: {
      login: "/login",
      register: "/register",
      landing: "/",
    },
    private: {
      dashboard: "/dashboard",
      requests: "/requests",
      allocations: "/allocations",
      profile: "/profile",
    },
    role: {
      citizen: "/citizen",
      operator: "/operator",
      admin: "/admin",
    },
  },

  // Roles
  roles: {
    CITIZEN: "CITIZEN",
    OPERATOR: "OPERATOR",
    ADMIN: "ADMIN",
  },
};

export default config;
