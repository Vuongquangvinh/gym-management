import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../../../firebase/lib/features/auth/auth.service.js'; // Chú ý đường dẫn
import notificationService from '../../../services/notificationService';

import { cssVars } from '../../../shared/theme/colors';
import styles from './login.module.css';

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

          // Xác định role của user
          const userRole = employee.role === 'pt' || employee.position === 'PT' ? 'pt' : 
                          employee.role === 'admin' || employee.position === 'Manager' ? 'admin' : 
                          'admin'; // default

          // Lưu thông tin user vào localStorage để sử dụng cho phân quyền
          localStorage.setItem('userRole', userRole);
          localStorage.setItem('userId', ptId);
          localStorage.setItem('userEmail', userData.email);

          // Bật notification real-time cho PT
          if (userRole === 'pt') {
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

          // Redirect dựa vào role
          if (userRole === 'pt') {
            navigate('/pt');
          } else {
            navigate('/admin');
          }
        } else {
          // Nếu không tìm thấy employee, mặc định là admin
          localStorage.setItem('userRole', 'admin');
          navigate('/admin');
        }
      } catch (roleError) {
        console.error('Error checking role:', roleError);
        // Mặc định là admin nếu có lỗi
        localStorage.setItem('userRole', 'admin');
        navigate('/admin');
      }
    } catch (err) {
      console.error('Login error:', err);
      let friendlyMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.";
      
      // Xử lý lỗi too-many-requests
      if (err.message?.includes('auth/too-many-requests') || err.code === 'auth/too-many-requests') {
        friendlyMessage = "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi 15-30 phút rồi thử lại.";
      } else if (err.message?.includes('auth/user-not-found') || err.message?.includes('auth/wrong-password')) {
        friendlyMessage = "Email hoặc mật khẩu không chính xác.";
      } else if (err.message?.includes('auth/invalid-email')) {
        friendlyMessage = "Địa chỉ email không hợp lệ.";
      } else if (err.message?.includes('auth/invalid-credential')) {
        friendlyMessage = "Thông tin đăng nhập không hợp lệ.";
      }
      
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.bgShapes}>
        <span className={`${styles.shape} ${styles.s1}`} />
        <span className={`${styles.shape} ${styles.s2}`} />
        <span className={`${styles.shape} ${styles.s3}`} />
      </div>

      <div className={styles.loginCard}>
        <div className={styles.brand}>
          <div className={styles.logo}>REPS</div>
          <div className={styles.brandText}>
            <h1>One More Rep</h1>
            <p>Admin / Owner portal</p>
          </div>
        </div>

        <form className={styles.loginForm} onSubmit={handleLogin} noValidate>
          {error && <div className={styles.formError}>{error}</div>}

          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </label>

          <label className={styles.field}>
            <span>Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <div className={`${styles.row} ${styles.between}`}>
            <label className={styles.remember}>
              <input type="checkbox" /> Ghi nhớ
            </label>
            <Link className={styles.textLink} to="/forgot-password">Quên mật khẩu?</Link>
          </div>

          <button className={`${styles.btn} ${styles.primary}`} type="submit" disabled={loading}>
            {loading ? <span className={styles.spinner} /> : 'Đăng nhập'}
          </button>

          <div className={styles.or}>hoặc</div>

          <button type="button" className={`${styles.btn} ${styles.outline}`} onClick={() => alert('Mở màn hình quét QR (mô phỏng)')}>
            Quét QR để vào phòng
          </button>
        </form>

        <footer className={styles.cardFoot}>
          <small>Chưa có tài khoản? <a href="#">Liên hệ quản trị</a></small>
        </footer>
      </div>
    </div>
  );
}
