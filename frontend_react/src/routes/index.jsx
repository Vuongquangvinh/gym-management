import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import ShowQRPage from "../features/qr/pages/ShowQRPage.jsx";
import ResetPassword from "../features/auth/pages/ResetPasswordPageTest.jsx";
import ChangePassword from "../features/auth/pages/ChangePasswordPage.jsx";
import ForgotPasswordPage from "../features/auth/pages/ForgotPassword.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import AdminLayout from '../features/admin/AdminLayout';
import PTLayout from '../features/pt/PTLayout';
import React from 'react';

// Admin Pages
const Dashboard = React.lazy(() => import('../features/admin/Dashboard'));
const CheckinDashboard = React.lazy(() => import('../features/admin/components/CheckinDashboard'));
const Members = React.lazy(() => import('../features/admin/pages/Members'));
const Employees = React.lazy(() => import('../features/admin/pages/Employees'));
const PTPricing = React.lazy(() => import('../features/admin/components/pt/PTPricingPage'));
const PendingRequests = React.lazy(() => import('../features/admin/pages/PendingRequests'));
const Checkins = React.lazy(() => import('../features/admin/pages/Checkins'));
const Packages = React.lazy(() => import('../features/admin/pages/Packages'));
const FaceCheckinPage = React.lazy(() => import('../features/admin/pages/FaceCheckinPage'));
const SchedulePage = React.lazy(() => import('../features/admin/pages/SchedulePage'));
const Reports = React.lazy(() => import('../features/admin/pages/Reports'));
const Settings = React.lazy(() => import('../features/admin/pages/Settings'));

// PT Pages
const PTDashboard = React.lazy(() => import('../features/pt/pages/PTDashboard'));
const PTProfile = React.lazy(() => import('../features/pt/pages/PTProfile'));
const PTPackages = React.lazy(() => import('../features/pt/pages/PTPackages'));
const PTClients = React.lazy(() => import('../features/pt/pages/PTClients'));
const PTSchedule = React.lazy(() => import('../features/pt/pages/PTSchedule'));
const PTSettings = React.lazy(() => import('../features/pt/pages/PTSettings'));
const AppRouter = () => {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Route công khai */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Các route được bảo vệ */}
          {/* <Route element={<ProtectedRoute />}> */}
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/qr" element={<ShowQRPage />} />
            
            {/* Route admin layout và các trang con */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="employees" element={<Employees />} />
              <Route path="pt-pricing" element={<PTPricing />} />
              <Route path="pending-requests" element={<PendingRequests />} />
              <Route path="checkins" element={<Checkins />} />
              <Route path="checkin-stats" element={<CheckinDashboard />} />
              <Route path="packages" element={<Packages />} />
              <Route path="face-checkin" element={<FaceCheckinPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Route PT layout và các trang con */}
            <Route path="/pt" element={<PTLayout />}>
              <Route index element={<PTDashboard />} />
              <Route path="profile" element={<PTProfile />} />
              <Route path="packages" element={<PTPackages />} />
              <Route path="clients" element={<PTClients />} />
              <Route path="schedule" element={<PTSchedule />} />
              <Route path="settings" element={<PTSettings />} />
            </Route>
          {/* </Route> */}
          {/* Route cho trang không tồn tại */}
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
