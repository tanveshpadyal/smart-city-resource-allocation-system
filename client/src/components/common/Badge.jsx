/**
 * Badge Component
 * Status and category badges
 */

export const Badge = ({ label, variant = "neutral", className = "" }) => {
  const variantStyles = {
    neutral: "bg-neutral-100 text-neutral-800",
    primary: "bg-primary-100 text-primary-800",
    success: "bg-success-100 text-success-800",
    warning: "bg-warning-100 text-warning-800",
    error: "bg-error-100 text-error-800",
    emergency: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
    pending: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    fulfilled: "bg-success-100 text-success-800",
    cancelled: "bg-neutral-100 text-neutral-800",
    in_transit: "bg-primary-100 text-primary-800",
    delivered: "bg-success-100 text-success-800",
    citizen: "bg-blue-100 text-blue-800",
    operator: "bg-orange-100 text-orange-800",
    admin: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {label}
    </span>
  );
};

/**
 * StatusBadge - Smart badge that determines variant from status
 */
export const StatusBadge = ({ status }) => {
  const statusVariants = {
    PENDING: "pending",
    APPROVED: "approved",
    FULFILLED: "fulfilled",
    CANCELLED: "cancelled",
    IN_TRANSIT: "in_transit",
    DELIVERED: "delivered",
  };

  const statusLabels = {
    PENDING: "Pending",
    APPROVED: "Approved",
    FULFILLED: "Fulfilled",
    CANCELLED: "Cancelled",
    IN_TRANSIT: "In Transit",
    DELIVERED: "Delivered",
  };

  return (
    <Badge
      variant={statusVariants[status] || "neutral"}
      label={statusLabels[status] || status}
    />
  );
};

/**
 * PriorityBadge - Smart badge for priority levels
 */
export const PriorityBadge = ({ priority }) => {
  const priorityVariants = {
    EMERGENCY: "emergency",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
  };

  const priorityLabels = {
    EMERGENCY: "Emergency",
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
  };

  return (
    <Badge
      variant={priorityVariants[priority] || "neutral"}
      label={priorityLabels[priority] || priority}
    />
  );
};

/**
 * RoleBadge - Smart badge for user roles
 */
export const RoleBadge = ({ role }) => {
  const roleVariants = {
    CITIZEN: "citizen",
    OPERATOR: "operator",
    ADMIN: "admin",
  };

  const roleLabels = {
    CITIZEN: "Citizen",
    OPERATOR: "Operator",
    ADMIN: "Administrator",
  };

  return (
    <Badge
      variant={roleVariants[role] || "neutral"}
      label={roleLabels[role] || role}
    />
  );
};

export default Badge;
