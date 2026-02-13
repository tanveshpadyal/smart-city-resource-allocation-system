/**
 * Authentication & Authorization Middleware
 * Handles JWT verification and role-based access control
 */

const authUtils = require("../utils/auth");

/**
 * MIDDLEWARE 1: Verify JWT Token
 * Extracts and validates JWT from Authorization header
 * Attaches decoded user info to req.user
 */
const authenticateToken = (req, res, next) => {
  try {
    // Extract token from Authorization header (Bearer scheme)
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided.",
        code: "NO_TOKEN",
      });
    }

    // Verify token
    const decoded = authUtils.verifyAccessToken(token);

    if (!decoded) {
      return res.status(403).json({
        success: false,
        error: "Invalid or expired token.",
        code: "INVALID_TOKEN",
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication error",
      code: "AUTH_ERROR",
    });
  }
};

/**
 * MIDDLEWARE 2: Verify Refresh Token
 * Used for token refresh endpoint
 */
const authenticateRefreshToken = (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: "Refresh token required.",
        code: "NO_REFRESH_TOKEN",
      });
    }

    const decoded = authUtils.verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(403).json({
        success: false,
        error: "Invalid or expired refresh token.",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    console.error("Refresh token middleware error:", error);
    return res.status(500).json({
      success: false,
      error: "Token refresh error",
      code: "REFRESH_ERROR",
    });
  }
};

/**
 * MIDDLEWARE 3: Role-Based Authorization
 * Checks if user has required role(s)
 *
 * Example usage:
 * router.post('/admin/config', authorize(['ADMIN']), controller.updateConfig)
 * router.get('/resources', authorize(['ADMIN', 'OPERATOR']), controller.listResources)
 */
const authorize = (requiredRoles = []) => {
  return (req, res, next) => {
    try {
      // Must call authenticateToken first
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated.",
          code: "NOT_AUTHENTICATED",
        });
      }

      // Check if user role is in required roles
      if (requiredRoles.length > 0 && !requiredRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required role(s): ${requiredRoles.join(", ")}`,
          code: "INSUFFICIENT_ROLE",
          requiredRoles,
          userRole: req.user.role,
        });
      }

      next();
    } catch (error) {
      console.error("Authorization middleware error:", error);
      return res.status(500).json({
        success: false,
        error: "Authorization error",
        code: "AUTHZ_ERROR",
      });
    }
  };
};

/**
 * MIDDLEWARE 4: Admin-Only Protection
 * Shorthand for admin-only routes
 */
const requireAdmin = authorize(["ADMIN"]);

/**
 * MIDDLEWARE 5: Operator or Admin
 * Shorthand for operator/admin routes
 */
const requireOperator = authorize(["OPERATOR", "ADMIN"]);

/**
 * MIDDLEWARE 6: Rate limiting for auth endpoints
 * Prevents brute force attacks on login/register
 * Store attempt count in memory (or use Redis for production)
 */
const authRateLimiter = (() => {
  const attempts = new Map(); // { email: { count, resetTime } }
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  return (req, res, next) => {
    const email = req.body.email?.toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
        code: "MISSING_EMAIL",
      });
    }

    // Rate limit by both IP and email to reduce cross-user collisions.
    const key = `${req.ip}:${email}`;

    const now = Date.now();
    const userAttempts = attempts.get(key);

    // Reset if window has passed
    if (userAttempts && now > userAttempts.resetTime) {
      attempts.delete(key);
    }

    const current = attempts.get(key) || {
      count: 0,
      resetTime: now + WINDOW_MS,
    };

    if (current.count >= MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        error: `Too many login attempts. Try again after ${Math.ceil(
          (current.resetTime - now) / 1000 / 60,
        )} minutes.`,
        code: "RATE_LIMIT_EXCEEDED",
      });
    }

    // Count only failed auth attempts. Successful auth clears the counter.
    res.on("finish", () => {
      const latest = attempts.get(key) || { count: 0, resetTime: now + WINDOW_MS };

      if (res.statusCode >= 400) {
        latest.count += 1;
        // Keep a stable rolling window once tracking has started.
        if (!latest.resetTime || now > latest.resetTime) {
          latest.resetTime = now + WINDOW_MS;
        }
        attempts.set(key, latest);
      } else {
        attempts.delete(key);
      }
    });

    next();
  };
})();

/**
 * MIDDLEWARE 7: Optional Authentication
 * Allows request to proceed but attaches user info if token is valid
 * Useful for public endpoints that work better with auth but don't require it
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = authUtils.verifyAccessToken(token);
      if (decoded) {
        req.user = {
          userId: decoded.userId,
          role: decoded.role,
        };
      }
    }

    next();
  } catch (error) {
    // Silently fail - this is optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  authenticateRefreshToken,
  authorize,
  requireAdmin,
  requireOperator,
  authRateLimiter,
  optionalAuth,
};
