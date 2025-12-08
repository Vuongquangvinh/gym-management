import React, { useState } from 'react';
import styles from './ClientDetailModal.module.css';
import PTChat from './PTChat';

export default function ClientDetailModal({ isOpen, onClose, client }) {
  const [showChat, setShowChat] = useState(false);
  
  // Nếu đang hiển thị chat, chỉ hiển thị chat
  if (showChat) {
    return (
      <PTChat 
        initialClient={{ 
          id: client.user?._id || client.user?.id, 
          name: client.user?.full_name || client.user?.name 
        }} 
        onClose={() => setShowChat(false)} 
      />
    );
  }
  
  if (!isOpen || !client) return null;

  const user = client.user || {};
  const ptPackage = client.package || {};
  const contract = client.contract || {};

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  const getGenderText = (gender) => {
    const genderMap = { 'male': 'Nam', 'female': 'Nữ', 'other': 'Khác' };
    return genderMap[gender] || gender || 'N/A';
  };

  const getMembershipStatusText = (status) => {
    const statusMap = {
      'Active': 'Đang hoạt động',
      'Expired': 'Hết hạn',
      'Frozen': 'Tạm dừng',
      'Trial': 'Dùng thử'
    };
    return statusMap[status] || status || 'N/A';
  };

  const getContractStatusText = (status) => {
    const statusMap = {
      'pending_payment': 'Chờ thanh toán',
      'paid': 'Đã thanh toán',
      'active': 'Đang hoạt động',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status || 'N/A';
  };

  const getPaymentStatusText = (status) => {
    const statusMap = {
      'PENDING': 'Chờ thanh toán',
      'PAID': 'Đã thanh toán',
      'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status || 'N/A';
  };

  const renderSchedule = (weeklySchedule) => {
    if (!weeklySchedule) return <div className={styles.emptyText}>Chưa có lịch học</div>;
    const dayNames = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
    let slots = [];

    if (weeklySchedule.schedule && typeof weeklySchedule.schedule === 'object') {
      slots = Object.values(weeklySchedule.schedule);
    } else if (weeklySchedule.selectedTimeSlots && Array.isArray(weeklySchedule.selectedTimeSlots)) {
      slots = weeklySchedule.selectedTimeSlots;
    } else if (Array.isArray(weeklySchedule)) {
      slots = weeklySchedule;
    }

    if (slots.length === 0) return <div className={styles.emptyText}>Chưa có lịch học</div>;

    const normalized = slots.map(s => {
      const raw = parseInt(s.dayOfWeek, 10);
      let d = isNaN(raw) ? 0 : raw;
      if (d === 7) d = 0;
      if (d < 0 || d > 7) d = (d % 7 + 7) % 7;
      return { ...s, dayOfWeek: d };
    });

    return (
      <ul className={styles.scheduleList}>
        {normalized.sort((a,b) => a.dayOfWeek - b.dayOfWeek).map((slot, idx) => (
          <li key={idx}>
            <span className={styles.scheduleDay}>{dayNames[slot.dayOfWeek || 0]}</span>
            <span className={styles.scheduleTime}>{slot.startTime || 'N/A'} - {slot.endTime || 'N/A'}</span>
            {slot.note && <span className={styles.scheduleNote}>({slot.note})</span>}
          </li>
        ))}
      </ul>
    );
  };

  const getInitials = (name) => {
    if (!name || name === 'N/A') return '?';
    return name.split(' ').slice(-1)[0].substr(0,2).toUpperCase();
  };

  return (
    <div className={styles.clientDetailOverlay}
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.clientDetailContainer}>
        <div className={styles.clientDetailHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.userAvatarHeader}>{getInitials(user.full_name || user.name)}</div>
            <div>
              <h2>{user.full_name || user.name || 'N/A'}</h2>
              <span className={`${styles.membershipBadge} ${styles[`badge${(user.membership_status || 'active').charAt(0).toUpperCase() + (user.membership_status || 'active').slice(1).toLowerCase()}`]}`}>
                {getMembershipStatusText(user.membership_status)}
              </span>
            </div>
          </div>
          <button className={styles.clientDetailClose}
         onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className={styles.clientDetailBody}>
          <div className={styles.contentColumns}>
            {/* Left Column */}
            <div className={styles.leftColumn}>
              {/* Contact Info */}
              <div className={`${styles.infoSection} ${styles.compactSection}`}>
                <div className={styles.sectionHeader}>📞 Liên hệ</div>
                <div className={styles.infoRows}>
                  <div className={styles.infoRowCompact}>
                    <label>Email</label>
                    <span>{user.email || 'N/A'}</span>
                  </div>
                  <div className={styles.infoRowCompact}>
                    <label>SĐT</label>
                    <span>{user.phone_number || user.phone || 'N/A'}</span>
                  </div>
                  <div className={styles.infoRowCompact}>
                    <label>Sinh</label>
                    <span>{formatDate(user.date_of_birth)}</span>
                  </div>
                  <div className={styles.infoRowCompact}>
                    <label>Giới tính</label>
                    <span>{getGenderText(user.gender)}</span>
                  </div>
                </div>
                <div style={{marginTop: '12px', textAlign: 'center'}}>
                  <button className={styles.contactButton}
         onClick={() => setShowChat(true)}>
                    💬 Liên hệ
                  </button>
                </div>
              </div>

              {/* Contract Info */}
              <div className={`${styles.infoSection} ${styles.compactSection}`}>
                <div className={styles.sectionHeader}>
                  📋 Hợp đồng
                  <span className={`${styles.statusBadgeSm} ${styles[`status${(contract.status || 'active').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`]}`}>
                    {getContractStatusText(contract.status)}
                  </span>
                </div>
                <div className={styles.infoRows}>
                  <div className={styles.infoRowCompact}>
                    <label>Mã HĐ</label>
                    <span className={styles.contractCodeSm}>{contract.id?.slice(-8) || 'N/A'}</span>
                  </div>
                  <div className={styles.infoRowCompact}>
                    <label>Bắt đầu</label>
                    <span>{formatDate(contract.startDate || client.startDate)}</span>
                  </div>
                  <div className={styles.infoRowCompact}>
                    <label>Kết thúc</label>
                    <span>{formatDate(contract.endDate || client.endDate)}</span>
                  </div>
                  <div className={styles.infoRowCompact}>
                    <label>Thanh toán</label>
                    <span className={`${styles.paymentBadgeSm} ${styles[`payment${(contract.paymentStatus || 'pending').charAt(0).toUpperCase() + (contract.paymentStatus || 'pending').slice(1).toLowerCase()}`]}`}>
                      {getPaymentStatusText(contract.paymentStatus)}
                    </span>
                  </div>
                  {contract.paymentAmount && (
                    <div className={`${styles.infoRowCompact} ${styles.highlightRow}`}>
                      <label>Số tiền</label>
                      <span className={styles.amountSm}>{formatCurrency(contract.paymentAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Goals & Health */}
              {((user.fitness_goal && user.fitness_goal.length > 0) || (user.medical_conditions && user.medical_conditions.length > 0)) && (
                <div className={`${styles.infoSection} ${styles.compactSection}`}>
                  <div className={styles.sectionHeader}>🎯 Mục tiêu & Sức khỏe</div>
                  {(user.fitness_goal && user.fitness_goal.length > 0) && (
                    <div className={styles.tagListCompact}>
                      {user.fitness_goal?.map((goal, idx) => (
                        <span key={idx} className={`${styles.tagSm} ${styles.tagGoal}`}>{goal}</span>
                      ))}
                    </div>
                  )}
                  {(user.medical_conditions && user.medical_conditions.length > 0) && (
                    <div className={styles.tagListCompact}>
                      {user.medical_conditions?.map((condition, idx) => (
                        <span key={idx} className={`${styles.tagSm} ${styles.tagMedical}`}>{condition}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className={styles.rightColumn}>
              {/* Package Info */}
              <div className={`${styles.infoSection} ${styles.packageSection}`}>
                <div className={styles.sectionHeader}>
                  💪 Gói tập
                  <span className={`${styles.packageTypeBadgeSm} ${styles[`type${(ptPackage.packageType || 'session').charAt(0).toUpperCase() + (ptPackage.packageType || 'session').slice(1)}`]}`}>
                    {ptPackage.packageType === 'monthly' ? 'Tháng' : 'Buổi'}
                  </span>
                </div>
                <div className={styles.packageNameCompact}>{ptPackage.name || 'N/A'}</div>
                <div className={styles.packageStats}>
                  <div className={styles.statItem}>
                    <div className={`${styles.statValue} ${styles.priceValue}`}>{formatCurrency(ptPackage.price)}</div>
                    <div className={styles.statLabel}>Giá gói</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={`${styles.statValue} ${styles.sessionsTotal}`}>{ptPackage.sessions || 'N/A'}</div>
                    <div className={styles.statLabel}>Tổng buổi</div>
                  </div>
                  <div className={styles.statItem}>
                    <div className={`${styles.statValue} ${styles.sessionsRemaining}`}>{client.sessionsRemaining ?? 'N/A'}</div>
                    <div className={styles.statLabel}>Còn lại</div>
                  </div>
                </div>

                {ptPackage.features && ptPackage.features.length > 0 && (
                  <>
                    <div className={styles.subsectionTitle}>Đặc điểm</div>
                    <ul className={styles.featureListCompact}>
                      {ptPackage.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                      {ptPackage.features.length > 4 && (
                        <li className={styles.featureMore}>+{ptPackage.features.length - 4} khác...</li>
                      )}
                    </ul>
                  </>
                )}
              </div>

              {/* Schedule */}
              <div className={`${styles.infoSection} ${styles.scheduleSection}`}>
                <div className={styles.sectionHeader}>📅 Lịch tập</div>
                {renderSchedule(contract.weeklySchedule || client.weeklySchedule)}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.clientDetailFooter}>
          <button className={styles.closeButton}
         onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
