/**
 * Citizen Layout
 * Sidebar navigation for citizen requests
 */

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
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

export const CitizenLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
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

  return (
    <div className="min-h-screen bg-neutral-50 md:flex dark:bg-[#0f172a]">
      {/* Mobile Overlay */}
      {!isDesktop && sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden dark:bg-black/60"
          aria-label="Close sidebar"
        />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-[#020617] ${
          isDesktop || sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-slate-800 dark:bg-[#020617]">
          {(isDesktop || sidebarOpen) && !collapsed && (
            <span className="text-lg font-bold text-neutral-900 dark:text-slate-200">
              Smart City
            </span>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-md border border-neutral-200 p-1.5 text-neutral-700 hover:bg-neutral-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {!isDesktop && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            )}
            {isDesktop && (
              <button
                type="button"
                onClick={() => setCollapsed((prev) => !prev)}
                className="rounded-md border border-neutral-200 p-1.5 text-neutral-700 hover:bg-neutral-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                aria-label="Collapse sidebar"
              >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            )}
          </div>
          </div>

          <nav className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 rounded-lg py-2 transition-colors ${
                isActive(item.href)
                  ? "bg-primary-100 text-primary-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-slate-300 dark:hover:bg-slate-900"
              } ${collapsed ? "justify-center px-2" : "px-4"}`}
            >
              <item.icon size={18} className="shrink-0" />
              {(isDesktop || sidebarOpen) && !collapsed && <span>{item.label}</span>}
            </Link>
          ))}
          </nav>

          {/* User Section */}
          <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-4 dark:border-slate-800 dark:bg-[#020617]">
          {(isDesktop || sidebarOpen) && !collapsed && (
            <div className="mb-4 rounded-lg bg-neutral-50 p-3 text-sm dark:bg-slate-900">
              <p className="font-medium text-neutral-900 dark:text-slate-200">{user?.name}</p>
              <p className="text-xs text-neutral-600 dark:text-slate-400">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-error-100 px-4 py-2 text-sm font-medium text-error-700 transition-colors hover:bg-error-200 dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/30"
          >
            <LogOut size={16} />
            {(isDesktop || sidebarOpen) && !collapsed && "Logout"}
          </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${collapsed ? "md:ml-20" : "md:ml-64"}`}>
        {/* Top Bar */}
        <div className="flex items-center gap-3 border-b border-neutral-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#020617]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-neutral-600 hover:bg-neutral-50 md:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            aria-label="Open sidebar"
          >
            Menu
          </button>
          <h1 className="text-lg font-bold text-neutral-900 sm:text-2xl dark:text-slate-200">
            Citizen Dashboard
          </h1>
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
};

export default CitizenLayout;
