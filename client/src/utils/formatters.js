/**
 * Formatters Utility
 * Common formatting functions for display
 */

export const formatters = {
  /**
   * Format date to readable string
   */
  formatDate: (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  /**
   * Format date and time to readable string
   */
  formatDateTime: (dateTime) => {
    if (!dateTime) return "-";
    const d = new Date(dateTime);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  /**
   * Format time to readable string (HH:mm)
   */
  formatTime: (time) => {
    if (!time) return "-";
    const d = new Date(time);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  /**
   * Format number with commas
   */
  formatNumber: (number) => {
    if (number === null || number === undefined) return "-";
    return number.toLocaleString("en-US");
  },

  /**
   * Format decimal to fixed places
   */
  formatDecimal: (number, places = 2) => {
    if (number === null || number === undefined) return "-";
    return parseFloat(number).toFixed(places);
  },

  /**
   * Format status to readable string
   */
  formatStatus: (status) => {
    const statusMap = {
      PENDING: "Pending",
      APPROVED: "Approved",
      FULFILLED: "Fulfilled",
      CANCELLED: "Cancelled",
      IN_TRANSIT: "In Transit",
      DELIVERED: "Delivered",
      FAILED: "Failed",
    };
    return statusMap[status] || status;
  },

  /**
   * Format priority to readable string with color
   */
  formatPriority: (priority) => {
    const priorityMap = {
      EMERGENCY: "Emergency",
      HIGH: "High",
      MEDIUM: "Medium",
      LOW: "Low",
    };
    return priorityMap[priority] || priority;
  },

  /**
   * Get color class for priority
   */
  getPriorityColor: (priority) => {
    const colorMap = {
      EMERGENCY: "bg-red-100 text-red-800",
      HIGH: "bg-orange-100 text-orange-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      LOW: "bg-green-100 text-green-800",
    };
    return colorMap[priority] || "bg-gray-100 text-gray-800";
  },

  /**
   * Format role to readable string
   */
  formatRole: (role) => {
    const roleMap = {
      CITIZEN: "Citizen",
      OPERATOR: "Operator",
      ADMIN: "Administrator",
    };
    return roleMap[role] || role;
  },

  /**
   * Format distance with unit
   */
  formatDistance: (distanceInKm) => {
    if (!distanceInKm) return "-";
    if (distanceInKm < 1) {
      return formatters.formatDecimal(distanceInKm * 1000, 0) + " m";
    }
    return formatters.formatDecimal(distanceInKm, 2) + " km";
  },

  /**
   * Format duration (minutes to readable format)
   */
  formatDuration: (minutes) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  },

  /**
   * Format coordinates
   */
  formatCoordinates: (latitude, longitude) => {
    if (!latitude || !longitude) return "-";
    return `${formatters.formatDecimal(latitude, 4)}, ${formatters.formatDecimal(longitude, 4)}`;
  },

  /**
   * Truncate text to max length
   */
  truncateText: (text, maxLength = 50) => {
    if (!text) return "-";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  },
};

export default formatters;
