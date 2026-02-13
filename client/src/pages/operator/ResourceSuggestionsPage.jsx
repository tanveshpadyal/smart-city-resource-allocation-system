/**
 * Resource Suggestions Page - Operator
 */

import { useCallback, useEffect, useState } from "react";
import { OperatorLayout } from "../../components/layouts/OperatorLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert } from "../../components/common/Alert";
import { Button } from "../../components/common";
import useRequest from "../../hooks/useRequest";
import useAllocation from "../../hooks/useAllocation";

export const ResourceSuggestionsPage = () => {
  const {
    requests,
    loading: reqLoading,
    error: reqError,
    getPendingRequests,
  } = useRequest();
  const {
    suggestResources,
    loading: allocLoading,
    error: allocError,
  } = useAllocation();

  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const loading = reqLoading || allocLoading;
  const error = reqError || allocError;

  const loadPendingRequests = useCallback(async () => {
    try {
      await getPendingRequests();
    } catch {
      // Error handled by hook
    }
  }, [getPendingRequests]);

  useEffect(() => {
    loadPendingRequests();
  }, [loadPendingRequests]);

  const handleGetSuggestions = async () => {
    if (!selectedRequestId) return;
    try {
      const response = await suggestResources(selectedRequestId);
      const rows =
        response?.data?.suggestions ||
        response?.data?.data?.suggestions ||
        response?.suggestions ||
        [];
      setSuggestions(rows);
    } catch {
      // Error handled by hook
      setSuggestions([]);
    }
  };

  return (
    <OperatorLayout>
      <div className="space-y-6">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            Resource Suggestions
          </h2>

          {loading ? (
            <InlineSpinner />
          ) : error ? (
            <ErrorAlert message={error} onRetry={loadPendingRequests} />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <select
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2 md:max-w-lg"
                  value={selectedRequestId}
                  onChange={(e) => setSelectedRequestId(e.target.value)}
                >
                  <option value="">Select pending request</option>
                  {(requests || []).map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.resource_category} | {req.priority} | qty{" "}
                      {req.quantity_requested}
                    </option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  onClick={handleGetSuggestions}
                  disabled={!selectedRequestId}
                  loading={allocLoading}
                >
                  Get Suggestions
                </Button>
              </div>

              {selectedRequestId && suggestions.length === 0 && (
                <p className="text-sm text-neutral-600">
                  No suggestions yet for the selected request.
                </p>
              )}

              {suggestions.length > 0 && (
                <div className="space-y-3">
                  {suggestions.map((item) => (
                    <div
                      key={item.resource_id}
                      className="rounded-lg border border-neutral-200 p-4"
                    >
                      <p className="font-semibold text-neutral-900">
                        {item.name} ({item.code})
                      </p>
                      <p className="text-sm text-neutral-600">
                        Category: {item.category} | Available:{" "}
                        {item.quantity_available}
                      </p>
                      <p className="text-sm text-neutral-600">
                        Distance: {item.distance_km} km | ETA:{" "}
                        {item.travel_time_minutes} min
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </OperatorLayout>
  );
};

export default ResourceSuggestionsPage;
