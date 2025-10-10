import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../../../firebase/lib/features/auth/auth.service.js'; // Chú ý đường dẫn

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (event) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await signIn(email, password);
            navigate('/dashboard'); // Chuyển hướng đến trang dashboard sau khi thành công
        } catch (err) {
            // Chuyển đổi mã lỗi của Firebase thành thông báo thân thiện
            let friendlyMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.";
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                friendlyMessage = "Email hoặc mật khẩu không chính xác.";
            } else if (err.code === 'auth/invalid-email') {
                friendlyMessage = "Địa chỉ email không hợp lệ.";
            }
            setError(friendlyMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h1>Đăng nhập</h1>
            <form onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Mật khẩu</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;