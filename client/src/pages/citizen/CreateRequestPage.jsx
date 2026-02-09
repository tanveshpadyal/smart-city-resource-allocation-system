/**
 * Create Request Page - Citizen
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CitizenLayout } from "../../components/layouts/CitizenLayout";
import { Input, Select, Textarea, Button } from "../../components/common";
import { ErrorAlert, SuccessAlert } from "../../components/common/Alert";
import useRequest from "../../hooks/useRequest";
import { validators } from "../../utils/validators";

export const CreateRequestPage = () => {
  const navigate = useNavigate();
  const { createRequest, loading, error } = useRequest();
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    resource_category: "",
    requested_quantity: "",
    priority: "MEDIUM",
    description: "",
    location_latitude: "",
    location_longitude: "",
    target_completion_date: "",
  });
  const [errors, setErrors] = useState({});

  const categories = [
    { value: "WATER", label: "Water" },
    { value: "FOOD", label: "Food Supplies" },
    { value: "MEDICAL", label: "Medical Supplies" },
    { value: "FUEL", label: "Fuel" },
    { value: "EQUIPMENT", label: "Equipment" },
    { value: "OTHER", label: "Other" },
  ];

  const priorities = [
    { value: "EMERGENCY", label: "Emergency" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.resource_category)
      newErrors.resource_category = "Category is required";
    if (!validators.isValidQuantity(formData.requested_quantity))
      newErrors.requested_quantity = "Quantity must be a positive number";
    if (!formData.priority) newErrors.priority = "Priority is required";
    if (!validators.isValidLatitude(formData.location_latitude))
      newErrors.location_latitude = "Invalid latitude (-90 to 90)";
    if (!validators.isValidLongitude(formData.location_longitude))
      newErrors.location_longitude = "Invalid longitude (-180 to 180)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await createRequest({
        resource_category: formData.resource_category,
        requested_quantity: parseFloat(formData.requested_quantity),
        priority: formData.priority,
        description: formData.description,
        location_latitude: parseFloat(formData.location_latitude),
        location_longitude: parseFloat(formData.location_longitude),
        target_completion_date: formData.target_completion_date || null,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/citizen/my-requests");
      }, 2000);
    } catch {
      // Error handled by hook
    }
  };

  if (success) {
    return (
      <CitizenLayout>
        <SuccessAlert
          message="Request created successfully! Redirecting..."
          onClose={() => {}}
        />
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout>
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-neutral-200 bg-white p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            Create Resource Request
          </h2>

          {error && <ErrorAlert message={error} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Resource Category"
                options={categories}
                value={formData.resource_category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    resource_category: e.target.value,
                  })
                }
                error={errors.resource_category}
                required
              />
              <Select
                label="Priority"
                options={priorities}
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                error={errors.priority}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantity"
                type="number"
                placeholder="100"
                value={formData.requested_quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requested_quantity: e.target.value,
                  })
                }
                error={errors.requested_quantity}
                required
              />
              <Input
                label="Target Completion Date"
                type="date"
                value={formData.target_completion_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_completion_date: e.target.value,
                  })
                }
              />
            </div>

            <Textarea
              label="Description"
              placeholder="Describe the resources needed and any special requirements..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                placeholder="-90 to 90"
                value={formData.location_latitude}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location_latitude: e.target.value,
                  })
                }
                error={errors.location_latitude}
                required
              />
              <Input
                label="Longitude"
                type="number"
                placeholder="-180 to 180"
                value={formData.location_longitude}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location_longitude: e.target.value,
                  })
                }
                error={errors.location_longitude}
                required
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="primary" loading={loading}>
                Create Request
              </Button>
              <Button
                type="button"
                variant="secondary"
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
