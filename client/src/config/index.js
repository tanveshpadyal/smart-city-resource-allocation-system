/**
 * Environment Configuration
 * Centralized configuration for API endpoints, timeouts, etc.
 */

const DEFAULT_DEV_API_URL = "http://localhost:5000/api";
const DEFAULT_PROD_API_URL =
  "https://smart-city-resource-allocation-system-1.onrender.com/api";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? DEFAULT_PROD_API_URL : DEFAULT_DEV_API_URL)
).replace(/\/+$/, "");

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
    name: "Smart City Complaint Management System",
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

  // Cities (hardcoded MVP)
  cities: [
    { value: "PUNE", label: "Pune" },
    { value: "MUMBAI", label: "Mumbai" },
    { value: "NAGPUR", label: "Nagpur" },
  ],
};

export default config;
