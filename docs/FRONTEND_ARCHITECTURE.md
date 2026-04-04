# Frontend Architecture Documentation

## 1. Frontend Stack

- `React 19`
- `Vite`
- `React Router`
- `Zustand` for auth persistence
- `Axios` via shared `apiClient`
- `Leaflet` / `react-leaflet` for map-based complaint input and visualizations
- `Recharts` for admin analytics

---

## 2. Current Route Structure

### Public Routes

| Page | Path | Purpose |
| --- | --- | --- |
| Landing | `/` | Entry page |
| Login | `/login` | User authentication |
| Register | `/register` | Citizen registration |
| Forgot Password | `/forgot-password` | Password recovery request |
| Reset Password | `/reset-password/:token` | Password reset flow |
| Unauthorized | `/unauthorized` | 403 screen |
| Not Found | `/*` | 404 screen |

### Citizen Routes

| Page | Path | Purpose |
| --- | --- | --- |
| Dashboard | `/citizen/dashboard` | Citizen overview |
| Create Complaint | `/citizen/create-request` | Submit new complaint |
| My Complaints | `/citizen/my-requests` | List/filter citizen complaints |

### Operator Routes

| Page | Path | Purpose |
| --- | --- | --- |
| Dashboard | `/operator/dashboard` | Operator overview |
| Complaints | `/operator/complaints` | Assigned complaints and actions |
| Profile | `/operator/profile` | Provider/operator profile |
| Complaint Detail | `/operator/complaint/:id` | Operator complaint view |

### Admin Routes

| Page | Path | Purpose |
| --- | --- | --- |
| Dashboard | `/admin/dashboard` | KPIs, charts, heatmaps, overdue queue |
| Pending Complaints | `/admin/pending-complaints` | Assignment workflow |
| Users | `/admin/users` | User and operator administration |
| Activity Logs | `/admin/activity-logs` | Admin audit history |
| Add Operator | `/admin/add-operator` | Operator creation workflow |

### Shared Protected Route

| Page | Path | Purpose |
| --- | --- | --- |
| Complaint Timeline / Detail | `/complaints/:id` | Role-aware complaint detail page |

---

## 3. Role-Based Navigation

### Citizen UX

```text
Login/Register
  -> Citizen Dashboard
  -> Create Complaint
  -> My Complaints
  -> Complaint Detail / Timeline
```

### Operator UX

```text
Login
  -> Operator Dashboard
  -> Complaints List
  -> Complaint Detail
  -> Start / Update / Resolve
  -> Profile / Provider Services
```

### Admin UX

```text
Login
  -> Admin Dashboard
  -> Pending Complaints
  -> Assign Operators
  -> Users / Add Operator
  -> Activity Logs
```

---

## 4. Major Frontend Modules

### 4.1 Authentication

Files:

- `src/store/authStore.js`
- `src/services/authService.js`
- `src/services/apiClient.js`
- `src/components/ProtectedRoute.jsx`

Responsibilities:

- persist user and tokens
- initialize auth from local storage
- refresh tokens when possible
- expose role checks
- guard routes by role

### 4.2 Complaint Management

Files:

- `src/hooks/useRequest.js`
- `src/services/requestService.js`
- `src/pages/citizen/CreateRequestPage.jsx`
- `src/pages/citizen/MyRequestsPage.jsx`
- `src/pages/ComplaintDetail.jsx`
- `src/pages/operator/ComplaintsPage.jsx`
- `src/pages/admin/PendingComplaintsPage.jsx`

Responsibilities:

- create complaint
- load citizen complaints
- load operator complaint queue
- load admin complaint views
- assign/start/resolve/status updates
- complaint timeline

### 4.3 Admin Analytics

Files:

- `src/pages/admin/DashboardPage.jsx`
- `src/components/admin/AnalyticsCharts.jsx`
- `src/components/admin/HeatmapView.jsx`
- `src/components/admin/OperatorPerformance.jsx`
- `src/components/admin/AdminLocationsMap.jsx`

Responsibilities:

- total counts and KPIs
- overdue complaint monitoring
- category/status/daily trend charts
- area and location visualization
- operator performance reporting

### 4.4 Provider / Operator Profile

Files:

- `src/hooks/useProvider.js`
- `src/services/providerService.js`
- `src/pages/operator/ProfilePage.jsx`
- `src/pages/operator/ProviderServicesPage.jsx`

Responsibilities:

- maintain provider profile
- list service catalog
- manage provider service offerings

---

## 5. Layout Architecture

### Shared Layouts

- `MainLayout`: public/auth pages
- `CitizenLayout`: citizen navigation shell
- `OperatorLayout`: operator navigation shell
- `AdminLayout`: admin navigation shell
- `TopUtilityBar`: shared utility/header support

These layouts keep navigation and role-specific structure separate while reusing common UI
components.

---

## 6. Component Structure

### Common Components

Located in `src/components/common/`

- `Button`
- `Input`
- `Badge`
- `Alert`
- `MetricCard`
- `Spinner`

Used for:

- forms
- loading states
- status indicators
- dashboard summaries

### Operator Components

Located in `src/components/operator/`

- `OperatorDashboard`
- `MyComplaints`
- `ComplaintCard`
- `Sidebar`
- `StatCard`
- `MiniOperatorChart`

### Admin Components

Located in `src/components/admin/`

- `AnalyticsCharts`
- `HeatmapView`
- `OperatorPerformance`
- `AdminLocationsMap`

---

## 7. State Management Flow

### Global Auth State

Implemented with Zustand in `authStore`.

Stored state:

- `user`
- `accessToken`
- `refreshToken`
- `isAuthenticated`
- `isLoading`
- `error`

Main actions:

- `initializeAuth`
- `register`
- `login`
- `googleLogin`
- `logout`
- `refreshAccessToken`
- `changePassword`
- `updateUser`
- `hasRole`
- `hasAnyRole`

### Feature Hook State

Feature data is managed in custom hooks rather than one large global store.

Examples:

- `useRequest`
- `useAllocation`
- `useProvider`
- `useAuth`

This keeps feature state localized and easier to reason about.

---

## 8. API Client Design

`apiClient.js` is the shared Axios layer.

Responsibilities:

- base URL configuration
- attaching bearer token from auth store
- centralized error handling
- refresh-token flow integration

Request pattern:

```text
Page/Component
  -> custom hook
  -> service wrapper
  -> apiClient
  -> backend API
  -> response to hook state
  -> UI update
```

---

## 9. Current Complaint UI Flow

### Citizen Complaint Creation

Screen: `CreateRequestPage`

Features:

- complaint category dropdown
- description field
- area, address, pincode
- map click to set latitude/longitude
- optional image upload with compression
- dynamic area options from backend, with fallback defaults

Flow:

```text
Citizen fills form
  -> client validation
  -> requestService.createRequest()
  -> POST /requests
  -> success message
  -> redirect to /citizen/my-requests
```

### Citizen Complaint Tracking

Screen: `MyRequestsPage`

Features:

- filter by status
- filter by category
- text search
- view operator name, timestamps, and resolution note
- open complaint detail page

### Operator Complaint Handling

Screen: `OperatorComplaintsPage`

Features:

- load assigned complaints
- start work from complaint list
- open complaint detail page

### Admin Dashboard

Screen: `AdminDashboardPage`

Features:

- complaint KPIs
- resolution rate
- overdue complaints
- analytics charts
- heatmap
- admin location map
- operator performance panel
- area master creation and listing

---

## 10. Error and Loading Handling

### Loading

The frontend uses:

- `InlineSpinner`
- loading button states
- section-level conditional rendering

### Error Handling

Pattern:

- service throws API error
- hook stores readable message
- page renders `ErrorAlert`

This pattern is used throughout auth, complaint, and admin flows.

---

## 11. Route Protection

Route protection is handled by `RoleGuard`.

Rules:

- citizen routes: citizen only
- operator routes: operator and sometimes admin
- admin routes: admin only
- shared complaint detail: citizen, operator, admin

This keeps routing behavior consistent with backend authorization.

---

## 12. Mismatches Removed from Older Docs

Older frontend documentation referenced pages such as:

- `/operator/pending-requests`
- `/operator/active-allocations`
- `/operator/resource-suggestions`
- `/admin/resources`
- `/admin/reports`
- `/admin/settings`
- `/citizen/request/:id`

Those are not the current primary routed pages in `App.jsx`, so they should not be treated as
implemented frontend routes.

---

## 13. Current Strengths

- role-based routing is clear
- auth persistence is implemented
- complaint creation UX is mature
- admin dashboard is feature-rich
- location-based complaint input is integrated
- complaint tracking is available across roles

---

## 14. Next Frontend Improvements

- unify operator status actions with backend-supported routes
- document remaining provider/allocation screens more explicitly
- add real-time notifications if socket support is introduced
- improve responsive and accessibility coverage
- add automated frontend tests
