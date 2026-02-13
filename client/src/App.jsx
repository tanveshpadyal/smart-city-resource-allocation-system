import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";
import config from "./config";
import { RoleGuard } from "./components/ProtectedRoute";

// Pages - Auth
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Pages - Citizen
import CitizenDashboardPage from "./pages/citizen/DashboardPage";
import CreateRequestPage from "./pages/citizen/CreateRequestPage";
import MyRequestsPage from "./pages/citizen/MyRequestsPage";

// Pages - Operator
import OperatorDashboardPage from "./pages/operator/DashboardPage";
import OperatorComplaintsPage from "./pages/operator/ComplaintsPage";
import OperatorProfilePage from "./pages/operator/ProfilePage";

// Complaint Timeline
import ComplaintDetail from "./pages/ComplaintDetail";

// Pages - Admin
import AdminDashboardPage from "./pages/admin/DashboardPage";
import PendingComplaintsPage from "./pages/admin/PendingComplaintsPage";
import AdminUsersPage from "./pages/admin/UsersPage";
import ActivityLogsPage from "./pages/admin/ActivityLogsPage";
import AddOperatorPage from "./pages/admin/AddOperatorPage";

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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

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
          path="/operator/complaints"
          element={
            <RoleGuard
              requiredRoles={[config.roles.OPERATOR, config.roles.ADMIN]}
            >
              <OperatorComplaintsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/operator/profile"
          element={
            <RoleGuard
              requiredRoles={[config.roles.OPERATOR, config.roles.ADMIN]}
            >
              <OperatorProfilePage />
            </RoleGuard>
          }
        />
        <Route
          path="/operator/complaint/:id"
          element={
            <RoleGuard
              requiredRoles={[config.roles.OPERATOR, config.roles.ADMIN]}
            >
              <ComplaintDetail />
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
        <Route
          path="/admin/pending-complaints"
          element={
            <RoleGuard requiredRoles={[config.roles.ADMIN]}>
              <PendingComplaintsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleGuard requiredRoles={[config.roles.ADMIN]}>
              <AdminUsersPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/activity-logs"
          element={
            <RoleGuard requiredRoles={[config.roles.ADMIN]}>
              <ActivityLogsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/add-operator"
          element={
            <RoleGuard requiredRoles={[config.roles.ADMIN]}>
              <AddOperatorPage />
            </RoleGuard>
          }
        />

        {/* Complaint Timeline (All Roles) */}
        <Route
          path="/complaints/:id"
          element={
            <RoleGuard
              requiredRoles={[
                config.roles.CITIZEN,
                config.roles.OPERATOR,
                config.roles.ADMIN,
              ]}
            >
              <ComplaintDetail />
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
