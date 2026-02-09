/**
 * Admin Layout
 * Admin dashboard for system oversight
 */

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
    { label: "Users", href: "/admin/users", icon: "👥" },
    { label: "Resources", href: "/admin/resources", icon: "📦" },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: "📝" },
    { label: "Reports", href: "/admin/reports", icon: "📈" },
    { label: "Settings", href: "/admin/settings", icon: "⚙️" },
  ];

  const isActive = (href) => location.pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} border-r border-neutral-200 bg-white transition-all duration-300`}
      >
        <div className="sticky top-0 flex h-16 items-center justify-between border-b border-neutral-200 px-4">
          {sidebarOpen && (
            <span className="text-lg font-bold text-neutral-900">Admin</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-neutral-500 hover:text-neutral-700"
          >
            {sidebarOpen ? "✕" : "✓"}
          </button>
        </div>

        <nav className="flex flex-col gap-2 p-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2 transition-colors ${
                isActive(item.href)
                  ? "bg-primary-100 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-neutral-200 p-4">
          {sidebarOpen && (
            <div className="mb-4 rounded-lg bg-neutral-50 p-3 text-sm">
              <p className="font-medium text-neutral-900">{user?.name}</p>
              <p className="text-xs text-neutral-600">Administrator</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-error-100 px-4 py-2 text-error-700 hover:bg-error-200 transition-colors text-sm font-medium"
          >
            {sidebarOpen ? "Logout" : "🚪"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="border-b border-neutral-200 bg-white p-4 shadow-sm">
          <h1 className="text-2xl font-bold text-neutral-900">
            System Administration
          </h1>
        </div>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
