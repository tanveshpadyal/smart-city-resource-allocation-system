import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
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

const STATUS_COLORS = {
  PENDING: "#f59e0b",
  ASSIGNED: "#6366f1",
  IN_PROGRESS: "#fbbf24",
  RESOLVED: "#10b981",
};

const CATEGORY_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e"];
const AREA_LABEL_MAX = 14;

const formatAreaLabel = (value) => {
  if (!value) return "Unknown";
  return value.length > AREA_LABEL_MAX
    ? `${value.slice(0, AREA_LABEL_MAX)}...`
    : value;
};

const ChartSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#020617]">
    <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
    <div className="mt-4 h-56 rounded bg-slate-100 dark:bg-slate-900" />
  </div>
);

export const AnalyticsCharts = ({
  dailyCounts = [],
  categoryStats = [],
  statusStats = [],
  areaStats = [],
  loading = false,
}) => {
  const [activeStatus, setActiveStatus] = useState("");
  const safeStatusStats = Array.isArray(statusStats) ? statusStats : [];
  const selectedStatus =
    activeStatus || safeStatusStats[0]?.status || "";

  const activeIndex = useMemo(
    () =>
      safeStatusStats.findIndex((item) => item.status === selectedStatus),
    [safeStatusStats, selectedStatus],
  );

  const activeSlice =
    safeStatusStats[
      activeIndex >= 0 ? activeIndex : 0
    ] || { status: "N/A", count: 0 };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 dark:hover:shadow-black/55">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-200">
          Complaints per Day (Last 7 Days)
        </h3>
        <div className="flex h-64 items-center justify-center">
          <div className="h-full w-full max-w-[380px]">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dailyCounts}
              margin={{ top: 10, right: 14, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#33415533" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 3 }}
                isAnimationActive
                animationDuration={900}
                name="Complaints"
              />
            </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 dark:hover:shadow-black/55">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-200">
          Category Distribution
        </h3>
        <div className="flex h-64 items-center justify-center">
          <div className="h-full w-full max-w-[380px]">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryStats}
              margin={{ top: 10, right: 14, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#33415533" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="count"
                radius={[8, 8, 0, 0]}
                isAnimationActive
                animationDuration={900}
                name="Complaints"
              >
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
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 dark:hover:shadow-black/55">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
            Status Distribution
          </h3>
          <select
            value={selectedStatus}
            onChange={(event) => setActiveStatus(event.target.value)}
            disabled={safeStatusStats.length === 0}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Select status"
          >
            {safeStatusStats.map((item) => (
              <option key={item.status} value={item.status}>
                {item.status.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="h-full w-full max-w-[420px]">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Tooltip />
              <Pie
                data={safeStatusStats}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={78}
                strokeWidth={4}
                activeIndex={activeIndex >= 0 ? activeIndex : 0}
                onMouseEnter={(_, index) =>
                  setActiveStatus(safeStatusStats[index]?.status || "")
                }
                activeShape={({ outerRadius = 0, ...props }) => (
                  <g>
                    <Sector {...props} outerRadius={outerRadius + 8} />
                    <Sector
                      {...props}
                      outerRadius={outerRadius + 20}
                      innerRadius={outerRadius + 10}
                    />
                  </g>
                )}
                isAnimationActive
                animationDuration={900}
              >
                {safeStatusStats.map((entry, index) => (
                  <Cell
                    key={`${entry.status}-${index}`}
                    fill={STATUS_COLORS[entry.status] || CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-slate-900 text-[20px] font-bold dark:fill-slate-100"
                          >
                            {activeSlice.count}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 18}
                            className="fill-slate-500 text-[11px] uppercase tracking-wide dark:fill-slate-400"
                          >
                            {activeSlice.status.replace("_", " ")}
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {safeStatusStats.map((item, index) => (
            <button
              key={item.status}
              type="button"
              onClick={() => setActiveStatus(item.status)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 hover:-translate-y-px focus:outline-none ${
                item.status === selectedStatus
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-500/40"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    STATUS_COLORS[item.status] ||
                    CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                }}
              />
              <span>{item.status.replace("_", " ")}</span>
              <span className="font-semibold">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 dark:hover:shadow-black/55">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-200">
          Area Distribution
        </h3>
        <div className="flex h-64 items-center justify-center">
          <div className="h-full w-full max-w-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={areaStats}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 18, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#33415533" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="area"
                  width={120}
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatAreaLabel}
                />
                <Tooltip
                  labelFormatter={(label) => `Area: ${label}`}
                  formatter={(value) => [value, "Complaints"]}
                />
                <Bar
                  dataKey="count"
                  radius={[0, 8, 8, 0]}
                  isAnimationActive
                  animationDuration={900}
                  name="Complaints"
                >
                  {areaStats.map((entry, index) => (
                    <Cell
                      key={`${entry.area}-${index}`}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
