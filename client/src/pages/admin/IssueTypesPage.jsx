import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { Button, Input, Textarea } from "../../components/common";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert, SuccessAlert } from "../../components/common/Alert";
import issueTypeService from "../../services/issueTypeService";

export const IssueTypesPage = () => {
  const [issueTypes, setIssueTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const loadIssueTypes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await issueTypeService.getAdminIssueTypes();
      setIssueTypes(response?.data || response || []);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to load issue types";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIssueTypes();
  }, [loadIssueTypes]);

  const activeCount = useMemo(
    () => issueTypes.filter((item) => item.is_active).length,
    [issueTypes],
  );

  const archivedCount = Math.max(issueTypes.length - activeCount, 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await issueTypeService.createIssueType(formData);
      setSuccessMessage(
        response?.message || "Issue type saved successfully.",
      );
      setFormData({
        name: "",
        description: "",
      });
      await loadIssueTypes();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to save issue type";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (issueType) => {
    const confirmed = window.confirm(
      `Remove "${issueType.name}" from the active complaint issue list?`,
    );
    if (!confirmed) return;

    setRemovingId(issueType.id);
    setError("");
    setSuccessMessage("");

    try {
      const response = await issueTypeService.deleteIssueType(issueType.id);
      setSuccessMessage(
        response?.message || "Issue type removed successfully.",
      );
      await loadIssueTypes();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to remove issue type";
      setError(message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {error && <ErrorAlert message={error} onRetry={loadIssueTypes} />}
        {successMessage && (
          <SuccessAlert
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        )}

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-md shadow-slate-200/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-slate-200">
                Add Issue Type
              </h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-slate-400">
                Create complaint options like pothole, drainage leak, or
                streetlight outage for citizens to pick during registration.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Issue Name"
                placeholder="e.g. Pothole"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                required
              />

              <Textarea
                label="Description"
                placeholder="Short note for admins about when to use this issue type."
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={4}
              />

              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                className="w-full"
              >
                Save Issue Type
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-md shadow-slate-200/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-slate-200">
                  Issue Type Library
                </h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-slate-400">
                  Active: {activeCount} | Archived: {archivedCount}
                </p>
              </div>

              <Button variant="secondary" size="sm" onClick={loadIssueTypes}>
                Refresh
              </Button>
            </div>

            <p className="mb-4 text-xs text-neutral-500 dark:text-slate-400">
              If you re-add an archived issue type with the same name, it will
              be restored automatically.
            </p>

            {loading ? (
              <InlineSpinner />
            ) : issueTypes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-neutral-600 dark:border-slate-700 dark:text-slate-400">
                No issue types found yet.
              </div>
            ) : (
              <div className="space-y-3">
                {issueTypes.map((issueType) => (
                  <div
                    key={issueType.id}
                    className={`rounded-2xl border px-4 py-4 transition-colors ${
                      issueType.is_active
                        ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60"
                        : "border-slate-200/70 bg-slate-50/70 opacity-75 dark:border-slate-800 dark:bg-slate-900/30"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-neutral-900 dark:text-slate-200">
                            {issueType.name}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              issueType.is_active
                                ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/40"
                                : "bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                            }`}
                          >
                            {issueType.is_active ? "Active" : "Archived"}
                          </span>
                        </div>
                        {issueType.description ? (
                          <p className="mt-2 text-sm text-neutral-600 dark:text-slate-400">
                            {issueType.description}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-neutral-500 dark:text-slate-500">
                            No description added.
                          </p>
                        )}
                      </div>

                      {issueType.is_active ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={removingId === issueType.id}
                          onClick={() => handleRemove(issueType)}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default IssueTypesPage;
