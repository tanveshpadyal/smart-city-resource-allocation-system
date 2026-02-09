/**
 * Allocation Details Page - Operator
 */

import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { OperatorLayout } from "../../components/layouts/OperatorLayout";
import { InlineSpinner } from "../../components/common/Spinner";
import { ErrorAlert, SuccessAlert } from "../../components/common/Alert";
import { Button } from "../../components/common";
import useAllocation from "../../hooks/useAllocation";
import { formatters } from "../../utils/formatters";

export const AllocationDetailsPage = () => {
  const { id } = useParams();
  const { loading, error, getAllocation, markInTransit, markDelivered } =
    useAllocation();
  const [allocation, setAllocation] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const loadAllocation = useCallback(async () => {
    try {
      const data = await getAllocation(id);
      setAllocation(data.allocation || data);
    } catch {
      // Error handled by hook
    }
  }, [id, getAllocation]);

  const handleMarkInTransit = async () => {
    try {
      await markInTransit(id);
      setSuccessMessage("Marked as in transit!");
      setTimeout(() => {
        setSuccessMessage("");
        loadAllocation();
      }, 1500);
    } catch {
      // Error handled
    }
  };

  const handleMarkDelivered = async () => {
    try {
      await markDelivered(id);
      setSuccessMessage("Marked as delivered!");
      setTimeout(() => {
        setSuccessMessage("");
        loadAllocation();
      }, 1500);
    } catch {
      // Error handled
    }
  };

  useEffect(() => {
    // Load allocation data on mount or when id changes
    loadAllocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <OperatorLayout>
        <InlineSpinner />
      </OperatorLayout>
    );
  }

  if (error) {
    return (
      <OperatorLayout>
        <ErrorAlert message={error} onRetry={loadAllocation} />
      </OperatorLayout>
    );
  }

  if (!allocation) {
    return (
      <OperatorLayout>
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-neutral-600">Allocation not found.</p>
        </div>
      </OperatorLayout>
    );
  }

  return (
    <OperatorLayout>
      <div className="space-y-6">
        {successMessage && (
          <SuccessAlert
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        )}

        <div className="rounded-lg border border-neutral-200 bg-white p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            Allocation #{allocation.id?.slice(0, 8)}
          </h2>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Resource</p>
              <p className="text-lg font-semibold text-neutral-900">
                {allocation.resource?.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">Status</p>
              <span
                className={`px-3 py-1 rounded text-sm font-medium inline-block ${
                  allocation.status === "PENDING"
                    ? "bg-blue-100 text-blue-800"
                    : allocation.status === "IN_TRANSIT"
                      ? "bg-yellow-100 text-yellow-800"
                      : allocation.status === "DELIVERED"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {allocation.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">
                Quantity Allocated
              </p>
              <p className="text-lg font-semibold text-neutral-900">
                {allocation.quantity_allocated} units
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">Distance</p>
              <p className="text-lg font-semibold text-neutral-900">
                {formatters.formatDistance(allocation.distance_km)}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">
                Estimated Delivery
              </p>
              <p className="text-lg font-semibold text-neutral-900">
                {formatters.formatDateTime(allocation.estimated_completion)}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">Created At</p>
              <p className="text-lg font-semibold text-neutral-900">
                {formatters.formatDateTime(allocation.createdAt)}
              </p>
            </div>
          </div>

          {/* Request Details */}
          <div className="mb-6 border-t border-neutral-200 pt-6">
            <h3 className="font-semibold text-neutral-900 mb-4">
              Request Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Requester</p>
                <p className="font-medium text-neutral-900">
                  {allocation.request?.user?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-1">Category</p>
                <p className="font-medium text-neutral-900">
                  {allocation.request?.resource_category}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-1">Priority</p>
                <p className="font-medium text-neutral-900">
                  {allocation.request?.priority}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-1">
                  Requested Quantity
                </p>
                <p className="font-medium text-neutral-900">
                  {allocation.request?.requested_quantity} units
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {allocation.status !== "DELIVERED" && (
            <div className="flex gap-3">
              {allocation.status === "PENDING" && (
                <Button onClick={handleMarkInTransit} variant="primary">
                  Mark as In Transit
                </Button>
              )}
              {allocation.status === "IN_TRANSIT" && (
                <Button onClick={handleMarkDelivered} variant="success">
                  Mark as Delivered
                </Button>
              )}
              <Button variant="secondary">Back</Button>
            </div>
          )}
        </div>
      </div>
    </OperatorLayout>
  );
};

export default AllocationDetailsPage;
