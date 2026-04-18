/**
 * Main Layout - For public auth pages
 */

import { Link, useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import AppFooter from "./AppFooter";
import cityView from "../../assets/city-view.png";

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
                    ? "bg-indigo-700 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                Register
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <img
          src={cityView}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.9)_0%,rgba(219,234,254,0.18)_24%,rgba(241,245,249,0.86)_52%,rgba(248,250,252,0.94)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.88)_0%,rgba(30,58,138,0.14)_28%,rgba(2,6,23,0.9)_55%,rgba(2,6,23,0.94)_100%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default MainLayout;
