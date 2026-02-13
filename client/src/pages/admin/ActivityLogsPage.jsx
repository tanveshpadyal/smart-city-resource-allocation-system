import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert } from "../../components/common/Alert";
import { Input } from "../../components/common";
import adminLogService from "../../services/adminLogService";
import { formatters } from "../../utils/formatters";

const actionOptions = [
  "ASSIGN",
  "STATUS_CHANGE",
  "DELETE",
  "UPDATE",
  "EXPORT",
];

const formatActionLabel = (action) => {
  if (!action) return "-";
  return action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatTargetLabel = (log) => {
  if (!log?.entity_type) return "-";
  if (!log?.entity_id) return log.entity_type;

  const entityId = String(log.entity_id);
  const shortId = entityId.slice(0, 8);
  return `${log.entity_type} #${shortId}`;
};

export const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    actionType: "",
    startDate: "",
    endDate: "",
  });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminLogService.getLogs({
        actionType: filters.actionType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: pagination.limit,
        offset: pagination.offset,
      });
      setLogs(response?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response?.pagination?.total || 0,
      }));
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to fetch activity logs";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, pagination.offset]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const pageCount = useMemo(() => {
    if (!pagination.total) return 1;
    return Math.ceil(pagination.total / pagination.limit);
  }, [pagination]);

  const currentPage = useMemo(() => {
    return Math.floor(pagination.offset / pagination.limit) + 1;
  }, [pagination]);

  const handlePageChange = (direction) => {
    setPagination((prev) => {
      const nextOffset =
        direction === "next"
          ? Math.min(prev.offset + prev.limit, Math.max(prev.total - prev.limit, 0))
          : Math.max(prev.offset - prev.limit, 0);
      return { ...prev, offset: nextOffset };
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <span className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            Activity
          </span>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-slate-200">
            Activity Logs
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-slate-400">
            Track admin actions across the system
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-slate-800 dark:bg-[#020617]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300">
                Action
              </label>
              <select
                value={filters.actionType}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, actionType: e.target.value }))
                }
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-700 focus:border-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-400"
              >
                <option value="">All Actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {formatActionLabel(action)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300">
                From Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="h-10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300">
                To Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="h-10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-transparent select-none">
                Apply
              </label>
              <button
                type="button"
                className="h-10 w-full rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                onClick={() => setPagination((prev) => ({ ...prev, offset: 0 }))}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <InlineSpinner />
        ) : error ? (
          <ErrorAlert message={error} onRetry={loadLogs} />
        ) : logs.length === 0 ? (
          <div className="rounded-lg border border-neutral-200 bg-white p-6">
            <p className="text-neutral-600">No activity logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr className="text-left text-neutral-600">
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-neutral-100 last:border-b-0"
                  >
                    <td className="px-4 py-3 text-neutral-900">
                      <span
                        className="inline-flex rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        title={log.action_type}
                      >
                        {formatActionLabel(log.action_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {log.admin?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      <span
                        title={
                          log.entity_type
                            ? `${log.entity_type} ${log.entity_id || ""}`
                            : "-"
                        }
                        className="inline-flex rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {formatTargetLabel(log)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatters.formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600 dark:text-slate-300">
            Page {currentPage} of {pageCount}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-default disabled:border-neutral-300 disabled:text-neutral-500 disabled:hover:bg-white dark:border-slate-700 dark:text-white dark:hover:bg-slate-900 dark:disabled:border-slate-700 dark:disabled:text-slate-300 dark:disabled:hover:bg-transparent"
              onClick={() => handlePageChange("prev")}
              disabled={pagination.offset === 0}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-default disabled:border-neutral-300 disabled:text-neutral-500 disabled:hover:bg-white dark:border-slate-700 dark:text-white dark:hover:bg-slate-900 dark:disabled:border-slate-700 dark:disabled:text-slate-300 dark:disabled:hover:bg-transparent"
              onClick={() => handlePageChange("next")}
              disabled={pagination.offset + pagination.limit >= pagination.total}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ActivityLogsPage;
