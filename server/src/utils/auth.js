/**
 * Authentication Utilities
 * Handles JWT token generation, verification, and password hashing
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ============================================
// JWT TOKEN MANAGEMENT
// ============================================

const getRequiredEnv = (key) => {
  const value = process.env[key];
  if (!value || !value.trim()) {
    throw new Error(`${key} is required and must be set`);
  }
  return value;
};

/**
 * Generate JWT tokens with proper expiry strategy
 * - Access Token: Short-lived (15 minutes) - used for API requests
 * - Refresh Token: Long-lived (7 days) - used to get new access tokens
 */
const createTokens = (userId, role) => {
  const accessSecret = getRequiredEnv("JWT_ACCESS_SECRET");
  const refreshSecret = getRequiredEnv("JWT_REFRESH_SECRET");

  const accessToken = jwt.sign(
    {
      userId,
      role,
      type: "access",
    },
    accessSecret,
    {
      expiresIn: "15m",
      issuer: "smart-city-api",
      audience: "smart-city-client",
    },
  );

  const refreshToken = jwt.sign(
    {
      userId,
      type: "refresh",
    },
    refreshSecret,
    {
      expiresIn: "7d",
      issuer: "smart-city-api",
    },
  );

  return { accessToken, refreshToken };
};

/**
 * Verify JWT access token
 * @returns Decoded token payload if valid, null if invalid
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, getRequiredEnv("JWT_ACCESS_SECRET"), {
      issuer: "smart-city-api",
      audience: "smart-city-client",
    });

    if (decoded.type !== "access") {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Token verification error:", error.message);
    return null;
  }
};

/**
 * Verify JWT refresh token
 * @returns Decoded token payload if valid, null if invalid
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, getRequiredEnv("JWT_REFRESH_SECRET"), {
      issuer: "smart-city-api",
    });

    if (decoded.type !== "refresh") {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("Refresh token verification error:", error.message);
    return null;
  }
};

/**
 * Decode token without verification (for debugging only)
 * NEVER use in production for authentication
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// ============================================
// PASSWORD HASHING & VERIFICATION
// ============================================

/**
 * Hash password using bcrypt
 * Salt rounds: 12 (balances security with performance)
 */
const hashPassword = async (plainPassword) => {
  try {
    const saltRounds = 12;
    const hash = await bcrypt.hash(plainPassword, saltRounds);
    return hash;
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * Verify password against stored hash
 * @returns true if password matches, false otherwise
 */
const verifyPassword = async (plainPassword, passwordHash) => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, passwordHash);
    return isMatch;
  } catch (error) {
    throw new Error(`Password verification failed: ${error.message}`);
  }
};

/**
 * Check if password meets security requirements
 */
const isStrongPassword = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);

  return (
    password.length >= minLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumbers &&
    hasSpecialChar
  );
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

module.exports = {
  createTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  hashPassword,
  verifyPassword,
  isStrongPassword,
  isValidEmail,
};
