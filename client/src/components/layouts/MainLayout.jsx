/**
 * Main Layout - For public pages (login, register)
 */

import { Link } from "react-router-dom";

export const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600"></div>
            <span className="text-xl font-bold text-neutral-900">
              Smart City
            </span>
          </Link>
          <nav className="flex gap-6">
            <Link
              to="/login"
              className="text-neutral-600 hover:text-primary-600"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-neutral-600 hover:text-primary-600"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white mt-12">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-center text-sm text-neutral-600">
          <p>
            &copy; 2026 Smart City Resource Allocation System. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
