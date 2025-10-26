import React, { useState, useEffect } from 'react';
import './CheckinDashboard.css';
import StatCard from './StatCard.jsx';
import CheckinStats from '../../../firebase/lib/features/checkin/checkin.stats.js';

const CheckinDashboard = () => {
  const [stats, setStats] = useState({
    today: { total: 0, qrScans: 0, manual: 0 },
    week: { total: 0, qrScans: 0, manual: 0, daily: [] },
    month: { total: 0, qrScans: 0, manual: 0, daily: [] },
    peakHours: { hourlyStats: [], peakHours: [] },
    comparison: {
      today: { current: 0, previous: 0, change: 0 },
      week: { current: 0, previous: 0, change: 0 }
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [todayStats, weekStats, monthStats, peakHoursStats, comparisonStats] = await Promise.all([
        CheckinStats.getTodayStats(),
        CheckinStats.getWeekStats(),
        CheckinStats.getMonthStats(),
        CheckinStats.getPeakHours(7),
        CheckinStats.getComparisonStats()
      ]);

      setStats({
        today: todayStats,
        week: weekStats,
        month: monthStats,
        peakHours: peakHoursStats,
        comparison: comparisonStats
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Có lỗi xảy ra khi tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  // Hàm xuất Excel cho tuần này
  const exportWeeklyData = async () => {
    try {
      setExportLoading(true);
      setExportMessage('');
      
      const today = new Date();
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const result = await CheckinStats.exportToExcel(startOfWeek, endOfWeek, 'checkin-tuan-nay');
      
      if (result.success) {
        setExportMessage(`✅ ${result.message}`);
      } else {
        setExportMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error exporting weekly data:', error);
      setExportMessage('❌ Có lỗi xảy ra khi xuất dữ liệu tuần');
    } finally {
      setExportLoading(false);
    }
  };

  // Hàm xuất Excel cho tháng này
  const exportMonthlyData = async () => {
    try {
      setExportLoading(true);
      setExportMessage('');
      
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

      const result = await CheckinStats.exportToExcel(startOfMonth, endOfMonth, 'checkin-thang-nay');
      
      if (result.success) {
        setExportMessage(`✅ ${result.message}`);
      } else {
        setExportMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error exporting monthly data:', error);
      setExportMessage('❌ Có lỗi xảy ra khi xuất dữ liệu tháng');
    } finally {
      setExportLoading(false);
    }
  };

  // Hàm xuất Excel cho tùy chỉnh (7 ngày qua)
  const exportCustomData = async () => {
    try {
      setExportLoading(true);
      setExportMessage('');
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const result = await CheckinStats.exportToExcel(startDate, endDate, 'checkin-7-ngay-qua');
      
      if (result.success) {
        setExportMessage(`✅ ${result.message}`);
      } else {
        setExportMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error exporting custom data:', error);
      setExportMessage('❌ Có lỗi xảy ra khi xuất dữ liệu');
    } finally {
      setExportLoading(false);
    }
  };

  const getTrendData = (current, previous) => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return { direction: 'up', text: 'Mới' };
    
    const change = Math.round(((current - previous) / previous) * 100);
    if (change > 0) {
      return { direction: 'up', text: `+${change}% so với hôm qua` };
    } else if (change < 0) {
      return { direction: 'down', text: `${change}% so với hôm qua` };
    }
    return { direction: 'same', text: 'Không đổi' };
  };

  const getWeekTrend = (current, previous) => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return { direction: 'up', text: 'Mới' };
    
    const change = Math.round(((current - previous) / previous) * 100);
    if (change > 0) {
      return { direction: 'up', text: `+${change}% so với tuần trước` };
    } else if (change < 0) {
      return { direction: 'down', text: `${change}% so với tuần trước` };
    }
    return { direction: 'same', text: 'Không đổi' };
  };

  if (error) {
    return (
      <div className="checkin-dashboard">
        <div className="dashboard-header">
          <h1>📊 Thống kê Check-in</h1>
          <button onClick={loadStats} className="refresh-btn">
            🔄 Tải lại
          </button>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadStats}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-dashboard">
      <div className="dashboard-header">
        <h1>📊 Thống kê Check-in</h1>
        <div className="header-actions">
          <button onClick={loadStats} className="refresh-btn" disabled={loading}>
            🔄 {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>
      </div>

      {/* Export Section */}
      <div className="export-section">
        <h3>📥 Xuất báo cáo Excel</h3>
        <div className="export-buttons">
          <button 
            onClick={exportCustomData} 
            className="export-btn primary"
            disabled={exportLoading}
          >
            📊 Xuất 7 ngày qua
          </button>
          <button 
            onClick={exportWeeklyData} 
            className="export-btn secondary"
            disabled={exportLoading}
          >
            📅 Xuất tuần này
          </button>
          <button 
            onClick={exportMonthlyData} 
            className="export-btn tertiary"
            disabled={exportLoading}
          >
            📈 Xuất tháng này
          </button>
        </div>
        {exportLoading && (
          <div className="export-loading">
            <span>⏳ Đang xuất dữ liệu...</span>
          </div>
        )}
        {exportMessage && (
          <div className={`export-message ${exportMessage.includes('✅') ? 'success' : 'error'}`}>
            {exportMessage}
          </div>
        )}
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <StatCard
          title="Check-in hôm nay"
          value={stats.today.total}
          icon="📅"
          color="blue"
          loading={loading}
          trend={getTrendData(stats.comparison.today.current, stats.comparison.today.previous)}
        />
        
        <StatCard
          title="Check-in tuần này"
          value={stats.week.total}
          icon="📊"
          color="green"
          loading={loading}
          trend={getWeekTrend(stats.comparison.week.current, stats.comparison.week.previous)}
        />
        
        <StatCard
          title="Check-in tháng này"
          value={stats.month.total}
          icon="📈"
          color="purple"
          loading={loading}
        />
        
        <StatCard
          title="QR Code hôm nay"
          value={stats.today.qrScans}
          icon="📱"
          color="orange"
          loading={loading}
          subtitle={`${stats.today.manual} thủ công`}
        />
      </div>

      {/* Peak Hours */}
      <div className="peak-hours-section">
        <h2>⏰ Khung giờ cao điểm (7 ngày qua)</h2>
        <div className="peak-hours-grid">
          {loading ? (
            <div className="loading-skeleton">Đang tải...</div>
          ) : stats.peakHours.peakHours.length > 0 ? (
            stats.peakHours.peakHours.map((peak, index) => (
              <div key={index} className="peak-hour-card">
                <div className="peak-rank">#{index + 1}</div>
                <div className="peak-time">{peak.hour}</div>
                <div className="peak-count">{peak.count} lượt</div>
              </div>
            ))
          ) : (
            <p>Chưa có dữ liệu khung giờ cao điểm</p>
          )}
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="weekly-breakdown">
        <h2>📋 Chi tiết tuần này</h2>
        <div className="weekly-stats">
          <div className="week-summary">
            <div className="summary-item">
              <span className="label">Tổng cộng:</span>
              <span className="value">{stats.week.total} lượt</span>
            </div>
            <div className="summary-item">
              <span className="label">QR Code:</span>
              <span className="value">{stats.week.qrScans} lượt</span>
            </div>
            <div className="summary-item">
              <span className="label">Thủ công:</span>
              <span className="value">{stats.week.manual} lượt</span>
            </div>
          </div>
          
          {!loading && stats.week.daily.length > 0 && (
            <div className="daily-breakdown">
              <h3>Theo từng ngày:</h3>
              <div className="daily-grid">
                {stats.week.daily.map((day, index) => (
                  <div key={index} className="daily-card">
                    <div className="day-name">
                      {new Date(day.date).toLocaleDateString('vi-VN', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: '2-digit' 
                      })}
                    </div>
                    <div className="day-count">{day.count}</div>
                    <div className="day-detail">
                      {day.qrScans} QR • {day.manual} thủ công
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckinDashboard;