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
import authIllustration from "../../assets/login/login.png";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, googleLogin, error, isLoading, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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

      if (role === "ADMIN") navigate("/admin/dashboard");
      else if (role === "OPERATOR") navigate("/operator/dashboard");
      else navigate("/citizen/dashboard");
    } catch {
      // handled by store
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
          } catch (error) {
            console.error("Google login failed:", error);
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
      <div className="mx-auto grid w-full max-w-4xl items-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 md:grid-cols-2 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40">
        {/* Illustration Section */}
        <div className="hidden  md:flex items-center justify-center p-4">
          <img
            src={authIllustration}
            alt="Smart city complaint and contractor management illustration"
            className="max-h-[550px] w-full object-contain"
          />
        </div>

        {/* Login Form */}
        <div className="flex items-center justify-center p-4">
          <div className="w-full max-w-[380px] bg-white p-4 dark:bg-slate-900">
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <ShieldCheck size={18} />
              </span>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Welcome Back
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sign in to manage complaints and operations.
                </p>
              </div>
            </div>

            {/* Error Alert */}
            {error && <ErrorAlert message={error} onClose={clearError} />}

            {/* Login Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-3"
              autoComplete="on"
            >
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                error={errors.email}
                name="username"
                autoComplete="username"
                className="rounded-xl shadow-sm"
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
                name="password"
                autoComplete="current-password"
                className="rounded-xl shadow-sm"
                required
              />

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isLoading}
                className="w-full rounded-xl bg-indigo-700 shadow-md shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-800 dark:shadow-indigo-900/35"
              >
                Login
              </Button>
            </form>

            {/* Divider */}
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Or
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Google Login */}
            <div className="flex justify-center">
              <div id="google-signin" />
            </div>

            {!googleReady && import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <p className="mt-3 text-center text-xs text-slate-500">
                Loading Google Sign-In...
              </p>
            )}

            {/* Register */}
            <p className="mt-5 text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
