# Smart City Complaint Management System - Implementation Guide

## System Status ✅

Your project is now a **Smart City Complaint Management System**. All backend, database, and frontend components have been updated to match your requirements.

---

## System Overview

### Three Main Actors

#### 1️⃣ **CITIZEN** (Problem Reporter)

- **Can Do:**
  - Register / Login
  - Create complaints with: Category, Description, Location, Optional Image
  - View their complaint list with status tracking
  - Track complaint status: PENDING → ASSIGNED → IN_PROGRESS → RESOLVED
- **Cannot Do:**
  - Assign operators
  - Change complaint status
  - Edit other citizens' complaints

#### 2️⃣ **ADMIN** (System Manager)

- **Can Do:**
  - View ALL complaints in the system
  - See complaints by status and category
  - Assign operators to pending complaints
  - View analytics: total, resolved %, pending %
- **Cannot Do:**
  - Actually solve problems (that's the operator's job)
  - **Admin manages the flow only**

#### 3️⃣ **OPERATOR** (Field Worker)

- **Can Do:**
  - See ONLY complaints assigned to them
  - Start complaint resolution
  - Add remarks
  - Mark complaint as RESOLVED
- **Cannot Do:**
  - See all complaints
  - Manage users
  - Assign others
  - Create new complaints

---

## Complaint Categories

The system now supports these complaint types:

- 🛣️ **ROAD** - Road issues, potholes, damaged surfaces
- 🗑️ **GARBAGE** - Waste, garbage collection issues
- 💧 **WATER** - Water supply, leakage, quality issues
- 💡 **LIGHT** - Street lights, lighting problems
- ❓ **OTHER** - Custom/miscellaneous issues

---

## Complaint Status Flow

```
PENDING → ASSIGNED → IN_PROGRESS → RESOLVED
```

1. **PENDING**: Citizen creates complaint, waiting for admin assignment
2. **ASSIGNED**: Admin assigns to operator, operator hasn't started yet
3. **IN_PROGRESS**: Operator starts working on the complaint
4. **RESOLVED**: Operator completes and adds remarks

---

## Database Changes

### Request Model Updates

The `Request` model now uses:

| Field                | Type | Purpose                                  |
| -------------------- | ---- | ---------------------------------------- |
| `complaint_category` | ENUM | ROAD, GARBAGE, WATER, LIGHT, OTHER       |
| `assigned_to`        | UUID | FK to assigned operator (User.id)        |
| `status`             | ENUM | PENDING, ASSIGNED, IN_PROGRESS, RESOLVED |
| `requested_at`       | DATE | When complaint was created               |
| `assigned_at`        | DATE | When operator was assigned               |
| `started_at`         | DATE | When operator started work               |
| `resolved_at`        | DATE | When operator marked resolved            |
| `operator_remark`    | TEXT | Operator's resolution notes              |
| `image`              | TEXT | Optional image URL/base64                |

**Removed Fields:**

- `resource_category` ❌
- `provider_service_id` ❌
- `quantity_requested/fulfilled` ❌
- `priority` ❌
- `target_completion_date` ❌

---

## API Endpoints

### Citizen Endpoints

```
POST   /api/requests
       Create a new complaint
       Body: {
         complaint_category, description, latitude, longitude,
         image (optional)
       }

GET    /api/requests/me
       Get my complaints

GET    /api/requests/:requestId
       Get specific complaint details
```

### Admin Endpoints

```
GET    /api/requests/admin/all
       Get all complaints (with filtering)
       Query: ?status=PENDING&category=ROAD&limit=50&offset=0

GET    /api/requests/admin/pending
       Get pending (unassigned) complaints

POST   /api/requests/:requestId/assign
       Assign complaint to operator
       Body: { operator_id }
```

### Operator Endpoints

```
GET    /api/requests/operator/assigned
       Get my assigned complaints

POST   /api/requests/:requestId/start
       Start working on complaint

POST   /api/requests/:requestId/resolve
       Mark complaint as resolved
       Body: { operator_remark }
```

---

## Frontend Updates

### Citizen Pages

- **CreateRequestPage**: Now collects complaint details (simple form)
- **MyRequestsPage**: Shows complaint tracker with status and operator info

### Admin Pages

- **DashboardPage**: Shows KPIs and pending complaints for assignment

### Operator Pages

- **DashboardPage**: Shows assigned complaints with action buttons

---

## UI Components Updated

All complaint displays now show:

- Category label
- Status badge (color-coded)
- Description
- Dates (reported, assigned, resolved)
- Assigned operator name (when applicable)
- Resolution remarks (when resolved)

---

## Environment & Setup

To test the system locally:

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Start database (ensure running)
docker-compose up

# Start backend
cd server && npm run dev

# Start frontend
cd client && npm run dev
```

---

## Test Scenarios

### Scenario 1: Create & Track Complaint

1. Login as **CITIZEN**
2. Create complaint: Category=ROAD, Description="Pothole on Main St"
3. See it in "My Complaints" with status=PENDING

### Scenario 2: Admin Assigns

1. Login as **ADMIN**
2. See pending complaint in dashboard
3. Click "Assign" → select operator
4. Status changes to ASSIGNED

### Scenario 3: Operator Resolves

1. Login as **OPERATOR**
2. See assigned complaint in dashboard
3. Click "Start Work" → status=IN_PROGRESS
4. Click "Resolve" → add remarks → status=RESOLVED

### Scenario 4: Citizen Tracks

1. Login as original CITIZEN
2. See complaint now shows: Assigned to [Operator Name]
3. When resolved: shows operator's remarks

---

## What Changed Summary

### Backend (server/src/)

- ✅ **models/Request.js**: Updated schema for complaints
- ✅ **controllers/request.js**: Completely rewritten for complaint workflow
- ✅ **routes/requests.js**: New endpoints for assignment and resolution

### Frontend (client/src/)

- ✅ **pages/citizen/CreateRequestPage.jsx**: Simplified complaint form
- ✅ **pages/citizen/MyRequestsPage.jsx**: New status tracking UI
- ✅ **pages/admin/DashboardPage.jsx**: Complaint management view
- ✅ **pages/operator/DashboardPage.jsx**: Assignment resolution workflow

---

## Notes

1. **No Migration Script**: Since this is a schema refactor, existing resource request data won't automatically convert. Consider backing up and running fresh migrations.

2. **Image Handling**: The `image` field supports base64 encoding. Implement image upload in CreateRequestPage if needed.

3. **Real-time Updates**: Consider adding WebSocket support via Socket.io for live status updates.

4. **Next Features** (Optional):
   - Bulk complaint assignment
   - SLA tracking (target resolution time)
   - Photo comparison (before/after complaint resolution)
   - Rating system for resolved complaints
   - Notification system for status changes

---

## Support

All components are ready to use. Test each user role to ensure smooth workflow. If you encounter any issues with the API calls, ensure:

- Bearer token is passed in Authorization header
- Role-based middleware is working
- CORS is configured correctly

Good luck! 🚀
