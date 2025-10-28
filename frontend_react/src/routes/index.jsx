import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import ShowQRPage from "../features/qr/pages/ShowQRPage.jsx";
import ResetPassword from "../features/auth/pages/ResetPasswordPageTest.jsx";
import ChangePassword from "../features/auth/pages/ChangePasswordPage.jsx";
import ForgotPasswordPage from "../features/auth/pages/ForgotPassword.jsx";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import AdminLayout from '../features/admin/AdminLayout';
import PaymentSuccess from '../features/payment/PaymentSuccess.jsx';
import React from 'react';
const Dashboard = React.lazy(() => import('../features/admin/Dashboard'));
const CheckinDashboard = React.lazy(() => import('../features/admin/components/CheckinDashboard'));
const Members = React.lazy(() => import('../features/admin/pages/Members'));
const Employees = React.lazy(() => import('../features/admin/pages/Employees'));
const PTPricing = React.lazy(() => import('../features/admin/components/pt/PTPricingPage'));
const Checkins = React.lazy(() => import('../features/admin/pages/Checkins'));
const Packages = React.lazy(() => import('../features/admin/pages/Packages'));
const Reports = React.lazy(() => import('../features/admin/pages/Reports'));
const Settings = React.lazy(() => import('../features/admin/pages/Settings'));
const AppRouter = () => {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Route công khai */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />

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
              <Route path="checkins" element={<Checkins />} />
              <Route path="checkin-stats" element={<CheckinDashboard />} />
              <Route path="packages" element={<Packages />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          {/* </Route> */}
          {/* Route cho trang không tồn tại */}
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
