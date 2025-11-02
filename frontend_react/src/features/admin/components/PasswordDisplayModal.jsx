import React, { useState } from 'react';
import './PasswordDisplayModal.css';

export default function PasswordDisplayModal({ isOpen, onClose, accountInfo }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !accountInfo) return null;

  const { email, tempPassword, fullName } = accountInfo;

  const handleCopy = () => {
    const textToCopy = `Email: ${email}\nMật khẩu tạm thời: ${tempPassword}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="password-modal-overlay" onClick={onClose}>
      <div className="password-modal" onClick={(e) => e.stopPropagation()}>
        <div className="password-modal-header">
          <h2>✅ Tài khoản đã được tạo!</h2>
        </div>

        <div className="password-modal-content">
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#28a745" strokeWidth="2"/>
              <path d="M8 12l2 2 4-4" stroke="#28a745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <p className="employee-name">
            Tài khoản cho <strong>{fullName}</strong> đã được tạo thành công!
          </p>

          <div className="credentials-box">
            <div className="credential-row">
              <label>Email:</label>
              <div className="credential-value">{email}</div>
            </div>
            <div className="credential-row">
              <label>Mật khẩu tạm thời:</label>
              <div className="credential-value password-value">{tempPassword}</div>
            </div>
          </div>

          <div className="warning-box">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>Lưu ý quan trọng:</strong>
              <ul>
                <li>Vui lòng gửi thông tin đăng nhập này cho nhân viên</li>
                <li>Nhân viên nên đổi mật khẩu sau lần đăng nhập đầu tiên</li>
                <li>Mật khẩu được tạo từ 4 số cuối số điện thoại + @Gym</li>
              </ul>
            </div>
          </div>

          <div className="button-group">
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? '✓ Đã copy!' : '📋 Copy thông tin'}
            </button>
            <button className="close-btn-primary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

