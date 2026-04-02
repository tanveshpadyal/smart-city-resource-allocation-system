import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert, SuccessAlert } from "../../components/common/Alert";
import { Input } from "../../components/common";
import { Button } from "../../components/common";
import useRequest from "../../hooks/useRequest";
import requestService from "../../services/requestService";
import authService from "../../services/authService";
import { formatters } from "../../utils/formatters";
import { getComplaintCategoryMeta } from "../../utils/complaintCategory";

const DEFAULT_LIMIT = 50;
const FILTERED_LIMIT = 500;

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const applyLocalFilters = (items, filters) => {
  const search = normalizeText(filters.search);

  return items.filter((complaint) => {
    if (filters.status && complaint.status !== filters.status) {
      return false;
    }

    if (filters.category && complaint.complaint_category !== filters.category) {
      return false;
    }

    if (
      filters.operator &&
      String(complaint.assigned_to || "") !== String(filters.operator)
    ) {
      return false;
    }

    if (filters.startDate || filters.endDate) {
      const requestedAt = complaint.requested_at ? new Date(complaint.requested_at) : null;
      if (!requestedAt || Number.isNaN(requestedAt.getTime())) {
        return false;
      }

      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        if (requestedAt < start) {
          return false;
        }
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (requestedAt > end) {
          return false;
        }
      }
    }

    if (search) {
      const haystack = [
        complaint.description,
        complaint.complaint_category,
        complaint.User?.name,
        complaint.assignedOperator?.name,
        complaint.location_data?.area,
        complaint.location_data?.address,
        complaint.Location?.zone_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });
};

export const PendingComplaintsPage = () => {
  const navigate = useNavigate();
  const { requests, loading, error, getAllRequests, assignComplaint } =
    useRequest();

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    category: searchParams.get("category") || "",
    operator: searchParams.get("operator") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    search: searchParams.get("search") || "",
  });

  const [operators, setOperators] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState({});
  const [assigningId, setAssigningId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: DEFAULT_LIMIT,
    offset: Number(searchParams.get("offset") || 0),
  });

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => String(value || "").trim() !== ""),
    [filters],
  );

  const complaints = useMemo(() => {
    const list = Array.isArray(requests) ? requests : [];
    return applyLocalFilters(list, filters);
  }, [requests, filters]);

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  const getStatusButtonStyles = (status) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
      case "IN_PROGRESS":
        return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
      case "RESOLVED":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
      case "PENDING":
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const buildApiFilters = useCallback(() => {
    const usingWideFetch = hasActiveFilters;
    const params = {
      limit: usingWideFetch ? FILTERED_LIMIT : pagination.limit,
      offset: usingWideFetch ? 0 : pagination.offset,
    };

    if (filters.status) params.status = filters.status;
    if (filters.category) params.category = filters.category;
    if (filters.operator) params.operator = filters.operator;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.search.trim()) params.search = filters.search.trim();

    return params;
  }, [filters, hasActiveFilters, pagination.limit, pagination.offset]);

  const loadOperators = useCallback(async () => {
    try {
      const operatorsRes = await authService.getOperators();
      const activeOperators = operatorsRes?.data || operatorsRes || [];
      setOperators(activeOperators);
    } catch {
      setOperators([]);
    }
  }, []);

  const loadComplaints = useCallback(async () => {
    try {
      const response = await getAllRequests(buildApiFilters());
      const apiRows = Array.isArray(response?.data) ? response.data : [];
      const page = response?.pagination || {};

      if (hasActiveFilters) {
        const filteredCount = applyLocalFilters(apiRows, filters).length;
        setPagination((prev) => ({
          ...prev,
          total: filteredCount,
          offset: 0,
        }));
      } else {
        setPagination((prev) => ({
          ...prev,
          total: Number(page.total) || 0,
          limit: Number(page.limit) || prev.limit,
          offset: Number(page.offset) || 0,
        }));
      }

      setSelectedOperators((prev) => {
        const next = { ...prev };
        const defaultOperatorId = operators[0]?.id;

        for (const complaint of apiRows) {
          if (
            complaint.status === "PENDING" &&
            !next[complaint.id] &&
            defaultOperatorId
          ) {
            next[complaint.id] = defaultOperatorId;
          }
        }

        return next;
      });
    } catch {
      // Error already managed in useRequest state
    }
  }, [buildApiFilters, filters, getAllRequests, hasActiveFilters, operators]);

  useEffect(() => {
    loadOperators();
  }, [loadOperators]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  useEffect(() => {
    const params = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });

    if (!hasActiveFilters && pagination.offset > 0) {
      params.offset = String(pagination.offset);
    }

    setSearchParams(params, { replace: true });
  }, [filters, hasActiveFilters, pagination.offset, setSearchParams]);

  const selectClassName =
    "w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-primary-400 dark:focus:ring-primary-500/25";

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const handleAssign = async (complaintId) => {
    const operatorId = selectedOperators[complaintId];
    if (!operatorId) return;

    try {
      setAssigningId(complaintId);
      await assignComplaint(complaintId, operatorId);
      setSuccessMessage("Complaint assigned successfully.");
      await loadComplaints();
    } finally {
      setAssigningId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await requestService.exportComplaints("all");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fallbackName = `complaints_all_${timestamp}.csv`;
      const disposition = response.headers?.["content-disposition"];
      const match = disposition?.match(/filename="(.+)"/);
      const filename = match?.[1] || fallbackName;
      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      status: "",
      category: "",
      operator: "",
      startDate: "",
      endDate: "",
      search: "",
    });
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const goToPreviousPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(prev.offset - prev.limit, 0),
    }));
  };

  const goToNextPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset:
        prev.offset + prev.limit >= prev.total
          ? prev.offset
          : prev.offset + prev.limit,
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              Complaints
            </span>
            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-slate-200">
              Complaint Queue
            </h1>
            <p className="mt-1 text-neutral-600 dark:text-slate-400">
              View all complaints, filter by status, and assign pending ones
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExport} loading={exporting}>
            Export as CSV
          </Button>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-slate-800 dark:bg-[#020617]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-slate-200">Filters</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearFilters}
              disabled={!Object.values(filters).some(Boolean)}
            >
              Clear Filters
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => updateFilter("status", e.target.value)}
                className={selectClassName}
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) => updateFilter("category", e.target.value)}
                className={selectClassName}
              >
                <option value="">All Categories</option>
                <option value="ROAD">Road</option>
                <option value="GARBAGE">Garbage</option>
                <option value="WATER">Water</option>
                <option value="LIGHT">Light</option>
                <option value="OTHER">Other</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
            <div className="relative">
              <select
                value={filters.operator}
                onChange={(e) => updateFilter("operator", e.target.value)}
                className={selectClassName}
              >
                <option value="">All Contractors</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
            <Input
              placeholder="Search keyword..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter("startDate", e.target.value)}
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter("endDate", e.target.value)}
            />
          </div>
        </div>

        {successMessage && (
          <SuccessAlert
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        )}

        {loading ? (
          <InlineSpinner />
        ) : error ? (
          <ErrorAlert message={error} onRetry={loadComplaints} />
        ) : complaints.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-slate-800 dark:bg-[#020617]">
            <p className="text-neutral-600 dark:text-slate-400">No complaints found.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-slate-800 dark:bg-[#020617]">
            <div className="space-y-4">
              {complaints.map((complaint) => {
                const categoryMeta = getComplaintCategoryMeta(
                  complaint.complaint_category,
                );
                const CategoryIcon = categoryMeta.icon;

                return (
                  <button
                    type="button"
                    key={complaint.id}
                    className="w-full rounded-lg border border-neutral-200 p-4 text-left shadow-sm shadow-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-300/60 focus:outline-none focus:ring-2 focus:ring-primary-300 dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/30 dark:hover:shadow-black/45"
                    onClick={() => navigate(`/complaints/${complaint.id}`)}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-slate-200">
                          <CategoryIcon size={15} className={categoryMeta.iconClass} />
                          {categoryMeta.label}
                        </p>
                        <p className="mt-1 text-sm text-neutral-700 dark:text-slate-300">
                          {complaint.description}
                        </p>
                        <p className="mt-2 text-xs text-neutral-500 dark:text-slate-400">
                          Reported by {complaint.User?.name || "Citizen"} on {" "}
                          {formatters.formatDate(complaint.requested_at)}
                        </p>
                      </div>

                      {complaint.status === "PENDING" ? (
                        <div
                          className="flex w-full gap-2 md:w-auto"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <select
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all duration-200 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30 md:w-64"
                            value={selectedOperators[complaint.id] || ""}
                            onChange={(event) =>
                              setSelectedOperators((prev) => ({
                                ...prev,
                                [complaint.id]: event.target.value,
                              }))
                            }
                          >
                            <option value="">Select contractor</option>
                            {operators.map((operator) => (
                              <option key={operator.id} value={operator.id}>
                                {operator.name} ({operator.email})
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAssign(complaint.id)}
                            disabled={!selectedOperators[complaint.id]}
                            loading={assigningId === complaint.id}
                          >
                            Assign
                          </Button>
                        </div>
                      ) : (
                        <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
                          <span
                            className={`rounded-lg px-3 py-2 text-center text-sm font-semibold ${getStatusButtonStyles(
                              complaint.status,
                            )}`}
                          >
                            {complaint.status?.replace("_", " ") || "UNKNOWN"}
                          </span>
                          {complaint.assignedOperator?.name && (
                            <p className="text-xs text-neutral-500 dark:text-slate-400">
                              Assigned to {complaint.assignedOperator.name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {!hasActiveFilters && (
              <div className="mt-6 flex flex-col gap-3 border-t border-neutral-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-neutral-600 dark:text-slate-400">
                  Showing {complaints.length} of {pagination.total} complaints
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={pagination.offset === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-neutral-600 dark:text-slate-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PendingComplaintsPage;
