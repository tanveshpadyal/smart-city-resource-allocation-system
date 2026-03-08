import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
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
    circle: "bg-slate-600 border-slate-600",
    bar: "bg-slate-600",
    card: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900",
  },
  ASSIGNED: {
    label: "Assigned to Operator",
    circle: "bg-blue-600 border-blue-600",
    bar: "bg-blue-600",
    card: "border-blue-200 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10",
  },
  IN_PROGRESS: {
    label: "Work Started",
    circle: "bg-violet-600 border-violet-600",
    bar: "bg-violet-600",
    card: "border-violet-200 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/10",
  },
  RESOLVED: {
    label: "Resolved",
    circle: "bg-emerald-600 border-emerald-600",
    bar: "bg-emerald-600",
    card: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10",
  },
};

const timelineOrder = ["CREATED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];

const statusStepMap = {
  PENDING: "CREATED",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
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
      const payload = response?.data || response || {};
      const complaintPayload = payload?.complaint || payload?.request || null;
      const timelinePayload = Array.isArray(payload?.timeline)
        ? payload.timeline
        : [];

      setTimelineData({ complaint: complaintPayload, timeline: timelinePayload });
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

  if (!timelineData?.complaint) {
    return (
      <Layout>
        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-slate-800 dark:bg-[#020617]">
          <p className="text-neutral-600 dark:text-slate-400">Complaint not found.</p>
        </div>
      </Layout>
    );
  }

  const complaint = timelineData.complaint;
  const timeline = Array.isArray(timelineData.timeline) ? timelineData.timeline : [];
  const isOperator = user?.role === "OPERATOR";
  const isAssigned = complaint.status === "ASSIGNED";
  const isInProgress = complaint.status === "IN_PROGRESS";

  const eventMap = new Map();
  timeline.forEach((event) => {
    if (!event?.type || !event?.timestamp) return;
    if (!eventMap.has(event.type)) {
      eventMap.set(event.type, event.timestamp);
    }
  });

  const currentStepKey = statusStepMap[complaint.status] || "CREATED";
  const currentStepIndex = Math.max(timelineOrder.indexOf(currentStepKey), 0);

  const timelineRows = timelineOrder.map((type, index) => ({
    type,
    label: timelineConfig[type].label,
    timestamp: eventMap.get(type),
    reached: index <= currentStepIndex,
  }));

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

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-500/5" />

          <div className="relative z-10">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400">
                  Complaint Journey
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Complaint Timeline
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {complaint.complaint_category}
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {complaint.status}
              </span>
            </div>

          {complaint.description && (
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
              {complaint.description}
            </p>
          )}
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700 dark:text-slate-300 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-500">Location</p>
              <p className="font-medium">{complaint.location?.area || "Unknown Area"}</p>
              {complaint.location?.address && (
                <p className="text-slate-600 dark:text-slate-400">
                  {complaint.location.address}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-500">Reporter</p>
              <p className="font-medium">{complaint.citizen?.name || "Citizen"}</p>
              {complaint.citizen?.email && (
                <p className="text-slate-600 dark:text-slate-400">
                  {complaint.citizen.email}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-500">Assigned To</p>
              <p className="font-medium">
                {complaint.assignedOperator?.name || "Not assigned"}
              </p>
              {complaint.assignedOperator?.email && (
                <p className="text-slate-600 dark:text-slate-400">
                  {complaint.assignedOperator.email}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase text-slate-500 dark:text-slate-500">Created</p>
              <p className="font-medium">{formatters.formatDateTime(complaint.requested_at)}</p>
            </div>
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

            {actionError && <ErrorAlert message={actionError} onRetry={loadTimeline} />}

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
                      className="block w-full text-sm text-neutral-500 dark:text-slate-400 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-indigo-500/20 dark:file:text-indigo-300 dark:hover:file:bg-indigo-500/30"
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

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/70 via-white to-violet-50/60 dark:from-blue-500/5 dark:via-slate-900 dark:to-violet-500/5" />

          <div className="relative z-10">
            <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400">
                  Complaint Journey
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Complaint Status Progress
                </h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Current: {complaint.status}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white/90 p-4 shadow-inner backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70">
              <div className="mt-2 overflow-x-auto overflow-y-visible py-2">
                <div className="mx-auto min-w-[680px] px-2">
                  <div className="relative flex items-start justify-between">
                    {timelineRows.map((row, index) => {
                      const config = timelineConfig[row.type];
                      const isReached = row.reached;
                      const isCurrent = index === currentStepIndex;

                      return (
                        <div key={row.type} className="relative flex w-full flex-col items-center text-center">
                          {index < timelineRows.length - 1 && (
                            <div className="pointer-events-none absolute left-1/2 top-5 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                              <div
                                className={`h-1 rounded-full transition-all duration-700 ease-out ${
                                  index < currentStepIndex ? config.bar : "bg-transparent"
                                }`}
                                style={{ width: index < currentStepIndex ? "100%" : "0%" }}
                              />
                            </div>
                          )}

                          <div
                            className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-500 ${
                              isReached
                                ? `${config.circle} text-white`
                                : "border-neutral-300 bg-white text-neutral-400 dark:border-slate-600 dark:bg-slate-900"
                            } ${
                              isCurrent
                                ? "scale-105 ring-4 ring-primary-100 shadow-md dark:ring-primary-500/20"
                                : "shadow-sm"
                            }`}
                          >
                            {isCurrent && (
                              <span className="pointer-events-none absolute -inset-1 rounded-full border-2 border-primary-300/60 animate-pulse dark:border-primary-400/40" />
                            )}
                            {isReached ? <Check size={16} /> : index + 1}
                          </div>

                          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                            {row.label}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {row.timestamp
                              ? formatters.formatDateTime(row.timestamp)
                              : "Not reached yet"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              {timelineRows.map((row) => {
                const config = timelineConfig[row.type];
                return (
                  <div key={row.type} className={`rounded-xl border p-4 shadow-sm ${config.card}`}>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-slate-200">
                      {row.label}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-slate-400">
                      {row.timestamp
                        ? formatters.formatDateTime(row.timestamp)
                        : "Not reached yet"}
                    </p>
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
