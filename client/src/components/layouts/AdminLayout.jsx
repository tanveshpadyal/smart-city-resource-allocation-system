/**
 * Admin Layout
 * Admin dashboard for system oversight
 */

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import TopUtilityBar from "./TopUtilityBar";

export const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("adminSidebarCollapsed") === "true";
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setSidebarOpen(desktop);
      if (!desktop) {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("adminSidebarCollapsed", String(collapsed));
    }
  }, [collapsed]);

  const menuItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Complaints", href: "/admin/pending-complaints", icon: Clock3 },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Add Contractor", href: "/admin/add-operator", icon: UserPlus },
    { label: "Activity", href: "/admin/activity-logs", icon: Activity },
  ];

  const isActive = (href) => location.pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = (user?.name || "AD")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = user?.profile_photo || user?.profilePhoto || "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a]">
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-[1px] lg:hidden dark:bg-black/50"
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 border-r border-slate-700/70 bg-gradient-to-b from-[#0b1220] via-[#111827] to-[#1e293b] shadow-xl shadow-black/45 backdrop-blur transition-all duration-[1000ms] ease-in-out lg:translate-x-0 dark:border-indigo-900/40 dark:bg-gradient-to-b dark:from-[#0b1220] dark:via-[#111827] dark:to-[#1e293b] dark:shadow-black/60 ${
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
                <p className="text-sm font-semibold text-slate-100 dark:text-slate-100">
                  {user?.name || "Administrator"}
                </p>
                <p className="text-xs text-slate-300 dark:text-slate-300">Administrator</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600/70 text-slate-300 hover:bg-slate-700/60 dark:border-slate-600/70 dark:text-slate-300 dark:hover:bg-slate-700/60"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-600/70 text-slate-300 hover:bg-slate-700/60 dark:border-slate-600/70 dark:text-slate-300 dark:hover:bg-slate-700/60 lg:inline-flex"
                aria-label="Collapse sidebar"
              >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600/70 text-slate-300 hover:bg-slate-700/60 dark:border-slate-600/70 dark:text-slate-300 dark:hover:bg-slate-700/60 lg:hidden"
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
                    ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-500/60 dark:bg-indigo-500 dark:text-white dark:ring-indigo-400/60"
                    : "text-slate-300 hover:bg-white/10 hover:text-white dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
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
                    ? "text-white"
                    : "text-slate-400 group-hover:text-white dark:text-slate-400 dark:group-hover:text-white"
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
              onClick={handleLogout}
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

      <main
        className={`min-h-screen transition-all duration-300 ${
          collapsed ? "lg:pl-20" : "lg:pl-72"
        }`}
      >
        <div className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6">
          <TopUtilityBar userLabel={user?.name || "Administrator"} />
          {children}
        </div>
      </main>

      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-4 right-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:bg-indigo-700 active:scale-[0.96] dark:bg-indigo-500 dark:hover:bg-indigo-400 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={18} />
      </button>
    </div>
  );
};

export default AdminLayout;
