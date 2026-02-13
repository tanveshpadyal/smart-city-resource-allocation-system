/**
 * Main Layout - For public pages (login, register)
 */

import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export const MainLayout = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    const previousColorScheme = root.style.colorScheme;

    root.classList.remove("dark");
    root.style.colorScheme = "light";

    return () => {
      if (hadDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      } else {
        root.style.colorScheme = previousColorScheme || "light";
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-indigo-200/60 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl" />

      {/* Header */}
      <header className="relative border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 shadow-md shadow-indigo-200" />
            <span className="text-xl font-bold text-slate-900">
              Smart City CMS
            </span>
          </Link>
          <nav className="flex w-full gap-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto sm:justify-end">
            <Link
              to="/login"
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                location.pathname === "/login"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                location.pathname === "/register"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative mt-12 border-t border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-slate-600 sm:px-6 lg:px-8">
          <p>
            &copy; 2026 Smart City Complaint Management System. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
