// Đường dẫn cũ:
// import { useAuth } from '../../../providers/AuthProvider';

// ✅ Đường dẫn MỚI:
import { useAuth } from '../../../firebase/lib/features/auth/authContext.jsx';

import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const { currentUser, loading } = useAuth(); // Dòng này không thay đổi

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;