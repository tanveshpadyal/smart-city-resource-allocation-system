/**
 * Request Service
 * API calls for resource request management
 */

import apiClient from "./apiClient";

const requestService = {
  /**
   * Create a new resource request
   */
  createRequest: async (requestData) => {
    const response = await apiClient.post("/requests", requestData);
    return response.data;
  },

  /**
   * Get all requests for the current user (citizen)
   */
  getMyRequests: async (filters = {}) => {
    const response = await apiClient.get("/requests/my", { params: filters });
    return response.data;
  },

  /**
   * Get all pending requests (operator/admin)
   */
  getPendingRequests: async (filters = {}) => {
    const response = await apiClient.get("/requests/pending", {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get a specific request by ID
   */
  getRequest: async (requestId) => {
    const response = await apiClient.get(`/requests/${requestId}`);
    return response.data;
  },

  /**
   * Update a request (citizen)
   */
  updateRequest: async (requestId, updateData) => {
    const response = await apiClient.put(`/requests/${requestId}`, updateData);
    return response.data;
  },

  /**
   * Cancel a request
   */
  cancelRequest: async (requestId) => {
    const response = await apiClient.delete(`/requests/${requestId}`);
    return response.data;
  },

  /**
   * Get all requests (admin)
   */
  getAllRequests: async (filters = {}) => {
    const response = await apiClient.get("/requests", { params: filters });
    return response.data;
  },
};

export default requestService;
