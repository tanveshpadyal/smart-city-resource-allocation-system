/**
 * useProvider Hook
 * Provider and service catalog operations
 */

import { useState } from "react";
import providerService from "../services/providerService";

const useProvider = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fn();
      setLoading(false);
      return data;
    } catch (err) {
      const message = err.response?.data?.error || "Request failed";
      setError(message);
      setLoading(false);
      throw err;
    }
  };

  return {
    loading,
    error,
    clearError: () => setError(null),
    getCatalog: (filters) => run(() => providerService.getCatalog(filters)),
    listProviderServices: (filters) =>
      run(() => providerService.listProviderServices(filters)),
    createMyProvider: (payload) =>
      run(() => providerService.createMyProvider(payload)),
    getMyProvider: () => run(() => providerService.getMyProvider()),
    updateMyProvider: (payload) =>
      run(() => providerService.updateMyProvider(payload)),
    addMyService: (payload) => run(() => providerService.addMyService(payload)),
  };
};

export default useProvider;
