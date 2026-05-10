# Antigravity Project Skill Map - Vehicle Showroom Management

> [!NOTE]
> This file is designed to help Antigravity (and other AI agents) quickly understand the project structure and logic, saving tokens and improving accuracy.

## 🛠 Tech Stack
- **Backend**: Express.js, MySQL (Sequelize ORM)
- **Frontend**: React (Vite), React Router v6, Tailwind CSS
- **Authentication**: JWT-based via `authMiddleware.js` and frontend `AuthContext`
- **File Uploads**: `multer` (memoryStorage) for image handling

## 📁 Directory Structure
### 🔹 Backend (`backend/src/`)
- `models/`: Sequelize models. Associations are defined centrally in `index.js`.
- `routes/`: API endpoint definitions (e.g., `vehicleRoutes.js`, `bookingRoutes.js`, `userRoutes.js`).
- `controllers/`: Business logic handling requests.
- `middlewares/`: 
  - `authMiddleware.js`: Handles JWT verification and role-based authorization.
  - Audit log hooks (implemented in `models/index.js` via Sequelize lifecycle hooks).

### 🔹 Frontend (`frontend/src/`)
- `pages/`: View components categorized into Admin (inside DashboardLayout) and Public (Standalone).
- `components/`: Reusable UI building blocks and `ProtectedRoute`.
- `context/`: Global state management (`AuthContext`, `ThemeContext`).
- `layouts/`: Contains `DashboardLayout` for the admin portal.
- `services/`: API interaction layer.

## 🔑 Key Domain Models & Concepts
1. **Vehicles & Brands**: `Vehicle` and `VehicleBrand` models manage the primary catalog inventory.
2. **Transactions & Bookings**: Managed via `Booking.js`. Handles customer purchases, tracking statuses, and history.
3. **Multi-Office & Locations**: The system supports multiple offices/branches (`Office.js`, `Location.js`) with a hierarchical structure. Data like users and vehicles are tied to specific offices.
4. **Users, Roles & Agents**: `User`, `Role`, and `SalesAgent` handle authentication, dynamic permissions, and sales performance tracking.
5. **Promotions**: System to handle discounts, banners, and marketing campaigns (`Promotion.js`).
6. **Showroom Settings**: Global settings and public catalog UI customizations (`ShowroomSetting.js`).

## ⚙️ Core Application Features
1. **Audit & Activity Tracking**: 
   - *Audit Trail*: All model changes (INSERT/UPDATE/DELETE) are automatically logged via Sequelize hooks.
   - *Activity Log*: Granular tracking of user actions across the platform.
2. **Public Catalog Routing**: A public-facing showroom catalog is accessible dynamically via the route `/c/:slug` (with nested `/about` and `/contact` subpages).
3. **Admin Dashboard & Reporting**: Secured admin portal offering rich analytics through Analysis, Finance, and Sales report pages.
4. **Recycle Bin (Soft Deletion)**: Soft-deleted records (like vehicles, bookings, etc.) are hidden from normal views and manageable via the dedicated Recycle Bin page for restoration or permanent deletion.
5. **Session Management**: Admins can monitor and terminate active user sessions across the system (`AdminSessions.jsx`).

## 🚀 Commands
- `npm run dev`: Starts both backend and frontend concurrently.
- `npm run backend`: Starts only the backend server (typically using nodemon).
- `npm run frontend`: Starts only the frontend application (Vite dev server).

---
*Updated by Antigravity*
