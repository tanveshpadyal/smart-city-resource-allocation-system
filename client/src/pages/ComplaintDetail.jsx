import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AdminLayout } from "../components/layouts/AdminLayout";
import { CitizenLayout } from "../components/layouts/CitizenLayout";
import { OperatorLayout } from "../components/layouts/OperatorLayout";
import { InlineSpinner } from "../components/common/Spinner";
import { ErrorAlert } from "../components/common/Alert";
import useAuth from "../hooks/useAuth";
import requestService from "../services/requestService";
import { formatters } from "../utils/formatters";

const timelineConfig = {
  CREATED: {
    label: "Complaint Created",
    color: "bg-primary-600",
  },
  ASSIGNED: {
    label: "Assigned to Operator",
    color: "bg-blue-600",
  },
  IN_PROGRESS: {
    label: "Work Started",
    color: "bg-warning-500",
  },
  RESOLVED: {
    label: "Resolved",
    color: "bg-success-600",
  },
};

export const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timelineData, setTimelineData] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [operatorRemark, setOperatorRemark] = useState("");
  const [resolutionImage, setResolutionImage] = useState(null);

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await requestService.getComplaintTimeline(id);
      setTimelineData(response?.data || response);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to load complaint timeline";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const Layout = useMemo(() => {
    if (user?.role === "ADMIN") return AdminLayout;
    if (user?.role === "OPERATOR") return OperatorLayout;
    return CitizenLayout;
  }, [user?.role]);

  if (loading) {
    return (
      <Layout>
        <InlineSpinner />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <ErrorAlert message={error} onRetry={loadTimeline} />
      </Layout>
    );
  }

  if (!timelineData) {
    return (
      <Layout>
        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-slate-800 dark:bg-[#020617]">
          <p className="text-neutral-600 dark:text-slate-400">Complaint not found.</p>
        </div>
      </Layout>
    );
  }

  const { complaint, timeline } = timelineData;
  const isOperator = user?.role === "OPERATOR";
  const isAssigned = complaint.status === "ASSIGNED";
  const isInProgress = complaint.status === "IN_PROGRESS";

  const handleStartWork = async () => {
    setActionError("");
    setActionLoading(true);
    try {
      await requestService.startComplaint(complaint.id);
      await loadTimeline();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to start work";
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!operatorRemark.trim()) {
      setActionError("Please add a short resolution note.");
      return;
    }
    setActionError("");
    setActionLoading(true);
    try {
      await requestService.resolveComplaint(
        complaint.id,
        operatorRemark.trim(),
        resolutionImage,
      );
      setOperatorRemark("");
      setResolutionImage(null);
      await loadTimeline();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to resolve complaint";
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolutionImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result;
    };

    img.onload = () => {
      const maxSize = 1024;
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const scale = Math.min(maxSize / width, maxSize / height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);

      setResolutionImage(dataUrl);
    };

    reader.readAsDataURL(file);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-start">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Go back"
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-slate-800 dark:bg-[#020617]">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-slate-200">
            Complaint Timeline
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-slate-400">
            {complaint.complaint_category} - {complaint.status}
          </p>
          {complaint.description && (
            <p className="mt-3 text-sm text-neutral-700 dark:text-slate-300">
              {complaint.description}
            </p>
          )}
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-neutral-700 dark:text-slate-300 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-neutral-500 dark:text-slate-500">Location</p>
              <p className="font-medium">
                {complaint.location?.area || "Unknown Area"}
              </p>
              {complaint.location?.address && (
                <p className="text-neutral-600 dark:text-slate-400">{complaint.location.address}</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500 dark:text-slate-500">Reporter</p>
              <p className="font-medium">
                {complaint.citizen?.name || "Citizen"}
              </p>
              {complaint.citizen?.email && (
                <p className="text-neutral-600 dark:text-slate-400">{complaint.citizen.email}</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500 dark:text-slate-500">Assigned To</p>
              <p className="font-medium">
                {complaint.assignedOperator?.name || "Not assigned"}
              </p>
              {complaint.assignedOperator?.email && (
                <p className="text-neutral-600 dark:text-slate-400">
                  {complaint.assignedOperator.email}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-500 dark:text-slate-500">Created</p>
              <p className="font-medium">
                {formatters.formatDateTime(complaint.requested_at)}
              </p>
            </div>
          </div>
        </div>

        {isOperator && (
          <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 dark:border-slate-800 dark:bg-[#020617]">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-slate-200">
                Operator Actions
              </h2>
              <p className="text-sm text-neutral-600 dark:text-slate-400">
                Update complaint progress and resolution status.
              </p>
            </div>

            {actionError && (
              <ErrorAlert message={actionError} onRetry={loadTimeline} />
            )}

            {isAssigned && (
              <button
                type="button"
                onClick={handleStartWork}
                disabled={actionLoading}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {actionLoading ? "Starting..." : "Start Work"}
              </button>
            )}

            {isInProgress && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300">
                  Resolution Note
                </label>
                <textarea
                  rows={3}
                  value={operatorRemark}
                  onChange={(event) => setOperatorRemark(event.target.value)}
                  placeholder="Summarize what was done to resolve the issue."
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-slate-300">
                    Resolution Photo (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleResolutionImageChange}
                      className="block w-full text-sm text-neutral-500 dark:text-slate-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary-50 file:text-primary-700
                        hover:file:bg-primary-100 dark:file:bg-indigo-500/20 dark:file:text-indigo-300 dark:hover:file:bg-indigo-500/30"
                    />
                    {resolutionImage && (
                      <button
                        type="button"
                        className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                        onClick={() => setResolutionImage(null)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {resolutionImage && (
                    <div className="mt-3">
                      <img
                        src={resolutionImage}
                        alt="Resolution preview"
                        className="h-auto max-w-xs rounded-lg border border-neutral-200 dark:border-slate-700"
                      />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  {actionLoading ? "Resolving..." : "Mark Resolved"}
                </button>
              </div>
            )}

            {!isAssigned && !isInProgress && (
              <p className="text-sm text-neutral-500 dark:text-slate-400">
                No actions available for the current status.
              </p>
            )}
          </div>
        )}

        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-slate-800 dark:bg-[#020617]">
          <div className="relative pl-6">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-neutral-200 dark:bg-slate-700" />
            <div className="space-y-6">
              {timeline.map((event) => {
                const config = timelineConfig[event.type] || {
                  label: event.type,
                  color: "bg-neutral-400",
                };
                return (
                  <div key={`${event.type}-${event.timestamp}`} className="flex">
                    <div
                      className={`mt-1 h-3 w-3 rounded-full ${config.color} shadow`}
                    />
                    <div className="ml-4">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-slate-200">
                        {config.label}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-slate-400">
                        {formatters.formatDateTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ComplaintDetail;

