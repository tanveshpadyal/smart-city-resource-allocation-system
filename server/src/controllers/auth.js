/**
 * Authentication Controller
 * Handles user registration, login, token refresh, and logout
 */

const authUtils = require("../utils/auth");
const db = require("../models");
const { sanitizeAreas } = require("../services/complaintAssignment");
const crypto = require("crypto");

const getGoogleClient = () => {
  try {
    // Lazy require so server can still run if dependency is not yet installed.
    const { OAuth2Client } = require("google-auth-library");
    return new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  } catch {
    return null;
  }
};

const sendResetEmail = async (email, resetUrl) => {
  try {
    const nodemailer = require("nodemailer");
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || "no-reply@smartcity.local";

    if (!host || !user || !pass) {
      console.warn("[forgot-password] SMTP not configured. Reset URL:", resetUrl);
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: "Reset your password",
      text: `Use this link to reset your password: ${resetUrl}`,
      html: `<p>Use this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  } catch (error) {
    console.warn("[forgot-password] Could not send email:", error.message);
    console.warn("[forgot-password] Reset URL:", resetUrl);
  }
};

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
      auth_provider: "local",
      status: "active",
      is_active: true,
      isActive: true,
      assignedAreas: [],
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
        profilePhoto: newUser.profile_photo || null,
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
    if (user.status === "suspended" || !user.is_active) {
      return res.status(403).json({
        success: false,
        error: "Account is suspended. Contact administrator.",
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
        profilePhoto: user.profile_photo || null,
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

    if (!user || user.status === "suspended" || !user.is_active) {
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
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "status",
        "is_active",
        "isActive",
        "assignedAreas",
        "profile_photo",
      ],
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

/**
 * CONTROLLER 7: List Active Operators (Admin)
 * Returns all active users with OPERATOR role
 */
const getActiveOperators = async (req, res) => {
  try {
    const operators = await db.User.findAll({
      where: {
        role: "OPERATOR",
        status: "active",
        is_active: true,
        isActive: true,
      },
      attributes: ["id", "name", "email", "assignedAreas", "isActive"],
      order: [["name", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: operators,
    });
  } catch (error) {
    console.error("Get active operators error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch operators.",
      code: "OPERATORS_FETCH_ERROR",
    });
  }
};

/**
 * CONTROLLER 8: List All Users (Admin)
 * Returns all users with role and active status
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "status",
        "is_active",
        "isActive",
        "assignedAreas",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch users.",
      code: "USERS_FETCH_ERROR",
    });
  }
};

/**
 * CONTROLLER 10: Create Operator (Admin)
 * Creates a new operator account
 */
const createOperator = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { name, email, password, passwordConfirm, assignedAreas = [] } =
      req.body;

    if (!name || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        error: "All fields (name, email, password) are required.",
        code: "MISSING_FIELDS",
      });
    }

    if (!authUtils.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format.",
        code: "INVALID_EMAIL",
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        error: "Passwords do not match.",
        code: "PASSWORD_MISMATCH",
      });
    }

    if (!authUtils.isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        error:
          "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
        code: "WEAK_PASSWORD",
      });
    }

    const existingUser = await db.User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Email already registered.",
        code: "EMAIL_EXISTS",
      });
    }

    const passwordHash = await authUtils.hashPassword(password);

    const newOperator = await db.User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: "OPERATOR",
      auth_provider: "local",
      status: "active",
      is_active: true,
      isActive: true,
      assignedAreas: sanitizeAreas(assignedAreas),
    });

    await db.AdminActivityLog.create({
      admin_id: adminId,
      action_type: "CREATE_OPERATOR",
      entity_type: "User",
      entity_id: newOperator.id,
      metadata: { email: newOperator.email },
    });

    return res.status(201).json({
      success: true,
      message: "Operator created successfully.",
      data: {
        id: newOperator.id,
        name: newOperator.name,
        email: newOperator.email,
        role: newOperator.role,
        assignedAreas: newOperator.assignedAreas,
        isActive: newOperator.isActive,
      },
    });
  } catch (error) {
    console.error("Create operator error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create operator.",
      code: "CREATE_OPERATOR_ERROR",
    });
  }
};

/**
 * CONTROLLER 9: Update User Status (Admin)
 * Sets status to active or suspended
 */
const updateUserStatus = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { userId } = req.params;
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be active or suspended.",
        code: "INVALID_STATUS",
      });
    }

    if (userId === adminId) {
      return res.status(400).json({
        success: false,
        error: "You cannot suspend your own account.",
        code: "SELF_SUSPEND",
      });
    }

    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
        code: "USER_NOT_FOUND",
      });
    }

    user.status = status;
    user.is_active = status === "active";
    user.isActive = status === "active";
    await user.save();

    await db.AdminActivityLog.create({
      admin_id: adminId,
      action_type: status === "active" ? "ACTIVATE" : "SUSPEND",
      entity_type: "User",
      entity_id: user.id,
      metadata: { status },
    });

    return res.status(200).json({
      success: true,
      message: `User status updated to ${status}.`,
      data: {
        id: user.id,
        status: user.status,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update user status.",
      code: "USER_STATUS_ERROR",
    });
  }
};

/**
 * CONTROLLER 11: Update Operator Assigned Areas (Admin)
 * Sets area coverage for an operator account
 */
const updateOperatorAreas = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { userId } = req.params;
    const { assignedAreas } = req.body;

    if (!Array.isArray(assignedAreas)) {
      return res.status(400).json({
        success: false,
        error: "assignedAreas must be an array of strings.",
        code: "INVALID_AREAS",
      });
    }

    const operator = await db.User.findByPk(userId);
    if (!operator) {
      return res.status(404).json({
        success: false,
        error: "Operator not found.",
        code: "USER_NOT_FOUND",
      });
    }

    if (operator.role !== "OPERATOR") {
      return res.status(400).json({
        success: false,
        error: "assignedAreas can only be updated for operators.",
        code: "INVALID_ROLE",
      });
    }

    const normalizedAreas = sanitizeAreas(assignedAreas);
    operator.assignedAreas = normalizedAreas;
    await operator.save();

    await db.AdminActivityLog.create({
      admin_id: adminId,
      action_type: "UPDATE_OPERATOR_AREAS",
      entity_type: "User",
      entity_id: operator.id,
      metadata: { assignedAreas: normalizedAreas },
    });

    return res.status(200).json({
      success: true,
      message: "Operator areas updated successfully.",
      data: {
        id: operator.id,
        assignedAreas: operator.assignedAreas,
      },
    });
  } catch (error) {
    console.error("Update operator areas error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update operator areas.",
      code: "UPDATE_OPERATOR_AREAS_ERROR",
    });
  }
};

/**
 * CONTROLLER 12: Update current user profile photo
 */
const updateProfilePhoto = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { profilePhoto } = req.body;

    if (profilePhoto !== null && profilePhoto !== undefined) {
      if (typeof profilePhoto !== "string") {
        return res.status(400).json({
          success: false,
          error: "profilePhoto must be a string, null, or omitted.",
          code: "INVALID_PROFILE_PHOTO",
        });
      }

      const trimmed = profilePhoto.trim();
      const isDataImage = trimmed.startsWith("data:image/");
      const isUrlImage = /^https?:\/\//i.test(trimmed);

      if (!isDataImage && !isUrlImage) {
        return res.status(400).json({
          success: false,
          error: "profilePhoto must be a valid image data URL or image URL.",
          code: "INVALID_PROFILE_PHOTO_FORMAT",
        });
      }

      if (trimmed.length > 5_000_000) {
        return res.status(400).json({
          success: false,
          error: "Profile photo is too large.",
          code: "PROFILE_PHOTO_TOO_LARGE",
        });
      }
    }

    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
        code: "USER_NOT_FOUND",
      });
    }

    user.profile_photo = profilePhoto ? profilePhoto.trim() : null;
    await user.save();

    try {
      await db.ActionLog.create({
        user_id: user.id,
        action_type: "PROFILE_PHOTO_UPDATED",
        description: "User updated profile photo",
        status: "SUCCESS",
      });
    } catch (logError) {
      // Log failures should not block profile update.
      console.warn("Profile photo log skipped:", logError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      data: {
        id: user.id,
        profilePhoto: user.profile_photo,
      },
    });
  } catch (error) {
    console.error("Update profile photo error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update profile photo.",
      code: "PROFILE_PHOTO_UPDATE_ERROR",
    });
  }
};

/**
 * CONTROLLER 13: Google Sign-In
 */
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: "Missing Google idToken.",
        code: "MISSING_GOOGLE_TOKEN",
      });
    }

    const googleClient = getGoogleClient();
    if (!googleClient || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        error: "Google login is not configured.",
        code: "GOOGLE_CONFIG_MISSING",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const googleId = payload?.sub;
    const email = payload?.email?.toLowerCase();
    const name = payload?.name || "Google User";
    const profilePhoto = payload?.picture || null;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        error: "Invalid Google token payload.",
        code: "INVALID_GOOGLE_PAYLOAD",
      });
    }

    let user =
      (await db.User.findOne({ where: { google_id: googleId } })) ||
      (await db.User.findOne({ where: { email } }));

    if (!user) {
      user = await db.User.create({
        name: name.trim(),
        email,
        password_hash: await authUtils.hashPassword(
          crypto.randomBytes(16).toString("hex"),
        ),
        role: "CITIZEN",
        auth_provider: "google",
        google_id: googleId,
        profile_photo: profilePhoto,
        status: "active",
        is_active: true,
        isActive: true,
        assignedAreas: [],
      });
    } else {
      if (!user.google_id) user.google_id = googleId;
      user.auth_provider = "google";
      if (!user.profile_photo && profilePhoto) {
        user.profile_photo = profilePhoto;
      }
      await user.save();
    }

    if (user.status === "suspended" || !user.is_active) {
      return res.status(403).json({
        success: false,
        error: "Account is suspended. Contact administrator.",
        code: "ACCOUNT_DISABLED",
      });
    }

    const { accessToken, refreshToken } = authUtils.createTokens(
      user.id,
      user.role,
    );

    return res.status(200).json({
      success: true,
      message: "Google login successful.",
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profile_photo || null,
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({
      success: false,
      error: "Google login failed.",
      code: "GOOGLE_LOGIN_ERROR",
    });
  }
};

/**
 * CONTROLLER 14: Forgot password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !authUtils.isValidEmail(email)) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with that email, a reset link has been sent.",
      });
    }

    const user = await db.User.findOne({ where: { email: email.toLowerCase() } });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      user.reset_password_token_hash = tokenHash;
      user.reset_password_expires_at = expiresAt;
      await user.save();

      const clientBase = process.env.CLIENT_URL || "http://localhost:5173";
      const resetUrl = `${clientBase}/reset-password/${rawToken}`;
      await sendResetEmail(user.email, resetUrl);
    }

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process forgot password.",
      code: "FORGOT_PASSWORD_ERROR",
    });
  }
};

/**
 * CONTROLLER 15: Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "token, newPassword and confirmPassword are required.",
        code: "MISSING_FIELDS",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Passwords do not match.",
        code: "PASSWORD_MISMATCH",
      });
    }

    if (!authUtils.isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error:
          "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
        code: "WEAK_PASSWORD",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await db.User.findOne({
      where: {
        reset_password_token_hash: tokenHash,
      },
    });

    if (
      !user ||
      !user.reset_password_expires_at ||
      new Date(user.reset_password_expires_at).getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token.",
        code: "INVALID_RESET_TOKEN",
      });
    }

    user.password_hash = await authUtils.hashPassword(newPassword);
    user.auth_provider = user.auth_provider || "local";
    user.reset_password_token_hash = null;
    user.reset_password_expires_at = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to reset password.",
      code: "RESET_PASSWORD_ERROR",
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
  getActiveOperators,
  getAllUsers,
  updateUserStatus,
  createOperator,
  updateOperatorAreas,
  updateProfilePhoto,
  googleLogin,
  forgotPassword,
  resetPassword,
};
