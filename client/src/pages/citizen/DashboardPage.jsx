/**
 * Citizen Dashboard Page
 */

import { useCallback, useEffect, useMemo } from "react";
import { CitizenLayout } from "../../components/layouts/CitizenLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert } from "../../components/common/Alert";
import { Button, MetricCard } from "../../components/common";
import useRequest from "../../hooks/useRequest";
import useAuth from "../../hooks/useAuth";
import useRealtimeComplaints from "../../hooks/useRealtimeComplaints";
import { Link } from "react-router-dom";
import { Clock3, FileText, PackageCheck, XCircle } from "lucide-react";

export const CitizenDashboardPage = () => {
  const { user } = useAuth();
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

  useRealtimeComplaints({
    onAssigned: (payload) => {
      if (payload?.citizenId === user?.id) {
        loadRequests();
      }
    },
    onStatusChanged: (payload) => {
      if (payload?.citizenId === user?.id) {
        loadRequests();
      }
    },
  });

  const stats = useMemo(() => {
    if (requests.length === 0) {
      return {
        total: 0,
        pending: 0,
        assigned: 0,
        resolved: 0,
      };
    }

    const pending = requests.filter((r) => r.status === "PENDING").length;
    const assigned = requests.filter((r) =>
      ["ASSIGNED", "IN_PROGRESS"].includes(r.status),
    ).length;
    const resolved = requests.filter((r) => r.status === "RESOLVED").length;

    return {
      total: requests.length,
      pending,
      assigned,
      resolved,
    };
  }, [requests]);

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Complaints"
            value={stats.total}
            subtitle="All complaints you submitted"
            icon={FileText}
            tone="indigo"
          />
          <MetricCard
            title="Pending"
            value={stats.pending}
            subtitle="Waiting for assignment"
            icon={Clock3}
            tone="amber"
          />
          <MetricCard
            title="Assigned"
            value={stats.assigned}
            subtitle="Operator assigned or working"
            icon={PackageCheck}
            tone="blue"
          />
          <MetricCard
            title="Resolved"
            value={stats.resolved}
            subtitle="Issue fixed"
            icon={XCircle}
            tone="emerald"
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
              View My Complaints
            </Button>
          </Link>
        </div>

        {/* Recent Requests */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/70 transition-all duration-200 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 dark:hover:shadow-black/55">
          <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-slate-200">
            Recent Complaints
          </h2>
          {loading ? (
            <InlineSpinner />
          ) : error ? (
            <ErrorAlert message={error} onRetry={loadRequests} />
          ) : requests.length === 0 ? (
            <p className="text-neutral-600 dark:text-slate-400">
              No complaints yet. Create your first complaint to get started.
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
                      {request.complaint_category || "Complaint"}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-slate-400">
                      {request.description || "No description provided"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === "PENDING"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                        : request.status === "RESOLVED"
                          ? "bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                          : request.status === "ASSIGNED" || request.status === "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
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
