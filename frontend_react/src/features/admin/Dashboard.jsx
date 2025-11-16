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
  const [paymentMessage, setPaymentMessage] = useState(null);
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
    // Check for payment success/cancel in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('paymentSuccess');
    const paymentCancelled = urlParams.get('paymentCancelled');
    const userId = urlParams.get('userId');

    if (paymentSuccess === 'true') {
      console.log('✅ Payment success detected for userId:', userId);
      setPaymentMessage({
        type: 'success',
        text: '✅ Thanh toán thành công! Gói tập đã được cập nhật.'
      });
      
      // Clear URL params
      window.history.replaceState({}, '', '/admin');
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setPaymentMessage(null);
      }, 5000);
    } else if (paymentCancelled === 'true') {
      console.log('❌ Payment cancelled');
      setPaymentMessage({
        type: 'error',
        text: '❌ Thanh toán đã bị hủy.'
      });
      
      // Clear URL params
      window.history.replaceState({}, '', '/admin');
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setPaymentMessage(null);
      }, 5000);
    }

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
        {paymentMessage && (
          <div 
            style={{
              padding: '12px 16px',
              marginTop: '12px',
              borderRadius: '8px',
              backgroundColor: paymentMessage.type === 'success' ? '#d4edda' : '#f8d7da',
              color: paymentMessage.type === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${paymentMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
              fontWeight: '500'
            }}
          >
            {paymentMessage.text}
          </div>
        )}
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
