/**
 * Register Page
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import MainLayout from "../../components/layouts/MainLayout";
import AuthShowcasePanel from "../../components/auth/AuthShowcasePanel";
import { Input, Button } from "../../components/common";
import { ErrorAlert } from "../../components/common/Alert";
import useAuth from "../../hooks/useAuth";
import { validators } from "../../utils/validators";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, googleLogin, error, isLoading, clearError } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});
  const [googleReady, setGoogleReady] = useState(false);

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
    else if (!validators.isValidPassword(formData.password)) {
      newErrors.password =
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character";
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
        document.getElementById("google-signup"),
        {
          theme: "outline",
          size: "large",
          shape: "pill",
          width: 320,
          text: "signup_with",
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
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/70 md:grid-cols-[1.04fr_0.96fr] dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40">
        <AuthShowcasePanel />

        <div className="flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-[400px] bg-white/95 p-4 dark:bg-slate-900/90 sm:p-5">
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <UserPlus size={18} />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Create Account
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Register to submit and track city complaints.
                </p>
              </div>
            </div>

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
                placeholder="Create a strong password"
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
                placeholder="Re-enter password"
                value={formData.passwordConfirm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    passwordConfirm: e.target.value,
                  })
                }
                error={errors.passwordConfirm}
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isLoading}
                className="w-full rounded-xl bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-800 dark:shadow-indigo-900/35"
              >
                Create Account
              </Button>
            </form>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Or
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="flex justify-center">
                  <div id="google-signup" />
                </div>
                {!googleReady && (
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Loading Google Sign-Up...
                  </p>
                )}
              </>
            )}

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterPage;
