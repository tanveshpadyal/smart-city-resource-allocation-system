/**
 * useRequest Hook
 * Custom hook for resource request operations
 */

import { useState, useCallback } from "react";
import requestService from "../services/requestService";

export const useRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);

  const createRequest = useCallback(async (requestData) => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[useRequest.createRequest] Calling API with data:",
        requestData,
      );
      const response = await requestService.createRequest(requestData);
      console.log("[useRequest.createRequest] Success response:", response);
      return response;
    } catch (err) {
      console.error("[useRequest.createRequest] Error:", err);
      console.error(
        "[useRequest.createRequest] Error response data:",
        err.response?.data,
      );
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to create request";
      console.log("[useRequest.createRequest] Setting error:", errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyRequests = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.getMyRequests(filters);
      setRequests(response.data || response);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch requests";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPendingRequests = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.getPendingRequests(filters);
      setRequests(response.data || response);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to fetch pending requests";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAssignedComplaints = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.getAssignedComplaints(filters);
      setRequests(response.data || response);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to fetch assigned complaints";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOperatorComplaints = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.getOperatorComplaints(filters);
      setRequests(response.data || response);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to fetch operator complaints";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRequest = useCallback(async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.getRequest(requestId);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch request";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRequest = useCallback(async (requestId, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.updateRequest(
        requestId,
        updateData,
      );
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to update request";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelRequest = useCallback(async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.cancelRequest(requestId);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to cancel request";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllRequests = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.getAllRequests(filters);
      setRequests(response.data || response);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch all requests";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startComplaint = useCallback(async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.startComplaint(requestId);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to start complaint";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveComplaint = useCallback(async (requestId, note, image) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.resolveComplaint(
        requestId,
        note,
        image,
      );
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to resolve complaint";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateComplaintStatus = useCallback(async (requestId, status) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.updateComplaintStatus(
        requestId,
        status,
      );
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to update complaint status";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAdminPendingComplaints = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.getAdminPendingComplaints(filters);
      setRequests(response.data || response);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to fetch pending complaints";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignComplaint = useCallback(async (requestId, operatorId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestService.assignComplaint(requestId, operatorId);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to assign complaint";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    requests,
    loading,
    error,

    // Actions
    createRequest,
    getMyRequests,
    getPendingRequests,
    getAssignedComplaints,
    getOperatorComplaints,
    getRequest,
    startComplaint,
    resolveComplaint,
    updateComplaintStatus,
    updateRequest,
    cancelRequest,
    getAllRequests,
    getAdminPendingComplaints,
    assignComplaint,
  };
};

export default useRequest;
