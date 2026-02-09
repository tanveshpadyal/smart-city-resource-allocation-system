# Smart City Resource Allocation & Monitoring System

## Core Business Logic Documentation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Logical Flow Diagrams](#logical-flow-diagrams)
3. [Backend API Responsibilities](#backend-api-responsibilities)
4. [Transaction Safety Strategy](#transaction-safety-strategy)
5. [Edge Cases & Handling](#edge-cases--handling)
6. [Data Consistency Rules](#data-consistency-rules)
7. [Priority-Based Resource Allocation](#priority-based-resource-allocation)
8. [Distance-Based Selection Algorithm](#distance-based-selection-algorithm)
9. [API Endpoints Reference](#api-endpoints-reference)
10. [Testing Scenarios](#testing-scenarios)

---

## System Overview

### Purpose

The system automates resource allocation in a smart city:

- **Citizen Request**: Citizens request resources (water, electricity, medical, etc.)
- **Auto/Manual Allocation**: System automatically allocates resources based on priority, or operators manually assign
- **Distance Optimization**: Closest available resources are prioritized
- **Status Tracking**: Real-time tracking from request → allocation → delivery
- **SLA Compliance**: Priority-based SLA enforcement

### Key Entities

```
CITIZEN (User)
    ↓
    │ creates
    ↓
REQUEST (resource needed)
    ↓
    │ matches to (via allocation service)
    ↓
RESOURCE (available resource)
    ↓
    │ creates
    ↓
RESOURCE_ALLOCATION (transaction record)
    ↓
    │ updates statuses
    ↓
REQUEST (fulfilled) + RESOURCE (used)
```

---

## Logical Flow Diagrams

### 1. Request Creation & Auto-Allocation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ CITIZEN CREATES REQUEST                                         │
│ Resources: [water=100L, electricity=50kW]                       │
│ Priority: EMERGENCY                                             │
│ Location: Downtown Zone                                         │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ↓
        ┌──────────────────────┐
        │ VALIDATE REQUEST     │
        ├──────────────────────┤
        │ ✓ Category valid     │
        │ ✓ Qty ≥ 1            │
        │ ✓ Priority valid     │
        │ ✓ Location exists    │
        └──────────┬───────────┘
                   │
                   ↓
        ┌──────────────────────┐
        │ CREATE REQUEST       │
        │ Status: PENDING      │
        │ SLA: 30 min (EMERG)  │
        └──────────┬───────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    EMERGENCY/HIGH?     MEDIUM/LOW?
         │                   │
         ↓                   ↓
    ┌─────────────────┐  └─→ WAIT FOR
    │ TRIGGER AUTO-   │      OPERATOR
    │ ALLOCATION      │      ALLOCATION
    └────────┬────────┘
             │
             ↓
    ┌─────────────────────────────────────┐
    │ FIND BEST RESOURCE                  │
    ├─────────────────────────────────────┤
    │ 1. Query ACTIVE resources           │
    │ 2. Filter by category match         │
    │ 3. Filter by quantity available     │
    │ 4. Calculate distance to each       │
    │ 5. Filter by max_distance_km        │
    │ 6. Sort: distance ASC, priority     │
    │ 7. Select first (closest)           │
    └────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
  SUCCESS?        FAILURE?
    │                 │
    ↓                 ↓
┌──────────────┐  ┌──────────────┐
│ ALLOCATE     │  │ LOG FAILURE  │
│ • Reserve    │  │ • Set PENDING│
│ • Create     │  │ • Auto-retry │
│   allocation │  │   later      │
│ • Update qty │  └──────────────┘
│ • Commit     │
└──────────────┘
```

### 2. Manual Allocation Flow (Operator)

```
┌──────────────────────────────────────────────────┐
│ OPERATOR VIEWS PENDING REQUESTS                  │
│ Sorted by: PRIORITY DESC, REQUESTED_AT ASC      │
└───────────────┬────────────────────────────────┘
                │
                ↓
    ┌───────────────────────┐
    │ SELECT REQUEST        │
    │ [EMERGENCY] 100L      │
    │ Downtown Zone         │
    │ by John Citizen       │
    └───────────┬───────────┘
                │
                ↓
    ┌───────────────────────────────┐
    │ GET RESOURCE SUGGESTIONS      │
    ├───────────────────────────────┤
    │ ? Water stations within 50km  │
    │   Sorted by distance          │
    │                               │
    │ 1. WS-001 (5 km away) ← pick  │
    │ 2. WS-002 (12 km away)        │
    │ 3. WS-003 (22 km away)        │
    └───────────┬───────────────────┘
                │
                ↓
    ┌───────────────────────────────┐
    │ OPERATOR SELECTS RESOURCE     │
    │ WS-001 (5 km)                 │
    │ Available: 500 L              │
    │ Qty Needed: 100 L             │
    └───────────┬───────────────────┘
                │
                ↓
    ┌──────────────────────────────────────┐
    │ EXECUTE ALLOCATION TRANSACTION       │
    │                                      │
    │ Lock WS-001 row in Resource table   │
    │ ↓                                    │
    │ Re-check: qty_available >= 100?     │
    │ ↓                                    │
    │ Update Resource:                     │
    │   qty_reserved += 100                │
    │   qty_available -= 100               │
    │ ↓                                    │
    │ Create ResourceAllocation:           │
    │   status = ALLOCATED                 │
    │   allocation_mode = MANUAL           │
    │   distance_km = 5                    │
    │   travel_time_minutes = 10           │
    │ ↓                                    │
    │ Update Request:                      │
    │   status = APPROVED                  │
    │   approved_at = NOW                  │
    │   quantity_fulfilled = 100           │
    │ ↓                                    │
    │ Log ActionLog entry                  │
    │ ↓                                    │
    │ COMMIT transaction                   │
    │                                      │
    │ If any step fails: ROLLBACK all     │
    └──────────────────────────────────────┘
```

### 3. Allocation Fulfillment Flow

```
┌──────────────────────────────────┐
│ ALLOCATION: ALLOCATED            │
│ WS-001 → Request (100L)          │
│ Reserved: 100L (locked in DB)    │
└───────────────┬──────────────────┘
                │
                ↓
    ┌────────────────────────┐
    │ OPERATOR: IN TRANSIT   │
    │ PUT /allocations/      │
    │ {id}/in-transit        │
    │                        │
    │ Status: IN_TRANSIT     │
    └────────────┬───────────┘
                 │
                 ↓
    ┌────────────────────────────────┐
    │ RESOURCE DELIVERED TO CITIZEN  │
    │ Operator confirms arrival      │
    └───────────┬────────────────────┘
                │
                ↓
    ┌──────────────────────────────────────┐
    │ OPERATOR: MARK DELIVERED             │
    │ PUT /allocations/{id}/delivered      │
    │                                      │
    │ Transaction:                         │
    │ 1. Lock Resource row                │
    │ 2. Move quantities:                 │
    │    qty_reserved -= 100              │
    │    qty_used += 100                  │
    │ 3. Update Allocation status         │
    │    → DELIVERED                      │
    │ 4. Update Request status            │
    │    → FULFILLED                      │
    │ 5. Create ActionLog                 │
    │ 6. COMMIT                           │
    └─────────────┬──────────────────────┘
                  │
                  ↓
    ┌────────────────────────────┐
    │ REQUEST FULFILLED          │
    │ ✓ All 100L delivered       │
    │ ✓ SLA met (within 30 min)  │
    │ ✓ Resource inventory clean │
    └────────────────────────────┘
```

### 4. Cancellation Flow

```
┌────────────────────────┐
│ ALLOCATION: ALLOCATED  │
│ WS-001 → Request (100L)│
└──────────────┬─────────┘
               │
               ↓ Operator cancels
    ┌──────────────────────────┐
    │ DELETE /allocations/{id} │
    │ Reason: "Resource needed │
    │ for other emergency"     │
    └──────────┬───────────────┘
               │
               ↓
    ┌──────────────────────────────────┐
    │ CANCELLATION TRANSACTION         │
    │                                  │
    │ Lock Resource row                │
    │ ↓                                │
    │ Free reserved quantity:          │
    │   qty_reserved -= 100            │
    │   qty_available += 100           │
    │ ↓                                │
    │ Update Allocation:               │
    │   status = CANCELLED             │
    │   cancellation_reason = "..."    │
    │ ↓                                │
    │ Revert Request:                  │
    │   status = PENDING               │
    │   approved_at = NULL             │
    │   quantity_fulfilled = 0          │
    │ ↓                                │
    │ Create ActionLog                 │
    │ ↓                                │
    │ COMMIT                           │
    └────────┬─────────────────────────┘
             │
             ↓
    ┌─────────────────────┐
    │ REQUEST BACK TO     │
    │ PENDING QUEUE       │
    │                     │
    │ Can be re-allocated │
    └─────────────────────┘
```

---

## Backend API Responsibilities

### 1. Request Service Responsibilities

| Responsibility           | Implementation                                     | Location                                 |
| ------------------------ | -------------------------------------------------- | ---------------------------------------- |
| **Request Validation**   | Check category, quantity, priority, location exist | `requestController.createRequest()`      |
| **Request Creation**     | Create with PENDING status, calculate SLA          | `requestController.createRequest()`      |
| **Priority Trigger**     | Auto-allocate if EMERGENCY/HIGH                    | `requestController.createRequest()`      |
| **Request Querying**     | Filter by user, status, priority, date range       | `requestController.getMyRequests()`      |
| **Request Update**       | Modify PENDING requests                            | `requestController.updateRequest()`      |
| **Request Cancellation** | Reject PENDING requests only                       | `requestController.cancelRequest()`      |
| **Pending List**         | Show operators requests awaiting allocation        | `requestController.getPendingRequests()` |

### 2. Allocation Service Responsibilities

| Responsibility              | Implementation                                    | Location                                            |
| --------------------------- | ------------------------------------------------- | --------------------------------------------------- |
| **Distance Calculation**    | Haversine formula (lat/lon)                       | `AllocationService.calculateDistance()`             |
| **Travel Time Estimation**  | Distance × 2 minutes per km                       | `AllocationService.estimateTravelTime()`            |
| **Best Resource Finding**   | Query → filter → sort → select                    | `AllocationService.findBestResource()`              |
| **Resource Validation**     | Category match, quantity check, ACTIVE status     | `AllocationService.findBestResource()`              |
| **Allocation Transaction**  | Atomic resource reservation + allocation creation | `AllocationService.allocateResourceToRequest()`     |
| **Auto-Allocation Logic**   | Find best + allocate                              | `AllocationService.autoAllocateRequest()`           |
| **Manual Allocation**       | Operator-specified resource allocation            | `AllocationService.manuallyAllocateResource()`      |
| **Allocation Cancellation** | Atomic cancellation + resource release            | `AllocationService.cancelAllocation()`              |
| **Delivery Marking**        | Atomic status update + quantity transfer          | `AllocationService.markAllocationDelivered()`       |
| **SLA Calculation**         | Based on priority                                 | `AllocationService.calculateTargetCompletionTime()` |

### 3. Resource Management Responsibilities

| Responsibility           | Implementation                                                               |
| ------------------------ | ---------------------------------------------------------------------------- |
| **Quantity Tracking**    | `quantity_total`, `quantity_available`, `quantity_used`, `quantity_reserved` |
| **Availability Check**   | `quantity_available >= request.quantity_requested`                           |
| **Reservation Lock**     | Database row-level locks during transactions                                 |
| **Status Management**    | ACTIVE, MAINTENANCE, DECOMMISSIONED                                          |
| **Distance Constraints** | `max_distance_km` limits allocation radius                                   |
| **Priority Scoring**     | `allocation_priority` breaks ties                                            |

---

## Transaction Safety Strategy

### Problem: Race Conditions

**Scenario**: Two requests arrive simultaneously for the last 100L of water.

```
Time  Action
────────────────────────────────────────────
T0    Request A checks: qty_available = 100
T0    Request B checks: qty_available = 100
      [Both read same value]

T1    Request A reserves 100L
      qty_available -= 100  → 0

T2    Request B tries to reserve 100L
      But qty_available = 0! ❌ CONFLICT
```

### Solution: Database Transactions + Row Locking

**Implementation in AllocationService**:

```javascript
const allocateResourceToRequest = async (request, resource) => {
  const transaction = await sequelize.transaction();

  try {
    // 1. LOCK THE RESOURCE ROW
    const lockedResource = await db.Resource.findByPk(
      resource.id,
      {
        lock: transaction.LOCK.UPDATE,  // ← Exclusive lock
        transaction
      }
    );

    // 2. RE-CHECK availability (after lock acquired)
    if (lockedResource.quantity_available < request.quantity_requested) {
      await transaction.rollback();
      return { success: false, error: "Insufficient quantity" };
    }

    // 3. RESERVE quantity
    lockedResource.quantity_reserved += request.quantity_requested;
    lockedResource.quantity_available -= request.quantity_requested;
    await lockedResource.save({ transaction });

    // 4. CREATE allocation record
    const allocation = await db.ResourceAllocation.create({...}, { transaction });

    // 5. UPDATE request status
    request.status = "APPROVED";
    await request.save({ transaction });

    // 6. LOG action
    await db.ActionLog.create({...}, { transaction });

    // 7. COMMIT all changes atomically
    await transaction.commit();

    return { success: true, allocation };
  } catch (error) {
    // 8. ON ANY ERROR: rollback ALL changes
    await transaction.rollback();
    return { success: false, error: error.message };
  }
};
```

### ACID Properties Guaranteed

| Property       | Guarantee                              | Implementation                         |
| -------------- | -------------------------------------- | -------------------------------------- |
| **Atomic**     | All-or-nothing                         | `transaction.commit()` or `rollback()` |
| **Consistent** | Quantity = used + available + reserved | Constraints enforced                   |
| **Isolated**   | No interference between transactions   | Row-level `LOCK.UPDATE`                |
| **Durable**    | Changes persist after commit           | Database commit to disk                |

### Transaction Boundaries

```
START TRANSACTION
  │
  ├─ Lock Resource row (EXCLUSIVE)
  ├─ Validate quantity for second time
  ├─ Update Resource quantities
  ├─ Create ResourceAllocation
  ├─ Update Request status
  ├─ Create ActionLog
  │
COMMIT or ROLLBACK (atomic)
```

**Key Principle**: Every transaction must be as short as possible to minimize lock contention.

---

## Edge Cases & Handling

### Edge Case 1: Insufficient Quantity Available

```
Request: 100L water
WS-001: qty_available = 80L ← Not enough

Handling:
1. Filter fails in findBestResource()
2. Try next resource
3. If no resources have qty_available >= 100:
   - Return error: "No resources available"
   - Keep request PENDING
   - Log failed attempt
4. Operator can:
   - Wait for resource to restock
   - Allocate multiple partial resources
   - Allocate from different category
```

**Code**:

```javascript
const availableResources = await db.Resource.findAll({
  where: {
    category: request.resource_category,
    status: "ACTIVE",
    quantity_available: {
      [Op.gte]: request.quantity_requested, // ← Ensures qty check
    },
  },
});
```

### Edge Case 2: All Resources Beyond Max Distance

```
Request: Emergency water in remote area
All water stations: > 50km away

Handling:
1. Distance filter removes all candidates
2. findBestResource() returns error
3. Request stays PENDING
4. Email admin/operator about remote emergency
5. Options:
   - Temporarily increase max_distance_km
   - Dispatch resource with explanation
   - Request special exception
```

**Code**:

```javascript
.filter((item) => item.withinMaxDistance)
.sort((a, b) => a.distance - b.distance);

if (resourcesWithDistance.length === 0) {
  return { success: false, reason: "No resources within distance limits" };
}
```

### Edge Case 3: Cancellation During In-Transit Status

```
Request: ALLOCATED → IN_TRANSIT → Cancellation requested
Problem: Resources already dispatched

Handling:
1. Check allocation.status
2. If DELIVERED: Cannot cancel
3. If IN_TRANSIT: Warn operator "Resource in transit"
4. If ALLOCATED: Can cancel normally
5. Log cancellation with reason
```

**Code**:

```javascript
if (allocation.status === "DELIVERED") {
  return { success: false, error: "Cannot cancel delivered allocation" };
}

// For IN_TRANSIT: allow but log "Recall needed"
if (allocation.status === "IN_TRANSIT") {
  // Log as "CANCELLATION_IN_TRANSIT", flag for callback
}
```

### Edge Case 4: Request Priority Change After Allocation

```
Scenario:
1. Request created with MEDIUM priority (24-hour SLA)
2. 1 hour later: Citizen updates to EMERGENCY (30-min SLA)
3. Allocation already planned for 5 hours from now

Problem: SLA mismatch

Handling:
1. Only allow priority changes for PENDING requests
2. APPROVED requests: freezechanges
3. If approved, operator must cancel and re-allocate
4. Log the update attempt rejection
```

**Code**:

```javascript
if (request.status !== "PENDING") {
  return res.status(400).json({
    error: `Cannot modify ${request.status} request`,
    suggestion: "Cancel and create new request with updated priority",
  });
}
```

### Edge Case 5: Resource Becomes Unavailable

```
Scenario:
1. WS-001 has 100L allocated to Request A
2. WS-001 goes into MAINTENANCE
3. What happens to allocation?

Handling:
1. Maintenance flag on Resource doesn't auto-cancel
2. Operator must manually cancel WS-001's allocations
3. Request A reverts to PENDING
4. Auto-allocate finds new resource
5. Log: "Resource maintenance triggered reallocation"
```

**Code**:

```javascript
// In cancellation flow:
await db.ActionLog.create({
  action: "ALLOCATION_CANCELLED_RESOURCE_MAINTENANCE",
  metadata: { resource_id, maintenance_reason },
});

// Re-trigger auto-allocation
await AllocationService.autoAllocateRequest(request);
```

### Edge Case 6: Partial Fulfillment Not Allowed

```
Request: 100L water
Resource available: Only 80L

Design Decision: All-or-nothing allocation (no partial)

Reasoning:
- Simpler tracking
- Clearer SLA compliance
- No partial fulfillment inventory nightmare
- Operator can allocate from multiple resources

Implementation:
quantity_allocated === request.quantity_requested (always)
```

### Edge Case 7: SLA Breach Tracking

```
Request: EMERGENCY priority
Target: 30 minutes
Actual: 45 minutes (BREACH)

Handling:
1. System calculates breach on FULFILLED
2. Breach = fulfilled_at > target_completion_date
3. Log to ActionLog for analytics
4. Metric: SLA_BREACH = true
5. No automated penalty, but tracked for reporting

Code:
if (new Date() > request.target_completion_date) {
  // SLA BREACHED - log for analysis
  metadata.sla_breached = true;
  metadata.breach_minutes = (Date.now() - request.target_completion_date) / 1000 / 60;
}
```

### Edge Case 8: Concurrent Allocation Attempts

```
Request: Open to auto-allocation
Operator 1: Clicks "Auto Allocate"
Operator 2: Clicks "Auto Allocate" (same request)

Handling:
1. First allocation succeeds, request → APPROVED
2. Second attempt checks: if (request.status === "APPROVED") return error
3. "Request already allocated"
4. No race condition due to row lock + status check
```

---

## Data Consistency Rules

### Rule 1: Request Quantity Conservation

```
request.quantity_fulfilled ≤ request.quantity_requested

AND

Sum of all non-cancelled allocations for request
  = request.quantity_fulfilled
```

**Enforcement**:

- On allocation creation: increment by `allocation.quantity_allocated`
- On allocation cancellation: decrement by `allocation.quantity_allocated`
- On request update: update quantity_fulfilled

### Rule 2: Resource Quantity Invariant

```
Resource.quantity_total = quantity_available + quantity_used + quantity_reserved

Always true after every transaction:
  total = available + used + reserved
```

**Enforcement**:

- On allocation: `available -= qty`, `reserved += qty`
- On delivery: `reserved -= qty`, `used += qty`
- On cancellation: `reserved -= qty`, `available += qty`
- Periodic audit: SELECT WHERE (total != available + used + reserved)

### Rule 3: Request Status Progression

```
┌─────────────────────────────────────────────────────┐
│                REQUEST STATUS FLOW                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│    PENDING ──→ APPROVED ──→ FULFILLED              │
│      ↓           ↓                                 │
│      └───→ REJECTED ←────────────────┘             │
│                                                     │
│ Valid transitions:                                  │
│ • PENDING → APPROVED (on allocation)               │
│ • PENDING → REJECTED (on cancellation)             │
│ • APPROVED → FULFILLED (on delivery)               │
│ • APPROVED → REJECTED (on cancellation)            │
│                                                     │
│ Invalid transitions: None allowed backwards        │
│ (no reverse from FULFILLED or final REJECTED)      │
└─────────────────────────────────────────────────────┘
```

**Enforcement**:

```javascript
const validTransitions = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["FULFILLED", "REJECTED"],
  FULFILLED: [], // Terminal
  REJECTED: [], // Terminal
};

if (!validTransitions[currentStatus].includes(newStatus)) {
  throw new Error(`Invalid transition: ${currentStatus} → ${newStatus}`);
}
```

### Rule 4: Allocation Status Progression

```
ALLOCATED → IN_TRANSIT → DELIVERED
   ↓ (can cancel anytime except DELIVERED)
CANCELLED
```

**Enforcement**:

```javascript
switch (allocation.status) {
  case "DELIVERED":
    return error("Cannot modify delivered allocation");
  case "ALLOCATED":
  case "IN_TRANSIT":
    // Can update or cancel
    break;
  case "CANCELLED":
    return error("Already cancelled");
}
```

### Rule 5: Timestamp Ordering

```javascript
// Always: approved_at >= requested_at
if (approved_at && approved_at < requested_at) {
  throw new Error("Invalid timestamp ordering");
}

// Always: fulfilled_at >= approved_at >= requested_at
if (fulfilled_at && fulfilled_at < approved_at) {
  throw new Error("Invalid timestamp ordering");
}

// SLA check
if (fulfilled_at > target_completion_date) {
  action_log.sla_breached = true;
}
```

### Rule 6: Location Consistency

```javascript
// Every request must reference a valid location
const location = await Location.findByPk(request.location_id);
if (!location) {
  throw new Error("Request references deleted location");
}

// Every resource should have valid coordinates
if (!resource.latitude || !resource.longitude) {
  throw new Error("Resource missing geographic data");
}
```

### Rule 7: No Orphaned Allocations

```javascript
// Every allocation must have:
// 1. Valid request_id
// 2. Valid resource_id
// 3. Request not deleted
// 4. Resource not deleted

// Cascade delete: If request deleted, related allocations must be cancelled
Request.beforeDestroy(async (request) => {
  await ResourceAllocation.update(
    { status: "CANCELLED", cancellation_reason: "Request deleted" },
    { where: { request_id: request.id, status: { [Op.ne]: "DELIVERED" } } },
  );
});
```

### Rule 8: Audit Trail Immutability

```javascript
// ActionLog records are immutable (never updated)
ActionLog.beforeUpdate(() => {
  throw new Error("Cannot modify audit logs");
});

// ActionLog must record:
// - WHO: actor_id
// - WHAT: action (CREATE, UPDATE, CANCEL, etc.)
// - WHEN: createdAt timestamp
// - WHERE: entity_type, entity_id
// - METADATA: additional context
```

---

## Priority-Based Resource Allocation

### Priority Levels

| Priority      | SLA        | Auto-Allocate? | Sort Order | Use Case                    |
| ------------- | ---------- | -------------- | ---------- | --------------------------- |
| **EMERGENCY** | 30 minutes | ✅ Yes         | 1st        | Medical emergency, disaster |
| **HIGH**      | 2 hours    | ✅ Yes         | 2nd        | Critical infrastructure     |
| **MEDIUM**    | 24 hours   | ❌ Pending     | 3rd        | Regular request             |
| **LOW**       | 72 hours   | ❌ Pending     | 4th        | Non-urgent                  |

### SLA Calculation

```javascript
const calculateTargetCompletionTime = (priority) => {
  const now = new Date();
  const delays = {
    EMERGENCY: 30 * 60 * 1000, // 30 minutes
    HIGH: 2 * 60 * 60 * 1000, // 2 hours
    MEDIUM: 24 * 60 * 60 * 1000, // 24 hours
    LOW: 72 * 60 * 60 * 1000, // 72 hours (3 days)
  };
  return new Date(now.getTime() + delays[priority]);
};
```

### Operator Queue Order

```sql
SELECT id, priority, requested_at, quantity_requested, description
FROM requests
WHERE status = 'PENDING'
ORDER BY
  priority DESC,              -- EMERGENCY first
  requested_at ASC            -- Then oldest first (fairness)
LIMIT 100;
```

**Result Priority Order**:

```
1. EMERGENCY requests (sorted by time) ← Most urgent
2. HIGH requests (sorted by time)
3. MEDIUM requests (sorted by time)
4. LOW requests (sorted by time)      ← Least urgent
```

---

## Distance-Based Selection Algorithm

### Haversine Formula

Calculates great-circle distance between two points on Earth.

```javascript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km

  // Convert degrees to radians
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return parseFloat((R * c).toFixed(2)); // ← Distance in km
};
```

### Resource Selection Algorithm

```
INPUT: Request (needs water, in Downtown zone)

STEP 1: Query candidates
  SELECT * FROM resources
  WHERE category = 'WATER'
    AND status = 'ACTIVE'
    AND quantity_available >= request.quantity_requested

  Result: 5 water stations with sufficient stock

STEP 2: Calculate distance for each
  WS-001: distance = 5 km   ✓
  WS-002: distance = 12 km  ✓
  WS-003: distance = 22 km  ✓
  WS-004: distance = 45 km  ✓
  WS-005: distance = 55 km  ✗ (> max 50km)

STEP 3: Filter by max_distance_km
  Candidates: WS-001, WS-002, WS-003, WS-004

STEP 4: Sort by distance (closest first)
  Then by allocation_priority (higher first)

  ORDER BY
    distance ASC,
    allocation_priority DESC

STEP 5: Select first match
  SELECTED: WS-001 (5 km away, closest)

RESULT:
  resource: WS-001
  distance: 5 km
  travel_time: 10 minutes
  reason: "Optimal resource selected"
```

### Travel Time Estimation

```javascript
const estimateTravelTime = (distanceKm) => {
  // Simplified: 1 km = 2 minutes (urban average)
  // Could be enhanced with:
  // - Traffic patterns
  // - Time of day
  // - Road network distance (not straight-line)
  return Math.ceil(distanceKm * 2);
};

// Examples:
// 5 km → 10 minutes
// 10 km → 20 minutes
// 25 km → 50 minutes
// 50 km → 100 minutes
```

### Priority-Based Tie-Breaking

```javascript
// If multiple resources at same distance:

resources.sort((a, b) => {
  // Primary: distance (ascending)
  if (a.distance !== b.distance) {
    return a.distance - b.distance;
  }

  // Secondary: allocation_priority (descending)
  if (a.allocation_priority !== b.allocation_priority) {
    return b.allocation_priority - a.allocation_priority;
  }

  // Tertiary: created_at (prefer older/more stable)
  return a.createdAt - b.createdAt;
});

// Select first
return resources[0];
```

---

## API Endpoints Reference

### Citizen Endpoints (Request Management)

```
POST /api/requests
  Create new request
  Body: { locationId, resourceCategory, quantityRequested, priority, description }
  Auth: Required (bearer token)

  Response:
  {
    "success": true,
    "message": "Request created and auto-allocated",
    "data": {
      "request": { id, status, priority, created_at, ... },
      "allocation": { id, resource_id, distance_km, ... },  // if auto-allocated
      "allocationDetails": "Distance: 5km, Est. Time: 10 mins"
    }
  }

GET /api/requests/me
  List citizen's own requests
  Auth: Required

  Response:
  [
    {
      "id": "uuid",
      "status": "APPROVED",
      "priority": "EMERGENCY",
      "quantity_requested": 100,
      "location": { "zone_name": "Downtown", ... },
      "allocations": [ { "id": "uuid", "resource": {...}, "status": "DELIVERED" } ]
    }
  ]

GET /api/requests/:requestId
  Get specific request with allocations
  Auth: Required (own request only)

PUT /api/requests/:requestId
  Update PENDING request
  Body: { quantity, priority, description }
  Auth: Required (own request only)

DELETE /api/requests/:requestId
  Cancel PENDING request
  Auth: Required (own request only)
```

### Operator Endpoints (Allocation Management)

```
GET /api/requests/pending/list
  List all pending requests
  Query: ?priority=EMERGENCY&category=WATER&limit=50&offset=0
  Auth: Required (OPERATOR or ADMIN)

  Sorted by: priority DESC, requested_at ASC

GET /api/allocations/suggest/:requestId
  Get suggested resources for manual allocation
  Query: ?limit=5
  Auth: Required (OPERATOR or ADMIN)

  Response:
  {
    "suggestions": [
      {
        "resource_id": "uuid",
        "name": "Water Station 1",
        "distance_km": 5.2,
        "travel_time_minutes": 10,
        "quantity_available": 500,
        "is_best_match": true
      }
    ]
  }

POST /api/requests/manual
  Operator manually allocates specific resource
  Body: { requestId, resourceId }
  Auth: Required (OPERATOR or ADMIN)

POST /api/requests/auto/:requestId
  Trigger auto-allocation for request
  Auth: Required (OPERATOR or ADMIN)

GET /api/allocations/list
  List all allocations
  Query: ?status=ALLOCATED&limit=50
  Auth: Required (OPERATOR or ADMIN)

GET /api/allocations/:allocationId
  Get allocation details

PUT /api/allocations/:allocationId/in-transit
  Mark allocation as dispatched

PUT /api/allocations/:allocationId/delivered
  Mark allocation as delivered (completes transaction)

DELETE /api/allocations/:allocationId
  Cancel allocation and free resources
  Body: { reason }
```

---

## Testing Scenarios

### Test 1: Happy Path - Emergency Auto-Allocation

```
Setup:
  - Location: Downtown (lat: 40.7128, lon: -74.0060)
  - Resource: WS-001 (5km away, 500L available)
  - Request: 100L EMERGENCY water

Steps:
  1. POST /api/requests { locationId, "WATER", 100, "EMERGENCY" }
  2. System auto-allocates WS-001
  3. Check: allocation created with distance=5km
  4. Check: Request status = APPROVED
  5. Check: WS-001 qty_available reduced by 100

Expected:
  ✓ Request created
  ✓ Allocation created
  ✓ Status: APPROVED
  ✓ Response includes allocation details
```

### Test 2: Concurrent Requests - Race Condition Prevention

```
Setup:
  - Resource: WS-001 (100L total, all available)
  - Request A: 100L water
  - Request B: 100L water (same time)

Steps:
  1. Request A and B received simultaneously
  2. Both start allocation process
  3. Request A acquires lock first
  4. Request A reserves 100L successfully
  5. Request B acquires lock
  6. Request B re-checks quantity: 0 available ❌
  7. Request B fails gracefully

Expected:
  ✓ Request A: APPROVED
  ✓ Request B: PENDING (no crash)
  ✓ Both requests logged
  ✓ DB remains consistent: qty_available = 0
```

### Test 3: No Resources Within Distance

```
Setup:
  - Location: Remote island (no resources within 50km)
  - Request: 100L water MEDIUM priority

Steps:
  1. POST /api/requests
  2. Auto-allocation triggered (yes, for MEDIUM)
  3. findBestResource() searches for water
  4. All candidates > 50km away
  5. Filter fails, returns error
  6. Request saved as PENDING

Expected:
  ✓ Request created with status PENDING
  ✓ Response includes error: "No resources within distance limit"
  ✓ Not auto-allocated
```

### Test 4: Manual Allocation with Operator

```
Setup:
  - Request: PENDING (100L water, Downtown)
  - Operator: Views pending requests
  - Resource: WS-002 (12km away, 300L available)

Steps:
  1. GET /api/requests/pending/list
  2. Operator sees the request
  3. GET /api/allocations/suggest/:requestId
  4. See WS-001 (5km), WS-002 (12km), ...
  5. POST /api/requests/manual { requestId, resourceId: "WS-002" }
  6. Allocation transaction executes
  7. Check: Request → APPROVED
  8. Check: WS-002 qty_reserved += 100

Expected:
  ✓ Allocation created with allocation_mode=MANUAL
  ✓ Distance recorded: 12km
  ✓ Travel time: 24 minutes
  ✓ Request status: APPROVED
```

### Test 5: Cancellation During Transit

```
Setup:
  - Allocation: ALLOCATED → IN_TRANSIT
  - Operator needs to cancel due to emergency

Steps:
  1. PUT /api/allocations/:id/in-transit (already called)
  2. DELETE /api/allocations/:id { reason: "Recalled for emergency" }
  3. Cancellation transaction:
     - Lock Resource row
     - qty_reserved -= 100, qty_available += 100
     - Allocation status = CANCELLED
     - Request status = PENDING
  4. Note: Operator must handle actual resource recall

Expected:
  ✓ Allocation cancelled
  ✓ Request back to PENDING
  ✓ Resource quantity restored
  ✓ Logged as ALLOCATION_CANCELLED_IN_TRANSIT
```

### Test 6: SLA Breach Detection

```
Setup:
  - Request: EMERGENCY priority (30-min SLA)
  - Created at: 10:00 AM
  - Target completion: 10:30 AM
  - Actually delivered: 10:45 AM (15 min late)

Steps:
  1. Request created, auto-allocated → 10:02 AM
  2. Marked IN_TRANSIT → 10:15 AM
  3. PUT /api/allocations/:id/delivered → 10:45 AM
  4. System calculates:
     - fulfilled_at (10:45) > target_completion_date (10:30)
     - SLA BREACHED = true
     - Breach minutes = 15
  5. ActionLog recorded with breach metadata

Expected:
  ✓ Request: FULFILLED
  ✓ Allocation: DELIVERED
  ✓ ActionLog.metadata.breach_minutes = 15
  ✓ Available for reporting/analytics
```

### Test 7: Resource Insufficient for Request

```
Setup:
  - Request: 200L water
  - WS-001: 150L available (not enough)
  - WS-002: 80L available (not enough)
  - WS-003: 200L available ✓ (enough)

Steps:
  1. POST /api/requests { qty: 200 }
  2. Auto-allocation queries:
     SELECT * WHERE qty_available >= 200
  3. Only WS-003 matches
  4. Distance to WS-003: 25km ✓ (within 50km)
  5. WS-003 allocated

Expected:
  ✓ Allocation: WS-003 (200L)
  ✓ WS-001 and WS-002 not considered (insufficient)
```

### Test 8: Multiple Allocations Same Request

```
Design note: System does NOT support partial fulfillment
  - One request = One allocation maximum
  - If citizen needs from two resources:
    Create TWO separate requests

Setup:
  - Request A: 100L water
  - Allocated to WS-001
  - Try to allocate additional from WS-002

Expected:
  ✓ Request A status = APPROVED (already allocated)
  ❌ Second allocation rejected: "Request already allocated"
```

---

## Summary: Key Design Decisions

| Decision                                   | Rationale                                          |
| ------------------------------------------ | -------------------------------------------------- |
| **All-or-nothing allocation**              | No partial fulfillment complexity                  |
| **Distance-based selection**               | Minimizes delivery time                            |
| **Auto-allocate HIGH/EMERGENCY only**      | Reduces pending backlog for critical requests      |
| **Transaction-based quantity updates**     | Prevents double-booking                            |
| **Row-level locking**                      | Prevents race conditions                           |
| **Immutable audit logs**                   | Legal compliance, forensics                        |
| **SLA tracking (not enforcement)**         | Visibility without automated penalties             |
| **No negative inventory**                  | Business rule: can't allocate what's not available |
| **Operator can cancel IN_TRANSIT**         | Flexibility for real-world issues                  |
| **Citizen can't modify APPROVED requests** | SLA predictability                                 |

---

## Next Steps

1. **Database Migration** - Create Location, ResourceAllocation tables
2. **Tests** - Unit tests for AllocationService algorithms
3. **Integration Tests** - Test full request → allocation → delivery flow
4. **Monitoring** - Track SLA breaches, allocation success rates
5. **Reporting** - Dashboard for allocation metrics
6. **Performance Tuning** - Index optimization for distance queries
7. **Disaster Recovery** - Backup/restore strategies for transaction logs
