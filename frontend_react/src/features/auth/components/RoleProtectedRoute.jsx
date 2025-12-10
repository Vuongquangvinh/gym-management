import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../firebase/lib/features/auth/authContext.jsx';

/**
 * Component để bảo vệ route dựa trên role của user
 * @param {string[]} allowedRoles - Danh sách các role được phép truy cập
 */
const RoleProtectedRoute = ({ allowedRoles }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    // Kiểm tra đăng nhập
    if (!currentUser) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Lấy role từ localStorage
    const userRole = localStorage.getItem('userRole');

    // Kiểm tra quyền truy cập
    if (!allowedRoles.includes(userRole)) {
        // Redirect về trang phù hợp với role của user
        if (userRole === 'pt') {
            return <Navigate to="/pt" replace />;
        } else if (userRole === 'admin') {
            return <Navigate to="/admin" replace />;
        } else {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <Outlet />;
};

export default RoleProtectedRoute;
