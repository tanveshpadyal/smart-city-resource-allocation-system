/**
 * useAllocation Hook
 * Custom hook for resource allocation operations
 */

import { useState, useCallback } from "react";
import allocationService from "../services/allocationService";

export const useAllocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allocations, setAllocations] = useState([]);

  const manualAllocate = useCallback(async (requestId, resourceId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await allocationService.manualAllocate(
        requestId,
        resourceId,
      );
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to allocate resource";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const autoAllocate = useCallback(async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await allocationService.autoAllocate(requestId);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.details ||
        err.response?.data?.message ||
        "Failed to auto-allocate";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const suggestResources = useCallback(async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await allocationService.suggestResources(requestId);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to suggest resources";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllocation = useCallback(async (allocationId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await allocationService.getAllocation(allocationId);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch allocation";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllocations = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await allocationService.getAllocations(filters);
      setAllocations(response.data || response.allocations || response || []);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to fetch allocations";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelAllocation = useCallback(async (allocationId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await allocationService.cancelAllocation(allocationId);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to cancel allocation";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markInTransit = useCallback(async (allocationId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await allocationService.markInTransit(allocationId);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to mark as in transit";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markDelivered = useCallback(async (allocationId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await allocationService.markDelivered(allocationId);
      return response;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to mark as delivered";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    allocations,
    loading,
    error,

    // Actions
    manualAllocate,
    autoAllocate,
    suggestResources,
    getAllocation,
    getAllocations,
    cancelAllocation,
    markInTransit,
    markDelivered,
  };
};

export default useAllocation;
