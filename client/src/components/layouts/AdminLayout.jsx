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

export const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
      if (window.innerWidth < 768) {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Pending",
      href: "/admin/pending-complaints",
      icon: Clock3,
    },
    {
      label: "Users",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Add Operator",
      href: "/admin/add-operator",
      icon: UserPlus,
    },
    {
      label: "Activity",
      href: "/admin/activity-logs",
      icon: Activity,
    },
  ];

  const isActive = (href) => location.pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-neutral-50 dark:bg-[#0f172a]">
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden dark:bg-black/60"
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-200 bg-white transition-all duration-[2000ms] md:translate-x-0 dark:border-slate-800 dark:bg-[#020617] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="flex h-full flex-col">
          <div className="sticky top-0 flex h-16 items-center justify-between border-b border-primary-200 px-4 bg-primary-50 z-10 dark:border-slate-800 dark:bg-[#020617]">
          <span
            className={`overflow-hidden whitespace-nowrap text-lg font-bold text-neutral-900 transition-all duration-[2000ms] dark:text-slate-200 ${
              collapsed ? "max-w-0 opacity-0 md:max-w-0" : "max-w-28 opacity-100"
            }`}
          >
            Admin
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-md border border-neutral-200 px-2 py-1 text-neutral-700 hover:bg-neutral-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="hidden rounded-md border border-neutral-200 px-2 py-1 text-neutral-700 transition-colors hover:bg-neutral-100 md:inline-flex dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Collapse sidebar"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className={`rounded-md px-2 py-1 text-xs font-bold transition-colors md:hidden ${
                sidebarOpen
                  ? "bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
          </div>

          <nav className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`relative flex items-center gap-3 rounded-xl py-2.5 transition-all ${
                isActive(item.href)
                  ? "bg-primary-100 text-primary-700 shadow-sm ring-1 ring-primary-200 dark:bg-indigo-500/25 dark:text-indigo-300 dark:ring-indigo-500/40"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-slate-300 dark:hover:bg-slate-900"
              } ${collapsed ? "px-3 md:justify-center" : "px-4"}`}
            >
              {isActive(item.href) && (
                <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-primary-600 dark:bg-indigo-400" />
              )}
              <item.icon
                size={18}
                className={`shrink-0 ${
                  isActive(item.href)
                    ? "text-primary-700 dark:text-indigo-300"
                    : "text-neutral-400 dark:text-slate-500"
                }`}
              />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-[2000ms] ${
                  collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"
                }`}
              >
                {item.label}
              </span>
            </Link>
          ))}
          </nav>

          <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-4 dark:border-slate-800 dark:bg-[#020617]">
          <div
            className={`overflow-hidden transition-all duration-[2000ms] ${
              collapsed ? "max-h-0 opacity-0" : "max-h-24 opacity-100"
            }`}
          >
            <div className="mb-4 rounded-lg bg-neutral-50 p-3 text-sm dark:bg-slate-900">
              <p className="font-medium text-neutral-900 dark:text-slate-200">{user?.name}</p>
              <p className="text-xs text-neutral-600 dark:text-slate-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-error-100 px-4 py-2 text-error-700 transition-colors text-sm font-medium hover:bg-error-200 flex items-center justify-center gap-2 dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/30"
          >
            <LogOut size={16} />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-[2000ms] ${
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
        className={`min-w-0 overflow-x-hidden overflow-y-auto transition-all duration-300 ${collapsed ? "md:ml-20" : "md:ml-64"}`}
      >
        <div className="border-b border-neutral-200 bg-white p-4 shadow-sm flex items-center gap-3 dark:border-slate-800 dark:bg-[#020617]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden rounded-lg border border-neutral-200 px-3 py-2 text-neutral-600 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            aria-label="Open sidebar"
          >
            Menu
          </button>
          <h1 className="text-lg font-bold text-neutral-900 sm:text-2xl dark:text-slate-200">
            System Administration
          </h1>
        </div>

        <div className="max-w-full p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
