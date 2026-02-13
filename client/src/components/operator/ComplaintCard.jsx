import { Clock3, MapPin, ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import { Button } from "../common";
import { formatters } from "../../utils/formatters";

const statusStyles = {
  ASSIGNED: "bg-blue-100 text-blue-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  RESOLVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
};

const progressByStatus = {
  ASSIGNED: 30,
  IN_PROGRESS: 70,
  RESOLVED: 100,
};

const getCategoryLabel = (category) => {
  const labels = {
    ROAD: "Road Issue",
    GARBAGE: "Garbage / Waste",
    WATER: "Water Issue",
    LIGHT: "Street Light",
    OTHER: "Other",
  };
  return labels[category] || category;
};

const ComplaintCard = ({
  complaint,
  onStartWork,
  onViewDetails,
  actionLoading = false,
}) => {
  const statusClass = statusStyles[complaint.status] || "bg-slate-100 text-slate-700";
  const progress = progressByStatus[complaint.status] ?? 20;
  const area =
    complaint.location_data?.area || complaint.Location?.zone_name || "Unknown area";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/40 dark:hover:shadow-black/55">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            {getCategoryLabel(complaint.complaint_category)}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
            {complaint.status.replace("_", " ")}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Clock3 size={12} />
          {formatters.formatDateTime(complaint.requested_at)}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-200">
        {complaint.description || "No description provided."}
      </p>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <MapPin size={13} />
        <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
          {area}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {complaint.status === "ASSIGNED" && (
          <Button
            size="sm"
            variant="primary"
            loading={actionLoading}
            className="active:scale-[0.98]"
            onClick={() => onStartWork(complaint.id)}
          >
            <PlayCircle size={14} />
            Start Work
          </Button>
        )}
        {complaint.status === "IN_PROGRESS" && (
          <Button
            size="sm"
            variant="success"
            className="active:scale-[0.98]"
            onClick={() => onViewDetails(complaint.id)}
          >
            <CheckCircle2 size={14} />
            Resolve
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          className="active:scale-[0.98]"
          onClick={() => onViewDetails(complaint.id)}
        >
          View Details
          <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
};

export default ComplaintCard;
