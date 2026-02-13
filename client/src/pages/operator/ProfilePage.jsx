/**
 * Operator Profile Page
 */

import { useEffect, useMemo } from "react";
import { useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { OperatorLayout } from "../../components/layouts/OperatorLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert, SuccessAlert } from "../../components/common/Alert";
import useAuth from "../../hooks/useAuth";
import useRequest from "../../hooks/useRequest";
import authService from "../../services/authService";

const hoursBetween = (start, end) => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  return diff > 0 ? diff / (1000 * 60 * 60) : null;
};

export const OperatorProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { requests, loading, error, getOperatorComplaints } = useRequest();
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");

  useEffect(() => {
    getOperatorComplaints();
  }, [getOperatorComplaints]);

  const stats = useMemo(() => {
    const totalResolved =
      requests?.filter((c) => c.status === "RESOLVED").length || 0;
    const workload =
      requests?.filter(
        (c) => c.status === "ASSIGNED" || c.status === "IN_PROGRESS",
      ).length || 0;
    const resolutionTimes = (requests || [])
      .filter((c) => c.status === "RESOLVED" && c.resolved_at)
      .map((c) => hoursBetween(c.requested_at, c.resolved_at))
      .filter((value) => value !== null);
    const avgResolution =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, value) => sum + value, 0) /
          resolutionTimes.length
        : 0;

    return {
      totalResolved,
      workload,
      avgResolution: Number(avgResolution.toFixed(2)),
    };
  }, [requests]);

  const avatarUrl = user?.profile_photo || user?.profilePhoto || "";

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoError("");
    setPhotoSuccess("");

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = async () => {
        try {
          setPhotoLoading(true);

          const maxSize = 640;
          let { width, height } = image;
          if (width > maxSize || height > maxSize) {
            const scale = Math.min(maxSize / width, maxSize / height);
            width = Math.floor(width * scale);
            height = Math.floor(height * scale);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0, width, height);

          const imageDataUrl = canvas.toDataURL("image/jpeg", 0.75);
          await authService.updateProfilePhoto(imageDataUrl);
          updateUser({ profile_photo: imageDataUrl, profilePhoto: imageDataUrl });
          setPhotoSuccess("Profile photo updated.");
        } catch (err) {
          const message =
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Failed to update profile photo.";
          setPhotoError(message);
        } finally {
          setPhotoLoading(false);
        }
      };

      image.onerror = () => {
        setPhotoError("Invalid image file.");
      };

      image.src = String(reader.result || "");
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    setPhotoError("");
    setPhotoSuccess("");
    try {
      setPhotoLoading(true);
      await authService.updateProfilePhoto(null);
      updateUser({ profile_photo: null, profilePhoto: null });
      setPhotoSuccess("Profile photo removed.");
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to remove profile photo.";
      setPhotoError(message);
    } finally {
      setPhotoLoading(false);
    }
  };

  return (
    <OperatorLayout>
      <div className="space-y-6">
        <div>
          <span className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            Profile
          </span>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-slate-200">
            Operator Profile
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-slate-400">
            Performance and workload overview.
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-md shadow-slate-200/70 dark:border-slate-800 dark:bg-[#020617] dark:shadow-black/40">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative h-16 w-16">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-16 w-16 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  {user?.name?.[0] || "O"}
                </div>
              )}
            </div>
            <div>
              <p className="text-lg font-semibold text-neutral-900 dark:text-slate-200">
                {user?.name || "Operator"}
              </p>
              <p className="text-sm text-neutral-600 dark:text-slate-400">{user?.email}</p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                <Camera size={14} />
                {photoLoading ? "Uploading..." : "Upload Photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={photoLoading}
                />
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={photoLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              )}
            </div>
          </div>
          {photoError && <div className="mt-4"><ErrorAlert message={photoError} /></div>}
          {photoSuccess && (
            <div className="mt-4">
              <SuccessAlert message={photoSuccess} onClose={() => setPhotoSuccess("")} />
            </div>
          )}
        </div>

        {loading ? (
          <InlineSpinner />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-md shadow-slate-200/70 dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/35">
              <p className="mb-1 text-xs text-neutral-600 dark:text-slate-400">Total Resolved</p>
              <p className="text-2xl font-bold text-success-600">
                {stats.totalResolved}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-md shadow-slate-200/70 dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/35">
              <p className="mb-1 text-xs text-neutral-600 dark:text-slate-400">
                Avg Resolution Time (hrs)
              </p>
              <p className="text-2xl font-bold text-primary-600">
                {stats.avgResolution}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-md shadow-slate-200/70 dark:border-slate-800 dark:bg-[#02061780] dark:shadow-black/35">
              <p className="mb-1 text-xs text-neutral-600 dark:text-slate-400">Current Workload</p>
              <p className="text-2xl font-bold text-warning-600">
                {stats.workload}
              </p>
            </div>
          </div>
        )}
      </div>
    </OperatorLayout>
  );
};

export default OperatorProfilePage;
