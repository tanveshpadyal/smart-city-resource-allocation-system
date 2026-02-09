/**
 * Unauthorized Page (403)
 */

import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layouts/MainLayout";
import { Button } from "../components/common";
import useAuth from "../hooks/useAuth";

export const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoToDashboard = () => {
    if (user?.role === "CITIZEN") {
      navigate("/citizen/dashboard");
    } else if (user?.role === "OPERATOR") {
      navigate("/operator/dashboard");
    } else if (user?.role === "ADMIN") {
      navigate("/admin/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-error-600 mb-4">403</h1>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Access Denied
          </h2>
          <p className="text-neutral-600 mb-8 max-w-md mx-auto">
            You don't have permission to access this page. Please contact an
            administrator if you believe this is an error.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleGoToDashboard} variant="primary">
              Go to Dashboard
            </Button>
            <Link to="/login">
              <Button variant="secondary">Go to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UnauthorizedPage;
