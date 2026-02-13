import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  collapsed,
  setCollapsed,
  user,
  menuItems,
  isActive,
  onLogout,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const initials = (user?.name || "OP")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = user?.profile_photo || user?.profilePhoto || "";

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-[1px] lg:hidden dark:bg-black/50"
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 border-r border-slate-200/70 bg-white/95 shadow-lg shadow-slate-300/40 backdrop-blur transition-all duration-[1000ms] ease-in-out lg:translate-x-0 dark:border-slate-800/70 dark:bg-[#020617]/90 dark:shadow-black/40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-20" : "w-72"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-slate-200/70 px-4 dark:border-slate-800/70">
            <div
              className={`flex items-center gap-3 overflow-hidden transition-all duration-[1000ms] ease-in-out ${
                collapsed ? "max-w-0 opacity-0" : "max-w-56 opacity-100"
              }`}
            >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-10 w-10 rounded-xl border border-indigo-200 object-cover dark:border-indigo-500/40"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-sm font-semibold text-white">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                    {user?.name || "Operator"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Operator</p>
                </div>
              </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900 lg:inline-flex"
                aria-label="Collapse sidebar"
              >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900 lg:hidden"
                aria-label="Close sidebar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? "bg-indigo-100 text-indigo-700 shadow-sm ring-1 ring-indigo-200 dark:bg-indigo-500/25 dark:text-indigo-300 dark:ring-indigo-500/40"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {isActive(item.href) && (
                  <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                )}
                <item.icon
                  size={18}
                  className={`shrink-0 ${
                    isActive(item.href)
                      ? "text-indigo-600 dark:text-indigo-300"
                      : "text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300"
                  }`}
                />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-[1000ms] ease-in-out ${
                    collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-slate-200/70 p-3 dark:border-slate-800/70">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 transition-transform hover:bg-rose-100 active:scale-[0.98] dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/30"
            >
              <LogOut size={16} />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-[1000ms] ease-in-out ${
                  collapsed ? "max-w-0 opacity-0" : "max-w-20 opacity-100"
                }`}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-4 right-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:bg-indigo-700 active:scale-[0.96] dark:bg-indigo-500 dark:hover:bg-indigo-400 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>
    </>
  );
};

export default Sidebar;
