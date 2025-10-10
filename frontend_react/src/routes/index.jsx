import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";
import ShowQRPage from "../features/qr/pages/ShowQRPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import ResetPassword from "../features/auth/pages/ResetPasswordPage.jsx";
import ChangePassword from "../features/auth/pages/ChangePassword.jsx";
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route công khai */}
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/forgot-password" element={<ResetPassword />} />

        {/* Các route được bảo vệ */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/qr" element={<ShowQRPage />} />
          {/* Thêm các route được bảo vệ khác ở đây */}
        </Route>
        {/* Route cho trang không tồn tại */}
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
