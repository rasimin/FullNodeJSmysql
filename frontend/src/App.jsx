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
import RoleManagement from './pages/RoleManagement';
import ActivityLog from './pages/ActivityLog';
import AuditTrail from './pages/AuditTrail';
import Profile from './pages/Profile';
import Reports from './pages/Reports';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/brands" element={<BrandManagement />} />
              <Route path="/offices" element={<OfficeManagement />} />
              <Route path="/activities" element={<ActivityLog />} />
              <Route path="/roles" element={<RoleManagement />} />
              <Route path="/audit-trails" element={<AuditTrail />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
              {/* Add other protected routes here */}
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
