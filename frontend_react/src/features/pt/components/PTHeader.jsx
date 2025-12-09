import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../firebase/lib/features/auth/authContext.jsx';
import { NotificationBell } from '../../../shared/components/Notification/NotificationBell.jsx';
import PTChatList from './PTChatList.jsx';
import styles from '../pt.module.css';

export default function PTHeader({ onToggle }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showChatList, setShowChatList] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <header className={styles.ptHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className={styles.menuBtn} 
            onClick={onToggle}
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ☺
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>PT Portal</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setShowChatList(true)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'white',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            title="Tin nhắn"
          >
            💬
          </button>

          <NotificationBell />
          
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {showChatList && <PTChatList onClose={() => setShowChatList(false)} />}
    </>
  );
}

