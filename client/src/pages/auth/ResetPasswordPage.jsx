import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MainLayout from "../../components/layouts/MainLayout";
import { Input, Button } from "../../components/common";
import { ErrorAlert, SuccessAlert } from "../../components/common/Alert";
import authService from "../../services/authService";
import { validators } from "../../utils/validators";

export const ResetPasswordPage = () => {
  const { token } = useParams();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const tokenMissing = useMemo(() => !token, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!validators.isValidPassword(formData.newPassword)) {
      setError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
      );
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(
        token,
        formData.newPassword,
        formData.confirmPassword,
      );
      setSuccess("Password reset successfully. You can now login.");
      setFormData({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to reset password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
          <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
          <p className="mt-1 text-sm text-slate-500">
            Set a new password for your account.
          </p>

          <div className="mt-5 space-y-3">
            {tokenMissing && (
              <ErrorAlert message="Invalid reset link. Missing token." />
            )}
            {error && <ErrorAlert message={error} onClose={() => setError("")} />}
            {success && (
              <SuccessAlert message={success} onClose={() => setSuccess("")} />
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="Create a strong password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, newPassword: e.target.value }))
              }
              required
              disabled={tokenMissing}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              required
              disabled={tokenMissing}
            />
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-200 hover:from-emerald-700 hover:to-teal-700"
              disabled={tokenMissing}
            >
              Reset Password
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default ResetPasswordPage;
