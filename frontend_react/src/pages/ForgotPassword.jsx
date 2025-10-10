import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import colors, { cssVars } from '../shared/theme/colors';
import './login.css';

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

  function handleSend(e) {
    e.preventDefault();
    // basic validation
    if (!email || !email.includes('@')) return;
    // simulate send
    setTimeout(() => setSent(true), 700);
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
            <h1>Quên mật khẩu</h1>
            <p>Nhập email để nhận hướng dẫn đặt lại mật khẩu</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSend} noValidate>
          {sent ? (
            <div className="form-success">Chúng tôi đã gửi email hướng dẫn. Vui lòng kiểm tra hộp thư.</div>
          ) : (
            <>
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

              <button className="btn primary" type="submit">Gửi hướng dẫn</button>

              <div className="or">hoặc</div>

              <Link to="/" className="btn outline" style={{ textDecoration: 'none' }}>Quay lại đăng nhập</Link>
            </>
          )}
        </form>

        <footer className="card-foot">
          <small>Vẫn cần trợ giúp? <a href="#">Liên hệ quản trị</a></small>
        </footer>
      </div>
    </div>
  );
}
