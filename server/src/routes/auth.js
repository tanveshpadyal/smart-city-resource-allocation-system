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
router.post("/google", authController.googleLogin);

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

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

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
 * GET /auth/operators
 * Get active operators for admin assignment workflow
 */
router.get(
  "/operators",
  authMiddleware.authenticateToken,
  authMiddleware.authorize(["ADMIN"]),
  authController.getActiveOperators,
);

/**
 * POST /auth/operators
 * Create operator account (admin only)
 */
router.post(
  "/operators",
  authMiddleware.authenticateToken,
  authMiddleware.authorize(["ADMIN"]),
  authController.createOperator,
);

/**
 * GET /auth/users
 * Get all users for admin dashboard
 */
router.get(
  "/users",
  authMiddleware.authenticateToken,
  authMiddleware.authorize(["ADMIN"]),
  authController.getAllUsers,
);

/**
 * PUT /auth/users/:userId/status
 * Suspend or activate a user (admin only)
 */
router.put(
  "/users/:userId/status",
  authMiddleware.authenticateToken,
  authMiddleware.authorize(["ADMIN"]),
  authController.updateUserStatus,
);

/**
 * PUT /auth/users/:userId/areas
 * Update operator area assignments (admin only)
 */
router.put(
  "/users/:userId/areas",
  authMiddleware.authenticateToken,
  authMiddleware.authorize(["ADMIN"]),
  authController.updateOperatorAreas,
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

/**
 * PUT /auth/profile-photo
 * Update current authenticated user's profile photo
 */
router.put(
  "/profile-photo",
  authMiddleware.authenticateToken,
  authController.updateProfilePhoto,
);

module.exports = router;
