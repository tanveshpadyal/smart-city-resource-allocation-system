import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert, SuccessAlert } from "../../components/common/Alert";
import { Input } from "../../components/common";
import { Button } from "../../components/common";
import useRequest from "../../hooks/useRequest";
import requestService from "../../services/requestService";
import authService from "../../services/authService";
import { formatters } from "../../utils/formatters";

export const PendingComplaintsPage = () => {
  const {
    requests,
    loading,
    error,
    getAdminPendingComplaints,
    assignComplaint,
  } = useRequest();

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "PENDING",
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

  const loadData = useCallback(async () => {
    try {
      const [pendingRes, operatorsRes] = await Promise.all([
        getAdminPendingComplaints({
          status: filters.status,
          category: filters.category,
          operator: filters.operator,
          startDate: filters.startDate,
          endDate: filters.endDate,
          search: filters.search,
        }),
        authService.getOperators(),
      ]);

      const pending = pendingRes?.data || pendingRes || [];
      const activeOperators = operatorsRes?.data || operatorsRes || [];

      const defaultSelection = {};
      pending.forEach((complaint) => {
        if (activeOperators[0]?.id) {
          defaultSelection[complaint.id] = activeOperators[0].id;
        }
      });

      setSelectedOperators(defaultSelection);
      setOperators(activeOperators);
    } catch {
      // Error is handled by hook state
    }
  }, [getAdminPendingComplaints, filters]);

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

  const pendingComplaints = useMemo(() => requests || [], [requests]);

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
      const response = await requestService.exportComplaints("pending");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fallbackName = `complaints_pending_${timestamp}.csv`;
      const disposition = response.headers?.["content-disposition"];
      const match = disposition?.match(/filename="(.+)"/);
      const filename = match?.[1] || fallbackName;
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
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
              Filter and assign complaints to active operators
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
          <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-slate-200">
            Filters
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="">All Status</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All Categories</option>
              <option value="ROAD">Road</option>
              <option value="GARBAGE">Garbage</option>
              <option value="WATER">Water</option>
              <option value="LIGHT">Light</option>
              <option value="OTHER">Other</option>
            </select>
            <select
              value={filters.operator}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, operator: e.target.value }))
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All Operators</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
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
        ) : pendingComplaints.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-slate-800 dark:bg-[#020617]">
            <p className="text-neutral-600 dark:text-slate-400">No pending complaints found.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-slate-800 dark:bg-[#020617]">
            <div className="space-y-4">
              {pendingComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="rounded-lg border border-neutral-200 p-4 shadow-sm shadow-slate-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-300/60 dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/30 dark:hover:shadow-black/45"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-slate-200">
                        {complaint.complaint_category}
                      </p>
                      <p className="mt-1 text-sm text-neutral-700 dark:text-slate-300">
                        {complaint.description}
                      </p>
                      <p className="mt-2 text-xs text-neutral-500 dark:text-slate-400">
                        Reported by {complaint.User?.name || "Citizen"} on{" "}
                        {formatters.formatDate(complaint.requested_at)}
                      </p>
                    </div>

                    <div className="flex w-full gap-2 md:w-auto">
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
                        <option value="">Select operator</option>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PendingComplaintsPage;
