# FoodLoop AI

> **Tagline:** Connect Surplus Food. Nourish Communities. Reduce Waste.  
> **Status:** Production-Ready Educational Mini-Project • Full Working Implementation

FoodLoop AI is an integrated web platform connecting commercial and local food providers (restaurants, caterers, bakeries) with verified community kitchens and shelters, supported by volunteer transport couriers. The platform tracks surplus food donations across an explicit 7-step lifecycle with transparent rule-based match recommendations and audit logs.

---

## 📑 Table of Contents
1. [Key Features & Capabilities](#key-features--capabilities)
2. [Architecture & Design Principles](#architecture--design-principles)
3. [Technology Stack](#technology-stack)
4. [Demo Accounts & Credentials](#demo-accounts--credentials)
5. [Prerequisites](#prerequisites)
6. [Getting Started & Installation](#getting-started--installation)
7. [Running the Application](#running-the-application)
8. [Testing & Verification](#testing--verification)
9. [REST API Documentation](#rest-api-documentation)
10. [Database Management & Docker](#database-management--docker)
11. [Troubleshooting](#troubleshooting)

---

## 1. Key Features & Capabilities

- **Role-Based Workflows**: Tailored, protected portals for **Providers**, **Recipient NGOs**, **Volunteers**, and **Administrators**.
- **Transparent Matching Engine (FR-07)**: Explainable rule-based scoring without fake ML claims. Factors:
  - Distance Suitability: **35%** (Haversine formula with fair missing-coordinate renormalization)
  - Pickup Time Window: **25%**
  - Quantity Fit: **20%**
  - Category Compatibility: **10%**
  - Urgency (Approaching Expiry): **10%**
- **Strict 7-Step Donation Lifecycle**:
  `AVAILABLE` &rarr; `REQUESTED` &rarr; `ACCEPTED` &rarr; `VOLUNTEER_ASSIGNED` &rarr; `PICKED_UP` &rarr; `DELIVERED` &rarr; `COMPLETED`
  *(Exception states: `REJECTED`, `CANCELLED`, `EXPIRED`)*
- **Organization Verification Gate**: Only admin-verified recipient organizations can reserve surplus food. Unverified organizations can browse public listings but cannot reserve portions until approved.
- **Atomic Quantity & Concurrency Protection**: Multi-request transactions prevent oversubscription and duplicate task claims.
- **In-App Notification Center**: Real-time alerts for incoming requests, approvals, courier assignments, and deliveries.
- **Append-Only Audit Trail (FR-09)**: All operational events recorded with actor ID, timestamp, and safe metadata (sensitive data redacted). Includes CSV export.
- **One-Click Demo Persona Switcher**: Instant switching between 7 test personas directly from the top banner or login page.

---

## 2. Architecture & Design Principles

- **Safety First**: FoodLoop AI coordinates redistribution; providers are strictly required to confirm food safety, handling, and safe shelf-life before listing.
- **Transparency & Honest Claims**: No fabricated AI/ML models, carbon credits, or fake user statistics. Metrics display real database aggregates.
- **Zero-Friction Local Execution**: Configured out-of-the-box with Prisma SQLite (`dev.db`), requiring zero external daemons or Docker to run immediately, while including full PostgreSQL and Docker Compose configuration.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS with custom HSL palette & Google Fonts (Outfit & Inter)
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Testing**: Vitest & React Testing Library with JSDOM

### Backend
- **Runtime**: Node.js v20+ with Express & TypeScript (`tsx`)
- **ORM & Database**: Prisma ORM with SQLite (default) and PostgreSQL support
- **Authentication**: JWT & secure password hashing via `bcryptjs`
- **Validation**: Zod schema validation
- **Security**: Helmet headers, CORS restrictions, express-rate-limit
- **Testing**: Vitest & Supertest for end-to-end API integration tests

---

## 4. Demo Accounts & Credentials

The seed script initializes pre-configured accounts representing every platform role. All accounts share the password: `Password123!`

| Role | Persona Name | Email | Password | Role Description |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Elena Vance | `admin@foodloop.org` | `Password123!` | Verify NGOs, manage users, review audit logs & metrics |
| **Provider 1** | Chef Marco Rossi | `bistro@foodloop.org` | `Password123!` | Green Harvest Bistro (Prepared meals, grain bowls, produce) |
| **Provider 2** | Sarah Jenkins | `bakery@foodloop.org` | `Password123!` | Sunrise Artisan Bakery (Sourdough loaves, bagels) |
| **Recipient (Verified)** | David Miller | `shelter@foodloop.org` | `Password123!` | Hope Community Kitchen (Verified NGO, can reserve food) |
| **Recipient (Pending)** | Amara Chen | `youth@foodloop.org` | `Password123!` | Northside Youth Project (Pending admin verification) |
| **Volunteer 1** | Alex Rivera | `alex.volunteer@foodloop.org` | `Password123!` | Cargo Bike courier (Claims tasks, updates pickup & delivery) |
| **Volunteer 2** | Maya Patel | `maya.volunteer@foodloop.org` | `Password123!` | Van transport volunteer (Handles larger crates) |

> 💡 **Tip:** You can switch between any of these accounts in 1 click using the top **Demo Mode** banner!

---

## 5. Prerequisites

- **Node.js**: v20.x or higher (tested on Node v24)
- **npm**: v10.x or higher

---

## 6. Getting Started & Installation

1. **Clone or navigate to the workspace**:
   ```bash
   cd "d:/Ai-Food Loop"
   ```

2. **Install all dependencies** (workspaces handle both frontend & backend):
   ```bash
   npm install
   ```

3. **Initialize the Database Schema & Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

4. **Seed the Database with Demo Data**:
   ```bash
   npm run seed
   ```

---

## 7. Running the Application

To start both the Backend API server and Vite Frontend concurrently:
```bash
npm run dev
```

Alternatively, run each in separate terminals:
- **Backend Server** (runs on port 5000):
  ```bash
  npm run dev --workspace=backend
  ```
- **Frontend App** (runs on port 3000):
  ```bash
  npm run dev --workspace=frontend
  ```

### Access URLs:
- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check Endpoint**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 8. Testing & Verification

Run the complete test suite (both backend unit/integration tests and frontend component tests):
```bash
npm run test
```

### Backend Unit & Integration Tests:
- `tests/unit/haversine.test.ts`: Great-circle distance calculations & missing coordinate handling
- `tests/unit/matching.test.ts`: Explainable recommendation factors, weights, and eligibility gates
- `tests/unit/lifecycle.test.ts`: State transition rules and backwards transition rejection
- `tests/integration/api.test.ts`: Authentication, unverified recipient blocking, provider ownership checks, oversubscription protection, audit log creation, and health checks

### Frontend Tests:
- `src/App.test.tsx`: Status badges, lifecycle timeline rendering, and transparent match score breakdown cards

---

## 9. REST API Documentation

All API endpoints are prefixed with `/api/v1`.

### Authentication
- `POST /api/v1/auth/register`: Register new user (and optional organization)
- `POST /api/v1/auth/login`: Authenticate and receive JWT token
- `POST /api/v1/auth/logout`: Discard authentication session
- `GET /api/v1/auth/me`: Get current authenticated user profile

### Food Listings
- `GET /api/v1/listings`: Search, filter by category/urgency/distance, with pagination
- `GET /api/v1/listings/:id`: Fetch listing details with match recommendation
- `POST /api/v1/listings`: Create surplus food listing (Provider only)
- `PATCH /api/v1/listings/:id`: Update owned listing (Provider only)
- `POST /api/v1/listings/:id/cancel`: Cancel active listing with reason

### Donation Requests & Coordination
- `POST /api/v1/requests/listings/:id/requests`: Verified recipient requests quantity
- `GET /api/v1/requests/mine`: Recipient's submitted requests and statuses
- `GET /api/v1/requests/provider`: Incoming requests for provider's listings
- `POST /api/v1/requests/:id/accept`: Provider accepts request (atomic quantity deduction)
- `POST /api/v1/requests/:id/reject`: Provider declines request with mandatory reason
- `POST /api/v1/requests/:id/cancel`: Recipient cancels request before courier assignment

### Volunteer Couriers
- `GET /api/v1/volunteer/tasks`: Unassigned tasks ready for courier collection
- `POST /api/v1/volunteer/claim/:id`: Courier claims delivery task (atomic assignment lock)
- `GET /api/v1/volunteer/mine`: Courier's active and completed assignments
- `POST /api/v1/assignments/:id/pickup`: Record pickup timestamp and transit notes
- `POST /api/v1/assignments/:id/deliver`: Confirm safe delivery to kitchen supervisor

### Matching & Recommendations
- `GET /api/v1/matches/recommended`: Tailored explainable recommendations for verified recipient

### Notifications
- `GET /api/v1/notifications`: In-app notification feed with unread count
- `POST /api/v1/notifications/:id/read`: Mark single notification as read
- `POST /api/v1/notifications/read-all`: Mark all notifications as read

### Admin & Analytics
- `GET /api/v1/admin/overview`: Real-time operational database counters
- `GET /api/v1/admin/organizations/pending`: Pending NGO verification queue
- `POST /api/v1/admin/organizations/:id/approve`: Approve NGO verification
- `POST /api/v1/admin/organizations/:id/reject`: Reject NGO verification with reason
- `GET /api/v1/admin/users`: View all platform accounts
- `PATCH /api/v1/admin/users/:id/status`: Suspend or reactivate user account
- `GET /api/v1/admin/audit-logs`: Inspect append-only audit trail
- `GET /api/v1/admin/export/audit-logs`: Export audit trail to CSV file
- `GET /api/v1/analytics/summary`: Real aggregate distribution metrics

---

## 10. Database Management & Docker

### Default Setup (SQLite)
The application is pre-configured with SQLite (`backend/prisma/dev.db`), which runs completely locally without external database software or Docker.

### Optional PostgreSQL Setup (Docker Compose)
If PostgreSQL is desired:
1. Start the PostgreSQL container:
   ```bash
   docker compose up -d
   ```
2. Update `backend/.env` with your PostgreSQL URL:
   ```env
   DATABASE_URL="postgresql://foodloop:foodloop_pass@localhost:5432/foodloop_db?schema=public"
   ```
3. Update `provider = "postgresql"` in `backend/prisma/schema.prisma`.
4. Run migrations and re-seed:
   ```bash
   npm run prisma:push
   npm run seed
   ```

---

## 11. Troubleshooting

- **EADDRINUSE (Port 5000 or 3000 already in use)**:
  Change the `PORT` variable in `backend/.env` or specify `--port 3001` in Vite.
- **Prisma Client not found**:
  Run `npm run prisma:generate` to rebuild Prisma client bindings.
- **Unverified Recipient Cannot Request Food**:
  This is an intended security feature. Either switch to the verified recipient demo account (`shelter@foodloop.org`) or log in as Admin (`admin@foodloop.org`) and approve the pending recipient organization.
