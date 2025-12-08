import React, { useState } from 'react';
import styles from './PasswordDisplayModal.module.css';

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
    <div className={styles.passwordModalOverlay} onClick={onClose}>
      <div className={styles.passwordModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.passwordModalHeader}>
          <h2>✅ Tài khoản đã được tạo!</h2>
        </div>

        <div className={styles.passwordModalContent}>
          <div className={styles.successIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#28a745" strokeWidth="2"/>
              <path d="M8 12l2 2 4-4" stroke="#28a745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <p className={styles.employeeName}>
            Tài khoản cho <strong>{fullName}</strong> đã được tạo thành công!
          </p>

          <div className={styles.credentialsBox}>
            <div className={styles.credentialRow}>
              <label>Email</label>
              <div className={styles.credentialValue}>{email}</div>
            </div>
            <div className={styles.credentialRow}>
              <label>Mật khẩu tạm thời</label>
              <div className={`${styles.credentialValue} ${styles.passwordValue}`}>{tempPassword}</div>
            </div>
          </div>

          <div className={styles.warningBox}>
            <div className={styles.warningIcon}>⚠️</div>
            <div className={styles.warningText}>
              <strong>Lưu ý quan trọng:</strong>
              <ul>
                <li>Vui lòng gửi thông tin đăng nhập này cho nhân viên</li>
                <li>Nhân viên nên đổi mật khẩu sau lần đăng nhập đầu tiên</li>
                <li>Mật khẩu được tạo từ 4 số cuối số điện thoại + @Gym</li>
              </ul>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button className={styles.copyBtn} onClick={handleCopy}>
              {copied ? '✓ Đã sao chép' : '📋 Sao chép thông tin'}
            </button>
            <button className={styles.closeBtnPrimary} onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

