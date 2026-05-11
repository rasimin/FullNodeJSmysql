# Vehicle Showroom Application - Skill Map

This document provides a distilled overview of the application's structure and logic to assist Antigravity in future tasks.

## 🚀 Tech Stack
- **Backend**: Node.js (Express), MySQL, Sequelize (ORM).
- **Frontend**: Vite, React, React Router, Tailwind CSS, Lucide-react.
- **Utilities**: `concurrently`, `jsonwebtoken`, `multer`, `react-quill-new`.

## 📂 Project Structure
```text
/ (Root)
├── backend/            # Express Server
│   ├── src/
│   │   ├── config/     # Database & App config
│   │   ├── controllers/# Business logic
│   │   ├── models/     # Sequelize models & associations
│   │   ├── routes/     # API Endpoints
│   │   ├── middlewares/# Auth & validation
│   │   └── services/   # Helper services
│   └── uploads/        # Publicly accessible files
└── frontend/           # React App
    ├── src/
    │   ├── components/ # Reusable UI components
    │   ├── context/    # Auth & Theme state
    │   ├── pages/      # Route-level components
    │   │   ├── showroom-settings/ # Tabbed components for catalog settings
    │   │   └── ...
    │   ├── layouts/    # UI wrappers (DashboardLayout)
    │   └── services/   # API call wrappers
```

## 🏗️ Core Backend Modules
### 1. Database Models (`backend/src/models/index.js`)
- **Identity**: `User`, `Role`, `UserSession`.
- **Org**: `Office` (Hierarchical, includes email/phone), `Location`, `SalesAgent`.
- **Inventory**: `Vehicle`, `VehicleBrand`, `VehicleImage`, `VehicleDocument`.
- **Operations**: `Booking`, `BookingArchive`, `BookingDocument`.
- **Marketing**: `Promotion`.
- **System**: `AuditTrail`, `ActivityLog`, `SystemSetting`, `ShowroomSetting`.

### 2. Key API Routes
- `/api/auth`: Login, Logout, Session management.
- `/api/vehicles`: CRUD for vehicle inventory.
- `/api/bookings`: Managing vehicle reservations/transactions.
- `/api/reports`: Sales, Finance, and Analysis reports.
- `/api/offices`: Managing showroom branches.
- `/api/users`: Admin user management.

## 💻 Frontend Architecture
### 1. Routing (`frontend/src/App.jsx`)
- **Public**: `/c/:slug` (Catalog), `/product/:id`, `/promotion/:id`.
- **Private (Admin)**: `/`, `/users`, `/vehicles`, `/transactions`, `/reports`, etc.

### 2. State Management
- `AuthContext`: Handles JWT, user profile, and authentication state.
- `ThemeContext`: Dark/Light mode management.

### 3. Key Layouts & Patterns
- `DashboardLayout`: Sidebar-based navigation for the admin panel.
- **Tabbed Settings Pattern**: Used in `ShowroomSettings.jsx` to lazy-load independent forms (LinkStatus, BannerContent, AboutUs) for better performance and modularity.

## 🛠️ Common Workflows
- **Running Dev**: Run `run_dev.bat` or `npm run dev` in the root.
- **Database Sync**: Uses `backend/sync-db.js` for migrations/syncing.
- **Audit Logging**: Hooks are attached to Sequelize models in `models/index.js` to track all changes (INSERT/UPDATE/DELETE).

## 💡 AI Assistance Tips
- Always check `skill_map.md` in the root before proposing architectural changes.
- Maintain consistency with the **Tabbed Settings Pattern** for complex configuration pages.
- Ensure all API calls use the wrappers in `frontend/src/services/`.
