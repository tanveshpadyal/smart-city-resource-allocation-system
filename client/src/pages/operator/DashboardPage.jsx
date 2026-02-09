/**
 * Operator Dashboard Page
 */

import { useEffect, useMemo } from "react";
import { OperatorLayout } from "../../components/layouts/OperatorLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert } from "../../components/common/Alert";
import useRequest from "../../hooks/useRequest";
import useAllocation from "../../hooks/useAllocation";

export const OperatorDashboardPage = () => {
  const {
    requests,
    loading: reqLoading,
    error: reqError,
    getPendingRequests,
  } = useRequest();
  const {
    allocations,
    loading: allocLoading,
    error: allocError,
    getAllocations,
  } = useAllocation();

  useEffect(() => {
    Promise.all([getPendingRequests(), getAllocations()]).catch(() => {
      // Error handled by hooks
    });
  }, [getPendingRequests, getAllocations]);

  const stats = useMemo(() => {
    if (requests.length === 0 && allocations.length === 0) {
      return {
        totalPending: 0,
        totalAllocations: 0,
        inTransit: 0,
        delivered: 0,
        urgent: 0,
      };
    }

    const urgent = requests.filter((r) => r.priority === "EMERGENCY").length;
    const inTransit = allocations.filter(
      (a) => a.status === "IN_TRANSIT",
    ).length;
    const delivered = allocations.filter(
      (a) => a.status === "DELIVERED",
    ).length;

    return {
      totalPending: requests.length,
      totalAllocations: allocations.length,
      inTransit,
      delivered,
      urgent,
    };
  }, [requests, allocations]);

  const loading = reqLoading || allocLoading;
  const error = reqError || allocError;

  return (
    <OperatorLayout>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">Pending Requests</p>
            <p className="text-3xl font-bold text-primary-600">
              {stats.totalPending}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">Total Allocations</p>
            <p className="text-3xl font-bold text-primary-600">
              {stats.totalAllocations}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">In Transit</p>
            <p className="text-3xl font-bold text-warning-600">
              {stats.inTransit}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">Delivered</p>
            <p className="text-3xl font-bold text-success-600">
              {stats.delivered}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">🚨 Urgent</p>
            <p className="text-3xl font-bold text-error-600">{stats.urgent}</p>
          </div>
        </div>

        {/* Pending Queue */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            Pending Request Queue
          </h2>
          {loading ? (
            <InlineSpinner />
          ) : error ? (
            <ErrorAlert message={error} />
          ) : requests.length === 0 ? (
            <p className="text-neutral-600">No pending requests</p>
          ) : (
            <div className="space-y-2">
              {requests.slice(0, 5).map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between border-b border-neutral-100 pb-3 hover:bg-neutral-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      {req.resource_category}
                    </p>
                    <p className="text-sm text-neutral-600">
                      Qty: {req.requested_quantity} | Priority: {req.priority}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      req.priority === "EMERGENCY"
                        ? "bg-red-100 text-red-800"
                        : req.priority === "HIGH"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {req.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Allocations */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            Active Allocations
          </h2>
          {loading ? (
            <InlineSpinner />
          ) : allocations.filter((a) => a.status !== "DELIVERED").length ===
            0 ? (
            <p className="text-neutral-600">No active allocations</p>
          ) : (
            <div className="space-y-2">
              {allocations
                .filter((a) => a.status !== "DELIVERED")
                .slice(0, 5)
                .map((alloc) => (
                  <div
                    key={alloc.id}
                    className="flex items-center justify-between border-b border-neutral-100 pb-3"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">
                        Allocation #{alloc.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-neutral-600">{alloc.status}</p>
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

export default OperatorDashboardPage;
