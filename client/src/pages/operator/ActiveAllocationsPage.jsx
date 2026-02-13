/**
 * Active Allocations Page - Operator
 */

import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OperatorLayout } from "../../components/layouts/OperatorLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert } from "../../components/common/Alert";
import { Button } from "../../components/common";
import useAllocation from "../../hooks/useAllocation";

export const ActiveAllocationsPage = () => {
  const navigate = useNavigate();
  const { allocations, loading, error, getAllocations } = useAllocation();

  const loadAllocations = useCallback(async () => {
    try {
      await getAllocations();
    } catch {
      // Error handled by hook
    }
  }, [getAllocations]);

  useEffect(() => {
    loadAllocations();
  }, [loadAllocations]);

  const activeAllocations = (allocations || []).filter(
    (item) => item.status !== "DELIVERED" && item.status !== "CANCELLED",
  );

  return (
    <OperatorLayout>
      <div className="space-y-6">
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            Active Allocations ({activeAllocations.length})
          </h2>

          {loading ? (
            <InlineSpinner />
          ) : error ? (
            <ErrorAlert message={error} onRetry={loadAllocations} />
          ) : activeAllocations.length === 0 ? (
            <p className="text-neutral-600 text-center py-8">
              No active allocations.
            </p>
          ) : (
            <div className="space-y-3">
              {activeAllocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className="border border-neutral-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-900">
                        Allocation #{allocation.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-neutral-600">
                        Status: {allocation.status}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        navigate(`/operator/allocation/${allocation.id}`)
                      }
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OperatorLayout>
  );
};

export default ActiveAllocationsPage;
