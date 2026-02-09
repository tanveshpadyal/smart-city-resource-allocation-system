/**
 * My Requests Page - Citizen
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { CitizenLayout } from "../../components/layouts/CitizenLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert } from "../../components/common/Alert";
import { Input } from "../../components/common";
import useRequest from "../../hooks/useRequest";
import { formatters } from "../../utils/formatters";

export const MyRequestsPage = () => {
  const { requests, loading, error, getMyRequests } = useRequest();
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
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
      filtered = filtered.filter((r) => r.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter((r) => r.priority === filters.priority);
    }

    if (filters.search) {
      filtered = filtered.filter(
        (r) =>
          r.resource_category
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          r.description?.toLowerCase().includes(filters.search.toLowerCase()),
      );
    }

    return filtered;
  }, [requests, filters]);

  const filteredRequests = useMemo(() => applyFilters(), [applyFilters]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return (
    <CitizenLayout>
      <div className="space-y-6">
        {/* Filters */}
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h3 className="font-semibold text-neutral-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              placeholder="Search by category..."
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
              className="px-4 py-2 border border-neutral-300 rounded-lg"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ ...filters, priority: e.target.value })
              }
              className="px-4 py-2 border border-neutral-300 rounded-lg"
            >
              <option value="">All Priorities</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">
            My Requests ({filteredRequests.length})
          </h2>

          {loading ? (
            <InlineSpinner />
          ) : error ? (
            <ErrorAlert message={error} onRetry={loadRequests} />
          ) : filteredRequests.length === 0 ? (
            <p className="text-neutral-600">No requests match your filters.</p>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors"
                >
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
                              : request.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                        }`}
                      >
                        {request.priority}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
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
                    <p className="text-sm text-neutral-600">
                      {request.requested_quantity} units requested on{" "}
                      {formatters.formatDate(request.requested_at)}
                    </p>
                  </div>
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
