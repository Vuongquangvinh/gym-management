import React, { useState } from "react";
import { motion } from "framer-motion";
import styles from "./detailPackage.module.css";
import ChangePackageInformation from "../changePackageInformation/changePackageInformation";
import UserModel from "../../../../firebase/lib/features/user/user.model.js";

import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement);

export default function DetailPackage({ pkg, onClose }) {
  const [editing, setEditing] = useState(false);
  const [currentPkg, setCurrentPkg] = useState(pkg);
  const [members, setMembers] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const combinedChartData = React.useMemo(() => {
    const regCounts = {};
    const revCounts = {};
    
    members.forEach((m) => {
      if (m.join_date) {
        const date = new Date(m.join_date);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
        regCounts[key] = (regCounts[key] || 0) + 1;
        
        let price = m.price || currentPkg.price || 0;
        price = typeof price === "string" ? parseInt(price.replace(/[^\d]/g, ""), 10) : price;
        revCounts[key] = (revCounts[key] || 0) + price;
      }
    });
    
    const sortedKeys = Object.keys(regCounts).sort();
    
    return {
      labels: sortedKeys,
      datasets: [
        {
          label: "Số lượng đăng ký",
          data: sortedKeys.map((k) => regCounts[k]),
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 1)",
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "rgba(54, 162, 235, 1)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          fill: false,
          tension: 0,
          yAxisID: 'y',
        },
        {
          label: "Doanh thu (VNĐ)",
          data: sortedKeys.map((k) => revCounts[k]),
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 1)",
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "rgba(255, 99, 132, 1)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          fill: false,
          tension: 0,
          yAxisID: 'y1',
        },
      ],
    };
  }, [members, currentPkg.price]);

  React.useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    Promise.all([
      UserModel.getUsersByPackageId(currentPkg.id),
      UserModel.calculatePackageRevenue(currentPkg.id),
      UserModel.getAdvancedAnalytics(currentPkg.id),
      UserModel.compareWithOtherPackages(currentPkg.id)
    ])
      .then(([users, totalRevenue, analyticsData, comparisonData]) => {
        if (isMounted) {
          setMembers(users);
          setRevenue(totalRevenue);
          setAnalytics(analyticsData);
          setComparison(comparisonData);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Lỗi khi tải dữ liệu");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [currentPkg.id]);

  if (editing) {
    return (
      <ChangePackageInformation
        pkg={currentPkg}
        onSave={(newPkg) => {
          setCurrentPkg(newPkg);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <motion.div
      className={styles.detailPackageContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.header}>
        <h2>Chi tiết gói tập: {currentPkg.name}</h2>
        <div className={styles.headerActions}>
          <button
            className={styles.editBtn}
            onClick={() => setEditing(true)}
          >
            <span className={styles.editBtnIcon}>✎ </span>
            Chỉnh sửa
          </button>
          <button
            className={styles.closeBtn}
            onClick={onClose}
          >
            <span className={styles.closeBtnIcon}>×  </span>
            Đóng
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>Mã gói</div>
            <div className={styles.infoValue}>{currentPkg.id}</div>
            <div className={styles.infoNote}>Mã định danh duy nhất cho gói tập</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>Loại</div>
            <div className={styles.infoValue}>{currentPkg.type}</div>
            <div className={styles.infoNote}>Loại hình gói tập</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>Thời hạn</div>
            <div className={styles.infoValue}>{currentPkg.duration}</div>
            <div className={styles.infoNote}>Thời gian sử dụng gói</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>Giá</div>
            <div className={styles.infoValue}>{currentPkg.price}</div>
            <div className={styles.infoNote}>Giá bán của gói tập</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>Mô tả</div>
            <div className={styles.infoValue}>{currentPkg.description}</div>
            <div className={styles.infoNote}>Thông tin chi tiết về gói tập</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>Ưu đãi</div>
            <div className={styles.infoValue}>{currentPkg.offer}</div>
            <div className={styles.infoNote}>Các ưu đãi đi kèm</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>Khuyến mãi</div>
            <div className={styles.infoValue}>{currentPkg.promotion}</div>
            <div className={styles.infoNote}>Điều kiện khuyến mãi</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>Thời gian áp dụng</div>
            <div className={styles.infoValue}>{currentPkg.startDate} → {currentPkg.endDate}</div>
            <div className={styles.infoNote}>Khoảng thời gian gói có hiệu lực</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoTitle}>Trạng thái</div>
            <div className={styles.infoValue}>{currentPkg.status === "active" ? "Đang áp dụng" : "Ngừng áp dụng"}</div>
            <div className={styles.infoNote}>Tình trạng hiện tại của gói</div>
          </div>
        </div>
      </div>

      {/* Phân tích và thống kê nâng cao */}
      {analytics && (
        <>
          <div className={styles.section}>
            <h3>📊 Phân tích & Thống kê nâng cao</h3>
            {loading ? (
              <div>Đang tải phân tích...</div>
            ) : error ? (
              <div className={styles.error}>{error}</div>
            ) : (
              <div className={styles.analyticsGrid}>
                <div className={styles.analyticsCard}>
                  <div className={styles.analyticsLabel}>Tổng thành viên</div>
                  <div className={styles.analyticsValue}>{analytics.totalUsers}</div>
                  <div className={styles.analyticsSublabel}>người</div>
                </div>
                <div className={`${styles.analyticsCard} ${styles.success}`}>
                  <div className={styles.analyticsLabel}>Đang hoạt động</div>
                  <div className={styles.analyticsValue}>{analytics.activeCount}</div>
                  <div className={styles.analyticsSublabel}>{analytics.activeRate}%</div>
                </div>
                <div className={`${styles.analyticsCard} ${styles.warning}`}>
                  <div className={styles.analyticsLabel}>Sắp hết hạn</div>
                  <div className={styles.analyticsValue}>{analytics.expiringCount}</div>
                  <div className={styles.analyticsSublabel}>trong 7 ngày</div>
                </div>
                <div className={`${styles.analyticsCard} ${styles.danger}`}>
                  <div className={styles.analyticsLabel}>Đã hết hạn</div>
                  <div className={styles.analyticsValue}>{analytics.expiredCount}</div>
                  <div className={styles.analyticsSublabel}>{((analytics.expiredCount / analytics.totalUsers) * 100).toFixed(1)}%</div>
                </div>
                <div className={styles.analyticsCard}>
                  <div className={styles.analyticsLabel}>Tỷ lệ hủy gói</div>
                  <div className={styles.analyticsValue}>{analytics.cancelRate}%</div>
                  <div className={styles.analyticsSublabel}>{analytics.canceledCount} người</div>
                </div>
                
                <div className={`${styles.analyticsCard} ${styles.info}`}>
                  <div className={styles.analyticsLabel}>Doanh thu hiện tại</div>
                  <div className={styles.analyticsValue}>{analytics.currentRevenue.toLocaleString()}đ</div>
                  <div className={styles.analyticsSublabel}>từ {analytics.totalUsers} người</div>
                </div>
                {/* <div className="analytics-card info">
                  <div className="analytics-label">Doanh thu dự kiến</div>
                  <div className="analytics-value">{analytics.projectedRevenue.toLocaleString()}đ</div>
                  <div className="analytics-sublabel">từ {analytics.activeCount} người active</div>
                </div> */}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h3>🥧 Phân bổ trạng thái thành viên</h3>
            {loading ? (
              <div>Đang tải biểu đồ...</div>
            ) : error ? (
              <div className={styles.error}>{error}</div>
            ) : (
              <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}>
                <Doughnut
                  data={{
                    labels: ['Đang hoạt động', 'Sắp hết hạn', 'Đã hết hạn', 'Đã hủy'],
                    datasets: [{
                      data: [
                        analytics.activeCount,
                        analytics.expiringCount,
                        analytics.expiredCount,
                        analytics.canceledCount
                      ],
                      backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(201, 203, 207, 0.8)'
                      ],
                      borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(201, 203, 207, 1)'
                      ],
                      borderWidth: 2,
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          font: { size: 14 }
                        }
                      },
                      title: {
                        display: true,
                        text: `Tổng: ${analytics.totalUsers} thành viên`,
                        font: { size: 16 }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} người (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>

          {comparison && comparison.length > 0 && (
            <div className={styles.section}>
              <h3>📈 So sánh với các gói khác (Top 5)</h3>
              {loading ? (
                <div>Đang tải so sánh...</div>
              ) : error ? (
                <div className={styles.error}>{error}</div>
              ) : (
                <div style={{ padding: "20px" }}>
                  <Bar
                    data={{
                      labels: comparison.map(c => c.packageName),
                      datasets: [
                        {
                          label: 'Số lượng thành viên',
                          data: comparison.map(c => c.totalUsers),
                          backgroundColor: 'rgba(54, 162, 235, 0.6)',
                          borderColor: 'rgba(54, 162, 235, 1)',
                          borderWidth: 2,
                          yAxisID: 'y',
                        },
                        {
                          label: 'Doanh thu (VNĐ)',
                          data: comparison.map(c => c.revenue),
                          backgroundColor: 'rgba(255, 99, 132, 0.6)',
                          borderColor: 'rgba(255, 99, 132, 1)',
                          borderWidth: 2,
                          yAxisID: 'y1',
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            padding: 20,
                            font: { size: 14 }
                          }
                        },
                        title: {
                          display: true,
                          text: 'So sánh hiệu suất các gói tập',
                          font: { size: 16 }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              let label = context.dataset.label || '';
                              if (label) {
                                label += ': ';
                              }
                              if (context.dataset.yAxisID === 'y1') {
                                label += context.parsed.y.toLocaleString() + 'đ';
                              } else {
                                label += context.parsed.y + ' người';
                              }
                              return label;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Số lượng thành viên',
                            font: { size: 14, weight: 'bold' }
                          }
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Doanh thu (VNĐ)',
                            font: { size: 14, weight: 'bold' }
                          },
                          ticks: {
                            callback: function(value) {
                              return value.toLocaleString() + 'đ';
                            }
                          },
                          grid: {
                            drawOnChartArea: false,
                          },
                        },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* <div className="section">
        <h3>Người đã đăng ký</h3>
        {loading ? (
          <div>Đang tải danh sách...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <ul className="member-list">
            {members.length === 0 ? (
              <li>Chưa có ai đăng ký gói này.</li>
            ) : (
              members.map((m) => (
                <li key={m._id}>{m.full_name} (Ngày đăng ký: {m.join_date ? new Date(m.join_date).toLocaleDateString() : "N/A"})</li>
              ))
            )}
          </ul>
        )}
      </div> */}

      <div className={styles.section}>
        <h3>Biểu đồ số lượng đăng ký và doanh thu theo tháng/năm</h3>
        {loading ? (
          <div>Đang tải biểu đồ...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div style={{ marginBottom: "40px" }}>
            <Line 
              data={combinedChartData} 
              options={{
                responsive: true,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                plugins: {
                  legend: { 
                    position: "top",
                    labels: {
                      usePointStyle: true,
                      padding: 20,
                    }
                  },
                  title: { 
                    display: true, 
                    text: "Số lượng đăng ký và Doanh thu theo tháng/năm",
                    font: {
                      size: 16
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                          label += ': ';
                        }
                        if (context.dataset.yAxisID === 'y1') {
                          label += context.parsed.y.toLocaleString() + 'đ';
                        } else {
                          label += context.parsed.y;
                        }
                        return label;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Số lượng đăng ký',
                      font: {
                        size: 14,
                        weight: 'bold'
                      }
                    },
                    ticks: {
                      stepSize: 1
                    }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Doanh thu (VNĐ)',
                      font: {
                        size: 14,
                        weight: 'bold'
                      }
                    },
                    ticks: {
                      callback: function(value) {
                        return value.toLocaleString() + 'đ';
                      }
                    },
                    grid: {
                      drawOnChartArea: false,
                    },
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Tháng/Năm',
                      font: {
                        size: 14,
                        weight: 'bold'
                      }
                    }
                  }
                },
              }} 
            />
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h3>Tổng doanh thu</h3>
        {loading ? (
          <div>Đang tính doanh thu...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.revenue}>{revenue.toLocaleString()}đ</div>
        )}
      </div>
    </motion.div>
  );
}