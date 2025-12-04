import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../../../firebase/lib/features/auth/auth.service.js'; // Chú ý đường dẫn
import notificationService from '../../../services/notificationService';

import { cssVars } from '../../../shared/theme/colors';
import './login.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    // inject theme CSS variables once so the stylesheet can use them
    if (!document.getElementById('theme-colors')) {
      const style = document.createElement('style');
      style.id = 'theme-colors';
      style.innerHTML = `:root {\n${cssVars()}\n}`;
      document.head.appendChild(style);
    }
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn(email, password);
      const jwtToken = result.token;
      const userData = result.user;
      localStorage.setItem('token', jwtToken);

      // Lấy thông tin employee để check role
      try {
        const { db } = await import('../../../firebase/lib/config/firebase');
        const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
        const employeesRef = collection(db, 'employees');
        const q = query(employeesRef, where('email', '==', userData.email), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const employeeDoc = snapshot.docs[0];
          const employee = employeeDoc.data();
          const ptId = employeeDoc.id;

          // Bật notification real-time cho PT
          if (employee.role === 'pt' || employee.position === 'PT') {
            try {
              // Yêu cầu quyền notification
              const hasPermission = await notificationService.requestPermission();
              if (hasPermission) {
                console.log('Notification permission granted for PT:', ptId);
                // Notification service sẽ được start sau khi navigate đến PT dashboard
              } else {
                console.warn('Notification permission denied');
              }
            } catch (err) {
              console.error('Lỗi yêu cầu quyền notification:', err);
            }
          }

          // Redirect dựa vào role/position
          if (employee.role === 'pt' || employee.position === 'PT') {
            navigate('/pt');
          } else if (employee.role === 'admin' || employee.position === 'Manager') {
            navigate('/admin');
          } else {
            navigate('/admin');
          }
        } else {
          navigate('/admin');
        }
      } catch (roleError) {
        console.error('Error checking role:', roleError);
        navigate('/admin');
      }
    } catch (err) {
      let friendlyMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        friendlyMessage = "Email hoặc mật khẩu không chính xác.";
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = "Địa chỉ email không hợp lệ.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

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
            <h1>One More Rep</h1>
            <p>Admin / Owner portal</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleLogin} noValidate>
          {error && <div className="form-error">{error}</div>}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <div className="row between">
            <label className="remember">
              <input type="checkbox" /> Ghi nhớ
            </label>
            <Link className="text-link" to="/forgot-password">Quên mật khẩu?</Link>
          </div>

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Đăng nhập'}
          </button>

          <div className="or">hoặc</div>

          <button type="button" className="btn outline" onClick={() => alert('Mở màn hình quét QR (mô phỏng)')}>
            Quét QR để vào phòng
          </button>
        </form>

        <footer className="card-foot">
          <small>Chưa có tài khoản? <a href="#">Liên hệ quản trị</a></small>
        </footer>
      </div>
    </div>
  );
}
