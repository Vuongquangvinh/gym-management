import React, { useState, useEffect } from 'react';
import { ScheduleStatisticsService } from '../../../firebase/lib/features/schedule/schedule.statistics';
import { Clock, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import './PTCheckinStats.css';

const PTCheckinStats = ({ employee }) => {
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to statistics with real-time updates
  useEffect(() => {
    if (!employee?._id) return;
    
    setLoading(true);
    setError(null);
    
    // Calculate date range based on view mode
    const now = new Date();
    let startDate, endDate;
    
    if (viewMode === 'week') {
      startDate = ScheduleStatisticsService.getStartOfWeek(now);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    console.log(`📊 Setting up real-time stats subscription (${viewMode})`);
    
    // Setup real-time subscription
    const unsubscribe = ScheduleStatisticsService.subscribeToStats(
      employee._id,
      startDate,
      endDate,
      (statsData) => {
        console.log('🔄 Stats updated:', statsData);
        setStats(statsData);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Stats error:', error);
        setError(error.message);
        setLoading(false);
      }
    );
    
    // Cleanup
    return () => {
      console.log('🧹 Cleaning up stats subscription');
      unsubscribe();
    };
  }, [employee, viewMode]);

  if (loading) {
    return (
      <div className="pt-checkin-stats">
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-checkin-stats">
        <div className="stats-error">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { period, summary, details } = stats;
  const completionRate = ScheduleStatisticsService.getCompletionRate(
    summary.totalDaysCompleted,
    period.totalDays
  );

  return (
    <div className="pt-checkin-stats">
      {/* Header with View Mode Toggle */}
      <div className="stats-header">
        <h2>📊 Thống kê chấm công</h2>
        <div className="view-mode-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            📅 Tuần này
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            📆 Tháng này
          </button>
        </div>
      </div>

      {/* Period Info */}
      <div className="stats-period">
        <Calendar size={16} />
        <span>
          {new Date(period.startDate).toLocaleDateString('vi-VN')} - {new Date(period.endDate).toLocaleDateString('vi-VN')}
        </span>
      </div>

      {/* Summary Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{summary.totalWorkingTimeFormatted}</div>
            <div className="stat-label">Tổng thời gian làm việc</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{summary.totalDaysCompleted}</div>
            <div className="stat-label">Ngày hoàn thành</div>
            <div className="stat-sublabel">Check-in & checkout</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{summary.avgHoursPerDayFormatted}</div>
            <div className="stat-label">Trung bình/ngày</div>
            <div className="stat-sublabel">Giờ làm việc</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <div className="completion-circle" style={{ '--percentage': completionRate }}>
              <span>{completionRate}%</span>
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{summary.totalDaysWithCheckin} / {period.totalDays}</div>
            <div className="stat-label">Tỷ lệ chấm công</div>
            <div className="stat-sublabel">Đã check-in</div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="stats-details">
        <h3>Chi tiết từng ngày</h3>
        
        {details.length === 0 ? (
          <div className="no-data">
            <p>Chưa có dữ liệu chấm công trong khoảng thời gian này</p>
          </div>
        ) : (
          <div className="details-table">
            <table>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Check-in</th>
                  <th>Checkout</th>
                  <th>Thời gian làm</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {details.map((day, index) => (
                  <tr key={index} className={day.status}>
                    <td className="date-cell">
                      {new Date(day.date).toLocaleDateString('vi-VN', { 
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </td>
                    <td className="time-cell">
                      {day.checkinTime 
                        ? day.checkinTime.toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : '-'
                      }
                    </td>
                    <td className="time-cell">
                      {day.checkoutTime 
                        ? day.checkoutTime.toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : '-'
                      }
                    </td>
                    <td className="duration-cell">
                      {day.status === 'completed' 
                        ? `${day.hours}h ${day.minutes}m`
                        : '-'
                      }
                    </td>
                    <td className="status-cell">
                      {day.status === 'completed' ? (
                        <span className="status-badge completed">✅ Hoàn thành</span>
                      ) : (
                        <span className="status-badge in-progress">🕐 Đang làm</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className="stats-additional">
        <div className="additional-stat">
          <span className="stat-label">Tổng ngày check-in:</span>
          <span className="stat-value">{summary.totalDaysWithCheckin} ngày</span>
        </div>
        <div className="additional-stat">
          <span className="stat-label">Tổng ngày checkout:</span>
          <span className="stat-value">{summary.totalDaysWithCheckout} ngày</span>
        </div>
        <div className="additional-stat">
          <span className="stat-label">Ngày chưa checkout:</span>
          <span className="stat-value">
            {summary.totalDaysWithCheckin - summary.totalDaysWithCheckout} ngày
          </span>
        </div>
      </div>
    </div>
  );
};

export default PTCheckinStats;

