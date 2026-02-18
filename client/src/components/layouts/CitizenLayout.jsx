/**
 * Citizen Layout
 * Sidebar navigation for citizen requests
 */

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  House,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Sun,
  X,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import TopUtilityBar from "./TopUtilityBar";

export const CitizenLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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

  const menuItems = [
    { label: "Dashboard", href: "/citizen/dashboard", icon: LayoutDashboard },
    { label: "Create Request", href: "/citizen/create-request", icon: PlusCircle },
    { label: "My Requests", href: "/citizen/my-requests", icon: ClipboardList },
  ];

  const isActive = (href) => location.pathname === href;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = (user?.name || "CT")
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
                  {user?.name || "Citizen"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Citizen</p>
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
        <div className="mx-auto w-full max-w-[1400px] px-4 py-5 pb-24 md:px-6 md:pb-6">
          <TopUtilityBar userLabel={user?.name || "Citizen"} />
          {children}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur dark:border-slate-800 dark:bg-[#020617]/95 lg:hidden">
        <div className="grid grid-cols-3 gap-2">
          <Link
            to="/citizen/dashboard"
            className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium ${
              isActive("/citizen/dashboard")
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <House size={14} />
            Home
          </Link>
          <Link
            to="/citizen/create-request"
            className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium ${
              isActive("/citizen/create-request")
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <PlusCircle size={14} />
            New
          </Link>
          <Link
            to="/citizen/my-requests"
            className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium ${
              isActive("/citizen/my-requests")
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <ClipboardList size={14} />
            Status
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default CitizenLayout;
