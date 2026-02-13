import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Sparkles,
  Timer,
} from "lucide-react";
import StatCard from "./StatCard";
import MiniOperatorChart from "./MiniOperatorChart";
import { formatters } from "../../utils/formatters";

const SLA_HOURS = 48;

const statusBadge = {
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
};

const timelineBar = {
  ASSIGNED: "bg-blue-500",
  IN_PROGRESS: "bg-amber-500",
  RESOLVED: "bg-emerald-500",
};

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
    <div className="h-3 w-24 rounded bg-slate-200" />
    <div className="mt-3 h-8 w-16 rounded bg-slate-200" />
  </div>
);

const OperatorDashboard = ({ requests = [], loading = false }) => {
  const now = Date.now();

  const assigned = requests.filter((c) => c.status === "ASSIGNED").length;
  const inProgress = requests.filter((c) => c.status === "IN_PROGRESS").length;
  const resolvedToday = requests.filter((c) => {
    if (c.status !== "RESOLVED" || !c.resolved_at) return false;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return new Date(c.resolved_at) >= startOfToday;
  }).length;
  const overdue = requests.filter((c) => {
    if (c.status === "RESOLVED") return false;
    return now - new Date(c.requested_at).getTime() > SLA_HOURS * 60 * 60 * 1000;
  }).length;

  const recent = [...requests]
    .sort(
      (a, b) =>
        new Date(b.assigned_at || b.requested_at) -
        new Date(a.assigned_at || a.requested_at),
    )
    .slice(0, 6);

  const resolvedItems = requests.filter((c) => c.status === "RESOLVED");
  const avgResolutionHours =
    resolvedItems.length > 0
      ? (
          resolvedItems.reduce((sum, item) => {
            if (!item.resolved_at || !item.requested_at) return sum;
            const hours =
              (new Date(item.resolved_at) - new Date(item.requested_at)) /
              (1000 * 60 * 60);
            return sum + hours;
          }, 0) / resolvedItems.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            Dashboard
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-200">
            Operator Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Clean view of your queue, progress, and SLA pressure.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-[#020617] dark:text-slate-300 dark:ring-slate-800">
          <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
          SaaS Ops View
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              title="Assigned"
              value={assigned}
              subtitle="Waiting to start"
              icon={FolderKanban}
              tone="blue"
            />
            <StatCard
              title="In Progress"
              value={inProgress}
              subtitle="Actively handled"
              icon={Clock3}
              tone="amber"
            />
            <StatCard
              title="Resolved Today"
              value={resolvedToday}
              subtitle="Delivered today"
              icon={CheckCircle2}
              tone="emerald"
            />
            <StatCard
              title="Overdue"
              value={overdue}
              subtitle={`Over ${SLA_HOURS}h unresolved`}
              icon={AlertTriangle}
              tone="rose"
            />
          </>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40">
          <h2 className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            Recent Assignments
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Timeline of your latest complaint flow.
          </p>

          {loading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={`recent-skeleton-${idx}`}
                  className="animate-pulse rounded-xl border border-slate-200 p-4"
                >
                  <div className="h-4 w-40 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-28 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No assignments yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recent.map((item) => (
                <article
                  key={item.id}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/30"
                >
                  <div
                    className={`h-12 w-1 rounded-full ${
                      timelineBar[item.status] || "bg-slate-300"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-200">
                      {item.description || item.complaint_category}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.location_data?.area || item.Location?.zone_name || "Unknown area"}
                      {" • "}
                      {formatters.formatDateTime(item.assigned_at || item.requested_at)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      statusBadge[item.status] ||
                      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40">
          <h2 className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            Performance
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your operator mini scorecard.
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/15">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Resolved Count
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-800 dark:text-emerald-300">
                {resolvedItems.length}
              </p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-500/15">
              <p className="text-xs uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                Avg Resolution Time
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-2xl font-semibold text-indigo-800 dark:text-indigo-300">
                <Timer size={18} />
                {avgResolutionHours}h
              </p>
            </div>
            <MiniOperatorChart requests={requests} loading={loading} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default OperatorDashboard;
