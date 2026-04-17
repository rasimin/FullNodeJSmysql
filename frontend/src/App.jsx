import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import OfficeManagement from './pages/OfficeManagement';
import Vehicles from './pages/Vehicles';
import BrandManagement from './pages/BrandManagement';
import LocationManagement from './pages/LocationManagement';
import RoleManagement from './pages/RoleManagement';
import ActivityLog from './pages/ActivityLog';
import AuditTrail from './pages/AuditTrail';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import SalesAgents from './pages/SalesAgents';
import Catalog from './pages/Catalog';
import SecuritySettings from './pages/SecuritySettings';
import Sessions from './pages/Sessions';
import AdminSessions from './pages/AdminSessions';
import LandingPage from './pages/LandingPage';
import SalesReport from './pages/SalesReport';
import AnalysisReport from './pages/AnalysisReport';
import Transactions from './pages/Transactions';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              {/* Layout for Admin Pages */}
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Reports />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/sales-agents" element={<SalesAgents />} />
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/brands" element={<BrandManagement />} />
                <Route path="/offices" element={<OfficeManagement />} />
                <Route path="/activities" element={<ActivityLog />} />
                <Route path="/roles" element={<RoleManagement />} />
                <Route path="/locations" element={<LocationManagement />} />
                <Route path="/audit-trails" element={<AuditTrail />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/security-settings" element={<SecuritySettings />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/admin-sessions" element={<AdminSessions />} />
                <Route path="/sales-report" element={<SalesReport />} />
                <Route path="/analysis-report" element={<AnalysisReport />} />
                <Route path="/old-dashboard" element={<Dashboard />} />
              </Route>

              {/* Standalone Page (New Tab) */}
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/landing-page" element={<LandingPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
