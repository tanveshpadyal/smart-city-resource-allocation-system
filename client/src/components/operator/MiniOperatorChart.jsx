import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const buildResolvedTrend = (requests = []) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  const buckets = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });

  const formatDay = (date) =>
    date.toLocaleDateString("en-US", { weekday: "short" });

  return buckets.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const count = requests.filter((request) => {
      if (request.status !== "RESOLVED" || !request.resolved_at) return false;
      const resolvedAt = new Date(request.resolved_at);
      return resolvedAt >= day && resolvedAt < nextDay;
    }).length;
    return {
      day: formatDay(day),
      resolved: count,
    };
  });
};

const MiniOperatorChart = ({ requests = [], loading = false }) => {
  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#020617]">
        <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-32 rounded bg-slate-100 dark:bg-slate-900" />
      </div>
    );
  }

  const trendData = buildResolvedTrend(requests);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-200/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
        Resolved (Last 7 Days)
      </h3>
      <div className="mt-3 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#33415533" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} width={26} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="resolved"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 2 }}
              isAnimationActive
              animationDuration={900}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MiniOperatorChart;
