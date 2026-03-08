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

export const PendingComplaintsPage = () => {
  const navigate = useNavigate();
  const { requests, loading, error, getAllRequests, assignComplaint } =
    useRequest();

  const [searchParams, setSearchParams] = useSearchParams();
  const defaultFilters = {
    status: searchParams.get("status") || "",
    category: searchParams.get("category") || "",
    operator: searchParams.get("operator") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    search: searchParams.get("search") || "",
  };
  const [filters, setFilters] = useState(defaultFilters);

  const [operators, setOperators] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState({});
  const [assigningId, setAssigningId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [exporting, setExporting] = useState(false);

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

  const loadData = useCallback(async () => {
    try {
      const [allRes, operatorsRes] = await Promise.all([
        getAllRequests(),
        authService.getOperators(),
      ]);

      const allComplaints = allRes?.data || allRes || [];
      const activeOperators = operatorsRes?.data || operatorsRes || [];

      const defaultSelection = {};
      allComplaints.forEach((complaint) => {
        if (complaint.status === "PENDING" && activeOperators[0]?.id) {
          defaultSelection[complaint.id] = activeOperators[0].id;
        }
      });

      setSelectedOperators(defaultSelection);
      setOperators(activeOperators);
    } catch {
      // Error is handled by hook state
    }
  }, [getAllRequests]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const complaints = useMemo(() => {
    const source = Array.isArray(requests) ? requests : [];
    const searchText = filters.search.trim().toLowerCase();

    return source.filter((complaint) => {
      if (filters.status && complaint.status !== filters.status) {
        return false;
      }

      if (
        filters.category &&
        complaint.complaint_category !== filters.category
      ) {
        return false;
      }

      if (
        filters.operator &&
        String(complaint.assigned_to || "") !== String(filters.operator)
      ) {
        return false;
      }

      const requestedAt = complaint.requested_at
        ? new Date(complaint.requested_at)
        : null;

      if (filters.startDate && requestedAt) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        if (requestedAt < start) {
          return false;
        }
      }

      if (filters.endDate && requestedAt) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (requestedAt > end) {
          return false;
        }
      }

      if (searchText) {
        const haystack = [
          complaint.description,
          complaint.complaint_category,
          complaint.User?.name,
          complaint.AssignedOperator?.name,
          complaint.Operator?.name,
          complaint.location_data?.area,
          complaint.location_data?.address,
          complaint.Location?.zone_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchText)) {
          return false;
        }
      }

      return true;
    });
  }, [requests, filters]);

  const selectClassName =
    "w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-primary-400 dark:focus:ring-primary-500/25";

  const handleAssign = async (complaintId) => {
    const operatorId = selectedOperators[complaintId];
    if (!operatorId) return;

    try {
      setAssigningId(complaintId);
      await assignComplaint(complaintId, operatorId);
      setSuccessMessage("Complaint assigned successfully.");
      await loadData();
    } catch {
      // Error is handled by hook state
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
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            loading={exporting}
          >
            Export as CSV
          </Button>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-slate-800 dark:bg-[#020617]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-slate-200">
              Filters
            </h3>
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
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
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
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
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
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, operator: e.target.value }))
                }
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
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
            />
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
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
          <ErrorAlert message={error} onRetry={loadData} />
        ) : complaints.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-slate-800 dark:bg-[#020617]">
            <p className="text-neutral-600 dark:text-slate-400">
              No complaints found.
            </p>
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
                  <div
                    key={complaint.id}
                    className="cursor-pointer rounded-lg border border-neutral-200 p-4 shadow-sm shadow-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-300/60 dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/30 dark:hover:shadow-black/45"
                    onClick={() => navigate(`/complaints/${complaint.id}`)}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-slate-200">
                          <CategoryIcon
                            size={15}
                            className={categoryMeta.iconClass}
                          />
                          {categoryMeta.label}
                        </p>
                        <p className="mt-1 text-sm text-neutral-700 dark:text-slate-300">
                          {complaint.description}
                        </p>
                        <p className="mt-2 text-xs text-neutral-500 dark:text-slate-400">
                          Reported by {complaint.User?.name || "Citizen"} on{" "}
                          {formatters.formatDate(complaint.requested_at)}
                        </p>
                      </div>

                      {complaint.status === "PENDING" ? (
                        <div
                          className="flex w-full gap-2 md:w-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-all duration-200 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30 md:w-64"
                            value={selectedOperators[complaint.id] || ""}
                            onChange={(e) =>
                              setSelectedOperators((prev) => ({
                                ...prev,
                                [complaint.id]: e.target.value,
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
                          <button
                            type="button"
                            className={`rounded-lg px-3 py-2 text-sm font-semibold ${getStatusButtonStyles(
                              complaint.status,
                            )}`}
                            disabled
                          >
                            {complaint.status?.replace("_", " ") || "UNKNOWN"}
                          </button>
                          {(complaint.Operator?.name ||
                            complaint.AssignedOperator?.name) && (
                            <p className="text-xs text-neutral-500 dark:text-slate-400">
                              Assigned to{" "}
                              {complaint.Operator?.name ||
                                complaint.AssignedOperator?.name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PendingComplaintsPage;
