/**
 * Register Page
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MainLayout } from "../components/layouts/MainLayout";
import { Input, Select, Button } from "../components/common";
import { ErrorAlert } from "../components/common/Alert";
import useAuth from "../hooks/useAuth";
import { validators } from "../utils/validators";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error, isLoading, clearError } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!validators.isNotEmpty(formData.name))
      newErrors.name = "Name is required";
    else if (!validators.isValidName(formData.name))
      newErrors.name = "Name must be at least 2 characters";

    if (!validators.isNotEmpty(formData.email))
      newErrors.email = "Email is required";
    else if (!validators.isValidEmail(formData.email))
      newErrors.email = "Invalid email format";

    if (!validators.isNotEmpty(formData.password))
      newErrors.password = "Password is required";
    else if (!validators.isValidPasswordSimple(formData.password)) {
      newErrors.password =
        "Password must be at least 8 characters with uppercase and lowercase";
    }

    if (formData.passwordConfirm !== formData.password) {
      newErrors.passwordConfirm = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      clearError();
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.passwordConfirm,
      );
      navigate("/citizen/dashboard");
    } catch {
      // Error handled by store
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            Create Account
          </h2>

          {error && <ErrorAlert message={error} onClose={clearError} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={errors.name}
              required
            />
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
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={formData.passwordConfirm}
              onChange={(e) =>
                setFormData({ ...formData, passwordConfirm: e.target.value })
              }
              error={errors.passwordConfirm}
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isLoading}
              className="w-full"
            >
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterPage;
