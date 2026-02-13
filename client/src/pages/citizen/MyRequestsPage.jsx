/**
 * My Complaints Page - Citizen
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CitizenLayout } from "../../components/layouts/CitizenLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert } from "../../components/common/Alert";
import { Input } from "../../components/common";
import useRequest from "../../hooks/useRequest";
import { formatters } from "../../utils/formatters";

export const MyRequestsPage = () => {
  const navigate = useNavigate();
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

  const applyFilters = useCallback(() => {
    let filtered = requests;

    if (filters.status) {
      filtered = filtered.filter(
        (complaint) => complaint.status === filters.status,
      );
    }

    if (filters.category) {
      filtered = filtered.filter(
        (complaint) => complaint.complaint_category === filters.category,
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (complaint) =>
          complaint.complaint_category?.toLowerCase().includes(searchLower) ||
          complaint.description?.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [requests, filters]);

  const filteredRequests = useMemo(() => applyFilters(), [applyFilters]);

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

  const getCategoryLabel = (category) => {
    const labels = {
      ROAD: "Road Issue",
      GARBAGE: "Garbage/Waste",
      WATER: "Water Issue",
      LIGHT: "Street Light",
      OTHER: "Other",
    };
    return labels[category] || category;
  };

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-slate-200">My Complaints</h1>
          <p className="mt-1 text-neutral-600 dark:text-slate-400">
            Track the status of all your reported issues
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-slate-800 dark:bg-[#020617]">
          <h3 className="mb-4 font-semibold text-neutral-900 dark:text-slate-200">Filters</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              placeholder="Search by description..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
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
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
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

        {/* Complaints List */}
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
              {filteredRequests.map((complaint) => (
                <div
                  key={complaint.id}
                  className="cursor-pointer rounded-lg border border-neutral-200 p-4 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-[#02061780] dark:hover:bg-slate-900"
                  onClick={() => navigate(`/complaints/${complaint.id}`)}
                >
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-neutral-900 dark:text-slate-200">
                          {getCategoryLabel(complaint.complaint_category)}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
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
                    <p>
                      Reported on{" "}
                      {formatters.formatDate(complaint.requested_at)}
                    </p>
                    {complaint.assigned_at && (
                      <p>
                        Assigned on{" "}
                        {formatters.formatDate(complaint.assigned_at)}
                      </p>
                    )}
                    {complaint.AssignedOperator && (
                      <p>
                        Operator:{" "}
                        <span className="font-medium text-neutral-700 dark:text-slate-300">
                          {complaint.AssignedOperator.name}
                        </span>
                      </p>
                    )}
                    {complaint.resolved_at && (
                      <p>
                        Resolved on{" "}
                        {formatters.formatDate(complaint.resolved_at)}
                      </p>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CitizenLayout>
  );
};

export default MyRequestsPage;
