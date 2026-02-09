/**
 * Error Utility
 * Common error messages and error handling
 */

export const errorMessages = {
  // Auth errors
  AUTH_INVALID_EMAIL: "Please enter a valid email address",
  AUTH_WEAK_PASSWORD:
    "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
  AUTH_WEAK_PASSWORD_SIMPLE:
    "Password must be at least 8 characters with uppercase and lowercase letters",
  AUTH_PASSWORD_MISMATCH: "Passwords do not match",
  AUTH_LOGIN_FAILED: "Invalid email or password",
  AUTH_REGISTER_FAILED: "Registration failed. Email may already be in use",
  AUTH_LOGOUT_FAILED: "Logout failed. Please try again",
  AUTH_SESSION_EXPIRED: "Your session has expired. Please log in again",
  AUTH_NOT_AUTHORIZED: "You are not authorized to perform this action",

  // Request errors
  REQUEST_CREATE_FAILED: "Failed to create request",
  REQUEST_NOT_FOUND: "Request not found",
  REQUEST_UPDATE_FAILED: "Failed to update request",
  REQUEST_CANCEL_FAILED: "Failed to cancel request",
  REQUEST_INVALID_QUANTITY: "Quantity must be a positive number",
  REQUEST_INVALID_PRIORITY: "Invalid priority level",
  REQUEST_INVALID_CATEGORY: "Invalid resource category",

  // Allocation errors
  ALLOCATION_FAILED: "Failed to allocate resource",
  ALLOCATION_NOT_FOUND: "Allocation not found",
  ALLOCATION_NO_RESOURCES: "No available resources for allocation",
  ALLOCATION_INSUFFICIENT_QUANTITY: "Insufficient quantity available",
  ALLOCATION_CANCEL_FAILED: "Failed to cancel allocation",
  ALLOCATION_STATUS_UPDATE_FAILED: "Failed to update allocation status",

  // Validation errors
  VALIDATION_REQUIRED_FIELD: "This field is required",
  VALIDATION_INVALID_INPUT: "Invalid input",
  VALIDATION_INVALID_COORDINATES:
    "Coordinates must be valid (latitude: -90 to 90, longitude: -180 to 180)",

  // Server errors
  SERVER_ERROR: "Server error. Please try again later",
  SERVER_NOT_FOUND: "Resource not found",
  SERVER_UNAUTHORIZED: "Unauthorized access",
  SERVER_FORBIDDEN: "Access denied",
  SERVER_BAD_REQUEST: "Invalid request",
  SERVER_CONFLICT: "Resource conflict",
  SERVER_RATE_LIMIT: "Too many requests. Please try again later",

  // Network errors
  NETWORK_ERROR: "Network error. Please check your connection",
  NETWORK_TIMEOUT: "Request timeout. Please try again",

  // Generic
  GENERIC_ERROR: "Something went wrong. Please try again",
  GENERIC_TRY_AGAIN: "Please try again",
};

/**
 * Get user-friendly error message from error object
 */
export const getErrorMessage = (error) => {
  if (!error) return errorMessages.GENERIC_ERROR;

  // If it's a string error
  if (typeof error === "string") return error;

  // If it's an axios error with response data
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // If it's an error with message property
  if (error.message) {
    // Check if it's a network error
    if (
      error.message === "Network Error" ||
      error.message.includes("network")
    ) {
      return errorMessages.NETWORK_ERROR;
    }
    // Check if it's a timeout
    if (error.code === "ECONNABORTED") {
      return errorMessages.NETWORK_TIMEOUT;
    }
    return error.message;
  }

  return errorMessages.GENERIC_ERROR;
};

/**
 * Handle API error and return appropriate message
 */
export const handleApiError = (error) => {
  const status = error.response?.status;
  const message = error.response?.data?.message;

  switch (status) {
    case 400:
      return message || errorMessages.SERVER_BAD_REQUEST;
    case 401:
      return message || errorMessages.AUTH_SESSION_EXPIRED;
    case 403:
      return message || errorMessages.AUTH_NOT_AUTHORIZED;
    case 404:
      return message || errorMessages.SERVER_NOT_FOUND;
    case 409:
      return message || errorMessages.SERVER_CONFLICT;
    case 429:
      return message || errorMessages.SERVER_RATE_LIMIT;
    case 500:
      return message || errorMessages.SERVER_ERROR;
    default:
      return message || errorMessages.GENERIC_ERROR;
  }
};

export const errors = {
  messages: errorMessages,
  getErrorMessage,
  handleApiError,
};

export default errors;
