# Complaint Management System - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React/Vite)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  CITIZEN              │      ADMIN              │    OPERATOR    │
│  ─────────────────    │  ──────────────────     │  ─────────────│
│  Create Complaint     │  Dashboard (KPIs)       │  My Assignments
│  View My Complaints   │  All Complaints         │  Pending Tasks
│  Track Status         │  Assign to Operator     │  Start Work
│  View Operator Notes  │  Analytics & Filters    │  Resolve Task
│                       │                         │  Add Remarks
│                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (HTTP/JWT)
┌─────────────────────────────────────────────────────────────────┐
│                 SERVER (Node.js/Express)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Authentication Middleware                                       │
│  ├─ Verify JWT Token                                           │
│  └─ Role-based Authorization                                    │
│                                                                   │
│  Routes Layer (/api/requests)                                    │
│  ├─ Citizen: POST /, GET /me, GET /:id                         │
│  ├─ Admin: GET /admin/all, GET /admin/pending, POST /:id/assign
│  └─ Operator: GET /operator/assigned, POST /:id/start, POST /:id/resolve
│                                                                   │
│  Controllers (request.js)                                        │
│  ├─ createRequest()                                             │
│  ├─ assignComplaint()                                           │
│  ├─ resolveComplaint()                                          │
│  └─ ... 8 other operations                                      │
│                                                                   │
│  Models (Request, Location, User, ActionLog)                    │
│  └─ Database Queries via Sequelize ORM                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (SQL)
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL/MySQL)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Requests (Complaints)                                           │
│  ├─ id, user_id, location_id, assigned_to                      │
│  ├─ complaint_category, description, image                      │
│  ├─ status, operator_remark                                     │
│  ├─ requested_at, assigned_at, started_at, resolved_at         │
│  └─ Indexes: user_id, status, location_id, assigned_to         │
│                                                                   │
│  Users (CITIZEN, ADMIN, OPERATOR roles)                         │
│  ├─ id, name, email, role, is_active                          │
│  └─ password_hash, last_login, created_at                      │
│                                                                   │
│  Locations (Zone/Area information)                              │
│  ├─ id, zone_name, latitude, longitude                         │
│  └─ created_at, updated_at                                     │
│                                                                   │
│  ActionLog (Audit Trail)                                        │
│  ├─ entity_type, entity_id, action, actor_id                  │
│  └─ metadata (JSON), created_at                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complaint Lifecycle

```
Step 1: CITIZEN Creates Complaint
├─ POST /api/requests
├─ Body: category, description, lat/lon, image
├─ Status: PENDING
└─ Saved to DB with requested_at timestamp

                    ↓

Step 2: ADMIN Views Pending
├─ GET /api/requests/admin/pending
├─ Sees list of unassigned complaints
└─ Selects operator to assign

                    ↓

Step 3: ADMIN Assigns to Operator
├─ POST /api/requests/{id}/assign
├─ Body: operator_id
├─ Status: ASSIGNED
├─ Saved: assigned_to, assigned_at
└─ Operator now sees in their list

                    ↓

Step 4: OPERATOR Starts Work
├─ POST /api/requests/{id}/start
├─ Status: IN_PROGRESS
├─ Saved: started_at
└─ Operator heading to location

                    ↓

Step 5: OPERATOR Resolves
├─ POST /api/requests/{id}/resolve
├─ Body: operator_remark
├─ Status: RESOLVED
├─ Saved: resolved_at, operator_remark
└─ Task complete!

                    ↓

Step 6: CITIZEN Views Resolution
├─ GET /api/requests/me
├─ Sees: Status=RESOLVED
├─ Sees: Operator name & remark
└─ Can leave feedback (future feature)
```

---

## Data Flow Diagram

```
CITIZEN
  │
  ├─ POST /requests ──────┐
  │                        │
  ├─ GET /requests/me ◄───┤
  │                        │
  └─ GET /requests/:id ◄──┤
                           │
                        BACKEND
                           │
                           ├─ Validate Input
                           ├─ Create/Update DB
                           ├─ Log Action
                           └─ Return Response
                           │
                        DATABASE
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    CREATE/INSERT    UPDATE STATUS      ActionLog
        Request        & Fields           INSERT
          │                 │                 │
          └─────────────────┴─────────────────┘

                    Response Flow
         Database → Backend → Client UI Update
```

---

## API Endpoint Tree

```
/api/requests
│
├─ POST / ................................ CITIZEN: Create complaint
│
├─ GET /me .............................. CITIZEN: My complaints
│
├─ GET /:requestId ...................... CITIZEN: View complaint
│
├─ GET /admin/all ....................... ADMIN: All complaints
│
├─ GET /admin/pending ................... ADMIN: Unassigned complaints
│
├─ POST /:requestId/assign .............. ADMIN: Assign to operator
│
├─ GET /operator/assigned ............... OPERATOR: My tasks
│
├─ POST /:requestId/start ............... OPERATOR: Start work
│
└─ POST /:requestId/resolve ............. OPERATOR: Mark resolved
```

---

## Database Schema

### Request Table

```sql
CREATE TABLE Requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES Users(id),
  location_id UUID NOT NULL REFERENCES Locations(id),
  assigned_to UUID REFERENCES Users(id),

  complaint_category ENUM('ROAD','GARBAGE','WATER','LIGHT','OTHER'),
  description TEXT,
  image LONGTEXT,
  operator_remark TEXT,

  status ENUM('PENDING','ASSIGNED','IN_PROGRESS','RESOLVED'),

  requested_at DATETIME,
  assigned_at DATETIME,
  started_at DATETIME,
  resolved_at DATETIME,

  createdAt DATETIME,
  updatedAt DATETIME,

  INDEX idx_user_id (user_id),
  INDEX idx_location_id (location_id),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_status (status),
  INDEX idx_requested_at (requested_at)
);
```

### User Table

```sql
CREATE TABLE Users (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash TEXT,
  role ENUM('CITIZEN','ADMIN','OPERATOR'),
  is_active BOOLEAN DEFAULT true,
  last_login DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME
);
```

### Location Table

```sql
CREATE TABLE Locations (
  id UUID PRIMARY KEY,
  zone_name VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  createdAt DATETIME,
  updatedAt DATETIME
);
```

---

## Access Control Matrix

```
Action                    CITIZEN  ADMIN  OPERATOR
─────────────────────────────────────────────────
Create complaint            ✅      ❌      ❌
View own complaints         ✅      ❌      ❌
View specific complaint     ✅✓     ✅      ✅✓
View all complaints         ❌      ✅      ❌
View pending complaints     ❌      ✅      ❌
Assign to operator          ❌      ✅      ❌
View assigned tasks         ❌      ❌      ✅
Start work                  ❌      ❌      ✅✓
Resolve complaint           ❌      ❌      ✅✓
Manage users                ❌      ✅      ❌

✅ = Full access
✅✓ = Own resources only
❌ = No access
```

---

## State Transitions

```
                    ┌─────────────┐
                    │   PENDING   │ ← Citizen creates
                    └──────┬──────┘
                           │
                      Admin assigns
                           │
                    ┌──────▼──────┐
                    │  ASSIGNED   │
                    └──────┬──────┘
                           │
                   Operator starts
                           │
                    ┌──────▼──────┐
                    │ IN_PROGRESS │
                    └──────┬──────┘
                           │
                  Operator resolves
                           │
                    ┌──────▼──────┐
                    │  RESOLVED   │ ← Final state
                    └─────────────┘
```

---

## Error Handling Flow

```
Client Request
      ↓
Server Receives
      ↓
Middleware: Verify JWT ──────→ 401 Unauthorized
      ↓
Middleware: Check Role ──────→ 403 Forbidden
      ↓
Route Handler
      ↓
Validation ──────→ 400 Bad Request (MISSING_FIELDS, INVALID_CATEGORY, etc)
      ↓
Database Query ──────→ 404 Not Found
      ↓
Business Logic ──────→ 400 Bad Request (INVALID_STATUS, INVALID_OPERATOR, etc)
      ↓
Update Success ──────→ 200 OK or 201 Created
      ↓
Response to Client
```

---

## Key Features by Version

### v1.0 (Current)

- ✅ Complaint creation
- ✅ Status tracking (PENDING → ASSIGNED → IN_PROGRESS → RESOLVED)
- ✅ Role-based access control
- ✅ Admin assignment workflow
- ✅ Operator task management
- ✅ Audit logging

### v2.0 (Future)

- ⏳ Bulk operations
- ⏳ SLA tracking
- ⏳ Real-time notifications
- ⏳ Image comparison
- ⏳ Citizen ratings

### v3.0 (Future)

- ⏳ ML-based auto-assignment
- ⏳ Predictive analytics
- ⏳ Mobile app
- ⏳ Public API

---

## Performance Considerations

### Database Indexes

- ✅ user_id (for filtering)
- ✅ status (for status-based queries)
- ✅ location_id (for geographic queries)
- ✅ assigned_to (for operator queries)
- ✅ requested_at (for time-based queries)

### Query Optimization

- Use pagination (limit/offset) for large result sets
- Eager load relationships (User, Location, AssignedOperator)
- Cache admin KPI calculations
- Consider materialized views for analytics

### Caching Strategy (Future)

- Cache pending complaints count
- Cache operator assignments
- Cache category statistics

---

## Security Measures

1. **JWT Authentication**: All endpoints require valid JWT token
2. **Role-Based Authorization**: Middleware enforces role checks
3. **Resource Ownership**: Citizens can't access others' complaints
4. **Operator Assignment**: Operators can't change assignments
5. **Admin Isolation**: Admins can't mark complaints as resolved
6. **Audit Logging**: All actions logged with user ID and timestamp
7. **SQL Injection Prevention**: Parameterized queries via Sequelize ORM
8. **Input Validation**: All inputs validated before processing

---

## Monitoring & Logging

### Action Logging (ActionLog table)

- Create complaint
- Assign to operator
- Start resolution
- Mark resolved

### Metrics to Track

- Avg resolution time
- Complaints by category
- Operator workload
- Complaint status distribution
- SLA compliance (future)

---

## Testing Strategy

### Unit Tests

- Controller logic
- Model validation
- Authorization checks

### Integration Tests

- API endpoint responses
- Database transactions
- Role-based workflows

### E2E Tests

- Complete complaint lifecycle
- Multi-user scenarios
- Admin assignment workflow

---

Generated: February 12, 2026
