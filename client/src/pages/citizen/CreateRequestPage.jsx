/**
 * Create Complaint Page - Citizen
 */

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CitizenLayout } from "../../components/layouts/CitizenLayout";
import { Input, Select, Textarea, Button } from "../../components/common";
import { ErrorAlert, SuccessAlert } from "../../components/common/Alert";
import useRequest from "../../hooks/useRequest";
import { validators } from "../../utils/validators";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export const CreateRequestPage = () => {
  const navigate = useNavigate();
  const { createRequest, loading, error } = useRequest();
  const mapRef = useRef(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    complaint_category: "",
    description: "",
    area: "",
    address: "",
    lat: "",
    lng: "",
    image: null,
  });
  const [errors, setErrors] = useState({});

  const categories = [
    { value: "ROAD", label: "Road Issue" },
    { value: "GARBAGE", label: "Garbage/Waste" },
    { value: "WATER", label: "Water Issue" },
    { value: "LIGHT", label: "Street Light" },
    { value: "OTHER", label: "Other" },
  ];
  const areas = [
    "Kothrud",
    "Warje",
    "Baner",
    "Wakad",
    "Hadapsar",
    "Shivajinagar",
    "Katraj",
  ];

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setFormData((prev) => ({
          ...prev,
          lat: e.latlng.lat.toFixed(6),
          lng: e.latlng.lng.toFixed(6),
        }));
      },
    });
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.complaint_category)
      newErrors.complaint_category = "Category is required";
    if (!formData.description || formData.description.trim().length === 0)
      newErrors.description = "Description is required";
    if (!formData.area) newErrors.area = "Area is required";
    if (!formData.address || formData.address.trim().length === 0)
      newErrors.address = "Address is required";
    if (!validators.isValidLatitude(formData.lat))
      newErrors.lat = "Invalid latitude (-90 to 90)";
    if (!validators.isValidLongitude(formData.lng))
      newErrors.lng = "Invalid longitude (-180 to 180)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const focusFirstError = (newErrors) => {
    const order = [
      "complaint_category",
      "description",
      "area",
      "address",
      "lat",
      "lng",
    ];
    for (const key of order) {
      if (newErrors[key]) {
        if (key === "lat" || key === "lng") {
          mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          mapRef.current?.focus?.();
        } else {
          const el = document.getElementById(key);
          el?.focus();
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        break;
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result;
    };

    img.onload = () => {
      const maxSize = 1024;
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const scale = Math.min(maxSize / width, maxSize / height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.75);

      setFormData((prev) => ({
        ...prev,
        image: dataUrl,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[CreateRequest] Form submitted");
    console.log("[CreateRequest] Form data:", formData);

    const isValid = validateForm();
    if (!isValid) {
      console.log("[CreateRequest] Form validation failed:", errors);
      focusFirstError({
        complaint_category: !formData.complaint_category,
        description: !formData.description || formData.description.trim().length === 0,
        area: !formData.area,
        address: !formData.address || formData.address.trim().length === 0,
        lat: !validators.isValidLatitude(formData.lat),
        lng: !validators.isValidLongitude(formData.lng),
      });
      return;
    }

    // Double-check category is not empty
    if (
      !formData.complaint_category ||
      formData.complaint_category.trim() === ""
    ) {
      const catError = "Please select a complaint category";
      console.error("[CreateRequest] Category validation failed:", catError);
      setErrors({ ...errors, complaint_category: catError });
      return;
    }

    console.log("[CreateRequest] Form validation passed, sending request...");

    try {
      const payload = {
        complaint_category: formData.complaint_category,
        description: formData.description,
        location: {
          area: formData.area,
          address: formData.address,
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        },
        image: formData.image || undefined,
      };
      console.log("[CreateRequest] Payload:", payload);

      const response = await createRequest(payload);
      console.log("[CreateRequest] Response:", response);

      setSuccess(true);
      setTimeout(() => {
        navigate("/citizen/my-requests");
      }, 2000);
    } catch (err) {
      console.error("[CreateRequest] Error caught:", err);
      console.error("[CreateRequest] Error status:", err.response?.status);
      console.error("[CreateRequest] Full error response:", err.response?.data);
      // Error is already set by the hook
    }
  };

  if (success) {
    return (
      <CitizenLayout>
        <SuccessAlert
          message="Complaint created successfully! Redirecting..."
          onClose={() => {}}
        />
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout>
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-8 dark:border-slate-800 dark:bg-[#020617]">
          <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-slate-200">
            Report a Problem
          </h2>
          <p className="mb-6 text-neutral-600 dark:text-slate-400">
            Please describe the issue you've encountered in your area. Your
            report will help us improve our city services.
          </p>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-rose-500/40 dark:bg-rose-500/10">
              <p className="font-medium text-red-800 dark:text-rose-300">Error: {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              label="Issue Category"
              options={categories}
              value={formData.complaint_category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  complaint_category: e.target.value,
                })
              }
              id="complaint_category"
              error={errors.complaint_category}
              required
            />

            <Textarea
              label="Description"
              placeholder="Describe the problem in detail. What is the issue? Where exactly is it located?"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              id="description"
              error={errors.description}
              rows={4}
              required
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Area"
                options={areas.map((area) => ({ value: area, label: area }))}
                value={formData.area}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    area: e.target.value,
                  })
                }
                id="area"
                error={errors.area}
                required
              />
              <Textarea
                label="Address"
                placeholder="Street address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: e.target.value,
                  })
                }
                id="address"
                error={errors.address}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-slate-300">
                Pick Location on Map
              </label>
              <div
                ref={mapRef}
                tabIndex={-1}
                className={`rounded-lg overflow-hidden border ${
                  errors.lat || errors.lng
                    ? "border-red-500 bg-red-50 dark:border-rose-500/60 dark:bg-rose-500/10"
                    : "border-neutral-200 dark:border-slate-700"
                }`}
              >
                <MapContainer
                  center={[18.5204, 73.8567]}
                  zoom={12}
                  scrollWheelZoom={false}
                  className="h-72 w-full"
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler />
                  {validators.isValidLatitude(formData.lat) &&
                    validators.isValidLongitude(formData.lng) && (
                      <Marker
                        position={[
                          parseFloat(formData.lat),
                          parseFloat(formData.lng),
                        ]}
                      />
                    )}
                </MapContainer>
              </div>
              <p className="text-xs text-neutral-500 dark:text-slate-400">
                Click on the map to drop a marker. Latitude and longitude are
                stored automatically.
              </p>
              {(errors.lat || errors.lng) && (
                <p className="text-xs text-red-600 dark:text-rose-400">
                  Please click the map to set a valid location.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-slate-300">
                Photo (Optional)
              </label>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-neutral-500 dark:text-slate-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100 dark:file:bg-indigo-500/20 dark:file:text-indigo-300 dark:hover:file:bg-indigo-500/30"
                />
                {formData.image && (
                  <button
                    type="button"
                    className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, image: null }))
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
              {formData.image && (
                <div className="mt-4">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="h-auto max-w-xs rounded-lg border border-neutral-200 dark:border-slate-700"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" variant="primary" loading={loading} className="w-full sm:w-auto">
                Submit Complaint
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
                onClick={() => navigate("/citizen/my-requests")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </CitizenLayout>
  );
};

export default CreateRequestPage;
