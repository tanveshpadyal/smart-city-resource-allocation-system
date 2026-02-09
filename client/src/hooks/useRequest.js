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
      const response = await requestService.createRequest(requestData);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to create request";
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
      setRequests(response.requests || response);
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
      setRequests(response.requests || response);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch pending requests";
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

  return {
    // State
    requests,
    loading,
    error,

    // Actions
    createRequest,
    getMyRequests,
    getPendingRequests,
    getRequest,
    updateRequest,
    cancelRequest,
  };
};

export default useRequest;
