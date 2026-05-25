# 🎨 React Frontend Architecture & Directory Roster

The Civic Pulse frontend is built on **React 18** and **Vite 5.4**, structured on the professional **Stitch Design System** standard. It features a responsive layout, comfortable typographies, vibrant HSL slate and navy colors, glassmorphic overlays, and fluid animations.

---

## 📁 Directory Roster

```
frontend/src/
├── api/                  # Unified HTTP network layer
│   ├── client.js         # Axios instance, dual interceptors, offline fallbacks
│   ├── auth.js           # REST authentication abstractions
│   ├── complaints.js     # Citizen complaints & notes calls
│   └── admin.js          # Departments, Wards, & Officers console actions
├── components/           # Reusable UI widgets
│   └── common/           # Shared UI buttons, modals, & loading skeletons
│       ├── Header.jsx    # Stitch responsive top navigation navbar
│       ├── Button.jsx    # Standardized system button
│       ├── Modal.jsx     # Backdrop-blurred custom popup modal
│       └── Loading.jsx   # Inline skeletons & spinner indicators
├── store/                # Zustand client-side domain stores
│   ├── authStore.js      # Persisted session JWT and profile token
│   ├── complaintStore.js # Active incident list and current ticket details
│   └── uiStore.js        # Active notifications, modals, and sidebar state
├── hooks/                # Domain-specific custom hooks
│   ├── useAuth.js        # Auth functions (login, register, logout)
│   ├── useComplaints.js  # Triage mutation triggers & detail fetches
│   ├── useNotification.js# Success/error banner trigger facade
│   └── useWs.js          # Websocket message subscriptions
├── pages/                # High-fidelity Stitch screen page views
│   ├── LandingPage.jsx   # Bento features grid & accessibility toggles
│   ├── LoginPage.jsx     # Modern login interface & development credential card
│   ├── RegisterPage.jsx  # Citizen validation signup form
│   ├── CitizenDashboard.jsx # Comfort-grid tables, categories, & ward query tools
│   ├── ComplaintForm.jsx # 4-step wizard incident submission flow
│   ├── ComplaintDetail.jsx # Bento details layout, SLA counter, location vector
│   ├── OfficerDashboard.jsx# Split-view triage queue, absolute GIS map drop-pins
│   ├── AdminDashboard.jsx # Analytics dashboards, volume trend charts, heatmap layers
│   ├── AdminOfficers.jsx # Roster management, access permissions, invites modal
│   ├── AdminDepartments.jsx# Unit management tables, CRUD forms, blur modals
│   └── AdminWards.jsx       # Territory definitions list, custom description forms
├── types/                # Types definition files
└── utils/                # System config constants & verification rules
```

---

## ⚡ Core Architecture Integrations

### 1. Resilient Offline Mock Fallback Layer
* **Location:** [client.js](file:///D:/Projects/Civic%20Pulse/frontend/src/api/client.js)
* **Mechanics:** The Axios client globally catches network error exceptions (e.g. `net::ERR_CONNECTION_REFUSED` or local dev-server proxy 502/504 gateway timeouts) and **instantly returns rich mock datasets**.
* **Utility:** Developers can run, test, and showcase **every single view, table, statistics panel, and popup completely offline** without needing a running Spring Boot backend!

### 2. Secure STOMP Websocket Safety Client
* **Location:** [socket.js](file:///D:/Projects/Civic%20Pulse/frontend/src/services/socket.js)
* **Mechanics:** Checks the active STOMP connection state (`client.connected`) before calling `client.subscribe()`.
* **Utility:** If the Spring Boot backend is offline, the client safely **buffers and queues subscriptions inside the `onConnect` callback**, preventing fatal browser console crashes (`TypeError: There is no underlying STOMP connection`) and allowing the dev server to run cleanly offline.

### 3. Persisted Zustand State Engine
* **Location:** [store/authStore.js](file:///D:/Projects/Civic%20Pulse/frontend/src/store/authStore.js)
* **Mechanics:** The authentication store utilizes the `persist` middleware, automatically caching active session JWTs and user profile details inside `localStorage`. Other custom hooks like `useWs` read directly from this cache to ensure secure handshakes.

---

## 🛠️ Compilation & Testing Commands

All packages can be scanned, tested, and built inside the `frontend/` workspace:

### 1. Development Dev Server
Starts the local development server on port `3000` with hot-module reloading:
```bash
npm run dev
```

### 2. Unit Testing Suite
Runs all mock tests inside `src/__tests__/` to verify page and hook logic (uses Vitest):
```bash
npm run test:run
```

### 3. Production Bundling
Performs tree-shaking, CSS purging, and minification to compile a production-ready bundle inside `dist/`:
```bash
npm run build
```
