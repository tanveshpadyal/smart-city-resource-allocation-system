/**
 * Login Page
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MainLayout } from "../components/layouts/MainLayout";
import { Input, Button } from "../components/common";
import { ErrorAlert } from "../components/common/Alert";
import useAuth from "../hooks/useAuth";
import { validators } from "../utils/validators";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error, isLoading, clearError } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!validators.isNotEmpty(formData.email))
      newErrors.email = "Email is required";
    else if (!validators.isValidEmail(formData.email))
      newErrors.email = "Invalid email format";
    if (!validators.isNotEmpty(formData.password))
      newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      clearError();
      await login(formData.email, formData.password);
      navigate("/citizen/dashboard");
    } catch {
      // Error handled by store
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Login</h2>

          {error && <ErrorAlert message={error} onClose={clearError} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              error={errors.password}
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isLoading}
              className="w-full"
            >
              Login
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
