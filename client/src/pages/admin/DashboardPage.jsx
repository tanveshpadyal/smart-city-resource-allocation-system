/**
 * Admin Dashboard Page
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert } from "../../components/common/Alert";
import { Button } from "../../components/common";
import AnalyticsCharts from "../../components/admin/AnalyticsCharts";
import HeatmapView from "../../components/admin/HeatmapView";
import OperatorPerformance from "../../components/admin/OperatorPerformance";
import AdminLocationsMap from "../../components/admin/AdminLocationsMap";
import useRequest from "../../hooks/useRequest";
import requestService from "../../services/requestService";
import { formatters } from "../../utils/formatters";

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { requests, loading, error, getAllRequests } = useRequest();
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsData, setAnalyticsData] = useState({
    dailyCounts: [],
    categoryStats: [],
    statusStats: [],
  });
  const [operatorStats, setOperatorStats] = useState([]);
  const [operatorLoading, setOperatorLoading] = useState(false);
  const [operatorError, setOperatorError] = useState("");
  const [overdueLoading, setOverdueLoading] = useState(false);
  const [overdueError, setOverdueError] = useState("");
  const [overdueComplaints, setOverdueComplaints] = useState([]);
  const [overdueThreshold, setOverdueThreshold] = useState(48);
  const [exporting, setExporting] = useState(false);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState("");

  useEffect(() => {
    getAllRequests();
  }, [getAllRequests]);

  useEffect(() => {
    const loadAnalytics = async () => {
      setAnalyticsLoading(true);
      setAnalyticsError("");
      try {
        const response = await requestService.getAdminAnalytics();
        setAnalyticsData({
          dailyCounts: response?.dailyCounts || [],
          categoryStats: response?.categoryStats || [],
          statusStats: response?.statusStats || [],
        });
      } catch (err) {
        const message =
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load chart analytics";
        setAnalyticsError(message);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  useEffect(() => {
    const loadOperatorStats = async () => {
      setOperatorLoading(true);
      setOperatorError("");
      try {
        const response = await requestService.getOperatorPerformance();
        setOperatorStats(response?.data || response || []);
      } catch (err) {
        const message =
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load operator performance";
        setOperatorError(message);
      } finally {
        setOperatorLoading(false);
      }
    };

    loadOperatorStats();
  }, []);

  useEffect(() => {
    const loadOverdue = async () => {
      setOverdueLoading(true);
      setOverdueError("");
      try {
        const response = await requestService.getOverdueComplaints();
        setOverdueComplaints(response?.data || response || []);
        if (response?.thresholdHours) {
          setOverdueThreshold(response.thresholdHours);
        }
      } catch (err) {
        const message =
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load overdue complaints";
        setOverdueError(message);
      } finally {
        setOverdueLoading(false);
      }
    };

    loadOverdue();
  }, []);

  useEffect(() => {
    const loadLocations = async () => {
      setLocationsLoading(true);
      setLocationsError("");
      try {
        const response = await requestService.getAdminLocations();
        setLocations(response?.data || response || []);
      } catch (err) {
        const message =
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load locations";
        setLocationsError(message);
      } finally {
        setLocationsLoading(false);
      }
    };

    loadLocations();
  }, []);

  const stats = useMemo(() => {
    if (requests.length === 0) {
      return {
        totalComplaints: 0,
        pendingComplaints: 0,
        assignedComplaints: 0,
        inProgressComplaints: 0,
        resolvedComplaints: 0,
        resolutionRate: 0,
      };
    }

    const pending = requests.filter((c) => c.status === "PENDING").length;
    const assigned = requests.filter((c) => c.status === "ASSIGNED").length;
    const inProgress = requests.filter(
      (c) => c.status === "IN_PROGRESS",
    ).length;
    const resolved = requests.filter((c) => c.status === "RESOLVED").length;

    const resolutionRate =
      requests.length > 0 ? ((resolved / requests.length) * 100).toFixed(1) : 0;

    return {
      totalComplaints: requests.length,
      pendingComplaints: pending,
      assignedComplaints: assigned,
      inProgressComplaints: inProgress,
      resolvedComplaints: resolved,
      resolutionRate: resolutionRate,
    };
  }, [requests]);

  const areaStats = useMemo(() => {
    if (!requests?.length) return [];

    const counts = requests.reduce((acc, request) => {
      const rawArea =
        request?.Location?.zone_name ||
        request?.location_data?.area ||
        request?.location_data?.zone_name ||
        "Unknown Area";
      const area =
        typeof rawArea === "string" && rawArea.trim().length > 0
          ? rawArea.trim()
          : "Unknown Area";
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [requests]);

  const handleExport = async (type) => {
    setExporting(true);
    try {
      const response = await requestService.exportComplaints(type);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fallbackName = `complaints_${type}_${timestamp}.csv`;
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
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              Dashboard
            </span>
            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-slate-200">Admin Overview</h1>
            <p className="text-neutral-600 dark:text-slate-400">Manage and track complaints</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="self-start md:self-auto"
            onClick={() => handleExport("all")}
            loading={exporting}
          >
            Export as CSV
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 dark:hover:shadow-black/55">
            <p className="text-xs text-neutral-600 mb-1 dark:text-slate-400">Total Complaints</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-indigo-400">
              {stats.totalComplaints}
            </p>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/40 dark:hover:shadow-black/55">
            <p className="text-xs text-neutral-600 mb-1 dark:text-slate-400">Pending</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-amber-400">
              {stats.pendingComplaints}
            </p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/40 dark:hover:shadow-black/55">
            <p className="text-xs text-neutral-600 mb-1 dark:text-slate-400">Assigned</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-indigo-400">
              {stats.assignedComplaints}
            </p>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/40 dark:hover:shadow-black/55">
            <p className="text-xs text-neutral-600 mb-1 dark:text-slate-400">In Progress</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-amber-400">
              {stats.inProgressComplaints}
            </p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/40 dark:hover:shadow-black/55">
            <p className="text-xs text-neutral-600 mb-1 dark:text-slate-400">Resolved</p>
            <p className="text-2xl font-bold text-green-600 dark:text-emerald-500">
              {stats.resolvedComplaints}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 dark:hover:shadow-black/55">
            <p className="text-xs text-neutral-600 mb-1 dark:text-slate-400">Resolution Rate</p>
            <p className="text-2xl font-bold text-success-600 dark:text-emerald-500">
              {stats.resolutionRate}%
            </p>
          </div>
          <div className="rounded-lg border border-error-200 bg-error-50 p-4 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/40 dark:hover:shadow-black/55">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-error-700 mb-1 dark:text-rose-300">Overdue</p>
                <p className="text-2xl font-bold text-error-700 dark:text-rose-500">
                  {overdueComplaints.length}
                </p>
              </div>
              <AlertTriangle size={18} className="text-error-700 mt-0.5 dark:text-rose-500" />
            </div>
            <p className="text-xs text-error-600 mt-1 dark:text-rose-300">
              &gt; {overdueThreshold}h unresolved
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              Analytics
            </h2>
          </div>
          {analyticsError ? (
            <ErrorAlert message={analyticsError} />
          ) : (
            <AnalyticsCharts
              dailyCounts={analyticsData.dailyCounts}
              categoryStats={analyticsData.categoryStats}
              statusStats={analyticsData.statusStats}
              areaStats={areaStats}
              loading={analyticsLoading}
            />
          )}
        </div>

        {/* Heatmap */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              Heatmap
            </h2>
          </div>
          <HeatmapView />
        </div>

        {/* Operator Performance */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              Operator Performance
            </h2>
          </div>
          {operatorLoading ? (
            <InlineSpinner />
          ) : operatorError ? (
            <ErrorAlert message={operatorError} />
          ) : (
            <OperatorPerformance data={operatorStats} />
          )}
        </div>

        {/* Complaint Locations Map */}
        <div className="space-y-4">
          {locationsLoading ? (
            <InlineSpinner />
          ) : locationsError ? (
            <ErrorAlert message={locationsError} />
          ) : (
            <AdminLocationsMap locations={locations} />
          )}
        </div>

        {/* Pending Complaints Awaiting Assignment */}
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-md shadow-slate-200/70 transition-all duration-200 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 dark:hover:shadow-black/55">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-neutral-900 dark:text-slate-200">
              Pending Complaints ({stats.pendingComplaints})
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/admin/pending-complaints")}
            >
              Manage All
            </Button>
          </div>

          {loading ? (
            <InlineSpinner />
          ) : error ? (
            <ErrorAlert message={error} />
          ) : requests.filter((c) => c.status === "PENDING").length === 0 ? (
            <p className="text-neutral-600 dark:text-slate-400">No pending complaints.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {requests
                .filter((c) => c.status === "PENDING")
                .slice(0, 10)
                .map((complaint) => (
                  <div
                    key={complaint.id}
                    className="border border-neutral-100 rounded-lg p-3 shadow-sm shadow-slate-200/60 hover:bg-neutral-50 transition-colors dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/35 dark:hover:bg-slate-900"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900 text-sm dark:text-slate-200">
                          {complaint.description?.substring(0, 60)}
                          {complaint.description?.length > 60 ? "..." : ""}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1 dark:text-slate-400">
                          Category:{" "}
                          <span className="font-medium">
                            {complaint.complaint_category}
                          </span>
                          {" | "}Reported:{" "}
                          <span className="font-medium">
                            {formatters.formatDate(complaint.requested_at)}
                          </span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate("/admin/pending-complaints")}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Overdue Complaints */}
        <div className="rounded-lg border border-error-200 bg-error-50/40 p-6 shadow-md shadow-slate-200/70 transition-all duration-200 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 dark:hover:shadow-black/55">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-error-100 text-error-700 dark:bg-rose-500/20 dark:text-rose-500">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              </span>
              <h3 className="font-bold text-error-800 dark:text-rose-400">
                Overdue Complaints ({overdueComplaints.length})
              </h3>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/admin/pending-complaints")}
            >
              View All
            </Button>
          </div>

          {overdueLoading ? (
            <InlineSpinner />
          ) : overdueError ? (
            <ErrorAlert message={overdueError} />
          ) : overdueComplaints.length === 0 ? (
            <p className="text-neutral-600 dark:text-slate-400">
              No overdue complaints found.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {overdueComplaints.slice(0, 8).map((complaint) => (
                <div
                  key={complaint.id}
                  className="border border-error-300 rounded-lg p-3 bg-error-50 shadow-sm shadow-slate-200/60 hover:bg-error-100 transition-colors dark:border-rose-500/30 dark:bg-rose-500/10 dark:shadow-black/35 dark:hover:bg-rose-500/20"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-1 items-start gap-2">
                      <AlertTriangle
                        size={16}
                        className="text-error-700 mt-0.5 shrink-0 dark:text-rose-500"
                      />
                      <div>
                      <p className="font-medium text-error-900 text-sm dark:text-rose-300">
                        {complaint.description?.substring(0, 60)}
                        {complaint.description?.length > 60 ? "..." : ""}
                      </p>
                      <p className="text-xs text-error-700 mt-1 dark:text-rose-300">
                        Category:{" "}
                        <span className="font-medium">
                          {complaint.complaint_category}
                        </span>
                        {" | "}Reported:{" "}
                        <span className="font-medium">
                          {formatters.formatDate(complaint.requested_at)}
                        </span>
                      </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate("/admin/pending-complaints")}
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
