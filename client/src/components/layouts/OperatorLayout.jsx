/**
 * Operator Layout
 * Dashboard for resource dispatchers
 */

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UserCircle2,
  FileStack,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";
import Sidebar from "../operator/Sidebar";

export const OperatorLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { label: "Dashboard", href: "/operator/dashboard", icon: LayoutDashboard },
    { label: "My Complaints", href: "/operator/complaints", icon: FileStack },
    { label: "Profile", href: "/operator/profile", icon: UserCircle2 },
  ];

  const isActive = (href) => location.pathname.startsWith(href);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a]">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        user={user}
        menuItems={menuItems}
        isActive={isActive}
        onLogout={handleLogout}
      />

      <main
        className={`min-h-screen transition-all duration-300 ${
          collapsed ? "lg:pl-20" : "lg:pl-72"
        }`}
      >
        <div className="mx-auto w-full max-w-[1400px] px-4 py-5 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default OperatorLayout;
