import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { Input } from "../../components/common";
import { Button } from "../../components/common";
import { ErrorAlert, SuccessAlert } from "../../components/common/Alert";
import authService from "../../services/authService";

export const AddOperatorPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    assignedAreas: "",
  });

  const parseAreas = (value) =>
    value
      .split(",")
      .map((area) => area.trim().toLowerCase())
      .filter(Boolean)
      .filter((area, index, arr) => arr.indexOf(area) === index);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await authService.createOperator(
        formData.name,
        formData.email,
        formData.password,
        formData.passwordConfirm,
        parseAreas(formData.assignedAreas),
      );
      setSuccess("Operator created successfully.");
      setFormData({
        name: "",
        email: "",
        password: "",
        passwordConfirm: "",
        assignedAreas: "",
      });
      setTimeout(() => navigate("/admin/users"), 1200);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to create operator";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <span className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            Operator
          </span>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-slate-200">Add Operator</h1>
          <p className="mt-1 text-neutral-600 dark:text-slate-400">
            Create a new operator account
          </p>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError("")} />}
        {success && (
          <SuccessAlert message={success} onClose={() => setSuccess("")} />
        )}

        <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-slate-800 dark:bg-[#020617]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={formData.passwordConfirm}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  passwordConfirm: e.target.value,
                }))
              }
              required
            />
            <Input
              label="Assigned Areas (comma-separated)"
              value={formData.assignedAreas}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  assignedAreas: e.target.value,
                }))
              }
              placeholder="downtown, north district"
            />
            <div className="flex gap-3">
              <Button type="submit" variant="primary" loading={loading}>
                Create Operator
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/admin/users")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddOperatorPage;
