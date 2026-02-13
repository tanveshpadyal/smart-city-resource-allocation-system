# API Quick Reference - Complaint Management

## Base URL

```
http://localhost:5000/api/requests
```

## Authentication

All endpoints require:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🟦 CITIZEN APIs

### 1. Create Complaint

```
POST /
Content-Type: application/json

{
  "complaint_category": "ROAD",  // ROAD, GARBAGE, WATER, LIGHT, OTHER
  "description": "Large pothole on Main Street near the park",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "image": "base64_encoded_image_or_null"  // optional
}

✅ Response 201:
{
  "success": true,
  "message": "Complaint created successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "complaint_category": "ROAD",
    "description": "...",
    "status": "PENDING",
    "requested_at": "2024-02-12T10:00:00Z",
    ...
  }
}
```

### 2. Get My Complaints

```
GET /me

✅ Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "complaint_category": "ROAD",
      "description": "...",
      "status": "RESOLVED",
      "requested_at": "2024-02-12T10:00:00Z",
      "assigned_at": "2024-02-12T10:15:00Z",
      "resolved_at": "2024-02-12T11:00:00Z",
      "operator_remark": "Fixed pothole with asphalt patch",
      "AssignedOperator": {
        "id": "uuid",
        "name": "John Operator",
        "email": "john@example.com"
      },
      "Location": {
        "zone_name": "Downtown",
        "latitude": 40.7128,
        "longitude": -74.0060
      }
    }
  ]
}
```

### 3. Get Complaint Details

```
GET /:{complaintId}

✅ Response 200:
{
  "success": true,
  "data": { ...complaint object... }
}

❌ 403 Forbidden - if not your complaint
❌ 404 Not Found
```

---

## 🟦 ADMIN APIs

### 1. Get All Complaints

```
GET /admin/all
     ?status=RESOLVED
     &category=ROAD
     &limit=50
     &offset=0

Query Parameters:
  - status: PENDING | ASSIGNED | IN_PROGRESS | RESOLVED (optional)
  - category: ROAD | GARBAGE | WATER | LIGHT | OTHER (optional)
  - limit: number (default 50)
  - offset: number (default 0)

✅ Response 200:
{
  "success": true,
  "data": [ ...complaints... ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

### 2. Get Pending Complaints (Unassigned)

```
GET /admin/pending
     ?category=ROAD
     &limit=20
     &offset=0

✅ Response 200:
{
  "success": true,
  "data": [ ...pending complaints... ],
  "pagination": {...}
}
```

### 3. Assign Complaint to Operator

```
POST /:{complaintId}/assign
Content-Type: application/json

{
  "operator_id": "uuid-of-operator"
}

✅ Response 200:
{
  "success": true,
  "message": "Complaint assigned to operator",
  "data": {
    "id": "uuid",
    "status": "ASSIGNED",
    "assigned_to": "operator_uuid",
    "assigned_at": "2024-02-12T10:15:00Z",
    ...
  }
}

❌ 400 Bad Request - operator not found or inactive
❌ 400 Bad Request - complaint not in PENDING status
```

---

## 🟦 OPERATOR APIs

### 1. Get My Assigned Complaints

```
GET /operator/assigned

✅ Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "complaint_category": "ROAD",
      "description": "...",
      "status": "ASSIGNED",  // or IN_PROGRESS
      "assigned_at": "2024-02-12T10:15:00Z",
      "started_at": "2024-02-12T10:30:00Z",  // null if not started
      "User": {
        "id": "citizen_uuid",
        "name": "Jane Citizen",
        "email": "jane@example.com"
      },
      "Location": {
        "zone_name": "Downtown",
        "latitude": 40.7128,
        "longitude": -74.0060
      }
    }
  ]
}
```

### 2. Start Complaint Resolution

```
POST /:{complaintId}/start

✅ Response 200:
{
  "success": true,
  "message": "Complaint resolution started",
  "data": {
    "id": "uuid",
    "status": "IN_PROGRESS",
    "started_at": "2024-02-12T10:30:00Z",
    ...
  }
}

❌ 403 Forbidden - not assigned to this operator
❌ 400 Bad Request - not in ASSIGNED status
```

### 3. Resolve Complaint

```
POST /:{complaintId}/resolve
Content-Type: application/json

{
  "operator_remark": "Fixed pothole with new asphalt. Road is now safe."
}

✅ Response 200:
{
  "success": true,
  "message": "Complaint resolved successfully",
  "data": {
    "id": "uuid",
    "status": "RESOLVED",
    "resolved_at": "2024-02-12T11:00:00Z",
    "operator_remark": "Fixed pothole with new asphalt. Road is now safe.",
    ...
  }
}

❌ 403 Forbidden - not assigned to this operator
❌ 400 Bad Request - not in IN_PROGRESS status
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Missing required field: complaint_category",
  "code": "MISSING_FIELDS"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "This complaint is not assigned to you",
  "code": "FORBIDDEN"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Complaint not found",
  "code": "NOT_FOUND"
}
```

### 500 Server Error

```json
{
  "success": false,
  "error": "Failed to create complaint",
  "details": "Database connection error",
  "code": "REQUEST_ERROR"
}
```

---

## Status Codes Reference

| Code | Meaning                       |
| ---- | ----------------------------- |
| 201  | Created                       |
| 200  | OK                            |
| 400  | Bad Request                   |
| 403  | Forbidden (permission denied) |
| 404  | Not Found                     |
| 500  | Server Error                  |

---

## Testing with cURL

```bash
# Create complaint
curl -X POST http://localhost:5000/api/requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "complaint_category": "ROAD",
    "description": "Pothole on Main St",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'

# Get my complaints
curl -X GET http://localhost:5000/api/requests/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Admin: get pending complaints
curl -X GET "http://localhost:5000/api/requests/admin/pending?limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Admin: assign complaint
curl -X POST http://localhost:5000/api/requests/{complaintId}/assign \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"operator_id": "OPERATOR_UUID"}'

# Operator: start work
curl -X POST http://localhost:5000/api/requests/{complaintId}/start \
  -H "Authorization: Bearer OPERATOR_TOKEN"

# Operator: resolve
curl -X POST http://localhost:5000/api/requests/{complaintId}/resolve \
  -H "Authorization: Bearer OPERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"operator_remark": "Issue fixed!"}'
```

---

## Roles & Permissions

| Endpoint               | CITIZEN | ADMIN | OPERATOR |
| ---------------------- | ------- | ----- | -------- |
| POST /                 | ✅      | ❌    | ❌       |
| GET /me                | ✅      | ❌    | ❌       |
| GET /:id               | ✅\*    | ✅    | ✅\*     |
| GET /admin/all         | ❌      | ✅    | ❌       |
| GET /admin/pending     | ❌      | ✅    | ❌       |
| POST /:id/assign       | ❌      | ✅    | ❌       |
| GET /operator/assigned | ❌      | ❌    | ✅       |
| POST /:id/start        | ❌      | ❌    | ✅\*     |
| POST /:id/resolve      | ❌      | ❌    | ✅\*     |

\* Own resources only
