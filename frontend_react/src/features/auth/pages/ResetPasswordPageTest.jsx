import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { cssVars } from '../../../shared/theme/colors';
import './login.css';
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

  useEffect(() => {
    if (!document.getElementById('theme-colors')) {
      const style = document.createElement('style');
      style.id = 'theme-colors';
      style.innerHTML = `:root {\n${cssVars()}\n}`;
      document.head.appendChild(style);
    }
    // Bước 1: Xác thực oobCode khi component được tải
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
    return <div className="login-page"><div className="login-card"><div>Đang kiểm tra yêu cầu...</div></div></div>;
  }

  return (
    <div className="login-page">
      <div className="bg-shapes">
        <span className="shape s1" />
        <span className="shape s2" />
        <span className="shape s3" />
      </div>

      <div className="login-card">
        <div className="brand">
          <div className="logo">REPS</div>
          <div className="brand-text">
            <h1>Đặt lại mật khẩu</h1>
            <p>Nhập mật khẩu mới để thay đổi mật khẩu tài khoản của bạn</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {message ? (
            <div className="form-success">{message}</div>
          ) : (
            <>
              {error && <div className="form-error">{error}</div>}
              <label className="field">
                <span>Mật khẩu mới</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới"
                  required
                />
              </label>
              <label className="field">
                <span>Xác nhận mật khẩu mới</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới"
                  required
                />
              </label>
              <button className="btn primary" type="submit">Xác nhận</button>
              <div className="or">hoặc</div>
              <Link to="/login" className="btn outline" style={{ textDecoration: 'none' }}>Quay lại đăng nhập</Link>
            </>
          )}
        </form>

        <footer className="card-foot">
          <small>Vẫn cần trợ giúp? <a href="#">Liên hệ quản trị</a></small>
        </footer>
      </div>
    </div>
  );
};

export default ResetPassword;