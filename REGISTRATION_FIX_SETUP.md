# Registration Fix & System Setup Guide

## Problem

Your registration endpoint was failing because:

1. ❌ JWT secrets were missing from `.env` file
2. ❌ Operator assignment association was missing from database models

## Solutions Applied

### 1. ✅ Updated `.env` File

Added missing JWT secrets to `/server/.env`:

```
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this-in-production-12345678
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-87654321
```

### 2. ✅ Fixed Database Model Associations

Added missing operator assignment associations in `/server/src/models/index.js`:

```javascript
// Operator assignment
Request.belongsTo(User, {
  foreignKey: "assigned_to",
  as: "assignedOperator",
});
User.hasMany(Request, {
  foreignKey: "assigned_to",
  as: "assignedComplaints",
});
```

## Pre-Registration Checklist

Before testing registration, ensure:

### Step 1: Verify PostgreSQL is Running

```powershell
# Windows - Check if PostgreSQL service is running
Get-Service -Name postgresql-x64-* | Select Status

# Or manually start it from Services app
```

### Step 2: Create Database

```sql
-- Connect to PostgreSQL as admin
-- Then create the database:
CREATE DATABASE smart_city;
```

### Step 3: Install Dependencies

```powershell
# Navigate to server folder
cd server

# Install npm packages
npm install

# Verify key packages are installed:
npm list bcryptjs
npm list jsonwebtoken
npm list sequelize
```

### Step 4: Start the Server

```powershell
# From /server directory
npm start
# Or for development with auto-reload:
npm run dev
```

Watch for success message:

```
PostgreSQL connected successfully
Database models synced successfully
Server running on port 5000
```

### Step 5: Test Registration

```powershell
# Using curl (Windows PowerShell)
$body = @{
    name = "John Citizen"
    email = "john@example.com"
    password = "Test@123"
    passwordConfirm = "Test@123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Step 6: Expected Success Response

```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "userId": "uuid-here",
    "name": "John Citizen",
    "email": "john@example.com",
    "role": "CITIZEN",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

## Application Flow After Registration

### For Citizens:

1. Register account (role: CITIZEN)
2. Navigate to Create Request page
3. Create complaint with:
   - Category: ROAD, GARBAGE, WATER, LIGHT, or OTHER
   - Description of the issue
   - Location (lat/lon)
   - Optional image
4. View all complaints in "My Requests"
5. Track status: PENDING → ASSIGNED → IN_PROGRESS → RESOLVED

### For Admins:

1. Register account (must manually set role to ADMIN in database)
2. View all complaints in Admin Dashboard
3. Assign pending complaints to operators
4. View analytics and trends

### For Operators:

1. Register account (must manually set role to OPERATOR in database)
2. See assigned complaints in dashboard
3. Start resolving complaint (status: IN_PROGRESS)
4. Add remarks and mark as resolved
5. See statistics of resolved complaints

## Manual Role Assignment

After registration, if you need to change a user's role:

```sql
-- Connect to smart_city database
UPDATE "Users"
SET role = 'ADMIN'
WHERE email = 'admin@example.com';

UPDATE "Users"
SET role = 'OPERATOR'
WHERE email = 'operator@example.com';
```

## Environment Variables Reference

| Variable             | Purpose                     | Default               |
| -------------------- | --------------------------- | --------------------- |
| `PORT`               | Server port                 | 5000                  |
| `DB_HOST`            | PostgreSQL host             | 127.0.0.1             |
| `DB_PORT`            | PostgreSQL port             | 5432                  |
| `DB_NAME`            | Database name               | smart_city            |
| `DB_USER`            | PostgreSQL user             | postgres              |
| `DB_PASSWORD`        | PostgreSQL password         | city123               |
| `JWT_ACCESS_SECRET`  | Token signing key (access)  | MUST SET              |
| `JWT_REFRESH_SECRET` | Token signing key (refresh) | MUST SET              |
| `CLIENT_URL`         | Frontend URL for CORS       | http://localhost:5173 |
| `NODE_ENV`           | Environment                 | development           |

## Troubleshooting

### Error: "Registration failed"

→ Check if PostgreSQL is running: `Get-Service -Name postgresql-x64-*`

### Error: "Password must be at least 8 characters..."

→ Password requirements:

- Minimum 8 characters
- At least 1 UPPERCASE letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&\*()\_+\-=\[\]{};':"\\|,.<>\/?")

Example valid password: `Test@12345`

### Error: "Email already registered"

→ Use a different email address or check if user exists in database

### Error: "Email already registered" (but first registration)

→ Delete the user from the database:

```sql
DELETE FROM "Users" WHERE email = 'test@example.com';
```

### Database connection fails

→ Verify connection string in `.env`:

```
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=smart_city
DB_USER=postgres
DB_PASSWORD=city123
```

## Frontend Setup

In `/client` folder:

```powershell
npm install
npm run dev
```

Access at: http://localhost:5173

## Next Steps

1. ✅ Start backend server (`npm start` in /server)
2. ✅ Test registration with valid password
3. ✅ Start frontend (`npm run dev` in /client)
4. ✅ Create test complaint as citizen
5. ✅ Assign to operator as admin
6. ✅ Resolve complaint as operator
7. ✅ Verify end-to-end workflow
