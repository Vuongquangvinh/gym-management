import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SmallChart from './components/SmallChart';
import ChartCard from './components/ChartCard';
import { fetchDashboard } from './api/dashboardService';
import QuickCheckinModal from './components/QuickCheckinModal';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await fetchDashboard();
      setData(dashboardData);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Refresh data mỗi 30 giây
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckinSuccess = () => {
    setShowCheckinModal(false);
    // Refresh dashboard data sau khi check-in thành công
    loadDashboardData();
  };

  if (loading && !data) {
    return (
      <div className="dashboard-root">
        <div className="dash-header">
          <h2>Dashboard</h2>
          <p className="muted">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      <div className="dash-header">
        <h2>Dashboard</h2>
        <p className="muted">Tổng quan phòng tập - Cập nhật realtime</p>
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="grid">
        <div className="card stat">
          <h3>Thành viên hoạt động</h3>
          <div className="big">{data ? data.activeMembers : '—'}</div>
          <SmallChart data={data?.series} />
          <p className="stat-label">Members đang active</p>
        </div>

        <div className="card stat">
          <h3>Check-ins hôm nay</h3>
          <div className="big">{data ? data.todayCheckins : '—'}</div>
          <p className="stat-label">Lượt check-in trong ngày</p>
        </div>

        <div className="card stat">
          <h3>Gói tập đang mở</h3>
          <div className="big">{data ? data.openPackages : '—'}</div>
          <p className="stat-label">Packages đang active</p>
        </div>

        <div className="card stat">
          <h3>Doanh thu (Triệu)</h3>
          <div className="big">{data ? data.revenueM : '—'}M</div>
          <p className="stat-label">Tổng giá trị gói đang active</p>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h4>Check-ins gần đây</h4>
          {(!data?.recent || data.recent.length === 0) ? (
            <p className="muted">Chưa có check-in nào</p>
          ) : (
            <ul className="activity">
              {data.recent.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h4>Quick Actions</h4>
          <div className="actions">
            <button 
              className="btn"
              onClick={() => navigate('/admin/members/new')}
            >
              ➕ Tạo member
            </button>
            <button 
              className="btn outline"
              onClick={() => navigate('/admin/packages/new')}
            >
              📦 Tạo gói
            </button>
            <button 
              className="btn primary"
              onClick={() => setShowCheckinModal(true)}
            >
              📱 Check-in nhanh
            </button>
          </div>
          <div className="actions" style={{ marginTop: '12px' }}>
            <button 
              className="btn outline"
              onClick={() => navigate('/admin/members')}
            >
              👥 Quản lý members
            </button>
            <button 
              className="btn outline"
              onClick={() => navigate('/admin/checkins')}
            >
              📋 Lịch sử check-in
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <ChartCard data={data?.series} />
      </div>

      {showCheckinModal && (
        <QuickCheckinModal
          onClose={() => setShowCheckinModal(false)}
          onSuccess={handleCheckinSuccess}
        />
      )}
    </div>
  );
}
