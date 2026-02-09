/**
 * Admin Dashboard Page
 */

import { useEffect, useMemo } from "react";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert } from "../../components/common/Alert";
import useRequest from "../../hooks/useRequest";
import useAllocation from "../../hooks/useAllocation";

export const AdminDashboardPage = () => {
  const { requests, loading: reqLoading, getAllRequests } = useRequest();
  const {
    allocations,
    loading: allocLoading,
    getAllocations,
  } = useAllocation();

  useEffect(() => {
    Promise.all([getAllRequests(), getAllocations()]).catch(() => {
      // Error handled by hooks
    });
  }, [getAllRequests, getAllocations]);

  const stats = useMemo(() => {
    if (requests.length === 0 && allocations.length === 0) {
      return {
        totalRequests: 0,
        totalAllocations: 0,
        fulfillmentRate: 0,
        averageResponseTime: 0,
        slaCompliance: 0,
      };
    }

    const fulfilled = requests.filter((r) => r.status === "FULFILLED").length;
    const fulfillmentRate =
      requests.length > 0
        ? ((fulfilled / requests.length) * 100).toFixed(1)
        : 0;

    return {
      totalRequests: requests.length,
      totalAllocations: allocations.length,
      fulfillmentRate: fulfillmentRate,
      averageResponseTime: 2.5, // Mock data
      slaCompliance: 94, // Mock data
    };
  }, [requests, allocations]);

  const loading = reqLoading || allocLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">Total Requests</p>
            <p className="text-3xl font-bold text-primary-600">
              {stats.totalRequests}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">Total Allocations</p>
            <p className="text-3xl font-bold text-primary-600">
              {stats.totalAllocations}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">Fulfillment Rate</p>
            <p className="text-3xl font-bold text-success-600">
              {stats.fulfillmentRate}%
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">Avg Response Time</p>
            <p className="text-3xl font-bold text-primary-600">
              {stats.averageResponseTime}h
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">SLA Compliance</p>
            <p className="text-3xl font-bold text-success-600">
              {stats.slaCompliance}%
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h3 className="font-bold text-neutral-900 mb-4">
              Requests by Status
            </h3>
            {loading ? (
              <InlineSpinner />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Pending</span>
                  <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${(requests.filter((r) => r.status === "PENDING").length / requests.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Fulfilled</span>
                  <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${(requests.filter((r) => r.status === "FULFILLED").length / requests.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <h3 className="font-bold text-neutral-900 mb-4">
              Priority Distribution
            </h3>
            {loading ? (
              <InlineSpinner />
            ) : (
              <div className="space-y-3">
                {["EMERGENCY", "HIGH", "MEDIUM", "LOW"].map((priority) => (
                  <div
                    key={priority}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-neutral-600">{priority}</span>
                    <p className="font-semibold text-neutral-900">
                      {requests.filter((r) => r.priority === priority).length}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h3 className="font-bold text-neutral-900 mb-4">
            Recent Allocations
          </h3>
          {loading ? (
            <InlineSpinner />
          ) : allocations.slice(0, 5).length === 0 ? (
            <p className="text-neutral-600">No allocations yet.</p>
          ) : (
            <div className="space-y-2">
              {allocations.slice(0, 5).map((alloc) => (
                <div
                  key={alloc.id}
                  className="flex items-center justify-between border-b border-neutral-100 pb-2"
                >
                  <p className="text-sm text-neutral-900">
                    Allocation #{alloc.id?.slice(0, 8)}
                  </p>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      alloc.status === "DELIVERED"
                        ? "bg-green-100 text-green-800"
                        : alloc.status === "IN_TRANSIT"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {alloc.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
