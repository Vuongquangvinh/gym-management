import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyResetCode, confirmResetPassword } from '../../../firebase/lib/features/auth/auth.service.js';

// Custom hook để lấy query params từ URL
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const oobCode = query.get('oobCode');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);

  // Bước 1: Xác thực oobCode khi component được tải
  useEffect(() => {
    if (!oobCode) {
      setError('Mã không hợp lệ hoặc đã hết hạn.');
      setIsVerifying(false);
      return;
    }
    verifyResetCode(oobCode)
      .then((email) => {
        console.log('Mã hợp lệ cho email:', email);
        setIsVerifying(false);
      })
      .catch((err) => {
        console.error('Lỗi xác thực mã:', err);
        setError('Mã không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
        setIsVerifying(false);
      });
  }, [oobCode]);

  // Bước 2: Xử lý việc đặt lại mật khẩu
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu không khớp.');
      return;
    }
    if (!oobCode) {
        setError('Thiếu mã xác thực.');
        return;
    }

    try {
      await confirmResetPassword(oobCode, newPassword);
      setMessage('Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.');
      setTimeout(() => navigate('/login'), 3000); // Chuyển về trang đăng nhập
    } catch (err) {
      console.error('Lỗi đổi mật khẩu:', err);
      setError('Lỗi: Không thể đổi mật khẩu. Vui lòng thử lại.');
    }
  };

  if (isVerifying) {
    return <div>Đang kiểm tra yêu cầu...</div>;
  }

  return (
    <div>
      <h3>Đặt lại mật khẩu mới</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      
      {!message && ( // Ẩn form sau khi thành công
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mật khẩu mới"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Xác nhận mật khẩu mới"
            required
          />
          <button type="submit">Xác nhận</button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;