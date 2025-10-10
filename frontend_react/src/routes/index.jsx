import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route công khai */}
        <Route path="/login" element={<LoginPage />} />

        {/* Các route được bảo vệ */}

        {/* Route cho trang không tồn tại */}
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
