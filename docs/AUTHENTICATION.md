# Authentication & Authorization Guide

## 1. Overview

The project uses JWT-based authentication with role-based authorization.
Authentication is implemented in the backend with Express middleware and in the frontend with
Zustand-backed session persistence plus an Axios API client.

Supported auth capabilities:

- citizen registration
- login with email/password
- Google login
- access-token refresh
- logout
- forgot/reset password
- change password
- profile-photo update
- admin user/operator management routes

---

## 2. Auth Endpoints

### Public Routes

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Protected Routes

```text
POST /api/auth/logout
GET  /api/auth/me
GET  /api/auth/operators
POST /api/auth/operators
GET  /api/auth/users
PUT  /api/auth/users/:userId/status
PUT  /api/auth/users/:userId/areas
PUT  /api/auth/change-password
PUT  /api/auth/profile-photo
```

---

## 3. Token Strategy

### Access Token

- JWT
- expiry: `15 minutes`
- includes:
  - `userId`
  - `role`
  - `type = access`
  - `issuer = smart-city-api`
  - `audience = smart-city-client`

### Refresh Token

- JWT
- expiry: `7 days`
- includes:
  - `userId`
  - `type = refresh`
  - `issuer = smart-city-api`

### Required Environment Variables

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

These are required by `server/src/utils/auth.js`.

---

## 4. Registration Flow

Route:

```text
POST /api/auth/register
```

Request body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "passwordConfirm": "SecurePass123!"
}
```

Backend behavior:

1. validate required fields
2. validate email format
3. verify password confirmation
4. enforce strong-password rule
5. reject duplicate email
6. hash password with bcrypt
7. create user as `CITIZEN`
8. issue access + refresh tokens

Success response includes:

- `userId`
- `name`
- `email`
- `role`
- `profilePhoto`
- `accessToken`
- `refreshToken`
- `expiresIn`

---

## 5. Login Flow

Route:

```text
POST /api/auth/login
```

Behavior:

1. validate email/password presence
2. find user by email
3. block suspended or inactive users
4. verify password hash
5. generate access and refresh tokens
6. write login event to `ActionLog`

Rate limiting:

- in-memory limiter
- keyed by `IP + email`
- maximum `5` failed attempts per `15 minutes`

---

## 6. Google Login Flow

Route:

```text
POST /api/auth/google
```

Request body:

```json
{
  "idToken": "google-id-token"
}
```

Behavior:

1. verify Google token with `google-auth-library`
2. read Google payload
3. find existing user by `google_id` or email
4. create citizen account if not found
5. link `google_id` when applicable
6. reject suspended users
7. return standard access/refresh token payload

Required config:

- `GOOGLE_CLIENT_ID`

---

## 7. Refresh Token Flow

Route:

```text
POST /api/auth/refresh
```

Request body:

```json
{
  "refreshToken": "..."
}
```

Behavior:

1. middleware validates refresh token
2. controller verifies token again defensively
3. load user by `decoded.userId`
4. ensure user still exists and is active
5. issue new access and refresh tokens

---

## 8. Logout Flow

Route:

```text
POST /api/auth/logout
```

Behavior:

- requires access token
- logs logout event to `ActionLog`
- returns success response
- client is still responsible for deleting local tokens

This is effectively a stateless JWT logout design.

---

## 9. Forgot / Reset Password

### Forgot Password

Route:

```text
POST /api/auth/forgot-password
```

Behavior:

1. accept email
2. always return a generic success message
3. if account exists:
   - generate random raw token
   - store only SHA-256 hash in DB
   - set expiry for 30 minutes
   - build reset URL
   - try SMTP delivery
4. in non-production, if SMTP is unavailable, response may include a dev reset URL

SMTP-related environment variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

### Reset Password

Route:

```text
POST /api/auth/reset-password
```

Request body:

```json
{
  "token": "raw-reset-token",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

Behavior:

1. validate required fields
2. validate password confirmation
3. validate strong password
4. hash incoming reset token and compare with stored hash
5. reject expired token
6. update password hash
7. clear reset-token fields

---

## 10. Authenticated User Management

### Get Current User

```text
GET /api/auth/me
```

Returns:

- basic identity
- role
- status flags
- operator assignment metadata
- profile photo

### Change Password

```text
PUT /api/auth/change-password
```

Requires:

- `currentPassword`
- `newPassword`
- `confirmPassword`

### Update Profile Photo

```text
PUT /api/auth/profile-photo
```

Accepts:

- image data URL
- image URL
- `null` to remove photo

Validation:

- must be a string, null, or omitted
- only image data URLs or HTTP/HTTPS URLs are allowed
- oversized payloads are rejected

---

## 11. Admin Auth-Related Management

### List Active Operators

```text
GET /api/auth/operators
```

Admin only.

### Create Operator

```text
POST /api/auth/operators
```

Admin can create operator accounts with:

- name
- email
- password
- assigned areas
- max active complaints
- availability flag

The controller also syncs area coverage into `ContractorAreas`.

### List All Users

```text
GET /api/auth/users
```

Admin only.

### Update User Status

```text
PUT /api/auth/users/:userId/status
```

Allowed statuses:

- `active`
- `suspended`

Admin cannot suspend their own account.

### Update Operator Areas

```text
PUT /api/auth/users/:userId/areas
```

Admin only.

This updates:

- `User.assignedAreas`
- related `ContractorAreas` rows

---

## 12. Middleware Architecture

### `authenticateToken`

Responsibilities:

- read bearer token from `Authorization` header
- verify access token
- attach:
  - `req.user.userId`
  - `req.user.role`

### `authenticateRefreshToken`

Responsibilities:

- validate refresh token from request body
- attach `req.user.userId`

### `authorize(requiredRoles)`

Responsibilities:

- ensure request is authenticated
- ensure caller role is in allowed roles

### `authRateLimiter`

Responsibilities:

- protect auth endpoints from brute-force attempts
- track failed attempts in memory
- return `429` after threshold

### `optionalAuth`

Responsibilities:

- attach user info if token is valid
- never block request if token is absent/invalid

---

## 13. Password Security

Password rules enforced by backend:

- minimum 8 characters
- uppercase required
- lowercase required
- number required
- special character required

Hashing:

- library: `bcryptjs`
- rounds: `12`

Benefits:

- plaintext passwords are never stored
- password verification is resistant to direct hash comparison attacks

---

## 14. Frontend Auth Flow

Frontend files:

- `client/src/store/authStore.js`
- `client/src/services/authService.js`
- `client/src/services/apiClient.js`

Behavior:

1. user logs in / registers
2. backend returns tokens and profile payload
3. store persists:
   - user
   - accessToken
   - refreshToken
   - isAuthenticated
4. on app start, `initializeAuth()` rehydrates state
5. frontend fetches `/auth/me` to refresh profile data
6. if access token fails and refresh token exists, client attempts refresh
7. if refresh fails, client logs out

---

## 15. Security Notes

- JWT secrets must be strong and private
- production should use HTTPS
- refresh tokens should never be logged
- profile-photo and image payload size should be monitored
- in-memory rate limiting is fine for development but Redis-backed limiting is better for production
- dev reset URLs should never be exposed in production

---

## 16. Known Documentation Corrections

This updated document removes outdated or incorrect assumptions from the older auth doc:

- removed stray plaintext content
- aligned token secrets with actual env names
- documented Google login
- documented forgot/reset password
- documented operator/user admin routes
- documented actual bcrypt rounds
- aligned middleware behavior with real code
