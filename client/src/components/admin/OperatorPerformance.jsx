import { useMemo, useState } from "react";

const columns = [
  { key: "name", label: "Operator" },
  { key: "totalAssigned", label: "Total Assigned" },
  { key: "resolvedCount", label: "Resolved" },
  { key: "avgResolutionHours", label: "Avg Resolution (hrs)" },
];

export const OperatorPerformance = ({ data = [] }) => {
  const [sortKey, setSortKey] = useState("resolvedCount");
  const [sortDir, setSortDir] = useState("desc");

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (typeof aValue === "string") {
        return aValue.localeCompare(bValue);
      }
      return (aValue ?? 0) - (bValue ?? 0);
    });
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [data, sortDir, sortKey]);

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("desc");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 dark:hover:shadow-black/55">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
          Operator Performance
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sorted by {columns.find((col) => col.key === sortKey)?.label}
        </p>
      </div>

      {sortedData.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No operator data available.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
              <tr className="text-left text-slate-600 dark:text-slate-300">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="cursor-pointer select-none px-3 py-2 font-medium"
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <span className="text-xs text-indigo-600 dark:text-indigo-300">
                          {sortDir === "asc" ? "^" : "v"}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row) => (
                <tr
                  key={row.operatorId}
                  className="border-b border-slate-100 last:border-b-0 dark:border-slate-800"
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900 dark:text-slate-200">
                      {row.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {row.email}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                    {row.totalAssigned}
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                    {row.resolvedCount}
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                    {row.avgResolutionHours}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OperatorPerformance;
