import React, { useState, useEffect } from 'react';
import './CheckinStatsDashboard.css';
import StatCard from './StatCard.jsx';
import CheckinStatsModel from '../../../firebase/lib/features/checkin/checkin-stats.model.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const CheckinStatsDashboard = () => {
  const [overallStats, setOverallStats] = useState(null);
  const [dateRangeStats, setDateRangeStats] = useState([]);
  const [hourlyStats, setHourlyStats] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7days'); // 7days, 30days, 90days

  // Load data on mount and when period changes
  useEffect(() => {
    loadAllStats();
  }, [selectedPeriod]);

  const loadAllStats = async () => {
    try {
      setLoading(true);

      // Load overall stats
      const overall = await CheckinStatsModel.getOverallStats();
      setOverallStats(overall);

      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      // Load date range stats
      const dateStats = await CheckinStatsModel.getStatsByDateRange(startDate, endDate);
      setDateRangeStats(dateStats);

      // Load today's hourly stats
      const hourStats = await CheckinStatsModel.getStatsByHour(new Date());
      setHourlyStats(hourStats);

      // Load peak hours for the selected period
      const peaks = await CheckinStatsModel.getPeakHours(startDate, endDate);
      setPeakHours(peaks);

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const lineChartData = {
    labels: dateRangeStats.map(stat => {
      const date = new Date(stat.date);
      return date.toLocaleDateString('vi-VN', { 
        month: 'short', 
        day: 'numeric' 
      });
    }),
    datasets: [
      {
        label: 'Check-ins theo ngày',
        data: dateRangeStats.map(stat => stat.count),
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#007bff',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  };

  const barChartData = {
    labels: hourlyStats.map(stat => `${stat.hour.toString().padStart(2, '0')}:00`),
    datasets: [
      {
        label: 'Check-ins theo giờ',
        data: hourlyStats.map(stat => stat.count),
        backgroundColor: hourlyStats.map(stat => 
          stat.count > 0 ? 'rgba(0, 123, 255, 0.8)' : 'rgba(0, 123, 255, 0.3)'
        ),
        borderColor: '#007bff',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const pieChartData = {
    labels: ['QR Code', 'Thủ công'],
    datasets: [
      {
        data: [
          overallStats?.bySource?.qr || 0, 
          overallStats?.bySource?.manual || 0
        ],
        backgroundColor: [
          '#28a745',
          '#fd7e14',
        ],
        borderColor: [
          '#1e7e34',
          '#dc5500',
        ],
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <div className="checkin-stats-dashboard">
      <div className="dashboard-header">
        <h1>📊 Thống kê Check-in</h1>
        <div className="period-selector">
          <label>Khoảng thời gian:</label>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
            <option value="90days">90 ngày qua</option>
          </select>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="stats-grid">
        <StatCard
          title="Tổng Check-ins"
          value={overallStats?.total}
          icon="📈"
          color="blue"
          subtitle="Tất cả thời gian"
          loading={loading}
        />
        <StatCard
          title="Hôm nay"
          value={overallStats?.today}
          icon="📅"
          color="green"
          subtitle={new Date().toLocaleDateString('vi-VN')}
          loading={loading}
        />
        <StatCard
          title="Tuần này"
          value={overallStats?.thisWeek}
          icon="📆"
          color="orange"
          subtitle="7 ngày qua"
          loading={loading}
        />
        <StatCard
          title="Tháng này"
          value={overallStats?.thisMonth}
          icon="🗓️"
          color="purple"
          subtitle={new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Line Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Xu hướng Check-in theo ngày</h3>
            <span className="chart-subtitle">
              {selectedPeriod === '7days' ? '7 ngày qua' : 
               selectedPeriod === '30days' ? '30 ngày qua' : '90 ngày qua'}
            </span>
          </div>
          <div className="chart-wrapper">
            {loading ? (
              <div className="chart-loading">
                <div className="loading-spinner"></div>
                <span>Đang tải biểu đồ...</span>
              </div>
            ) : (
              <Line data={lineChartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Check-in theo giờ</h3>
            <span className="chart-subtitle">Hôm nay</span>
          </div>
          <div className="chart-wrapper">
            {loading ? (
              <div className="chart-loading">
                <div className="loading-spinner"></div>
                <span>Đang tải biểu đồ...</span>
              </div>
            ) : (
              <Bar data={barChartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Nguồn Check-in</h3>
            <span className="chart-subtitle">Tỷ lệ QR vs Thủ công</span>
          </div>
          <div className="chart-wrapper">
            {loading ? (
              <div className="chart-loading">
                <div className="loading-spinner"></div>
                <span>Đang tải biểu đồ...</span>
              </div>
            ) : (
              <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            )}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="chart-container peak-hours-container">
          <div className="chart-header">
            <h3>⏰ Khung giờ cao điểm</h3>
            <span className="chart-subtitle">Top 5 giờ có nhiều check-in nhất</span>
          </div>
          <div className="peak-hours-list">
            {loading ? (
              <div className="chart-loading">
                <div className="loading-spinner"></div>
                <span>Đang tải dữ liệu...</span>
              </div>
            ) : peakHours.length > 0 ? (
              peakHours.map((peak, index) => (
                <div key={peak.hour} className="peak-hour-item">
                  <div className="peak-rank">#{index + 1}</div>
                  <div className="peak-time">{peak.hourDisplay}</div>
                  <div className="peak-count">{peak.count} lượt</div>
                </div>
              ))
            ) : (
              <div className="no-data">Không có dữ liệu</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckinStatsDashboard;