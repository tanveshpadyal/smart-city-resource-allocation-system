# Authentication & Authorization Security Guide

> **Complete Backend Implementation for Smart City System**

---

## Table of Contents

1. [Auth Flow Design](#auth-flow-design)
2. [JWT Structure & Expiry](#jwt-structure--expiry)
3. [Middleware Architecture](#middleware-architecture)
4. [Secure Password Handling](#secure-password-handling)
5. [Route Protection Examples](#route-protection-examples)
6. [Security Mistakes to Avoid](#security-mistakes-to-avoid)
7. [Environment Configuration](#environment-configuration)
8. [Testing the Auth System](#testing-the-auth-system)

---

## Auth Flow Design

### 1. User Registration Flow

```
User Fills Registration Form
        ↓
[POST /api/auth/register]
        ↓
Validate Input (email format, password strength)
        ↓
Check Email Already Exists
        ↓
Hash Password (bcrypt, 12 rounds)
        ↓
Create User in Database
        ↓
Generate JWT Tokens (access + refresh)
        ↓
Return Tokens to Client
```

**Registration Endpoint:**

```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "passwordConfirm": "SecurePass123!"
}

Success Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CITIZEN",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}

Error Response (400/409):
{
  "success": false,
  "error": "Email already registered",
  "code": "EMAIL_EXISTS"
}
```

### 2. User Login Flow

```
User Submits Credentials
        ↓
[POST /api/auth/login]
        ↓
Check Rate Limiting (max 5 attempts per 15 min)
        ↓
Find User by Email
        ↓
Verify Password (bcrypt compare)
        ↓
Check Account is Active
        ↓
Generate JWT Tokens
        ↓
Log Login Action (audit trail)
        ↓
Return Tokens to Client
```

**Login Endpoint:**

```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Success Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "uuid-here",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CITIZEN",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}

Error Response (401):
{
  "success": false,
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS"
}
```

### 3. Token Refresh Flow

```
Access Token Expires
        ↓
Client Sends Refresh Token
        ↓
[POST /api/auth/refresh]
        ↓
Validate Refresh Token
        ↓
Verify User Still Exists & Active
        ↓
Generate New Access Token
        ↓
Generate New Refresh Token
        ↓
Return New Tokens
```

**Refresh Endpoint:**

```
POST /api/auth/refresh
Content-Type: application/json

Request Body:
{
  "refreshToken": "eyJhbGc..."
}

Success Response (200):
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

---

## JWT Structure & Expiry

### Access Token (Short-lived)

**Expiry:** 15 minutes

**Properties:**

```javascript
{
  // Header
  "alg": "HS256",
  "typ": "JWT"

  // Payload
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "CITIZEN",
  "type": "access",
  "iss": "smart-city-api",
  "aud": "smart-city-client",
  "iat": 1707500000,
  "exp": 1707500900

  // Signature
  "signature": "HMACSHA256(base64(header) + '.' + base64(payload), secret)"
}
```

**Why 15 minutes?**

- Balances security (frequent rotation) with UX (not too many refreshes)
- If token is compromised, damage is limited
- Prevents long-term token reuse

### Refresh Token (Long-lived)

**Expiry:** 7 days

**Properties:**

```javascript
{
  // Header
  "alg": "HS256",
  "typ": "JWT"

  // Payload
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "refresh",
  "iss": "smart-city-api",
  "iat": 1707500000,
  "exp": 1708105200  // 7 days later

  // Signature
  "signature": "HMACSHA256(...)"
}
```

**Why Separate Tokens?**

- **Access Token:** Short-lived, frequently validated, minimal claims
- **Refresh Token:** Long-lived, rarely used, only for token issuance
- If access token leaks: limited window for attack
- If refresh token leaks: longer risk period but needs separate endpoint

### Token Expiry Strategy

```
Day 0 (Login)
  ├─ Access Token issued: 15 min expiry
  └─ Refresh Token issued: 7 day expiry

Day 0 + 14:59 min
  ├─ Access Token expires ❌
  └─ Client calls /api/auth/refresh
      └─ New Access Token issued: 15 min expiry

Day 6:59
  ├─ Access Token expires
  └─ Client calls /api/auth/refresh
      └─ New Refresh Token issued: 7 day expiry
      └─ New Access Token issued: 15 min expiry

Day 7:00
  ├─ Both tokens expired ❌
  └─ User must login again
```

### Using Tokens in Requests

**Client must include in Authorization header:**

```
GET /api/auth/me
Authorization: Bearer eyJhbGc...access_token_here...
```

---

## Middleware Architecture

### 1. Token Authentication Middleware

**File:** `src/middleware/auth.js`

```javascript
// Used for all protected endpoints
router.get(
  "/api/auth/me",
  authenticateToken, // ← Middleware verifies JWT
  authController.getCurrentUser,
);
```

**Flow:**

1. Extract token from `Authorization: Bearer <token>` header
2. Verify token signature using secret
3. Check token hasn't expired
4. Verify token type is "access"
5. Attach user data to `req.user`
6. Pass to next middleware/controller

**Error Handling:**

- No token → 401 Unauthorized
- Invalid signature → 403 Forbidden
- Expired token → 403 Forbidden

### 2. Role-Based Authorization Middleware

**File:** `src/middleware/auth.js`

```javascript
// In routes/resourceAllocation.js
router.post(
  "/allocate",
  authenticateToken, // ← First: verify token
  authorize(["OPERATOR", "ADMIN"]), // ← Then: check role
  allocationController.allocateResource,
);
```

**Available Roles:**

- `ADMIN` - Full system access, user management
- `OPERATOR` - Resource allocation, monitoring
- `CITIZEN` - View requests, create requests

**How to Use:**

```javascript
// Single role
authorize(["ADMIN"]);

// Multiple roles (OR logic)
authorize(["OPERATOR", "ADMIN"]);

// Shorthand helpers
requireAdmin; // → authorize(['ADMIN'])
requireOperator; // → authorize(['OPERATOR', 'ADMIN'])
```

**Error Handling:**

- Insufficient role → 403 Forbidden

### 3. Refresh Token Middleware

**Used only for token refresh:**

```javascript
router.post(
  "/api/auth/refresh",
  authenticateRefreshToken, // ← Special middleware for refresh tokens
  authController.refreshToken,
);
```

### 4. Rate Limiting Middleware

**Prevents brute force attacks:**

```javascript
router.post(
  "/api/auth/login",
  authRateLimiter, // ← Max 5 attempts per 15 minutes
  authController.login,
);

router.post(
  "/api/auth/register",
  authRateLimiter, // ← Same protection
  authController.register,
);
```

**How it works:**

- Tracks login attempts per email address
- Blocks after 5 failed attempts
- Resets after 15 minutes

### 5. Optional Authentication Middleware

**For public endpoints that work better with auth:**

```javascript
// This endpoint works for both authenticated and unauthenticated users
router.get(
  "/resources",
  optionalAuth, // ← User info attached if valid token provided
  resourceController.listResources,
);

// In controller:
const resources = await Resource.findAll({
  where: req.user // ← Filter if authenticated, show all if not
    ? { user_id: req.user.userId }
    : {},
});
```

---

## Secure Password Handling

### Password Requirements

**Minimum strength:**

- At least 8 characters
- At least one UPPERCASE letter
- At least one lowercase letter
- At least one number (0-9)
- At least one special character (!@#$%^&\*)

**Examples:**

- ✅ `SecurePass123!` - Valid
- ✅ `MyP@ssw0rd` - Valid
- ❌ `password123` - Missing uppercase & special char
- ❌ `Pass!` - Too short
- ❌ `PASSWORD123!` - Missing lowercase
- ❌ `abcdefgh` - Missing number & special char

### Bcrypt Hashing

**Implementation:**

```javascript
// src/utils/auth.js
const bcrypt = require("bcryptjs");

// Hashing
const plainPassword = "SecurePass123!";
const saltRounds = 12; // Computational cost: ~250ms on modern hardware
const passwordHash = await bcrypt.hash(plainPassword, saltRounds);
// Result: $2b$12$R9h/cIPz0gi.URNNX3kh2OPST9mX...

// Verification
const isMatch = await bcrypt.compare(plainPassword, passwordHash);
// Returns: true
```

**Why 12 salt rounds?**

- 10 rounds: ~100ms (old standard, now too fast)
- 12 rounds: ~250ms (recommended, current standard)
- 14 rounds: ~1000ms (future-proof but may slow UX)

**Storage:**

```javascript
// Database stores ONLY the hash, never the plaintext
user.password_hash = await hashPassword(plainPassword);
```

### Password Validation Workflow

```
User Registration
      ↓
Receive plaintext password
      ↓
Validate strength (password regex check)
      ↓
Hash with bcrypt (12 rounds, ~250ms)
      ↓
Store hash in database
      ↓
Never store plaintext ❌

---

User Login
      ↓
Receive plaintext password
      ↓
Retrieve hash from database
      ↓
Compare password with bcrypt.compare()
      ↓
Returns boolean (true/false)
      ↓
Never encrypt/decrypt ❌
```

### Migration for Existing Users

**If adding auth to existing system:**

```javascript
// One-time migration script
const users = await User.findAll({ where: { password_hash: null } });

for (const user of users) {
  // Reset password (send email with temp password)
  const tempPassword = crypto.randomBytes(16).toString("hex");
  user.password_hash = await hashPassword(tempPassword);
  await user.save();

  // Email user with temp password
  await sendResetPasswordEmail(user.email, tempPassword);
}
```

---

## Route Protection Examples

### Example 1: Citizen Routes

```javascript
// routes/requests.js
const express = require("express");
const { authenticateToken, optionalAuth } = require("../middleware/auth");

// Public: List all resource requests (anyone can see)
router.get(
  "/public/requests",
  optionalAuth, // ← Optional: shows userName if authenticated
  requestController.listPublicRequests,
);

// Protected: Create new request (must be logged in)
router.post(
  "/requests",
  authenticateToken, // ← Must have valid access token
  requestController.createRequest,
);

// Protected: View own requests
router.get(
  "/requests/my",
  authenticateToken,
  requestController.getMyRequests, // ← Controller checks req.user.userId
);

// Protected: Update own request
router.put(
  "/requests/:id",
  authenticateToken,
  requestController.updateRequest, // ← Controller verifies ownership
);
```

### Example 2: Operator Routes

```javascript
// routes/resourceAllocation.js
const { authenticateToken, authorize } = require("../middleware/auth");

// Protected: Allocate resources (operators & admins only)
router.post(
  "/allocate",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]), // ← Role check
  allocationController.allocateResource,
);

// Protected: View allocation analytics
router.get(
  "/analytics",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  allocationController.getAnalytics,
);

// Protected: Update allocation
router.put(
  "/allocations/:id",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  allocationController.updateAllocation,
);
```

### Example 3: Admin Routes

```javascript
// routes/admin.js
const {
  authenticateToken,
  authorize,
  requireAdmin,
} = require("../middleware/auth");

// Protected: Admin-only user management
router.get(
  "/users",
  authenticateToken,
  requireAdmin, // ← Shorthand for authorize(['ADMIN'])
  adminController.listAllUsers,
);

router.post(
  "/users/:userId/promote",
  authenticateToken,
  requireAdmin,
  adminController.promoteToOperator,
);

router.delete(
  "/users/:userId",
  authenticateToken,
  requireAdmin,
  adminController.deactivateUser,
);

// Protected: Audit logs (admin only)
router.get(
  "/logs",
  authenticateToken,
  requireAdmin,
  adminController.getAuditLogs,
);
```

### Example 4: Mixed Access Levels

```javascript
// routes/resources.js

// Public: List available resources
router.get("/resources", resourceController.listResources);

// Public: Get resource details
router.get("/resources/:id", resourceController.getResource);

// Protected: Create new resource type (operators & admins)
router.post(
  "/resources",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  resourceController.createResource,
);

// Protected: Update resource (operators & admins)
router.put(
  "/resources/:id",
  authenticateToken,
  authorize(["OPERATOR", "ADMIN"]),
  resourceController.updateResource,
);

// Admin only: Delete resource
router.delete(
  "/resources/:id",
  authenticateToken,
  requireAdmin,
  resourceController.deleteResource,
);
```

### Example 5: Controller-Level Role Checking

```javascript
// controllers/userController.js

const updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { newRole } = req.body;

  // Middleware verified authentication and admin role
  // But add additional business logic checks:

  // Only admins can promote others
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      error: "Only admins can change user roles",
    });
  }

  // Can't promote to higher role than yourself
  const roleHierarchy = { CITIZEN: 1, OPERATOR: 2, ADMIN: 3 };
  if (roleHierarchy[newRole] > roleHierarchy[req.user.role]) {
    return res.status(403).json({
      error: "Cannot promote user to role higher than your own",
    });
  }

  // Proceed with update
  const user = await User.findByPk(userId);
  user.role = newRole;
  await user.save();

  res.json({ success: true, data: user });
};
```

---

## Security Mistakes to Avoid

### ❌ MISTAKE #1: Storing Plaintext Passwords

**WRONG:**

```javascript
user.password = plainPassword; // ❌ NEVER do this
await user.save();
```

**CORRECT:**

```javascript
user.password_hash = await hashPassword(plainPassword);
await user.save();
```

**Why:** If database is compromised, attackers get all passwords immediately.

---

### ❌ MISTAKE #2: Using Weak Hashing

**WRONG:**

```javascript
const crypto = require("crypto");
const hash = crypto.createHash("md5").update(password).digest("hex");
// ❌ MD5 is broken and fast to crack
```

**CORRECT:**

```javascript
const bcrypt = require("bcryptjs");
const hash = await bcrypt.hash(password, 12);
// ✅ Bcrypt is slow-by-design and modern
```

**Why:** MD5/SHA1 hash ~1 billion passwords/second. Bcrypt hashes 5 passwords/second (by design).

---

### ❌ MISTAKE #3: Sending Passwords in Response

**WRONG:**

```javascript
res.json({
  user: { id, email, password_hash }, // ❌ NEVER expose hash
  success: true,
});
```

**CORRECT:**

```javascript
res.json({
  user: { id, email, role }, // ✅ Only safe fields
  accessToken,
  refreshToken,
  success: true,
});
```

**Why:** Even the hash is sensitive. If attacker sees pattern, they can crack offline.

---

### ❌ MISTAKE #4: Storing Tokens in LocalStorage (Client-side)

**WRONG (Client):**

```javascript
// ❌ Vulnerable to XSS attacks
localStorage.setItem("accessToken", token);
```

**BETTER (Client):**

```javascript
// ✅ Store in memory + secure HttpOnly cookie
sessionStorage.setItem("accessToken", token);
// Even better: HttpOnly cookies (backend sets)
```

**Why:** XSS can read localStorage. HttpOnly cookies can't be accessed by JavaScript.

---

### ❌ MISTAKE #5: Long-Lived Access Tokens

**WRONG:**

```javascript
const accessToken = jwt.sign(data, secret, { expiresIn: "7d" });
// ❌ If compromised, attacker has 7 days
```

**CORRECT:**

```javascript
const accessToken = jwt.sign(data, secret, { expiresIn: "15m" });
// ✅ If compromised, attacker has only 15 minutes
```

**Why:** Limits damage window if token is leaked.

---

### ❌ MISTAKE #6: Not Validating Token Expiry

**WRONG:**

```javascript
const decoded = jwt.decode(token); // ❌ No verification
if (decoded.userId) allowAccess();
```

**CORRECT:**

```javascript
const decoded = jwt.verify(token, secret); // ✅ Verifies expiry + signature
if (decoded.userId && decoded.exp > Date.now() / 1000) allowAccess();
```

**Why:** `decode()` ignores expiry. `verify()` checks it.

---

### ❌ MISTAKE #7: Hardcoding Secrets

**WRONG:**

```javascript
const JWT_SECRET = "hardcoded-secret-abc123";
// ❌ Now visible in Git history forever
```

**CORRECT:**

```javascript
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;
// ✅ Loaded from .env, not in version control
```

**.env file:**

```
JWT_ACCESS_SECRET=super-long-random-string-min-32-chars-here
JWT_REFRESH_SECRET=another-super-long-random-string-here
```

**Generate strong secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: a3f9e8c2b1d7a4f6e9c2b5d8a1f4e7c0d3b6a9f2e5c8b1a4d7e0f3c6b9a2d5
```

---

### ❌ MISTAKE #8: Leaking User Information

**WRONG:**

```javascript
if (!user) {
  res.status(401).json({ error: "Email not registered" });
  // ❌ Attacker can enumerate valid emails
}
```

**CORRECT:**

```javascript
if (!user) {
  res.status(401).json({ error: "Invalid email or password" });
  // ✅ Same message for missing email or wrong password
}
```

**Why:** Attackers can build list of valid emails to target.

---

### ❌ MISTAKE #9: No Rate Limiting on Auth

**WRONG:**

```javascript
router.post("/login", authController.login);
// ❌ Attacker can try 1000s of passwords per second
```

**CORRECT:**

```javascript
router.post("/login", authRateLimiter, authController.login);
// ✅ Max 5 attempts per 15 minutes
```

**Why:** Prevents brute force attacks.

---

### ❌ MISTAKE #10: Trusting Client Data

**WRONG:**

```javascript
const updateUserRole = async (req, res) => {
  const userId = req.body.userId; // ❌ Trust the client?
  const newRole = req.body.newRole;

  // Update any user's role based on client request
  const user = await User.findByPk(userId);
  user.role = newRole;
  await user.save();
};
```

**CORRECT:**

```javascript
const updateOwnProfile = async (req, res) => {
  const userId = req.user.userId; // ✅ From verified JWT
  const { name } = req.body;

  // User can only update their own profile
  const user = await User.findByPk(userId);
  user.name = name;
  await user.save();
};

const promoteUserRole = async (req, res) => {
  // ✅ Only admin can do this (checked by middleware)
  const userId = req.params.userId; // From URL
  const newRole = req.body.newRole;

  // Admin explicitly promotes another user
  const user = await User.findByPk(userId);
  user.role = newRole;
  await user.save();
};
```

**Why:** Client can modify anything sent to server. Trust JWT identity, not client claims.

---

### ❌ MISTAKE #11: Insufficient CORS Configuration

**WRONG:**

```javascript
app.use(cors()); // ❌ Allows ALL origins
```

**CORRECT:**

```javascript
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
```

**Why:** Restricts requests to trusted domains only.

---

### ❌ MISTAKE #12: Sending Tokens in URL Query String

**WRONG:**

```javascript
// Client does this:
fetch("/api/resource?token=eyJhbGc...");
// ❌ Token exposed in browser history, logs, referrer header
```

**CORRECT:**

```javascript
// Client does this:
fetch("/api/resource", {
  headers: { Authorization: "Bearer eyJhbGc..." }, // ✅ Secret header
});
```

**Why:** Authorization header is not logged or exposed in referrer header.

---

### ❌ MISTAKE #13: Not Implementing Token Rotation

**WRONG:**

```javascript
// Single refresh token session
POST /login → Get token, valid for 30 days
// After 30 days, user must login again
```

**CORRECT:**

```javascript
// Refresh token rotates
POST /login → Get token pair
GET /refresh → New access + NEW refresh token
// New refresh token extends session by 7 more days
// Prevents old refresh tokens from being useful
```

**Why:** Limits exposure window even if old token is stolen.

---

### ❌ MISTAKE #14: No Logout Mechanism

**WRONG:**

```javascript
// Stateless JWT = no logout needed
// User's old token still works until expiry
// If token is stolen, attacker has access for 7 days
```

**CORRECT:**

```javascript
// Implement token blacklist in Redis:
POST /logout → Add refresh token to blacklist
GET /refresh → Check if token is blacklisted
// Token is now unusable even if not expired

// Or revoke user's all refresh tokens:
POST /logout → Generate new secret for user
// All old tokens become invalid immediately
```

**Why:** Immediate session termination when user logs out.

---

### ❌ MISTAKE #15: No Audit Logging

**WRONG:**

```javascript
// No record of who logged in, what they accessed
const login = async (req, res) => {
  // ... validate credentials ...
  res.json({ accessToken }); // ❌ No audit trail
};
```

**CORRECT:**

```javascript
const login = async (req, res) => {
  // ... validate credentials ...

  // ✅ Log every auth action
  await ActionLog.create({
    user_id: user.id,
    action_type: "LOGIN",
    ip_address: req.ip,
    user_agent: req.headers["user-agent"],
    timestamp: new Date(),
    status: "SUCCESS",
  });

  res.json({ accessToken });
};
```

**Why:** Detect suspicious activity, trace security incidents, compliance audit trail.

---

## Environment Configuration

### .env File (NEVER commit to Git)

```bash
# Server Config
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_city_db
DB_USER=postgres
DB_PASSWORD=your-secure-password

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_ACCESS_SECRET=a3f9e8c2b1d7a4f6e9c2b5d8a1f4e7c0d3b6a9f2e5c8b1a4d7e0f3c6b9a2d5
JWT_REFRESH_SECRET=e0f3c6b9a2d5a3f9e8c2b1d7a4f6e9c2b5d8a1f4e7c0d3b6a9f2e5c8b1a4d7

# Email (for password reset, optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-specific-password

# Redis (for rate limiting, token blacklist, optional)
REDIS_URL=redis://localhost:6379
```

### .gitignore

```
# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Build
dist/
build/
```

---

## Testing the Auth System

### Using Thunder Client or Postman

#### Test 1: Register New User

```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Alice Operator",
  "email": "alice@smartcity.com",
  "password": "SecurePass123!",
  "passwordConfirm": "SecurePass123!"
}

Expected: 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "uuid...",
    "name": "Alice Operator",
    "email": "alice@smartcity.com",
    "role": "CITIZEN",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

#### Test 2: Login User

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "alice@smartcity.com",
  "password": "SecurePass123!"
}

Expected: 200 OK
(Same response as register)
```

#### Test 3: Access Protected Route

```
GET http://localhost:5000/api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Expected: 200 OK
{
  "success": true,
  "data": {
    "id": "uuid...",
    "name": "Alice Operator",
    "email": "alice@smartcity.com",
    "role": "CITIZEN",
    "is_active": true
  }
}

If no token:
Expected: 401 Unauthorized

If expired token:
Expected: 403 Forbidden
```

#### Test 4: Refresh Access Token

```
POST http://localhost:5000/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Expected: 200 OK
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

#### Test 5: Change Password

```
PUT http://localhost:5000/api/auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecure456@",
  "confirmPassword": "NewSecure456@"
}

Expected: 200 OK
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Test 6: Rate Limiting

```
POST http://localhost:5000/api/auth/login (5x quickly)
Content-Type: application/json

{
  "email": "alice@smartcity.com",
  "password": "WrongPassword123!"
}

After 5 attempts:
Expected: 429 Too Many Requests
{
  "success": false,
  "error": "Too many login attempts. Try again after 15 minutes.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

---

## Next Steps

1. **Update .env** with JWT secrets (generate strong values)
2. **Configure CORS** with your client URL
3. **Set up database** with migrations if needed
4. **Test auth flow** using Postman
5. **Implement token blacklist** in Redis (production)
6. **Add email verification** for registration
7. **Add password reset** flow
8. **Set up HTTPS** in production (never HTTP)
9. **Enable audit logging** to ActionLog table
10. **Monitor failed login attempts** for suspicious activity
