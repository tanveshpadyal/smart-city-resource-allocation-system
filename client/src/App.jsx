import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";
import config from "./config";
import { RoleGuard } from "./components/ProtectedRoute";

// Pages - Auth
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Pages - Citizen
import CitizenDashboardPage from "./pages/citizen/DashboardPage";
import CreateRequestPage from "./pages/citizen/CreateRequestPage";
import MyRequestsPage from "./pages/citizen/MyRequestsPage";

// Pages - Operator
import OperatorDashboardPage from "./pages/operator/DashboardPage";
import PendingRequestsPage from "./pages/operator/PendingRequestsPage";
import AllocationDetailsPage from "./pages/operator/AllocationDetailsPage";

// Pages - Admin
import AdminDashboardPage from "./pages/admin/DashboardPage";

// Error Pages
import NotFoundPage from "./pages/NotFoundPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes - Citizen */}
        <Route
          path="/citizen/dashboard"
          element={
            <RoleGuard requiredRoles={[config.roles.CITIZEN]}>
              <CitizenDashboardPage />
            </RoleGuard>
          }
        />
        <Route
          path="/citizen/create-request"
          element={
            <RoleGuard requiredRoles={[config.roles.CITIZEN]}>
              <CreateRequestPage />
            </RoleGuard>
          }
        />
        <Route
          path="/citizen/my-requests"
          element={
            <RoleGuard requiredRoles={[config.roles.CITIZEN]}>
              <MyRequestsPage />
            </RoleGuard>
          }
        />

        {/* Protected Routes - Operator */}
        <Route
          path="/operator/dashboard"
          element={
            <RoleGuard
              requiredRoles={[config.roles.OPERATOR, config.roles.ADMIN]}
            >
              <OperatorDashboardPage />
            </RoleGuard>
          }
        />
        <Route
          path="/operator/pending-requests"
          element={
            <RoleGuard
              requiredRoles={[config.roles.OPERATOR, config.roles.ADMIN]}
            >
              <PendingRequestsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/operator/allocation/:id"
          element={
            <RoleGuard
              requiredRoles={[config.roles.OPERATOR, config.roles.ADMIN]}
            >
              <AllocationDetailsPage />
            </RoleGuard>
          }
        />

        {/* Protected Routes - Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleGuard requiredRoles={[config.roles.ADMIN]}>
              <AdminDashboardPage />
            </RoleGuard>
          }
        />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/*" element={<NotFoundPage />} />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
