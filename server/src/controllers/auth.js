/**
 * Authentication Controller
 * Handles user registration, login, token refresh, and logout
 */

const authUtils = require("../utils/auth");
const db = require("../models");

/**
 * CONTROLLER 1: User Registration
 * Creates new user account with hashed password
 * Returns access and refresh tokens on success
 */
const register = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;

    // ========== INPUT VALIDATION ==========
    if (!name || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        error: "All fields (name, email, password) are required.",
        code: "MISSING_FIELDS",
      });
    }

    // Validate email format
    if (!authUtils.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format.",
        code: "INVALID_EMAIL",
      });
    }

    // Check password confirmation
    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        error: "Passwords do not match.",
        code: "PASSWORD_MISMATCH",
      });
    }

    // Validate password strength
    if (!authUtils.isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        error:
          "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
        code: "WEAK_PASSWORD",
      });
    }

    // ========== CHECK EXISTING USER ==========
    const existingUser = await db.User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Email already registered.",
        code: "EMAIL_EXISTS",
      });
    }

    // ========== HASH PASSWORD ==========
    const passwordHash = await authUtils.hashPassword(password);

    // ========== CREATE USER ==========
    // By default, new users are citizens
    const newUser = await db.User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: "CITIZEN", // Default role
      is_active: true,
    });

    // ========== GENERATE TOKENS ==========
    const { accessToken, refreshToken } = authUtils.createTokens(
      newUser.id,
      newUser.role,
    );

    // ========== RESPONSE ==========
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      error: "Registration failed. Please try again.",
      code: "REGISTRATION_ERROR",
    });
  }
};

/**
 * CONTROLLER 2: User Login
 * Authenticates user and returns JWT tokens
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ========== INPUT VALIDATION ==========
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
        code: "MISSING_CREDENTIALS",
      });
    }

    // ========== FIND USER ==========
    const user = await db.User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
        code: "INVALID_CREDENTIALS",
      });
    }

    // ========== CHECK IF USER IS ACTIVE ==========
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: "Account is disabled. Contact administrator.",
        code: "ACCOUNT_DISABLED",
      });
    }

    // ========== VERIFY PASSWORD ==========
    const isPasswordValid = await authUtils.verifyPassword(
      password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
        code: "INVALID_CREDENTIALS",
      });
    }

    // ========== GENERATE TOKENS ==========
    const { accessToken, refreshToken } = authUtils.createTokens(
      user.id,
      user.role,
    );

    // ========== LOG LOGIN (Optional: for security auditing) ==========
    await db.ActionLog.create({
      user_id: user.id,
      action_type: "LOGIN",
      description: `User ${user.email} logged in`,
      status: "SUCCESS",
    });

    // ========== RESPONSE ==========
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      error: "Login failed. Please try again.",
      code: "LOGIN_ERROR",
    });
  }
};

/**
 * CONTROLLER 3: Refresh Access Token
 * Uses refresh token to get new access token
 * Called when access token expires
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required.",
        code: "MISSING_REFRESH_TOKEN",
      });
    }

    // Verify refresh token (middleware handles this, but double-check)
    const decoded = authUtils.verifyRefreshToken(token);

    if (!decoded) {
      return res.status(403).json({
        success: false,
        error: "Invalid or expired refresh token.",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    // ========== GET USER INFO ==========
    const user = await db.User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: "User not found or account disabled.",
        code: "USER_NOT_FOUND",
      });
    }

    // ========== GENERATE NEW ACCESS TOKEN ==========
    const { accessToken, refreshToken: newRefreshToken } =
      authUtils.createTokens(user.id, user.role);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return res.status(500).json({
      success: false,
      error: "Token refresh failed.",
      code: "REFRESH_ERROR",
    });
  }
};

/**
 * CONTROLLER 4: Logout
 * Invalidates user session (optional - depends on implementation)
 * For stateless JWT, client simply deletes tokens
 */
const logout = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated.",
        code: "NOT_AUTHENTICATED",
      });
    }

    // ========== LOG LOGOUT (Optional: for security auditing) ==========
    await db.ActionLog.create({
      user_id: userId,
      action_type: "LOGOUT",
      description: "User logged out",
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully. Please delete tokens from client.",
      code: "LOGOUT_SUCCESS",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      error: "Logout failed.",
      code: "LOGOUT_ERROR",
    });
  }
};

/**
 * CONTROLLER 5: Get Current User Profile
 * Returns authenticated user's information
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const user = await db.User.findByPk(userId, {
      attributes: ["id", "name", "email", "role", "is_active"],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
        code: "USER_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch user profile.",
      code: "PROFILE_ERROR",
    });
  }
};

/**
 * CONTROLLER 6: Change Password (Authenticated User)
 * Allows user to change their own password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // ========== INPUT VALIDATION ==========
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "All password fields are required.",
        code: "MISSING_FIELDS",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "New passwords do not match.",
        code: "PASSWORD_MISMATCH",
      });
    }

    if (!authUtils.isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error:
          "New password must be at least 8 characters with uppercase, lowercase, number, and special character.",
        code: "WEAK_PASSWORD",
      });
    }

    // ========== GET USER ==========
    const user = await db.User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
        code: "USER_NOT_FOUND",
      });
    }

    // ========== VERIFY CURRENT PASSWORD ==========
    const isPasswordValid = await authUtils.verifyPassword(
      currentPassword,
      user.password_hash,
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect.",
        code: "INVALID_PASSWORD",
      });
    }

    // ========== HASH AND UPDATE NEW PASSWORD ==========
    const newPasswordHash = await authUtils.hashPassword(newPassword);
    user.password_hash = newPasswordHash;
    await user.save();

    // ========== LOG PASSWORD CHANGE ==========
    await db.ActionLog.create({
      user_id: userId,
      action_type: "PASSWORD_CHANGE",
      description: "User changed password",
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      code: "PASSWORD_CHANGED",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      error: "Password change failed.",
      code: "PASSWORD_CHANGE_ERROR",
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  changePassword,
};
