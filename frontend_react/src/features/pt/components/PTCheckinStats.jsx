import React, { useState, useEffect } from 'react';
import { ScheduleStatisticsService } from '../../../firebase/lib/features/schedule/schedule.statistics';
import { Clock, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import styles from './PTCheckinStats.module.css';

const PTCheckinStats = ({ employee }) => {
  const [viewMode, setViewMode] = useState('week');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!employee?._id) return;
    
    setLoading(true);
    setError(null);
    
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
    
    return () => {
      console.log('🧹 Cleaning up stats subscription');
      unsubscribe();
    };
  }, [employee, viewMode]);

  if (loading) {
    return (
      <div className={styles.ptCheckinStats}>
        <div className={styles.statsLoading}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.ptCheckinStats}>
        <div className={styles.statsError}>
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
    <div className={styles.ptCheckinStats}>
      <div className={styles.statsHeader}>
        <h2>📊 Thống kê chấm công</h2>
        <div className={styles.viewModeToggle}>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'week' ? styles.active : ''}`}
            onClick={() => setViewMode('week')}
          >
            📅 Tuần này
          </button>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'month' ? styles.active : ''}`}
            onClick={() => setViewMode('month')}
          >
            📆 Tháng này
          </button>
        </div>
      </div>

      <div className={styles.statsPeriod}>
        <Calendar size={16} />
        <span>
          {new Date(period.startDate).toLocaleDateString('vi-VN')} - {new Date(period.endDate).toLocaleDateString('vi-VN')}
        </span>
      </div>

      <div className={styles.statsCards}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <div className={styles.statIcon}>
            <Clock size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{summary.totalWorkingTimeFormatted}</div>
            <div className={styles.statLabel}>Tổng thời gian làm việc</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statIcon}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{summary.totalDaysCompleted}</div>
            <div className={styles.statLabel}>Ngày hoàn thành</div>
            <div className={styles.statSublabel}>Check-in & checkout</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.info}`}>
          <div className={styles.statIcon}>
            <BarChart3 size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{summary.avgHoursPerDayFormatted}</div>
            <div className={styles.statLabel}>Trung bình/ngày</div>
            <div className={styles.statSublabel}>Giờ làm việc</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statIcon}>
            <div className={styles.completionCircle} style={{ '--percentage': completionRate }}>
              <span>{completionRate}%</span>
            </div>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{summary.totalDaysWithCheckin} / {period.totalDays}</div>
            <div className={styles.statLabel}>Tỷ lệ chấm công</div>
            <div className={styles.statSublabel}>Đã check-in</div>
          </div>
        </div>
      </div>

      <div className={styles.statsDetails}>
        <h3>Chi tiết từng ngày</h3>
        
        {details.length === 0 ? (
          <div className={styles.noData}>
            <p>Chưa có dữ liệu chấm công trong khoảng thời gian này</p>
          </div>
        ) : (
          <div className={styles.detailsTable}>
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
                  <tr key={index} className={styles[day.status]}>
                    <td className={styles.dateCell}>
                      {new Date(day.date).toLocaleDateString('vi-VN', { 
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </td>
                    <td className={styles.timeCell}>
                      {day.checkinTime 
                        ? day.checkinTime.toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : '-'
                      }
                    </td>
                    <td className={styles.timeCell}>
                      {day.checkoutTime 
                        ? day.checkoutTime.toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })
                        : '-'
                      }
                    </td>
                    <td className={styles.durationCell}>
                      {day.status === 'completed' 
                        ? `${day.hours}h ${day.minutes}m`
                        : '-'
                      }
                    </td>
                    <td className={styles.statusCell}>
                      {day.status === 'completed' ? (
                        <span className={`${styles.statusBadge} ${styles.completed}`}>✅ Hoàn thành</span>
                      ) : (
                        <span className={`${styles.statusBadge} ${styles.inProgress}`}>🕐 Đang làm</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.statsAdditional}>
        <div className={styles.additionalStat}>
          <span className={styles.statLabel}>Tổng ngày check-in:</span>
          <span className={styles.statValue}>{summary.totalDaysWithCheckin} ngày</span>
        </div>
        <div className={styles.additionalStat}>
          <span className={styles.statLabel}>Tổng ngày checkout:</span>
          <span className={styles.statValue}>{summary.totalDaysWithCheckout} ngày</span>
        </div>
        <div className={styles.additionalStat}>
          <span className={styles.statLabel}>Ngày chưa checkout:</span>
          <span className={styles.statValue}>
            {summary.totalDaysWithCheckin - summary.totalDaysWithCheckout} ngày
          </span>
        </div>
      </div>
    </div>
  );
};

export default PTCheckinStats;
