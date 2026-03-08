import {
  AlertCircle,
  Droplets,
  Lightbulb,
  Trash2,
  TrafficCone,
} from "lucide-react";

const categoryMeta = {
  ROAD: {
    label: "Road Issue",
    icon: TrafficCone,
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  GARBAGE: {
    label: "Garbage / Waste",
    icon: Trash2,
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  WATER: {
    label: "Water Issue",
    icon: Droplets,
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  LIGHT: {
    label: "Street Light",
    icon: Lightbulb,
    iconClass: "text-yellow-600 dark:text-yellow-400",
  },
  OTHER: {
    label: "Other",
    icon: AlertCircle,
    iconClass: "text-slate-600 dark:text-slate-400",
  },
};

export const getComplaintCategoryMeta = (category) =>
  categoryMeta[category] || categoryMeta.OTHER;

