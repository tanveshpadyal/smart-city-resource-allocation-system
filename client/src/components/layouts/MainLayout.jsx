/**
 * Main Layout - For public auth pages
 */

import { Link, useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import AppFooter from "./AppFooter";

export const MainLayout = ({ children }) => {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1220]">
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-[#020617]/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-700 text-sm font-bold text-white">
              SC
            </span>
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Smart City CMS
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <nav className="flex gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-[#020617]">
              <Link
                to="/login"
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  location.pathname === "/login"
                    ? "bg-indigo-700 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  location.pathname === "/register"
                    ? "bg-emerald-700 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                Register
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <AppFooter />
    </div>
  );
};

export default MainLayout;
