

import { useNavigate } from 'react-router-dom';
import { signOutUser } from '../firebase/lib/features/auth/auth.service.js';
import { KJUR } from "jsrsasign";


const token = localStorage.getItem('token');
if(token) {
        console.log("Token on DashboardPage:", token);
        // Nếu vẫn lỗi, thử dùng jwt_decode(token) trực tiếp
        try {
           const decoded = KJUR.jws.JWS.parse(token);
            console.log("Decoded JWT:", decoded);
        } catch (err) {
            console.error("Lỗi decode JWT:", err);
        }
}

const DashboardPage = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOutUser();
        navigate('/login');
    };

    return (
        <div>
            <h1>Dashboard</h1>
            <button onClick={handleLogout}>Đăng xuất</button>
        </div>
    );
};

export default DashboardPage;