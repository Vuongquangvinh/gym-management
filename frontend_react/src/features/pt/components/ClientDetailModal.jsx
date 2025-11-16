import React, { useState } from 'react';
import './ClientDetailModal.css';
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
    if (!weeklySchedule) return <div className="empty-text">Chưa có lịch học</div>;
    const dayNames = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
    let slots = [];

    if (weeklySchedule.schedule && typeof weeklySchedule.schedule === 'object') {
      slots = Object.values(weeklySchedule.schedule);
    } else if (weeklySchedule.selectedTimeSlots && Array.isArray(weeklySchedule.selectedTimeSlots)) {
      slots = weeklySchedule.selectedTimeSlots;
    } else if (Array.isArray(weeklySchedule)) {
      slots = weeklySchedule;
    }

    if (slots.length === 0) return <div className="empty-text">Chưa có lịch học</div>;

    const normalized = slots.map(s => {
      const raw = parseInt(s.dayOfWeek, 10);
      let d = isNaN(raw) ? 0 : raw;
      if (d === 7) d = 0;
      if (d < 0 || d > 7) d = (d % 7 + 7) % 7;
      return { ...s, dayOfWeek: d };
    });

    return (
      <ul className="schedule-list">
        {normalized.sort((a,b) => a.dayOfWeek - b.dayOfWeek).map((slot, idx) => (
          <li key={idx}>
            <span className="schedule-day">{dayNames[slot.dayOfWeek || 0]}</span>
            <span className="schedule-time">{slot.startTime || 'N/A'} - {slot.endTime || 'N/A'}</span>
            {slot.note && <span className="schedule-note">({slot.note})</span>}
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
    <div className="client-detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="client-detail-container">
        <div className="client-detail-header">
          <div className="header-left">
            <div className="user-avatar-header">{getInitials(user.full_name || user.name)}</div>
            <div>
              <h2>{user.full_name || user.name || 'N/A'}</h2>
              <span className={`membership-badge badge-${user.membership_status?.toLowerCase() || 'active'}`}>
                {getMembershipStatusText(user.membership_status)}
              </span>
            </div>
          </div>
          <button className="client-detail-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        <div className="client-detail-body">
          <div className="content-columns">
            {/* Left Column */}
            <div className="left-column">
              {/* Contact Info */}
              <div className="info-section compact-section">
                <div className="section-header">� Liên hệ</div>
                <div className="info-rows">
                  <div className="info-row-compact">
                    <label>Email</label>
                    <span>{user.email || 'N/A'}</span>
                  </div>
                  <div className="info-row-compact">
                    <label>SĐT</label>
                    <span>{user.phone_number || user.phone || 'N/A'}</span>
                  </div>
                  <div className="info-row-compact">
                    <label>Sinh</label>
                    <span>{formatDate(user.date_of_birth)}</span>
                  </div>
                  <div className="info-row-compact">
                    <label>Giới tính</label>
                    <span>{getGenderText(user.gender)}</span>
                  </div>
                </div>
                <div style={{marginTop: '12px', textAlign: 'center'}}>
                  <button className="btn-contact" onClick={() => setShowChat(true)}>
                    💬 Liên hệ
                  </button>
                </div>
              </div>

              {/* Contract Info */}
              <div className="info-section compact-section">
                <div className="section-header">
                  📋 Hợp đồng
                  <span className={`status-badge-sm status-${contract.status?.replace('_', '-')}`}>
                    {getContractStatusText(contract.status)}
                  </span>
                </div>
                <div className="info-rows">
                  <div className="info-row-compact">
                    <label>Mã HĐ</label>
                    <span className="contract-code-sm">{contract.id?.slice(-8) || 'N/A'}</span>
                  </div>
                  <div className="info-row-compact">
                    <label>Bắt đầu</label>
                    <span>{formatDate(contract.startDate || client.startDate)}</span>
                  </div>
                  <div className="info-row-compact">
                    <label>Kết thúc</label>
                    <span>{formatDate(contract.endDate || client.endDate)}</span>
                  </div>
                  <div className="info-row-compact">
                    <label>Thanh toán</label>
                    <span className={`payment-badge-sm payment-${contract.paymentStatus?.toLowerCase() || 'pending'}`}>
                      {getPaymentStatusText(contract.paymentStatus)}
                    </span>
                  </div>
                  {contract.paymentAmount && (
                    <div className="info-row-compact highlight-row">
                      <label>Số tiền</label>
                      <span className="amount-sm">{formatCurrency(contract.paymentAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Goals & Health */}
              {((user.fitness_goal && user.fitness_goal.length > 0) || (user.medical_conditions && user.medical_conditions.length > 0)) && (
                <div className="info-section compact-section">
                  <div className="section-header">🎯 Mục tiêu & Sức khỏe</div>
                  {(user.fitness_goal && user.fitness_goal.length > 0) && (
                    <div className="tag-list-compact">
                      {user.fitness_goal.map((goal, idx) => (
                        <span key={idx} className="tag-sm tag-goal">{goal}</span>
                      ))}
                    </div>
                  )}
                  {(user.medical_conditions && user.medical_conditions.length > 0) && (
                    <div className="tag-list-compact">
                      {user.medical_conditions.map((condition, idx) => (
                        <span key={idx} className="tag-sm tag-medical">{condition}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="right-column">
              {/* Package Info */}
              <div className="info-section package-section">
                <div className="section-header">
                  💪 Gói tập
                  <span className={`package-type-badge-sm type-${ptPackage.packageType || 'session'}`}>
                    {ptPackage.packageType === 'monthly' ? 'Tháng' : 'Buổi'}
                  </span>
                </div>
                <div className="package-name-compact">{ptPackage.name || 'N/A'}</div>
                <div className="package-stats">
                  <div className="stat-item">
                    <div className="stat-value price-value">{formatCurrency(ptPackage.price)}</div>
                    <div className="stat-label">Giá gói</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value sessions-total">{ptPackage.sessions || 'N/A'}</div>
                    <div className="stat-label">Tổng buổi</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value sessions-remaining">{client.sessionsRemaining ?? 'N/A'}</div>
                    <div className="stat-label">Còn lại</div>
                  </div>
                </div>

                {ptPackage.features && ptPackage.features.length > 0 && (
                  <>
                    <div className="subsection-title">Đặc điểm</div>
                    <ul className="feature-list-compact">
                      {ptPackage.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                      {ptPackage.features.length > 4 && (
                        <li className="feature-more">+{ptPackage.features.length - 4} khác...</li>
                      )}
                    </ul>
                  </>
                )}
              </div>

              {/* Schedule */}
              <div className="info-section schedule-section">
                <div className="section-header">📅 Lịch tập</div>
                {renderSchedule(contract.weeklySchedule || client.weeklySchedule)}
              </div>
            </div>
          </div>
        </div>

        <div className="client-detail-footer">
          <button className="btn-close" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}