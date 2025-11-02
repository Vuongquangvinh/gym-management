import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../firebase/lib/features/auth/authContext';

export default function PTSettings() {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>
        Cài đặt
      </h1>
      <p style={{ color: 'var(--color-textSecondary)', margin: '0 0 28px 0' }}>
        Quản lý tài khoản và cài đặt cá nhân
      </p>

      <div style={{ 
        background: 'var(--color-surface)', 
        borderRadius: '14px', 
        padding: '24px',
        boxShadow: '0 10px 30px rgba(11,37,69,0.06)',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0' }}>
          Thông tin tài khoản
        </h3>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--color-textSecondary)', marginBottom: '4px' }}>
            Email
          </div>
          <div style={{ fontSize: '15px', fontWeight: 500 }}>
            {currentUser?.email}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--color-textSecondary)', marginBottom: '4px' }}>
            Tên hiển thị
          </div>
          <div style={{ fontSize: '15px', fontWeight: 500 }}>
            {currentUser?.displayName || 'Chưa cập nhật'}
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'var(--color-surface)', 
        borderRadius: '14px', 
        padding: '24px',
        boxShadow: '0 10px 30px rgba(11,37,69,0.06)',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0' }}>
          Bảo mật
        </h3>
        <button
          onClick={() => navigate('/change-password')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            background: 'white',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          Đổi mật khẩu
        </button>
      </div>

      <div style={{ 
        background: 'var(--color-surface)', 
        borderRadius: '14px', 
        padding: '24px',
        boxShadow: '0 10px 30px rgba(11,37,69,0.06)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0', color: '#dc3545' }}>
          Đăng xuất
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-textSecondary)', margin: '0 0 16px 0' }}>
          Đăng xuất khỏi tài khoản PT
        </p>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid #dc3545',
            background: 'white',
            color: '#dc3545',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

