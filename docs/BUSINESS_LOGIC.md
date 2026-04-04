# Smart City Complaint Management System

## Core Business Logic Documentation

---

## 1. System Overview

### Purpose

The current codebase is centered on a complaint-management workflow for a smart city.
Citizens report civic issues, admins monitor and assign them, and operators resolve them.
The project also includes supporting modules for provider services, operator area coverage,
resource allocation history, and audit logging.

### Main Roles

- `CITIZEN`: creates complaints and tracks their progress
- `ADMIN`: monitors complaints, assigns operators, manages areas and users
- `OPERATOR`: views assigned complaints, starts work, resolves issues, manages provider profile

### Main Complaint Lifecycle

```text
Citizen creates complaint
  -> status = PENDING
Admin assigns operator
  -> status = ASSIGNED
Operator starts work
  -> status = IN_PROGRESS
Operator resolves issue
  -> status = RESOLVED
```

### Key Entities

- `User`
- `Request` (complaint)
- `Location`
- `ContractorArea`
- `ActionLog`
- `AdminActivityLog`
- `Provider`
- `Service`
- `ProviderService`
- `Resource`
- `ResourceAllocation`

Resource and allocation models exist in the codebase, but the primary live user workflow is the
complaint flow above.

---

## 2. Complaint Workflow

### 2.1 Citizen Complaint Creation

Route:

```text
POST /api/requests
```

Citizen submits:

- `complaint_category`
- `description`
- `location` object with area/address/pincode/lat/lng
- optional `image`

System behavior:

1. validates required fields
2. resolves or stores complaint location data
3. creates a `Request`
4. stores it with `PENDING` status
5. sets `requested_at`
6. writes audit/timeline data when applicable

### 2.2 Admin Review and Assignment

Important admin routes:

```text
GET  /api/requests/admin/all
GET  /api/requests/admin/pending
POST /api/requests/:requestId/assign
GET  /api/requests/admin/analytics
GET  /api/requests/admin/operator-performance
GET  /api/requests/admin/overdue
GET  /api/requests/admin/locations
GET  /api/requests/admin/areas
POST /api/requests/admin/areas
```

Admin responsibilities:

- review complaint backlog
- filter complaints by category/status
- assign complaints to active operators
- manage area master data
- review operator workload and overdue complaints
- export complaint data

When a complaint is assigned:

- `assigned_to` is set to an operator user
- `assigned_at` is set
- `status` becomes `ASSIGNED`
- assignment metadata may be stored:
  - `assignment_strategy`
  - `assignment_score`
  - `assignment_reason`
  - `location_bucket`

### 2.3 Operator Resolution Workflow

Operator-facing routes:

```text
GET  /api/operator/complaints
POST /api/requests/:requestId/start
POST /api/requests/:requestId/resolve
GET  /api/requests/:requestId
GET  /api/requests/:requestId/timeline
```

Operator flow:

1. operator opens assigned complaints
2. operator starts work
3. complaint status changes to `IN_PROGRESS`
4. operator resolves complaint with remark
5. complaint status changes to `RESOLVED`
6. `resolved_at` is stored
7. `operator_remark` is stored

---

## 3. Business Rules

### 3.1 Request Status Rules

Defined in the `Request` model:

```text
PENDING -> ASSIGNED
ASSIGNED -> IN_PROGRESS
IN_PROGRESS -> RESOLVED
RESOLVED -> terminal
```

Invalid backward transitions are rejected by model logic.

### 3.2 Operator Assignment Rules

An operator must:

- have role `OPERATOR`
- be active
- not be suspended
- usually belong to the complaint area through `assignedAreas` / `ContractorAreas`

Supporting fields used by the dispatch logic:

- `User.max_active_complaints`
- `User.last_assigned_at`
- `User.assignedAreas`
- `Request.reassignment_cooldown_until`

### 3.3 SLA and Overdue Logic

The codebase includes SLA support through:

- `Request.slaBreached`
- `slaService`
- admin overdue analytics routes

Operational meaning:

- complaints unresolved for too long can be flagged
- overdue complaints are surfaced in the admin dashboard
- breach state is stored on the request record

### 3.4 Timeline / Audit Rules

The system tracks important actions in:

- `ActionLog`
- `AdminActivityLog`

Typical logged events:

- login/logout
- password change
- profile photo update
- operator creation
- user activation/suspension
- operator area updates
- complaint assignment/resolution related activities

---

## 4. Data Model Responsibilities

### `User`

Represents all platform users:

- `ADMIN`
- `OPERATOR`
- `CITIZEN`

Notable fields:

- identity: `name`, `email`, `password_hash`
- access: `role`, `status`, `is_active`
- dispatch support: `assignedAreas`, `max_active_complaints`, `last_assigned_at`
- auth support: `auth_provider`, `google_id`, password-reset fields

### `Request`

Represents a complaint.

Notable fields:

- ownership: `user_id`
- location: `location_id`, `location_data`
- issue: `complaint_category`, `description`, `image`
- assignment: `assigned_to`, `assignment_strategy`, `assignment_score`, `assignment_reason`
- workflow: `status`, `requested_at`, `assigned_at`, `started_at`, `resolved_at`
- outcomes: `operator_remark`, `slaBreached`

### `Location`

Represents city area master data.

Used for:

- complaint area dropdowns
- admin area management
- operator area coverage
- analytics by area

### `ContractorArea`

Maps operators to service areas.

Used for:

- prioritizing assignment
- area coverage control
- identifying primary area ownership

### Provider / Service Tables

These support operator business/service configuration:

- `Provider`
- `Service`
- `ProviderService`

This module lets operators maintain service offerings, while complaints remain the main
user-facing workflow.

### Resource / Allocation Tables

These still exist:

- `Resource`
- `ResourceAllocation`

They support inventory/allocation scenarios, but they are not the primary complaint flow
currently surfaced in the frontend.

---

## 5. API Responsibilities

### Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
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

### Complaints

```text
POST /api/requests
GET  /api/requests/me
GET  /api/requests/areas
GET  /api/requests/:requestId
GET  /api/requests/:requestId/timeline
GET  /api/requests/admin/all
GET  /api/requests/admin/pending
GET  /api/requests/admin/stats/time
GET  /api/requests/admin/operator-performance
GET  /api/requests/admin/analytics
GET  /api/requests/admin/overdue
GET  /api/requests/admin/export
GET  /api/requests/admin/locations
GET  /api/requests/admin/areas
GET  /api/requests/admin/workload/contractors
GET  /api/requests/admin/queue/unassigned
POST /api/requests/admin/areas
POST /api/requests/:requestId/assign
POST /api/requests/:requestId/start
POST /api/requests/:requestId/resolve
PATCH /api/requests/:requestId/status
```

### Operator Dashboard

```text
GET /api/operator/complaints
```

### Providers

```text
GET  /api/providers/services
GET  /api/providers/catalog
POST /api/providers/me
GET  /api/providers/me
PUT  /api/providers/me
POST /api/providers/me/services
```

### Resource Allocation

```text
POST   /api/allocations/manual
POST   /api/allocations/auto/:requestId
GET    /api/allocations/suggest/:requestId
GET    /api/allocations/list
GET    /api/allocations/:allocationId
PUT    /api/allocations/:allocationId/in-transit
PUT    /api/allocations/:allocationId/delivered
DELETE /api/allocations/:allocationId
```

---

## 6. Security and Access Control

### Authentication

- access tokens are JWTs
- refresh tokens are JWTs
- access token expiry is 15 minutes
- refresh token expiry is 7 days

### Authorization

- citizens can create and view their own complaints
- operators can access operator workflows
- admins can access admin analytics, user management, and assignment actions

### Rate Limiting

Auth routes use an in-memory limiter keyed by IP + email.

### Password Handling

- passwords are hashed using bcrypt
- strong password rules are enforced
- reset-token hashes are stored instead of raw reset tokens

---

## 7. Performance Considerations

- `Request` has indexes for user, location, assignment, status, SLA, and time filtering
- `Resource` and `ResourceAllocation` also include query-supporting indexes
- admin dashboards rely on filtered aggregation routes rather than loading all data into the UI
- location and operator-assignment data are normalized to support reporting

---

## 8. Testing Scenarios

### Core Complaint Tests

1. citizen creates valid complaint
2. citizen cannot create complaint with missing required fields
3. admin can view pending complaints
4. admin can assign valid operator
5. operator can start only assigned complaint
6. operator can resolve only in-progress complaint
7. invalid status transitions are rejected
8. citizen can view own complaints and details

### Auth Tests

1. registration blocks duplicate email
2. login rejects invalid password
3. suspended users cannot log in
4. refresh token returns new access token
5. reset password rejects expired token

### Admin / Area Tests

1. admin can create operator
2. admin can update operator areas
3. area mappings sync to `ContractorAreas`
4. overdue and analytics endpoints return valid summaries

---

## 9. Summary

The current implementation is best described as a smart-city complaint management platform with:

- role-based complaint workflows
- operator assignment and area coverage
- admin analytics and audit trails
- optional provider/resource support modules

The complaint lifecycle is the primary business process, and the documentation should treat
resource allocation as a supporting capability rather than the main product workflow.
