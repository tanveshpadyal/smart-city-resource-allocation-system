# Classic ER Diagram - Smart City Resource Allocation System
## Using Chen's ER Notation with Symbolic Representation

---

## LEGEND
```
🟦 RECTANGLE   → Entity (Strong or Weak)
🔵 OVAL        → Attribute (Key Attribute)
◯◯ DOUBLE OVAL → Primary Key Attribute
💎 DIAMOND     → Relationship
─ LINE         → Connection
1, N, M        → Cardinality Labels
```

---

## ENTITIES & ATTRIBUTES

### 🟦 USER
```
        ◯◯id (PK)
         |
    ┌────┴────┐
    |          |
   🔵name    🔵email
    |          |
   🔵password  🔵role
   _hash       |
    |         🔵status
   🔵auth_     🔵is_
   provider   active
    |
   🔵google_id
```

**Attributes:**
- ◯◯ `id` (UUID, Primary Key)
- 🔵 `name` (VARCHAR)
- 🔵 `email` (VARCHAR, UNIQUE)
- 🔵 `password_hash` (TEXT)
- 🔵 `role` (ENUM: ADMIN, OPERATOR, CITIZEN)
- 🔵 `status` (ENUM: active, suspended)
- 🔵 `auth_provider` (ENUM: local, google)
- 🔵 `google_id` (VARCHAR)
- 🔵 `is_active` (BOOLEAN)

---

### 🟦 REQUEST
```
        ◯◯id (PK)
         |
    ┌────┬────┬────┐
    |    |    |    |
   🔵user 🔵location 🔵assigned_to
   _id   _id        |
    |    |          🔵complaint_
   🔵priority  category
    |          |
   🔵status  🔵description
    |
   🔵requested_at
```

**Attributes:**
- ◯◯ `id` (UUID, Primary Key)
- 🔵 `user_id` (UUID, FK → USER)
- 🔵 `location_id` (UUID, FK → LOCATION)
- 🔵 `assigned_to` (UUID, FK → USER)
- 🔵 `complaint_category` (ENUM: ROAD, GARBAGE, WATER, LIGHT, OTHER)
- 🔵 `priority` (ENUM: LOW, MEDIUM, HIGH, EMERGENCY)
- 🔵 `status` (ENUM: PENDING, ASSIGNED, IN_PROGRESS, RESOLVED)
- 🔵 `description` (TEXT)
- 🔵 `quantity_requested` (INTEGER)
- 🔵 `quantity_fulfilled` (INTEGER)
- 🔵 `requested_at` (TIMESTAMP)

---

### 🟦 RESOURCE
```
        ◯◯id (PK)
         |
    ┌────┬────┬────┐
    |    |    |    |
   🔵name 🔵code 🔵category
    |    |    |
   🔵latitude 🔵longitude
   🔵quantity_total
   🔵quantity_available
   🔵status
```

**Attributes:**
- ◯◯ `id` (UUID, Primary Key)
- 🔵 `name` (VARCHAR)
- 🔵 `code` (VARCHAR, UNIQUE)
- 🔵 `category` (ENUM: WATER, ELECTRICITY, MEDICAL, TRANSPORT, OTHER)
- 🔵 `latitude` (DECIMAL)
- 🔵 `longitude` (DECIMAL)
- 🔵 `address` (TEXT)
- 🔵 `quantity_total` (INTEGER)
- 🔵 `quantity_available` (INTEGER)
- 🔵 `quantity_used` (INTEGER)
- 🔵 `status` (ENUM: available, in_transit, depleted)

---

### 🟦 LOCATION
```
        ◯◯id (PK)
         |
    ┌────┬────┬────┐
    |    |    |    |
   🔵zone_🔵zone_🔵latitude
   name code  |
    |    |   🔵longitude
   🔵boundary_
   polygon
    |
   🔵population_
   estimate
```

**Attributes:**
- ◯◯ `id` (UUID, Primary Key)
- 🔵 `zone_name` (VARCHAR, UNIQUE)
- 🔵 `zone_code` (VARCHAR, UNIQUE)
- 🔵 `latitude` (DECIMAL)
- 🔵 `longitude` (DECIMAL)
- 🔵 `boundary_polygon` (JSON/JSONB)
- 🔵 `population_estimate` (INTEGER)
- 🔵 `city_region` (VARCHAR)
- 🔵 `is_active` (BOOLEAN)

---

### 🟦 PROVIDER
```
        ◯◯id (PK)
         |
    ┌────┬────┬────┐
    |    |    |    |
   🔵user_id 🔵name 🔵city
    |    |    |
   🔵phone 🔵email 🔵address
    |
   🔵latitude
   🔵longitude
   🔵is_active
```

**Attributes:**
- ◯◯ `id` (UUID, Primary Key)
- 🔵 `user_id` (UUID, FK → USER, UNIQUE)
- 🔵 `name` (VARCHAR)
- 🔵 `city` (ENUM: PUNE, MUMBAI, NAGPUR)
- 🔵 `description` (TEXT)
- 🔵 `phone` (VARCHAR)
- 🔵 `email` (VARCHAR)
- 🔵 `address` (TEXT)
- 🔵 `latitude` (DECIMAL)
- 🔵 `longitude` (DECIMAL)
- 🔵 `is_active` (BOOLEAN)

---

### 🟦 SERVICE
```
        ◯◯id (PK)
         |
    ┌────┬────┐
    |    |    |
   🔵name 🔵category
    |
   🔵unit_type
   🔵is_active
```

**Attributes:**
- ◯◯ `id` (UUID, Primary Key)
- 🔵 `name` (VARCHAR, UNIQUE)
- 🔵 `category` (ENUM: WATER, FOOD, MEDICAL, FUEL, PARKING, EQUIPMENT, OTHER)
- 🔵 `unit_type` (VARCHAR)
- 🔵 `is_active` (BOOLEAN)

---

### 🟦 RESOURCE_ALLOCATION (Bridge Entity)
```
        ◯◯id (PK)
         |
    ┌────┬────┬────┬────┐
    |    |    |    |    |
   🔵request 🔵resource 🔵allocated_ 🔵quantity_
   _id      _id         by           allocated
    |    |    |    |
   🔵allocation_ 🔵status 🔵distance_ 🔵travel_
   mode          km        time_minutes
    |
   🔵allocated_at
   🔵delivered_at
   🔵notes
```

**Attributes:**
- ◯◯ `id` (UUID, Primary Key)
- 🔵 `request_id` (UUID, FK → REQUEST)
- 🔵 `resource_id` (UUID, FK → RESOURCE)
- 🔵 `allocated_by` (UUID, FK → USER)
- 🔵 `quantity_allocated` (INTEGER)
- 🔵 `allocation_mode` (ENUM: AUTO, MANUAL, SYSTEM)
- 🔵 `status` (ENUM: ALLOCATED, IN_TRANSIT, DELIVERED, PARTIALLY_DELIVERED, CANCELLED)
- 🔵 `distance_km` (DECIMAL)
- 🔵 `travel_time_minutes` (INTEGER)
- 🔵 `allocated_at` (TIMESTAMP)
- 🔵 `delivered_at` (TIMESTAMP)

---

### 🟦 PROVIDER_SERVICE (Bridge Entity)
```
        ◯◯id (PK)
         |
    ┌────┬────┬────┐
    |    |    |    |
   🔵provider 🔵service 🔵price_per
   _id        _id       _unit
    |    |    |
   🔵capacity 🔵capacity 🔵status
   _total    _available
    |
   🔵metadata
```

**Attributes:**
- ◯◯ `id` (UUID, Primary Key)
- 🔵 `provider_id` (UUID, FK → PROVIDER)
- 🔵 `service_id` (UUID, FK → SERVICE)
- 🔵 `price_per_unit` (DECIMAL)
- 🔵 `capacity_total` (INTEGER)
- 🔵 `capacity_available` (INTEGER)
- 🔵 `status` (ENUM: ACTIVE, PAUSED, INACTIVE)

---

### 🟦 CONTRACTOR_AREA (Bridge Entity)
```
        ◯◯id (PK)
         |
    ┌────┬────┬────┐
    |    |    |    |
   🔵contractor 🔵area_id 🔵priority
   _id       |    |
    |       🔵is_primary
   🔵weight
```

**Attributes:**
- ◯◯ `id` (UUID, Primary Key)
- 🔵 `contractor_id` (UUID, FK → USER)
- 🔵 `area_id` (UUID, FK → LOCATION)
- 🔵 `priority` (INTEGER)
- 🔵 `is_primary` (BOOLEAN)
- 🔵 `weight` (INTEGER)

---

### 🟦 ACTION_LOG (Audit Entity)
```
        ◯◯id (PK)
         |
    ┌────┬────┬────┐
    |    |    |    |
   🔵entity 🔵entity 🔵action
   _type    _id      |
    |              🔵metadata
```

**Attributes:**
- ◯◯ `id` (UUID, Primary Key)
- 🔵 `entity_type` (VARCHAR)
- 🔵 `entity_id` (UUID, FK)
- 🔵 `action` (VARCHAR)
- 🔵 `metadata` (JSONB)

---

## RELATIONSHIPS & CARDINALITY

```
                    1                    N
         🟦 USER ─────💎 IS_CREATOR ────── 🟦 REQUEST
                        |
                        ├─ 1 User creates (1..N) Requests
                        └─ (0..1) Request created by 1 User


                    1                    N
         🟦 USER ─────💎 IS_ASSIGNED ────── 🟦 REQUEST
                        |
                        ├─ 1 Operator assigned to (1..N) Requests
                        └─ (0..1) Request assigned to 1 Operator


                    1                    1
         🟦 USER ─────💎 OPERATES ────── 🟦 PROVIDER
                        |
                        ├─ 1 User operates (1..1) Provider
                        └─ 1 Provider operated by 1 User


                    1                    N
      🟦 REQUEST ─────💎 LOCATED_IN ────── 🟦 LOCATION
                        |
                        ├─ 1 Location contains (1..N) Requests
                        └─ (1..N) Requests in 1 Location


                    1                    N
      🟦 REQUEST ─────💎 RECEIVES ────── 🟦 RESOURCE_ALLOCATION
                        |
                        ├─ 1 Request receives (1..N) Allocations
                        └─ 1..N Allocations for 1 Request


                    1                    N
      🟦 RESOURCE ─────💎 ALLOCATED_VIA ────── 🟦 RESOURCE_ALLOCATION
                        |
                        ├─ 1 Resource used in (1..N) Allocations
                        └─ 1..N Allocations of 1 Resource


                    1                    N
      🟦 RESOURCE ─────💎 STORED_IN ────── 🟦 LOCATION
                        |
                        ├─ 1 Location stores (1..N) Resources
                        └─ (1..N) Resources stored in 1 Location


                    1                    N
      🟦 PROVIDER ─────💎 OFFERS ────── 🟦 PROVIDER_SERVICE
                        |
                        ├─ 1 Provider offers (1..N) Services
                        └─ 1..N Services offered by 1 Provider


                    1                    N
       🟦 SERVICE ─────💎 PROVIDED_VIA ────── 🟦 PROVIDER_SERVICE
                        |
                        ├─ 1 Service provided by (1..N) Providers
                        └─ 1..N Providers provide 1 Service


                    1                    N
      🟦 LOCATION ─────💎 COVERED_BY ────── 🟦 CONTRACTOR_AREA
                        |
                        ├─ 1 Location covered by (1..N) Contractors
                        └─ 1..N Contractors cover 1 Location


                    1                    N
         🟦 USER ─────💎 COVERS_AREA ────── 🟦 CONTRACTOR_AREA
                        |
                        ├─ 1 Contractor covers (1..N) Areas
                        └─ 1..N Areas covered by 1 Contractor
```

---

## RELATIONSHIP TABLE SUMMARY

| 💎 Relationship | From 🟦 | To 🟦 | Cardinality | Type |
|---|---|---|---|---|
| IS_CREATOR | USER | REQUEST | 1:N | One-to-Many |
| IS_ASSIGNED | USER | REQUEST | 1:N | One-to-Many |
| OPERATES | USER | PROVIDER | 1:1 | One-to-One |
| COVERS_AREA | USER | CONTRACTOR_AREA | 1:N | One-to-Many |
| LOCATED_IN | REQUEST | LOCATION | N:1 | Many-to-One |
| RECEIVES | REQUEST | RESOURCE_ALLOCATION | 1:N | One-to-Many |
| ALLOCATED_VIA | RESOURCE | RESOURCE_ALLOCATION | 1:N | One-to-Many |
| STORED_IN | RESOURCE | LOCATION | N:1 | Many-to-One |
| COVERED_BY | LOCATION | CONTRACTOR_AREA | 1:N | One-to-Many |
| OFFERS | PROVIDER | PROVIDER_SERVICE | 1:N | One-to-Many |
| PROVIDED_VIA | SERVICE | PROVIDER_SERVICE | 1:N | One-to-Many |

---

## KEY CONSTRAINTS

### PRIMARY KEYS (◯◯)
- All entities have UUID-based primary keys
- Composite keys: CONTRACTOR_AREA (contractor_id, area_id)

### FOREIGN KEYS (🔵)
- REQUEST.user_id → USER.id
- REQUEST.assigned_to → USER.id
- REQUEST.location_id → LOCATION.id
- RESOURCE.location_id → LOCATION.id
- USER.provider_id → PROVIDER.id (implicit)
- PROVIDER.user_id → USER.id
- PROVIDER_SERVICE.provider_id → PROVIDER.id
- PROVIDER_SERVICE.service_id → SERVICE.id
- CONTRACTOR_AREA.contractor_id → USER.id
- CONTRACTOR_AREA.area_id → LOCATION.id
- RESOURCE_ALLOCATION.request_id → REQUEST.id
- RESOURCE_ALLOCATION.resource_id → RESOURCE.id
- RESOURCE_ALLOCATION.allocated_by → USER.id

---

## CARDINALITY EXPLANATION

- **1** = Exactly one
- **N** = Zero or more (Many)
- **M** = Zero or more (alternate notation)

### Examples:
- **1:N** (One-to-Many): One USER can create many REQUESTs
- **1:1** (One-to-One): One USER operates exactly one PROVIDER
- **N:M** (Many-to-Many): Handled via bridge entities (PROVIDER_SERVICE, CONTRACTOR_AREA)

---
