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
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
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
   * Check if pincode is valid (India 6-digit format)
   */
  isValidPincode: (pincode) => {
    return /^\d{6}$/.test(String(pincode || "").trim());
  },

  /**
   * Check if pincode is valid for Pune district
   * Accepts common Pune city/rural ranges starting with 411 or 412
   */
  isValidPuneDistrictPincode: (pincode) => {
    const value = String(pincode || "").trim();
    return /^(411|412)\d{3}$/.test(value);
  },

  /**
   * Check if pincode exists in the approved Pune pincode list
   * sourced from client/public/pune-pincodes_compress.pdf
   */
  isValidSupportedPunePincode: (pincode) => {
    const value = String(pincode || "").trim();
    const supportedPincodes = new Set([
      "411001", "411002", "411003", "411004", "411005", "411006",
      "411007", "411008", "411009", "411011", "411012", "411013",
      "411014", "411015", "411016", "411017", "411018", "411019",
      "411020", "411021", "411022", "411023", "411024", "411025",
      "411026", "411027", "411028", "411030", "411031", "411032",
      "411033", "411034", "411035", "411036", "411037", "411038",
      "411039", "411040", "411041", "411042", "411043", "411044",
      "411045", "411046", "411047", "411048", "411051", "411052",
      "411057", "411058", "411060", "411061", "411062", "412101",
    ]);
    return supportedPincodes.has(value);
  },

  /**
   * Check if string is not empty
   */
  isNotEmpty: (value) => {
    return value && value.trim().length > 0;
  },
};

export default validators;
