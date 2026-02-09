/**
 * Validators Utility
 * Common validation functions for form inputs
 */

export const validators = {
  /**
   * Validate email format
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   * Password should be at least 8 characters, contain uppercase, lowercase, number, and special char
   */
  isValidPassword: (password) => {
    if (password.length < 8) return false;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password,
    );
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  },

  /**
   * Validate password strength (simple)
   * Minimum 8 characters, at least one uppercase and one lowercase
   */
  isValidPasswordSimple: (password) => {
    return (
      password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password)
    );
  },

  /**
   * Check if name is valid (at least 2 characters)
   */
  isValidName: (name) => {
    return name && name.trim().length >= 2;
  },

  /**
   * Check if quantity is valid (positive number)
   */
  isValidQuantity: (quantity) => {
    const num = parseFloat(quantity);
    return !isNaN(num) && num > 0;
  },

  /**
   * Check if latitude is valid (-90 to 90)
   */
  isValidLatitude: (latitude) => {
    const num = parseFloat(latitude);
    return !isNaN(num) && num >= -90 && num <= 90;
  },

  /**
   * Check if longitude is valid (-180 to 180)
   */
  isValidLongitude: (longitude) => {
    const num = parseFloat(longitude);
    return !isNaN(num) && num >= -180 && num <= 180;
  },

  /**
   * Check if coordinates are valid
   */
  isValidCoordinates: (latitude, longitude) => {
    return (
      validators.isValidLatitude(latitude) &&
      validators.isValidLongitude(longitude)
    );
  },

  /**
   * Check if string is not empty
   */
  isNotEmpty: (value) => {
    return value && value.trim().length > 0;
  },
};

export default validators;
