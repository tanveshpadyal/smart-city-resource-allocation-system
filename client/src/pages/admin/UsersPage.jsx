import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../../components/layouts/AdminLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert, SuccessAlert } from "../../components/common/Alert";
import { Button } from "../../components/common";
import authService from "../../services/authService";
import { formatters } from "../../utils/formatters";

const roleBadgeClass = {
  ADMIN:
    "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-500/40",
  OPERATOR:
    "bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:ring-sky-500/40",
  CITIZEN:
    "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
};

const getNormalizedStatus = (user) => {
  if (typeof user?.status === "string" && user.status.trim()) {
    return user.status.trim().toLowerCase();
  }
  return user?.is_active ? "active" : "suspended";
};

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [savingAreasId, setSavingAreasId] = useState(null);
  const [areaDrafts, setAreaDrafts] = useState({});
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authService.getAllUsers();
      const data = response?.data || response || [];
      setUsers(data);
      const nextDrafts = {};
      data.forEach((user) => {
        if (user.role === "OPERATOR") {
          nextDrafts[user.id] = (user.assignedAreas || []).join(", ");
        }
      });
      setAreaDrafts(nextDrafts);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to fetch users";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const roleMatch = roleFilter === "ALL" || user.role === roleFilter;
      const derivedStatus = getNormalizedStatus(user);
      const statusMatch =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && derivedStatus === "active") ||
        (statusFilter === "SUSPENDED" && derivedStatus === "suspended");
      return roleMatch && statusMatch;
    });
  }, [users, roleFilter, statusFilter]);

  const handleStatusToggle = async (user) => {
    const nextStatus =
      getNormalizedStatus(user) === "active"
        ? "suspended"
        : "active";

    try {
      setUpdatingId(user.id);
      await authService.updateUserStatus(user.id, nextStatus);
      setSuccessMessage(`User status updated to ${nextStatus}.`);
      loadUsers();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to update user status";
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const parseAreas = (value) =>
    value
      .split(",")
      .map((area) => area.trim().toLowerCase())
      .filter(Boolean)
      .filter((area, index, arr) => arr.indexOf(area) === index);

  const handleSaveAreas = async (user) => {
    try {
      setSavingAreasId(user.id);
      const assignedAreas = parseAreas(areaDrafts[user.id] || "");
      await authService.updateOperatorAreas(user.id, assignedAreas);
      setSuccessMessage("Operator assigned areas updated.");
      loadUsers();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to update operator areas";
      setError(message);
    } finally {
      setSavingAreasId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <span className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            Users
          </span>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-slate-200">User Management</h1>
          <p className="mt-1 text-neutral-600 dark:text-slate-400">
            View all registered users and their roles
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-md shadow-slate-200/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="OPERATOR">Operator</option>
              <option value="CITIZEN">Citizen</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
              <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {filteredUsers.length} users
              </span>
            </div>
            <button
              onClick={loadUsers}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <ErrorAlert message={error} onRetry={loadUsers} />
        )}
        {successMessage && (
          <SuccessAlert
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        )}

        {loading ? (
          <InlineSpinner />
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-md shadow-slate-200/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40">
            <p className="text-neutral-600 dark:text-slate-400">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-md shadow-slate-200/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-track]:bg-slate-800 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-500">
            <table className="min-w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-slate-800 dark:bg-slate-900/60">
                <tr className="text-left text-xs uppercase tracking-wide text-neutral-500 dark:text-slate-400">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Assigned Areas</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  (() => {
                    const status = getNormalizedStatus(user);
                    return (
                  <tr
                    key={user.id}
                    className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 last:border-b-0 dark:border-slate-800 dark:hover:bg-slate-900/60"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-slate-200">{user.name}</td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-slate-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeClass[user.role] || roleBadgeClass.CITIZEN}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          status === "active"
                            ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/40"
                            : "bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:ring-rose-500/40"
                        }`}
                      >
                        {status === "active" ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="min-w-80 px-4 py-3">
                      {user.role === "OPERATOR" ? (
                        <input
                          type="text"
                          value={areaDrafts[user.id] ?? ""}
                          onChange={(e) =>
                            setAreaDrafts((prev) => ({
                              ...prev,
                              [user.id]: e.target.value,
                            }))
                          }
                          placeholder="downtown, west zone"
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-indigo-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        />
                      ) : (
                        <span className="text-neutral-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-600 dark:text-slate-400">
                      {formatters.formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant={status === "active" ? "danger" : "success"}
                          onClick={() => handleStatusToggle(user)}
                          loading={updatingId === user.id}
                        >
                          {status === "active" ? "Suspend" : "Activate"}
                        </Button>
                        {user.role === "OPERATOR" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSaveAreas(user)}
                            loading={savingAreasId === user.id}
                          >
                            Save Areas
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                    );
                  })()
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
