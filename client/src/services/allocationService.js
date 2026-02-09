/**
 * Allocation Service
 * API calls for resource allocation management
 */

import apiClient from "./apiClient";

const allocationService = {
  /**
   * Manually allocate a resource to a request
   */
  manualAllocate: async (requestId, resourceId) => {
    const response = await apiClient.post(`/allocations/manual`, {
      requestId,
      resourceId,
    });
    return response.data;
  },

  /**
   * Trigger auto-allocation for a request
   */
  autoAllocate: async (requestId) => {
    const response = await apiClient.post(`/allocations/auto/${requestId}`);
    return response.data;
  },

  /**
   * Get suggested resources for manual allocation
   */
  suggestResources: async (requestId) => {
    const response = await apiClient.get(`/allocations/suggest/${requestId}`);
    return response.data;
  },

  /**
   * Get a specific allocation by ID
   */
  getAllocation: async (allocationId) => {
    const response = await apiClient.get(`/allocations/${allocationId}`);
    return response.data;
  },

  /**
   * Get all allocations (operator/admin)
   */
  getAllocations: async (filters = {}) => {
    const response = await apiClient.get("/allocations", { params: filters });
    return response.data;
  },

  /**
   * Cancel an allocation
   */
  cancelAllocation: async (allocationId) => {
    const response = await apiClient.delete(`/allocations/${allocationId}`);
    return response.data;
  },

  /**
   * Mark allocation as in transit
   */
  markInTransit: async (allocationId) => {
    const response = await apiClient.patch(
      `/allocations/${allocationId}/in-transit`,
    );
    return response.data;
  },

  /**
   * Mark allocation as delivered
   */
  markDelivered: async (allocationId) => {
    const response = await apiClient.patch(
      `/allocations/${allocationId}/delivered`,
    );
    return response.data;
  },
};

export default allocationService;
