import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/lib/features/auth/authContext';
import { usePT } from '../../../firebase/lib/features/pt/pt.provider';
import { useNotifications } from '../../../hooks/useNotifications';
import MemberScheduleModal from '../components/MemberScheduleModal';
import styles from '../pt.module.css';

export default function PTDashboard() {
  const { currentUser } = useAuth();
  console.log('PT currentUser:', currentUser); // Kiểm tra login đúng PT
  const { ptPackages, loading } = usePT();
  const [stats, setStats] = useState({
    totalClients: 0,
    activePackages: 0,
    monthlyRevenue: 0,
    rating: 0
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUserId, setModalUserId] = useState(null);
  const [modalContractId, setModalContractId] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    // Tính toán thống kê từ packages
    if (ptPackages && Array.isArray(ptPackages)) {
      const activePackages = ptPackages.filter(pkg => pkg.isActive).length;
      
      setStats({
        totalClients: 0, // Sẽ lấy từ package_users sau
        activePackages,
        monthlyRevenue: 0, // Sẽ tính từ commission
        rating: 0 // Sẽ lấy từ ptInfo
      });
    }
  }, [ptPackages]);

  // --- Notification logic ---
  const ptId = currentUser?.uid;
  const { notifications, unreadCount, markAsRead } = useNotifications(ptId);

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'PT';

  return (
    <div className={styles.ptDashboardContainer}>
      <div className={styles.ptWelcome}>
        <h1>Chào mừng trở lại, {displayName}! 👋</h1>
        <p>Đây là tổng quan về hoạt động PT của bạn</p>
      </div>

      <div className={styles.ptStatsGrid}>
        <div className={styles.ptStatCard}>
          <div className={styles.label}>Tổng học viên</div>
          <div className={styles.value}>{stats.totalClients}</div>
          <div className={styles.subtext}>Đang hoạt động</div>
        </div>

        <div className={styles.ptStatCard}>
          <div className={styles.label}>Gói đang bán</div>
          <div className={styles.value}>{stats.activePackages}</div>
          <div className={styles.subtext}>Gói tập hiện có</div>
        </div>

        <div className={styles.ptStatCard}>
          <div className={styles.label}>Doanh thu tháng này</div>
          <div className={styles.value}>{stats.monthlyRevenue.toLocaleString('vi-VN')}₫</div>
          <div className={styles.subtext}>Từ commission</div>
        </div>

        <div className={styles.ptStatCard}>
          <div className={styles.label}>Đánh giá</div>
          <div className={styles.value}>{stats.rating || 'N/A'}</div>
          <div className={styles.subtext}>Trung bình từ học viên</div>
        </div>
      </div>

      <div style={{ 
        background: 'var(--color-surface)', 
        borderRadius: '14px', 
        padding: '24px',
        boxShadow: '0 10px 30px rgba(11,37,69,0.06)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
          Bắt đầu nào!
        </h3>
        <p style={{ color: 'var(--color-textSecondary)', margin: '0 0 20px 0' }}>
          Hãy hoàn thiện thông tin cá nhân và tạo gói tập đầu tiên của bạn
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a 
            href="/pt/profile" 
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-primaryVariant))',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'transform 0.2s ease'
            }}
          >
            Cập nhật thông tin
          </a>
          <a 
            href="/pt/packages" 
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'white',
              color: 'var(--color-textPrimary)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'transform 0.2s ease'
            }}
          >
            Tạo gói tập
          </a>
        </div>
      </div>

      {/* Notification badge */}
      {unreadCount > 0 && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 1000,
          background: '#ff6b35', color: 'white', borderRadius: 20, padding: '8px 16px', fontWeight: 600
        }}>
          🔔 {unreadCount} thông báo mới
        </div>
      )}

      {/* Notification list */}
      <div style={{ margin: '32px 0 0 0', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>Thông báo mới nhất</h3>
        {notifications.length === 0 && <div style={{ color: '#888', marginTop: 12 }}>Chưa có thông báo nào</div>}
        {notifications.map(notif => (
          <div key={notif.id} style={{
            borderLeft: notif.read ? '4px solid #eee' : '4px solid #ff6b35',
            background: notif.read ? '#fafafa' : '#fff7f3',
            margin: '16px 0', padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
            boxShadow: notif.read ? 'none' : '0 2px 8px #ff6b3522'
          }}
            onClick={() => {
              markAsRead(notif.id);
              if (notif.userId) {
                setModalUserId(notif.userId);
                setModalContractId(notif.contractId || null);
                setSelectedNotification(notif); // Đặt notification trước khi mở modal
                setModalOpen(true);
              }
            }}
          >
            <div style={{ fontWeight: 600 }}>{notif.title}</div>
            <div style={{ color: '#444', margin: '4px 0 0 0' }}>{notif.body || notif.message}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{notif.createdAt && notif.createdAt.toDate ? notif.createdAt.toDate().toLocaleString() : ''}</div>
            {!notif.read && <span style={{ color: '#ff6b35', fontWeight: 700, fontSize: 12 }}>Chưa đọc</span>}
          </div>
        ))}
      </div>
      {/* MemberScheduleModal */}
      <MemberScheduleModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        userId={modalUserId} 
        contractId={modalContractId} 
        notification={selectedNotification} 
      />
    </div>
  );
}

