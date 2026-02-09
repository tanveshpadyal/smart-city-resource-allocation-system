/**
 * Citizen Dashboard Page
 */

import { useCallback, useEffect, useMemo } from "react";
import { CitizenLayout } from "../../components/layouts/CitizenLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert } from "../../components/common/Alert";
import { Button } from "../../components/common";
import useRequest from "../../hooks/useRequest";
import { Link } from "react-router-dom";

export const CitizenDashboardPage = () => {
  const { requests, loading, error, getMyRequests } = useRequest();

  const loadRequests = useCallback(async () => {
    try {
      await getMyRequests();
    } catch {
      // Error handled by hook
    }
  }, [getMyRequests]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const stats = useMemo(() => {
    if (requests.length === 0) {
      return {
        total: 0,
        pending: 0,
        fulfilled: 0,
        cancelled: 0,
      };
    }

    const pending = requests.filter((r) => r.status === "PENDING").length;
    const fulfilled = requests.filter((r) => r.status === "FULFILLED").length;
    const cancelled = requests.filter((r) => r.status === "CANCELLED").length;

    return {
      total: requests.length,
      pending,
      fulfilled,
      cancelled,
    };
  }, [requests]);

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">Total Requests</p>
            <p className="text-3xl font-bold text-primary-600">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">Pending</p>
            <p className="text-3xl font-bold text-warning-600">
              {stats.pending}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">Fulfilled</p>
            <p className="text-3xl font-bold text-success-600">
              {stats.fulfilled}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-sm text-neutral-600 mb-2">Cancelled</p>
            <p className="text-3xl font-bold text-error-600">
              {stats.cancelled}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link to="/citizen/create-request">
            <Button variant="primary">Create New Request</Button>
          </Link>
          <Link to="/citizen/my-requests">
            <Button variant="secondary">View All Requests</Button>
          </Link>
        </div>

        {/* Recent Requests */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            Recent Requests
          </h2>
          {loading ? (
            <InlineSpinner />
          ) : error ? (
            <ErrorAlert message={error} onRetry={loadRequests} />
          ) : requests.length === 0 ? (
            <p className="text-neutral-600">
              No requests yet. Create your first request to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between border-b border-neutral-100 pb-3"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      {request.resource_category}
                    </p>
                    <p className="text-sm text-neutral-600">
                      Requested {request.requested_quantity} units
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === "PENDING"
                        ? "bg-blue-100 text-blue-800"
                        : request.status === "FULFILLED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CitizenLayout>
  );
};

export default CitizenDashboardPage;
