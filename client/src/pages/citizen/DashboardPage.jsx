/**
 * Citizen Dashboard Page
 */

import { useCallback, useEffect, useMemo } from "react";
import { CitizenLayout } from "../../components/layouts/CitizenLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert } from "../../components/common/Alert";
import { Button, MetricCard } from "../../components/common";
import useRequest from "../../hooks/useRequest";
import { Link } from "react-router-dom";
import { Clock3, FileText, PackageCheck, XCircle } from "lucide-react";

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Requests"
            value={stats.total}
            subtitle="All requests created"
            icon={FileText}
            tone="indigo"
          />
          <MetricCard
            title="Pending"
            value={stats.pending}
            subtitle="Awaiting fulfillment"
            icon={Clock3}
            tone="amber"
          />
          <MetricCard
            title="Fulfilled"
            value={stats.fulfilled}
            subtitle="Completed requests"
            icon={PackageCheck}
            tone="emerald"
          />
          <MetricCard
            title="Cancelled"
            value={stats.cancelled}
            subtitle="Requests closed early"
            icon={XCircle}
            tone="rose"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link to="/citizen/create-request">
            <Button variant="primary" className="w-full sm:w-auto">Create New Request</Button>
          </Link>
          <Link to="/citizen/my-requests">
            <Button
              variant="secondary"
              className="w-full dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
            >
              View All Requests
            </Button>
          </Link>
        </div>

        {/* Recent Requests */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/70 transition-all duration-200 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 dark:hover:shadow-black/55">
          <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-slate-200">
            Recent Requests
          </h2>
          {loading ? (
            <InlineSpinner />
          ) : error ? (
            <ErrorAlert message={error} onRetry={loadRequests} />
          ) : requests.length === 0 ? (
            <p className="text-neutral-600 dark:text-slate-400">
              No requests yet. Create your first request to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-[#02061780]"
                >
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-slate-200">
                      {request.resource_category}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-slate-400">
                      Requested {request.requested_quantity} units
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === "PENDING"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                        : request.status === "FULFILLED"
                          ? "bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                          : "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300"
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
