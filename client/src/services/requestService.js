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
    try {
      console.log("[requestService.createRequest] Sending data:", requestData);
      const response = await apiClient.post("/requests", requestData);
      console.log("[requestService.createRequest] Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("[requestService.createRequest] Request failed:", error);
      console.error(
        "[requestService.createRequest] Error status:",
        error.response?.status,
      );
      console.error(
        "[requestService.createRequest] Error data:",
        error.response?.data,
      );
      console.error(
        "[requestService.createRequest] Error message:",
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message,
      );
      throw error;
    }
  },

  /**
   * Get all requests for the current user (citizen)
   */
  getMyRequests: async (filters = {}) => {
    const response = await apiClient.get("/requests/me", { params: filters });
    return response.data;
  },

  /**
   * Get all pending requests (operator/admin)
   */
  getPendingRequests: async (filters = {}) => {
    const response = await apiClient.get("/requests/pending/list", {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get complaints assigned to current operator
   */
  getAssignedComplaints: async (filters = {}) => {
    const response = await apiClient.get("/requests/operator/assigned", {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get all complaints for current operator
   */
  getOperatorComplaints: async (filters = {}) => {
    const response = await apiClient.get("/operator/complaints", {
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
   * Get complaint timeline
   */
  getComplaintTimeline: async (requestId) => {
    const response = await apiClient.get(`/requests/${requestId}/timeline`);
    return response.data;
  },

  /**
   * Start complaint resolution (operator)
   */
  startComplaint: async (requestId) => {
    const response = await apiClient.post(`/requests/${requestId}/start`);
    return response.data;
  },

  /**
   * Resolve complaint (operator)
   */
  resolveComplaint: async (requestId, note, image) => {
    const response = await apiClient.post(`/requests/${requestId}/resolve`, {
      note,
      image,
    });
    return response.data;
  },

  /**
   * Update complaint status (operator)
   */
  updateComplaintStatus: async (requestId, status) => {
    const response = await apiClient.patch(`/requests/${requestId}/status`, {
      status,
    });
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
    const response = await apiClient.get("/requests/admin/all", {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get pending complaints (admin)
   */
  getAdminPendingComplaints: async (filters = {}) => {
    const response = await apiClient.get("/requests/admin/pending", {
      params: filters,
    });
    return response.data;
  },

  /**
   * Assign a complaint to an operator (admin)
   */
  assignComplaint: async (requestId, operatorId) => {
    const response = await apiClient.post(`/requests/${requestId}/assign`, {
      operator_id: operatorId,
    });
    return response.data;
  },

  /**
   * Get time-based analytics stats (admin)
   */
  getAdminTimeStats: async () => {
    const response = await apiClient.get("/requests/admin/stats/time");
    return response.data;
  },

  /**
   * Get operator performance leaderboard (admin)
   */
  getOperatorPerformance: async () => {
    const response = await apiClient.get(
      "/requests/admin/operator-performance",
    );
    return response.data;
  },

  /**
   * Get admin analytics charts data (admin)
   */
  getAdminAnalytics: async () => {
    const response = await apiClient.get("/requests/admin/analytics");
    return response.data;
  },

  /**
   * Get overdue complaints (admin)
   */
  getOverdueComplaints: async () => {
    const response = await apiClient.get("/requests/admin/overdue");
    return response.data;
  },

  /**
   * Get admin locations (admin)
   */
  getAdminLocations: async () => {
    const response = await apiClient.get("/requests/admin/locations");
    return response.data;
  },

  /**
   * Export complaints as CSV (admin)
   */
  exportComplaints: async (type = "all") => {
    const response = await apiClient.get("/requests/admin/export", {
      params: { type },
      responseType: "blob",
    });
    return response;
  },
};

export default requestService;
