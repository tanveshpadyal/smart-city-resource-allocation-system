# PHASE 8 — FRONTEND ARCHITECTURE DOCUMENTATION

## 1. PAGE STRUCTURE BY ROLE

### **Citizen Pages** (Request Creator & Tracker)

| Page           | Path                      | Purpose                                           |
| -------------- | ------------------------- | ------------------------------------------------- |
| Login          | `/login`                  | User authentication                               |
| Register       | `/register`               | User account creation                             |
| Dashboard      | `/citizen/dashboard`      | Overview: stats, recent requests, quick actions   |
| Create Request | `/citizen/create-request` | Form to submit resource requests                  |
| My Requests    | `/citizen/my-requests`    | List of all personal requests with filtering      |
| Request Detail | `/citizen/request/:id`    | Detailed view with allocation status and tracking |

**Citizen User Flow:**

```
Login → Dashboard (stats) → Create Request OR View My Requests → Track status
```

### **Operator Pages** (Resource Dispatcher & Handler)

| Page                 | Path                             | Purpose                                                       |
| -------------------- | -------------------------------- | ------------------------------------------------------------- |
| Dashboard            | `/operator/dashboard`            | Real-time overview: pending queue, KPIs, active allocations   |
| Pending Requests     | `/operator/pending-requests`     | Prioritized request queue (EMERGENCY→LOW) with actions        |
| Active Allocations   | `/operator/active-allocations`   | In-progress allocations with live location tracking           |
| Allocation Details   | `/operator/allocation/:id`       | Detailed view: update status, view request, suggest resources |
| Resource Suggestions | `/operator/resource-suggestions` | AI-suggested optimal allocations for manual review            |

**Operator User Flow:**

```
Dashboard → Pending Requests Queue → Select Request → Auto/Manual Allocate →
Allocation Details → Mark In Transit → Mark Delivered
```

### **Admin Pages** (System Oversight & Management)

| Page       | Path                | Purpose                                                            |
| ---------- | ------------------- | ------------------------------------------------------------------ |
| Dashboard  | `/admin/dashboard`  | System analytics: fulfillment rate, SLA compliance, response times |
| Users      | `/admin/users`      | User management: create, edit, delete, role assignment             |
| Resources  | `/admin/resources`  | Resource inventory management and availability                     |
| Audit Logs | `/admin/audit-logs` | Activity log with filtering and search                             |
| Reports    | `/admin/reports`    | Generate system reports (performance, compliance)                  |
| Settings   | `/admin/settings`   | System configuration and preferences                               |

**Admin User Flow:**

```
Dashboard (analytics) → View Audit Logs → Manage Users → Configure Resources → Generate Reports
```

### **Shared Pages**

| Page         | Path            | Purpose              |
| ------------ | --------------- | -------------------- |
| Unauthorized | `/unauthorized` | Access denied (403)  |
| Not Found    | `/*`            | Page not found (404) |

---

## 2. COMPONENT BREAKDOWN

### **Common Components** (`src/components/common/`)

#### UI Primitives

- **Spinner.jsx** — Loading indicator (PageSpinner, InlineSpinner, Spinner variations)
- **Button.jsx** — Styled button (variants: primary, secondary, danger, success, outline, ghost; sizes: sm, md, lg)
- **Input.jsx** — Form input with label, validation error display
- **Input.jsx** (extended) — Textarea, Select components
- **Badge.jsx** — Status badges with automatic variant mapping (StatusBadge, PriorityBadge, RoleBadge)
- **Alert.jsx** — Error, Success, Warning alerts with auto-dismiss and retry options

### **Layout Components** (`src/components/layouts/`)

- **MainLayout.jsx** — Public layout with header, navigation, footer (for /login, /register)
- **CitizenLayout.jsx** — Sidebar nav (Dashboard, Create Request, My Requests), user profile, logout
- **OperatorLayout.jsx** — Sidebar nav (Dashboard, Pending Requests, Active Allocations, Suggestions), urgent alert badge
- **AdminLayout.jsx** — Sidebar nav (Dashboard, Users, Resources, Audit Logs, Reports, Settings)

### **Route Guards** (`src/components/`)

- **ProtectedRoute.jsx** — Guards by authentication (redirects to /login if not authenticated)
- **RoleGuard.jsx** — Guards by role (redirects to /unauthorized if role not in requiredRoles array)

### **Card Components** (`src/components/cards/`) — _Queued for implementation_

- **RequestCard.jsx** — Compact request summary with status badge
- **AllocationCard.jsx** — Compact allocation summary with status and distance
- **ResourceCard.jsx** — Resource availability with quantity and location
- **StatsCard.jsx** — Metric display for dashboards (KPI card)

### **Form Components** (`src/components/forms/`) — _Queued for implementation_

- **RequestForm.jsx** — Create/edit resource request form
- **ResourceForm.jsx** — Allocate resource to request form
- **UserForm.jsx** — Create/edit user form for admin

### **Table Components** (`src/components/tables/`) — _Queued for implementation_

- **RequestsTable.jsx** — Sortable, paginated table of requests
- **AllocationsTable.jsx** — Sortable, paginated table of allocations
- **UsersTable.jsx** — User management table with edit/delete actions
- **AuditTable.jsx** — Activity log table with timestamps and action descriptions

### **Chart Components** (`src/components/charts/`) — _Queued for implementation_

- **RequestMetrics.jsx** — Pie/bar chart: requests by status (pending, fulfilled, cancelled)
- **ResponseTime.jsx** — Line chart: average response time trend over time
- **ResourceUtil.jsx** — Gauge chart: resource utilization percentage
- **SLACompliance.jsx** — Progress bar: SLA target achievement percentage

---

## 3. STATE FLOW ARCHITECTURE

```
┌─ App (BrowserRouter)
│
├─ Authentication Flow
│  ├─ useAuthStore (Zustand)
│  │  ├─ State: user, accessToken, refreshToken, isAuthenticated, error, isLoading
│  │  └─ Actions: login, register, logout, refreshAccessToken, changePassword
│  │
│  └─ apiClient.js (Axios instance)
│     ├─ Request interceptor: Inject Authorization header with bearer token
│     ├─ Response interceptor (401): Call /auth/refresh, update tokens, retry original request
│     └─ Response interceptor (403): Redirect to /unauthorized
│
├─ Request Management
│  ├─ useRequest() hook
│  │  ├─ State: requests[], loading, error
│  │  ├─ Actions: createRequest, getMyRequests, getPendingRequests, getRequest, updateRequest, cancelRequest
│  │  └─ Error handling: Try/catch with human-readable messages
│  │
│  └─ Services: requestService.js (API wrapper functions)
│
├─ Allocation Management
│  ├─ useAllocation() hook
│  │  ├─ State: allocations[], loading, error
│  │  ├─ Actions: manualAllocate, autoAllocate, suggestResources, getAllocation, markInTransit, markDelivered
│  │  └─ Error handling: Try/catch with human-readable messages
│  │
│  └─ Services: allocationService.js (API wrapper functions)
│
└─ Component Local State
   ├─ UI State: loading (boolean), error (string), successMessage (string)
   ├─ Form State: formData (object), errors (object)
   ├─ Filter State: filters (object), filteredData (array)
   └─ Selection State: selectedItem (object)

Data Flow:
User Interaction → Component State → API Call (via service) → Response interceptor (token refresh if needed) → Update Store → Re-render
```

**State Management Principles:**

1. **Zustand** for global auth (persistent to localStorage)
2. **React hooks** for component-level request/allocation data
3. **Local useState** for UI state (modals, filters, pagination)
4. **Axios interceptors** for automatic token refresh on 401

---

## 4. ERROR & LOADING HANDLING

### **Error Pattern**

```jsx
const { data, loading, error, setError } = useRequest();

useEffect(() => {
  (async () => {
    try {
      setLoading(true);
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err)); // Human-readable message from utils/errors.js
    } finally {
      setLoading(false);
    }
  })();
}, []);
```

### **Error Messages** (`src/utils/errors.js`)

| Category   | Message                 | Trigger                    |
| ---------- | ----------------------- | -------------------------- |
| Auth       | `SESSION_EXPIRED`       | Token invalid/expired      |
| Auth       | `NOT_AUTHORIZED`        | 403 response               |
| Request    | `REQUEST_CREATE_FAILED` | 400/500 on create          |
| Allocation | `NO_RESOURCES`          | No matching resource found |
| Network    | `NETWORK_ERROR`         | Connection lost            |
| Network    | `NETWORK_TIMEOUT`       | Request >30s               |

### **Loading UI Components**

- **PageSpinner** — Full-page loader with centered spinner + text
- **InlineSpinner** — Inline loading state within card/section
- **Button loading prop** — Spinner inside button during submission

### **Error UI Components**

- **ErrorAlert** — Displays error message with optional "Retry" and "Dismiss" buttons
- **WarningAlert** — Non-critical warnings
- **SuccessAlert** — Auto-dismiss success message (5s)
- **Error Boundary** — Catches component render errors (implement if needed)

### **Toast Notifications** (Planned)

- Success: "Request created successfully!" (auto-dismiss 5s)
- Error: "Failed to allocate resource" (sticky with retry button)
- Info: "Loading pending requests..." (sticky until loaded)

---

## 5. ROLE-BASED UI PROTECTION

### **Route Level**

```jsx
// In App.jsx routes
<Route
  path="/operator/dashboard"
  element={
    <RoleGuard requiredRoles={["OPERATOR", "ADMIN"]}>
      <OperatorDashboard />
    </RoleGuard>
  }
/>
```

**Route Protection Matrix:**
| Route | Public | Citizen | Operator | Admin |
|-------|--------|---------|----------|-------|
| /login | ✅ | ⚠️ (redirect) | ⚠️ (redirect) | ⚠️ (redirect) |
| /citizen/_ | ❌ | ✅ | ❌ | ❌ |
| /operator/_ | ❌ | ❌ | ✅ | ✅ |
| /admin/\* | ❌ | ❌ | ❌ | ✅ |

### **Component Level**

```jsx
// Conditional rendering
{
  user?.role === "ADMIN" && <AdminSettings />;
}

// Based on hook helper
{
  hasRole("OPERATOR") && <AllocationForm />;
}

// Multi-role check
{
  hasAnyRole(["OPERATOR", "ADMIN"]) && <PendingQueue />;
}
```

### **Action Level**

```jsx
// Show/hide buttons based on role and state
{
  canAllocate && isOperator && (
    <Button onClick={allocate}>Allocate Resource</Button>
  );
}
```

### **Middleware-Style Protection**

```jsx
export const ProtectedRoute = ({ children, requiredRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!requiredRoles.includes(user?.role))
    return <Navigate to="/unauthorized" />;

  return children;
};
```

---

## 6. DASHBOARD & ANALYTICS APPROACH

### **Citizen Dashboard** (`/citizen/dashboard`)

**Purpose:** Quick overview of personal request status and ability to create new requests

| **Metric**      | **Component** | **Data Source**                       | **Calculation**       |
| --------------- | ------------- | ------------------------------------- | --------------------- |
| Total Requests  | StatsCard     | requests.length                       | Count of all requests |
| Pending         | StatsCard     | requests.filter(s='PENDING').length   | Count                 |
| Fulfilled       | StatsCard     | requests.filter(s='FULFILLED').length | Count                 |
| Cancelled       | StatsCard     | requests.filter(s='CANCELLED').length | Count                 |
| Recent Requests | List          | requests.slice(0,5)                   | Latest 5 requests     |

**Visual Layout:**

```
┌─ Dashboard Header
├─ [Stats Cards: Total, Pending, Fulfilled, Cancelled]
├─ [Action Buttons: Create Request, View All]
└─ [Recent Requests List with status badges]
```

### **Operator Dashboard** (`/operator/dashboard`)

**Purpose:** Real-time overview of pending queue and active operations for rapid response

| **Metric**         | **Component**   | **Data Source**                           | **Calculation**  |
| ------------------ | --------------- | ----------------------------------------- | ---------------- |
| Pending Requests   | StatsCard       | requests.length (PENDING status)          | Count            |
| Total Allocations  | StatsCard       | allocations.length                        | Count            |
| In Transit         | StatsCard       | allocations.filter(s='IN_TRANSIT').length | Count            |
| Delivered          | StatsCard       | allocations.filter(s='DELIVERED').length  | Count            |
| 🚨 Urgent          | StatsCard (red) | requests.filter(p='EMERGENCY').length     | Count            |
| Request Queue      | RequestQueue    | requests (sorted by priority DESC)        | Latest 5 pending |
| Active Allocations | AllocationList  | allocations (s!='DELIVERED')              | Latest 5 active  |

**Visual Layout:**

```
┌─ Top Bar [Urgent Alert Badge]
├─ [KPI Cards: Pending, Total, In-Transit, Delivered, Urgent]
├─ [Pending Request Queue with Auto/Manual buttons]
└─ [Active Allocations with status updates]
```

### **Admin Dashboard** (`/admin/dashboard`)

**Purpose:** System-wide analytics for performance monitoring and compliance tracking

| **Metric**            | **Component** | **Data Source**              | **Calculation**                       |
| --------------------- | ------------- | ---------------------------- | ------------------------------------- |
| Total Requests        | StatsCard     | requests.length              | Count                                 |
| Total Allocations     | StatsCard     | allocations.length           | Count                                 |
| Fulfillment Rate (%)  | StatsCard     | (fulfilled/total)\*100       | Percentage                            |
| Avg Response Time (h) | StatsCard     | Mock: 2.5h                   | Time from request to allocation       |
| SLA Compliance (%)    | StatsCard     | Mock: 94%                    | % of requests delivered on-time       |
| Requests by Status    | ProgressBars  | requests grouped by status   | Pending%, Fulfilled%, Cancelled%      |
| Priority Distribution | BarChart      | requests grouped by priority | Count of EMERGENCY, HIGH, MEDIUM, LOW |
| Recent Allocations    | Table         | allocations.slice(0,5)       | Latest 5 with status                  |

**Visual Layout:**

```
┌─ [KPI Cards: Total Requests, Total Allocations, Fulfillment Rate, Response Time, SLA]
├─ [Requests by Status Chart | Priority Distribution Chart]
└─ [Recent Allocations Table]
```

### **Chart Types & Libraries**

- **Simple Progress Bars:** HTML div with CSS background (no library needed)
- **Line Charts (Response Time):** Use React-compatible library (e.g., Recharts)
- **Pie/Bar Charts:** Use Recharts or Chart.js
- **Gauge Charts (Resource Util):** Custom CSS or Recharts

### **Real-Time Updates** (Future)

- Poll `/api/requests/pending` every 10 seconds (Operator)
- Use WebSocket/SSE for live allocation updates
- Operator page: Auto-refresh pending queue

### **Analytics Export** (Future)

- CSV export for Audit Logs
- PDF report generation for Admin Reports
- Email scheduled reports

---

## 7. STATE FLOW EXAMPLES

### **Auth Flow**

```
User types email/password on Login page
  ↓
handleSubmit() → validate form
  ↓
useAuth.login(email, password)
  ↓
authService.login(email, password)
  ↓
apiClient.post('/auth/login', {email, password})
  ↓
Axios request interceptor adds Authorization header
  ↓
Backend returns {user, accessToken, refreshToken}
  ↓
AuthStore updates: set({user, accessToken, refreshToken, isAuthenticated: true})
  ↓
localStorage saved (via Zustand persist middleware)
  ↓
Navigate to /citizen/dashboard
```

### **Request Creation Flow**

```
User fills form on /citizen/create-request
  ↓
handleSubmit() → validateForm()
  ↓
useRequest.createRequest({resource_category, quantity, priority, ...})
  ↓
requestService.createRequest(data)
  ↓
apiClient.post('/api/requests', data)
  ↓
Request interceptor adds token
  ↓
Backend creates request → returns {id, status: 'PENDING', ...}
  ↓
setSuccess(true)
  ↓
After 2s → navigate('/citizen/my-requests')
  ↓
New page calls getMyRequests() → updates requests state
```

### **Token Refresh Flow** (Automatic on 401)

```
User makes request (e.g., getRequest/:id)
  ↓
apiClient.get('/api/requests/123')
  ↓
Request interceptor adds token (1-hour old, about to expire)
  ↓
Backend returns 401 (token expired)
  ↓
Response interceptor catches 401
  ↓
Call authService.refreshToken(refreshToken)
  ↓
apiClient.post('/auth/refresh', {refreshToken})
  ↓
Backend returns {accessToken: newToken, refreshToken: newRefresh}
  ↓
Update localStorage with new tokens
  ↓
Update AuthStore tokens
  ↓
Retry original request (getRequest) with new token
  ↓
Backend returns 200 with request data
  ↓
Component state updates, UI re-renders
```

---

## 8. IMPLEMENTATION CHECKLIST

### ✅ Completed

- [x] Spinner, Button, Input, Badge, Alert components
- [x] Main, Citizen, Operator, Admin layouts
- [x] ProtectedRoute, RoleGuard
- [x] Login, Register pages
- [x] Citizen: Dashboard, Create Request, My Requests pages
- [x] Operator: Dashboard, Pending Requests, Allocation Details pages
- [x] Admin: Dashboard page
- [x] Error pages (404, 403)
- [x] Auth store (Zustand) with token management
- [x] API client with interceptors
- [x] Custom hooks (useAuth, useRequest, useAllocation)
- [x] Service wrappers (authService, requestService, allocationService)

### ⏳ Queued for Phase 9

- [ ] Card components (RequestCard, AllocationCard, etc.)
- [ ] Form components (RequestForm, AllocationForm, etc.)
- [ ] Table components (RequestsTable, AllocationsTable, etc.)
- [ ] Chart components (RequestMetrics, ResponseTime, etc.)
- [ ] Admin pages (Users, Resources, Audit Logs, Reports, Settings)
- [ ] Operator: Active Allocations, Resource Suggestions pages
- [ ] Citizen: Request Detail, tracking page
- [ ] Toast notification system (Toastify or similar)
- [ ] Real-time updates (socket.io or polling)
- [ ] Analytics and reporting UI
- [ ] E2E tests (Cypress or Playwright)

### ⏳ Post-Implementation

- [ ] Performance optimization (lazy loading, memoization)
- [ ] Accessibility audit (a11y)
- [ ] Mobile responsiveness QA
- [ ] Browser compatibility testing
- [ ] Offline support (service workers)

---

## 9. KEY ARCHITECTURAL DECISIONS

1. **Zustand for Auth** — Lightweight, persists to localStorage, integrates with axios interceptors
2. **React Hooks for Requests/Allocations** — Flexible state per component, no global overhead
3. **Centralized API Client** — Single Axios instance with interceptors prevents code duplication
4. **Tailwind CSS** — Utility-first, custom theme for brand consistency
5. **Role-Based Layouts** — Separate sidebars per role prevents unauthorized UI exposure
6. **ProtectedRoute + RoleGuard** — Dual protection at route level prevents access
7. **Error Utilities** — Centralized error messages for consistency and i18n-ready
8. **Service Wrappers** — Keep components clean, API logic isolated in services

---

## 10. NEXT STEPS

1. ✅ **Complete Core Pages** (Login, Dashboards, Create Request, etc.) — DONE
2. **Implement Card & Form Components**
3. **Add Table Components with Sorting & Pagination**
4. **Build Analytics Charts** (Recharts/Chart.js integration)
5. **Complete Admin Pages** (User Management, Audit Logs, Reports)
6. **Add Toast Notifications**
7. **Implement Real-Time Updates** (WebSocket or polling)
8. **Test End-to-End** (Authentication flow, request creation, allocation updates)
9. **Performance Optimization** (Code splitting, lazy loading)
10. **Deploy to Production**
