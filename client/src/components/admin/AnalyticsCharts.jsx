import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STATUS_META = {
  PENDING: { label: "Pending", color: "#f59e0b" },
  ASSIGNED: { label: "Assigned", color: "#6366f1" },
  IN_PROGRESS: { label: "In Progress", color: "#0ea5e9" },
  RESOLVED: { label: "Resolved", color: "#10b981" },
};

const CATEGORY_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];
const AREA_COLORS = ["#1d4ed8", "#2563eb", "#3b82f6", "#0ea5e9", "#14b8a6", "#10b981", "#84cc16"];

const truncate = (value, max = 14) => {
  if (!value) return "Unknown";
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

const ChartTooltip = ({
  active,
  payload,
  label,
  labelPrefix = "Label",
  valueLabel = "Count",
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {labelPrefix}: {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-200">
        {valueLabel}: {point?.value ?? 0}
      </p>
    </div>
  );
};

const PanelSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#020617]">
    <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
    <div className="mt-2 h-3 w-56 rounded bg-slate-100 dark:bg-slate-900" />
    <div className="mt-5 h-64 rounded-xl bg-slate-100 dark:bg-slate-900" />
  </div>
);

const Panel = ({ title, subtitle, children }) => (
  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 dark:hover:shadow-black/55">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500/35 via-sky-500/35 to-emerald-500/35 dark:from-indigo-400/70 dark:via-sky-400/70 dark:to-emerald-400/70" />
    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">{title}</h3>
    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
    <div className="mt-4">{children}</div>
  </div>
);

export const AnalyticsCharts = ({
  dailyCounts = [],
  categoryStats = [],
  statusStats = [],
  areaStats = [],
  loading = false,
}) => {
  const safeStatusStats = Array.isArray(statusStats) ? statusStats : [];
  const [activeStatus, setActiveStatus] = useState(safeStatusStats[0]?.status || "");
  const selectedStatus = activeStatus || safeStatusStats[0]?.status || "";

  const activeIndex = useMemo(
    () => safeStatusStats.findIndex((item) => item.status === selectedStatus),
    [safeStatusStats, selectedStatus],
  );

  const activeSlice = safeStatusStats[activeIndex >= 0 ? activeIndex : 0] || {
    status: "N/A",
    count: 0,
  };

  const dailyTrendData = useMemo(() => {
    if (!Array.isArray(dailyCounts)) return [];
    return dailyCounts.map((item, index) => {
      const prev = dailyCounts[index - 1]?.count ?? item.count ?? 0;
      const next = dailyCounts[index + 1]?.count ?? item.count ?? 0;
      const current = item.count ?? 0;
      const smoothed = Number(((prev + current + next) / 3).toFixed(2));
      return { ...item, trend: smoothed };
    });
  }, [dailyCounts]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PanelSkeleton />
        <PanelSkeleton />
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Panel
        title="Complaints Per Day"
        subtitle="Daily trend for the last 7 days"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrendData} margin={{ top: 8, right: 8, left: -8, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#33415526" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                padding={{ left: 8, right: 8 }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                content={(props) => (
                  <ChartTooltip {...props} labelPrefix="Date" valueLabel="Complaints" />
                )}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Complaints"
                stroke="#1d4ed8"
                strokeWidth={3}
                dot={{ r: 3, fill: "#1d4ed8", stroke: "#eff6ff", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "#1e3a8a", stroke: "#bfdbfe", strokeWidth: 2 }}
                isAnimationActive
                animationDuration={900}
              />
              <Line
                type="monotone"
                dataKey="trend"
                name="Trend"
                stroke="#0f766e"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                isAnimationActive
                animationDuration={900}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel
        title="Category Distribution"
        subtitle="Complaint volume by category"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryStats}
              layout="vertical"
              margin={{ top: 8, right: 12, left: 18, bottom: 6 }}
              barCategoryGap={10}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#33415526" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="category"
                width={120}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => truncate(value, 16)}
              />
              <Tooltip
                content={(props) => (
                  <ChartTooltip {...props} labelPrefix="Category" valueLabel="Complaints" />
                )}
              />
              <Bar dataKey="count" radius={[0, 10, 10, 0]} maxBarSize={28}>
                {categoryStats.map((entry, index) => (
                  <Cell
                    key={`${entry.category}-${index}`}
                    fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel
        title="Status Distribution"
        subtitle="Current state across all complaints"
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_160px]">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={(props) => (
                    <ChartTooltip {...props} labelPrefix="Status" valueLabel="Complaints" />
                  )}
                />
                <Pie
                  data={safeStatusStats}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={98}
                  paddingAngle={2}
                  strokeWidth={3}
                  activeIndex={activeIndex >= 0 ? activeIndex : 0}
                  onMouseEnter={(_, index) =>
                    setActiveStatus(safeStatusStats[index]?.status || "")
                  }
                  activeShape={({ outerRadius = 0, ...props }) => (
                    <g>
                      <Sector {...props} outerRadius={outerRadius + 8} />
                      <Sector
                        {...props}
                        outerRadius={outerRadius + 16}
                        innerRadius={outerRadius + 10}
                      />
                    </g>
                  )}
                >
                  {safeStatusStats.map((entry, index) => (
                    <Cell
                      key={`${entry.status}-${index}`}
                      fill={
                        STATUS_META[entry.status]?.color ||
                        CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="-mt-40 text-center pointer-events-none">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {activeSlice.count}
              </p>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {STATUS_META[activeSlice.status]?.label || activeSlice.status}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 xl:grid-cols-1 xl:content-start">
            {safeStatusStats.map((item, index) => (
              <button
                key={item.status}
                type="button"
                onClick={() => setActiveStatus(item.status)}
                className={`rounded-xl border px-3 py-2 text-left transition-all ${
                  item.status === selectedStatus
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-500/40"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <p className="inline-flex items-center gap-2 text-xs font-medium">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        STATUS_META[item.status]?.color ||
                        CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                    }}
                  />
                  {STATUS_META[item.status]?.label || item.status.replace("_", " ")}
                </p>
                <p className="mt-1 text-lg font-semibold">{item.count}</p>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel
        title="Area Distribution"
        subtitle="Top complaint concentration by area"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={areaStats}
              layout="vertical"
              margin={{ top: 8, right: 12, left: 18, bottom: 6 }}
              barCategoryGap={10}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#33415526" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="area"
                width={120}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => truncate(value, 16)}
              />
              <Tooltip
                content={(props) => (
                  <ChartTooltip {...props} labelPrefix="Area" valueLabel="Complaints" />
                )}
              />
              <Bar dataKey="count" radius={[0, 10, 10, 0]} maxBarSize={28}>
                {areaStats.map((entry, index) => (
                  <Cell
                    key={`${entry.area}-${index}`}
                    fill={AREA_COLORS[index % AREA_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
};

export default AnalyticsCharts;
