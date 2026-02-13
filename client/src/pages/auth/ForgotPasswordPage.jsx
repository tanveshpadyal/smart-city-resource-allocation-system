import { useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../components/layouts/MainLayout";
import { Input, Button } from "../../components/common";
import { ErrorAlert, SuccessAlert } from "../../components/common/Alert";
import authService from "../../services/authService";
import { validators } from "../../utils/validators";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!validators.isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const response = await authService.forgotPassword(email);
      setSuccess(
        response?.message ||
          "If an account exists with that email, a reset link has been sent.",
      );
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to process request.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
          <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter your email to receive a password reset link.
          </p>

          <div className="mt-5 space-y-3">
            {error && <ErrorAlert message={error} onClose={() => setError("")} />}
            {success && (
              <SuccessAlert message={success} onClose={() => setSuccess("")} />
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-sky-600 shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-sky-700"
            >
              Send Reset Link
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Remembered your password?{" "}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default ForgotPasswordPage;
