# 🎯 Civic Pulse - AI-Powered Citizen Service Management System

Civic Pulse is a state-of-the-art full-stack platform designed to revolutionize municipal communications, automate incident triaging, and provide regional administrators with comprehensive operational transparency. 

Underpinned by a **Spring Boot** Java backend and a high-fidelity **React** frontend structured on the premium **Stitch Design System**, Civic Pulse harnesses AI categorization, real-time STOMP SockJS WebSockets, and geospatial mapping to deliver an institutional-grade service desk.

---

## 🏗️ System Architecture & Data Flow

```
+--------------------------------------------------------------+
|                         REACT CLIENT                         |
|  - Stitch Design System (Public Sans, HSL Slate/Navy Palette) |
|  - Domain Zustand Stores & Reusable Hooks (useAuth, useWs)    |
|  - Real-Time GIS Ward Maps & Interactive Incident Wizards   |
+------------------------------+-------------------------------+
                               |
                   HTTP GET/POST/PUT/DELETE
                     & STOMP WebSockets
                               |
                               v
+------------------------------+-------------------------------+
|                       API CONTROLLERS                        |
|  - JWT Auth Handler, Role-Based Route Filters (RBAC)         |
|  - Dispatch Triage, Analytics, Department Directories         |
+------------------------------+-------------------------------+
                               |
                               v
+------------------------------+-------------------------------+
|                    BUSINESS SERVICE LAYER                    |
|  - Extensible AI Enrichment Chain of Responsibility Pipeline |
|  - Strategy Pattern LLM Provider Abstractions (Spring AI)    |
+------------------------------+-------------------------------+
                               |
                               v
+------------------------------+-------------------------------+
|                       REPOSITORY LAYER                       |
|   - MySQL/PostgreSQL Data JPA + Vector Similarity Embeddings  |
|   - Redis Session Blacklisting and Real-time Queue Caches    |
+--------------------------------------------------------------+
```

---

## 🚀 Technology Stack

### Frontend Architecture
* **Core Framework:** React 18.3 (Vite 5.4 bundler)
* **Design Token System:** Custom Tailwind CSS 3.4 (Stitch corporate tokens: Public Sans typography, slate/navy HSL scales, 4px/8px comfortable spacing grid, rounded-xl shapes)
* **Global State Engine:** Zustand 5.0 (Zustand persists tokens & maps local state domain-by-domain)
* **HTTP Client:** Axios 1.7 with dual token & error interceptors
* **Real-time Client:** SockJS Client + STOMP JS
* **GIS Visualizers:** Leaflet Maps (`react-leaflet` integration)
* **Graphical Charts:** Recharts 2.13
* **Fluid Physics Animations:** Framer Motion 11.11

### Backend Architecture
* **Core Framework:** Spring Boot 3.3.5 (Java 17)
* **Security & Auth:** Spring Security + Stateless JWT Token verification
* **AI Cognitive Pipelines:** Spring AI 1.0.0 (Supports OpenAI / Ollama Spring abstractions)
* **Data Layer:** Spring Data JPA + MySQL/PostgreSQL
* **Vector Store:** pgvector database embeddings (supports semantic duplicate checks and chatbot RAG)
* **Session Cache:** Redis
* **Real-time Broadcasts:** WebSocket Message Broker + STOMP protocol

---

## 🛠️ Global Core Features

1. **4-Step Citizen Incident Wizard:** Lets citizens report potholes, water main leaks, and structural damages with geolocator coordinates and multiple high-res image attachments.
2. **Real-time Officer Triage Console:** Prioritized incident queues featuring a split-view GIS map, absolute drop-pins, live audio-synthesizer beep alarms, and warning alert banners.
3. **Advanced KPI Analytics Board:** Displays volume trends charts, compliance counts, category distribution gauges, and metropolitan ward load heatmaps.
4. **Persistent Notification Feed:** Includes filter tabs (All, Unread, Mentions, Alerts) to keep administrators synced, supporting inline thread replies and slide-to-clear actions.

---

## 📥 Getting Started

### 1. Spring Boot Backend
1. Configure database profiles inside [application.yml](file:///D:/Projects/Civic%20Pulse/backend/src/main/resources/application.yml).
2. Run standard Maven package compilation:
   ```bash
   cd backend
   ./mvnw clean install
   ```
3. Run the Spring Boot server:
   ```bash
   ./mvnw spring-boot:run
   ```
   *The backend will boot on port `8080`.*

### 2. React Vite Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *The server will boot on port `3000`.*

---

## 💻 Offline Development & Demo Mode

Civic Pulse has a **built-in high-fidelity frontend mock interceptor layer**. If the Java Spring Boot backend is offline, the React app **gracefully and instantly falls back to offline mock datasets**, allowing you to test every view, dashboard, and form completely offline!

Sign in immediately using the following mock accounts (any password):

* 👑 **Administrator:** `admin@civicpulse.gov.in` (Password: `password123`)
* 🛡️ **Department Officer:** `officer@civicpulse.gov.in` (Password: `password123`)
* 🏠 **Verified Citizen:** `citizen@civicpulse.gov.in` (Password: `password123`)
