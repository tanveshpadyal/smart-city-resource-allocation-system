/**
 * Pending Requests Page - Operator
 */

import { useCallback, useEffect, useState } from "react";
import { OperatorLayout } from "../../components/layouts/OperatorLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert, SuccessAlert } from "../../components/common/Alert";
import { Button } from "../../components/common";
import useRequest from "../../hooks/useRequest";
import useAllocation from "../../hooks/useAllocation";

export const PendingRequestsPage = () => {
  const { requests, loading, error, getPendingRequests } = useRequest();
  const { autoAllocate } = useAllocation();
  const [successMessage, setSuccessMessage] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      await getPendingRequests();
    } catch {
      // Error handled by hook
    }
  }, [getPendingRequests]);

  useEffect(() => {
    loadRequests();
  }, [getPendingRequests, loadRequests]);

  const handleAutoAllocate = async (requestId) => {
    try {
      await autoAllocate(requestId);
      setSuccessMessage("Auto-allocation triggered successfully!");
      setTimeout(() => setSuccessMessage(""), 5000);
      loadRequests();
    } catch {
      // Error handled by hook
    }
  };

  // Separate and sort requests by priority
  const sortedRequests = [...(requests || [])].sort((a, b) => {
    const priorityOrder = { EMERGENCY: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <OperatorLayout>
      <div className="space-y-6">
        {successMessage && (
          <SuccessAlert
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        )}

        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            Pending Requests Queue ({sortedRequests.length})
          </h2>

          {loading ? (
            <InlineSpinner />
          ) : error ? (
            <ErrorAlert message={error} onRetry={loadRequests} />
          ) : sortedRequests.length === 0 ? (
            <p className="text-neutral-600 text-center py-8">
              No pending requests at the moment.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-neutral-900">
                          {request.resource_category}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            request.priority === "EMERGENCY"
                              ? "bg-red-100 text-red-800"
                              : request.priority === "HIGH"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {request.priority}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600">
                        Requester: {request.user?.name} | Quantity:{" "}
                        {request.requested_quantity} units
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAutoAllocate(request.id)}
                        variant="primary"
                        size="sm"
                      >
                        Auto Allocate
                      </Button>
                      <Button variant="secondary" size="sm">
                        Manual Allocate
                      </Button>
                    </div>
                  </div>
                  {request.description && (
                    <p className="text-sm text-neutral-600 bg-neutral-50 p-2 rounded">
                      {request.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OperatorLayout>
  );
};

export default PendingRequestsPage;
