/**
 * Provider Service
 * API calls for provider registration and service listings
 */

import apiClient from "./apiClient";

const providerService = {
  getCatalog: async () => {
    const response = await apiClient.get("/providers/catalog");
    return response.data;
  },

  listProviderServices: async (filters = {}) => {
    const response = await apiClient.get("/providers/services", {
      params: filters,
    });
    return response.data;
  },

  createMyProvider: async (payload) => {
    const response = await apiClient.post("/providers/me", payload);
    return response.data;
  },

  getMyProvider: async () => {
    const response = await apiClient.get("/providers/me");
    return response.data;
  },

  updateMyProvider: async (payload) => {
    const response = await apiClient.put("/providers/me", payload);
    return response.data;
  },

  addMyService: async (payload) => {
    const response = await apiClient.post("/providers/me/services", payload);
    return response.data;
  },
};

export default providerService;
