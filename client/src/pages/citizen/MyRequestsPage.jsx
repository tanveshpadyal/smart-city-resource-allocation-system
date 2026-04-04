import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CitizenLayout } from "../../components/layouts/CitizenLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert } from "../../components/common/Alert";
import { Input } from "../../components/common";
import useRequest from "../../hooks/useRequest";
import useAuth from "../../hooks/useAuth";
import useRealtimeComplaints from "../../hooks/useRealtimeComplaints";
import { formatters } from "../../utils/formatters";
import { getComplaintCategoryMeta } from "../../utils/complaintCategory";

export const MyRequestsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requests, loading, error, getMyRequests } = useRequest();
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    search: "",
  });

  const loadRequests = useCallback(async () => {
    try {
      await getMyRequests();
    } catch {
      // Error handled by hook
    }
  }, [getMyRequests]);

  const filteredRequests = useMemo(() => {
    const source = Array.isArray(requests) ? requests : [];

    return source.filter((complaint) => {
      if (filters.status && complaint.status !== filters.status) {
        return false;
      }

      if (filters.category && complaint.complaint_category !== filters.category) {
        return false;
      }

      if (filters.search.trim()) {
        const searchLower = filters.search.toLowerCase();
        const haystack = [complaint.complaint_category, complaint.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [filters, requests]);

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-amber-500/20 dark:text-amber-300";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800 dark:bg-indigo-500/20 dark:text-indigo-300";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800 dark:bg-violet-500/20 dark:text-violet-300";
      case "RESOLVED":
        return "bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300";
    }
  };

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

  return (
    <CitizenLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-slate-200">
            My Complaints
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-slate-400">
            Track the status of all your reported issues
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-slate-800 dark:bg-[#020617]">
          <h3 className="mb-4 font-semibold text-neutral-900 dark:text-slate-200">Filters</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              placeholder="Search by description..."
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
            />
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value }))
              }
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <select
              value={filters.category}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, category: event.target.value }))
              }
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All Categories</option>
              <option value="ROAD">Road Issue</option>
              <option value="GARBAGE">Garbage/Waste</option>
              <option value="WATER">Water Issue</option>
              <option value="LIGHT">Street Light</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 sm:p-6 dark:border-slate-800 dark:bg-[#020617]">
          <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-slate-200">
            Complaints ({filteredRequests.length})
          </h2>

          {loading ? (
            <InlineSpinner />
          ) : error ? (
            <ErrorAlert message={error} onRetry={loadRequests} />
          ) : filteredRequests.length === 0 ? (
            <p className="text-neutral-600 dark:text-slate-400">
              No complaints match your filters.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((complaint) => {
                const categoryMeta = getComplaintCategoryMeta(
                  complaint.complaint_category,
                );
                const CategoryIcon = categoryMeta.icon;

                return (
                  <button
                    type="button"
                    key={complaint.id}
                    className="w-full rounded-lg border border-neutral-200 p-4 text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-300 dark:border-slate-800 dark:bg-[#02061780] dark:hover:bg-slate-900"
                    onClick={() => navigate(`/complaints/${complaint.id}`)}
                  >
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-slate-200">
                            <CategoryIcon size={15} className={categoryMeta.iconClass} />
                            {categoryMeta.label}
                          </h3>
                          <span
                            className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(
                              complaint.status,
                            )}`}
                          >
                            {complaint.status}
                          </span>
                        </div>
                        <p className="mb-2 text-sm text-neutral-700 dark:text-slate-300">
                          {complaint.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-xs text-neutral-500 dark:text-slate-400">
                      <p>Reported on {formatters.formatDate(complaint.requested_at)}</p>
                      {complaint.assigned_at && (
                        <p>Assigned on {formatters.formatDate(complaint.assigned_at)}</p>
                      )}
                      {complaint.assignedOperator && (
                        <p>
                          Contractor:{" "}
                          <span className="font-medium text-neutral-700 dark:text-slate-300">
                            {complaint.assignedOperator.name}
                          </span>
                        </p>
                      )}
                      {complaint.assignment_reason && (
                        <p>{complaint.assignment_reason}</p>
                      )}
                      {complaint.resolved_at && (
                        <p>Resolved on {formatters.formatDate(complaint.resolved_at)}</p>
                      )}
                    </div>

                    {complaint.operator_remark && (
                      <div className="mt-3 rounded border-l-2 border-green-500 bg-neutral-50 p-3 dark:bg-slate-900">
                        <p className="mb-1 text-xs font-medium text-neutral-700 dark:text-slate-300">
                          Resolution Note:
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-slate-400">
                          {complaint.operator_remark}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CitizenLayout>
  );
};

export default MyRequestsPage;
