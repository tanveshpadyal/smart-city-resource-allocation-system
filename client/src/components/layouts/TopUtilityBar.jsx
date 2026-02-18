import { Bell, Search } from "lucide-react";

export const TopUtilityBar = ({ userLabel = "User" }) => {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/30 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          placeholder="Search complaints, users, areas..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none ring-indigo-200 transition focus:border-indigo-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
        />
      </div>
      <div className="flex items-center justify-between gap-3 md:justify-end">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
        <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {userLabel}
        </div>
      </div>
    </div>
  );
};

export default TopUtilityBar;
