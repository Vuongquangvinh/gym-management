import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import colors, { cssVars } from '../shared/theme/colors';
import './login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // inject theme CSS variables once so the stylesheet can use them
    if (!document.getElementById('theme-colors')) {
      const style = document.createElement('style');
      style.id = 'theme-colors';
      style.innerHTML = `:root {\n${cssVars()}\n}`;
      document.head.appendChild(style);
    }
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // simulate authentication
    setTimeout(() => {
      setLoading(false);
      if (!email.includes('@') || password.length < 6) {
        setError('Vui lòng nhập email hợp lệ và mật khẩu ít nhất 6 ký tự.');
        return;
      }
      alert('Đăng nhập thành công (mô phỏng)');
    }, 900);
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
            <h1>One More Rep</h1>
            <p>Admin / Owner portal</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
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
            <Link className="text-link" to="/forgot">Quên mật khẩu?</Link>
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
