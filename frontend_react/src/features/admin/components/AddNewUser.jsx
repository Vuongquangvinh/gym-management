import React, { useState } from 'react';
import './AddNewuser.css';

export default function AddNewUser({ isOpen, onClose, onSubmit }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [packageId, setPackageId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !name) {
      setError("Vui lòng nhập đầy đủ Email và Tên.");
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit({
        email,
        name,
        phone,
        dob,
        packageId,
        expiryDate,
        role: "client",
        isActive: true,
      }, password);
    } catch (err) {
      console.error("Lỗi tạo người dùng:", err);
      setError("Không thể tạo người dùng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="addnewuser-card">
        <div className="addnewuser-brand">
          <div className="addnewuser-logo">REPS</div>
          <div className="addnewuser-brand-text">
            <h1>Thêm người dùng mới</h1>
            <p>Nhập thông tin để tạo tài khoản người dùng mới</p>
          </div>
        </div>
        <form className="addnewuser-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="form-error">{error}</div>}
          <div className="addnewuser-form-row">
            <div className="addnewuser-form-col">
              <label className="field">
                <span>Email *</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email người dùng"
                  required
                />
              </label>

               <label className="field">
                <span>Password *</span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mật khẩu người dùng"
                  required
                />
              </label>

              <label className="field">
                <span>Tên *</span>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Tên người dùng"
                  required
                />
              </label>
              <label className="field">
                <span>Số điện thoại</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Số điện thoại"
                />
              </label>
            </div>
            <div className="addnewuser-form-col">
              <label className="field">
                <span>Ngày sinh</span>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Gói tập</span>
                <input
                  type="text"
                  value={packageId}
                  onChange={e => setPackageId(e.target.value)}
                  placeholder="Tên gói tập"
                />
              </label>
              <label className="field">
                <span>Ngày hết hạn</span>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                />
              </label>
            </div>
          </div>
          <input type="hidden" value="User" readOnly />
          <button className="btn primary addnewuser-btn" type="submit" disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : "Tạo mới"}
          </button>
          <div className="or">hoặc</div>
          <button type="button" className="btn outline addnewuser-btn cancel" onClick={onClose}>
            Hủy
          </button>
        </form>
      </div>
    </div>
  );
}
