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
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-900">
          Operator Performance
        </h3>
        <p className="text-xs text-neutral-500">
          Sorted by {columns.find((col) => col.key === sortKey)?.label}
        </p>
      </div>

      {sortedData.length === 0 ? (
        <p className="text-sm text-neutral-600">No operator data available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr className="text-left text-neutral-600">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 font-medium cursor-pointer select-none"
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <span className="text-xs text-primary-600">
                          {sortDir === "asc" ? "▲" : "▼"}
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
                  className="border-b border-neutral-100 last:border-b-0"
                >
                  <td className="px-3 py-2">
                    <div className="text-neutral-900 font-medium">
                      {row.name}
                    </div>
                    <div className="text-xs text-neutral-500">{row.email}</div>
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {row.totalAssigned}
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {row.resolvedCount}
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
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
