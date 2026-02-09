/**
 * Authentication Routes
 * Endpoints for user registration, login, token refresh, and profile management
 */

const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth");
const authMiddleware = require("../middleware/auth");

/**
 * PUBLIC ROUTES (No authentication required)
 */

/**
 * POST /auth/register
 * Register a new user account
 * Rate limited to prevent abuse
 */
router.post(
  "/register",
  authMiddleware.authRateLimiter,
  authController.register,
);

/**
 * POST /auth/login
 * Authenticate user and receive tokens
 * Rate limited to prevent brute force
 */
router.post("/login", authMiddleware.authRateLimiter, authController.login);

/**
 * POST /auth/refresh
 * Request new access token using refresh token
 * Can be called without access token
 */
router.post(
  "/refresh",
  authMiddleware.authenticateRefreshToken,
  authController.refreshToken,
);

/**
 * PROTECTED ROUTES (Authentication required)
 */

/**
 * POST /auth/logout
 * Logout user (invalidate session if needed)
 */
router.post("/logout", authMiddleware.authenticateToken, authController.logout);

/**
 * GET /auth/me
 * Get current authenticated user's profile
 */
router.get(
  "/me",
  authMiddleware.authenticateToken,
  authController.getCurrentUser,
);

/**
 * PUT /auth/change-password
 * Change password for authenticated user
 */
router.put(
  "/change-password",
  authMiddleware.authenticateToken,
  authController.changePassword,
);

module.exports = router;
