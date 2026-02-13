import { AlertTriangle } from "lucide-react";
import ComplaintCard from "./ComplaintCard";

const ComplaintsSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div
        key={`complaint-skeleton-${idx}`}
        className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
      >
        <div className="h-4 w-52 rounded bg-slate-200" />
        <div className="mt-3 h-3 w-full rounded bg-slate-200" />
        <div className="mt-2 h-3 w-4/5 rounded bg-slate-200" />
        <div className="mt-4 h-8 w-36 rounded bg-slate-200" />
      </div>
    ))}
  </div>
);

const MyComplaints = ({
  complaints = [],
  loading = false,
  onStartWork,
  onViewDetails,
  actionLoading = false,
}) => {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section>
        <span className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
          Complaints
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-200">
          My Complaints
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your assignments with fast actions and clear status.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-200/70 md:p-5 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40">
        {loading ? (
          <ComplaintsSkeleton />
        ) : complaints.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
            <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" />
            No complaints assigned yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {complaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onStartWork={onStartWork}
                onViewDetails={onViewDetails}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyComplaints;
