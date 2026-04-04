import { Link } from "react-router-dom";

export const AppFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-slate-200/80 bg-white/95 dark:border-slate-800 dark:bg-[#020617]/95">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
                SC
              </span>
              <div>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Smart City Complaint System
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Faster complaint tracking, assignment, and resolution for every role.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Quick Links
              </p>
              <div className="mt-3 flex flex-col gap-2 text-slate-600 dark:text-slate-300">
                <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-300">
                  Home
                </Link>
                <Link
                  to="/login"
                  className="hover:text-indigo-600 dark:hover:text-indigo-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="hover:text-indigo-600 dark:hover:text-indigo-300"
                >
                  Register
                </Link>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Platform
              </p>
              <div className="mt-3 flex flex-col gap-2 text-slate-600 dark:text-slate-300">
                <p>Citizen reporting</p>
                <p>Operator workflow</p>
                <p>Admin monitoring</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-slate-200/80 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>&copy; {year} Smart City Complaint Management System</p>
          <p>Built for responsive city operations and transparent service updates.</p>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
