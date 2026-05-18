import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoutes';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/auth/Login';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import PerformanceReview from './pages/employee/PerformanceReview';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerApprovals from './pages/manager/ManagerApprovals';
import AdminDashboard from './pages/admin/AdminDashboard';

// Custom App Wrapper
const AppRedirector = () => {
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Secure Portal Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              
              {/* Employee Dedicated Routes */}
              <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
                <Route path="/employee" element={<EmployeeDashboard />} />
                <Route path="/employee/performance" element={<PerformanceReview />} />
              </Route>

              {/* Manager Dedicated Routes */}
              <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
                <Route path="/manager" element={<ManagerDashboard />} />
                <Route path="/manager/approvals" element={<ManagerApprovals />} />
              </Route>

              {/* HR / Admin Dedicated Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                {/* Fallback for other sidebar items to prevent route breaking */}
                <Route path="/admin/audit" element={<AdminDashboard />} />
                <Route path="/admin/reports" element={<AdminDashboard />} />
              </Route>

            </Route>
          </Route>

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<AppRedirector />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
