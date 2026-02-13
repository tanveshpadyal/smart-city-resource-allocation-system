/**
 * Login Page
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import MainLayout from "../../components/layouts/MainLayout";
import { Input, Button } from "../../components/common";
import { ErrorAlert } from "../../components/common/Alert";
import useAuth from "../../hooks/useAuth";
import { validators } from "../../utils/validators";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, googleLogin, error, isLoading, clearError } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [googleReady, setGoogleReady] = useState(false);

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
      const response = await login(formData.email, formData.password);
      const role = response?.data?.role;
      if (role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (role === "OPERATOR") {
        navigate("/operator/dashboard");
      } else {
        navigate("/citizen/dashboard");
      }
    } catch {
      // Error handled by store
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const renderGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const loginResponse = await googleLogin(response.credential);
            const role = loginResponse?.data?.role;
            if (role === "ADMIN") navigate("/admin/dashboard");
            else if (role === "OPERATOR") navigate("/operator/dashboard");
            else navigate("/citizen/dashboard");
          } catch {
            // handled by store
          }
        },
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin"),
        {
          theme: "outline",
          size: "large",
          shape: "pill",
          width: 320,
          text: "signin_with",
        },
      );
      setGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      renderGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogle;
    document.body.appendChild(script);
  }, [googleLogin, navigate]);

  return (
    <MainLayout>
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-sm text-slate-500">
                Sign in to manage complaints and operations.
              </p>
            </div>
          </div>

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
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              error={errors.password}
              required
            />
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-sky-600 shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-sky-700"
            >
              Login
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Or
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="flex justify-center">
            <div id="google-signin" />
          </div>
          {!googleReady && import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <p className="mt-3 text-center text-xs text-slate-500">
              Loading Google Sign-In...
            </p>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
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
