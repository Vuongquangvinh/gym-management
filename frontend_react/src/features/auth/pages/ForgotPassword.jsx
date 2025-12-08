import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cssVars } from '../../../shared/theme/colors';
import styles from './login.module.css';
import { forgotPassword } from '../../../firebase/lib/features/auth/auth.service.js'; // Chú ý đường dẫn

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!document.getElementById('theme-colors')) {
      const style = document.createElement('style');
      style.id = 'theme-colors';
      style.innerHTML = `:root {\n${cssVars()}\n}`;
      document.head.appendChild(style);
    }
  }, []);

  async function handleSend(e) {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (error) {
      console.error("Error sending password reset email:", error);
    }
  }
    // const handleForgotPassword = async (event) => {
    //       event.preventDefault();
    //       setError(null);
    //       setIsLoading(true);
  
    //       try {
    //           await forgotPassword(email);
    //           alert('Đã gửi email đặt lại mật khẩu!');
    //       } catch (err) {
    //           console.error('Lỗi gửi email đặt lại mật khẩu:', err);
    //           setError('Không thể gửi email đặt lại mật khẩu.');
    //       } finally {
    //           setIsLoading(false);
    //       }
    //   }

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
            <h1>Quên mật khẩu</h1>
            <p>Nhập email để nhận hướng dẫn đặt lại mật khẩu</p>
          </div>
        </div>

        <form className={styles.loginForm} onSubmit={handleSend} noValidate>
          {sent ? (
            <div className={styles.formSuccess}>Chúng tôi đã gửi email hướng dẫn. Vui lòng kiểm tra hộp thư.</div>
          ) : (
            <>
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

              <button className={`${styles.btn} ${styles.primary}`} type="submit">Gửi hướng dẫn</button>

              <div className={styles.or}>hoặc</div>

              <Link to="/" className={`${styles.btn} ${styles.outline}`} style={{ textDecoration: 'none' }}>Quay lại đăng nhập</Link>
            </>
          )}
        </form>

        <footer className={styles.cardFoot}>
          <small>Vẫn cần trợ giúp? <a href="#">Liên hệ quản trị</a></small>
        </footer>
      </div>
    </div>
  );
}
