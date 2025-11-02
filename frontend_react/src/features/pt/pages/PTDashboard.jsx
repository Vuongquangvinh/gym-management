import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/lib/features/auth/authContext';
import { usePT } from '../../../firebase/lib/features/pt/pt.provider';
import '../pt.css';

export default function PTDashboard() {
  const { currentUser } = useAuth();
  const { ptPackages, loading } = usePT();
  const [stats, setStats] = useState({
    totalClients: 0,
    activePackages: 0,
    monthlyRevenue: 0,
    rating: 0
  });

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

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'PT';

  return (
    <div className="pt-dashboard-container">
      <div className="pt-welcome">
        <h1>Chào mừng trở lại, {displayName}! 👋</h1>
        <p>Đây là tổng quan về hoạt động PT của bạn</p>
      </div>

      <div className="pt-stats-grid">
        <div className="pt-stat-card">
          <div className="label">Tổng học viên</div>
          <div className="value">{stats.totalClients}</div>
          <div className="subtext">Đang hoạt động</div>
        </div>

        <div className="pt-stat-card">
          <div className="label">Gói đang bán</div>
          <div className="value">{stats.activePackages}</div>
          <div className="subtext">Gói tập hiện có</div>
        </div>

        <div className="pt-stat-card">
          <div className="label">Doanh thu tháng này</div>
          <div className="value">{stats.monthlyRevenue.toLocaleString('vi-VN')}₫</div>
          <div className="subtext">Từ commission</div>
        </div>

        <div className="pt-stat-card">
          <div className="label">Đánh giá</div>
          <div className="value">{stats.rating || 'N/A'}</div>
          <div className="subtext">Trung bình từ học viên</div>
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
    </div>
  );
}

