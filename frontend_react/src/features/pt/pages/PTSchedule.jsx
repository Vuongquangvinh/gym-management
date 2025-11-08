import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/lib/features/auth/authContext';
import EmployeeService from '../../../firebase/lib/features/employee/employee.service';
import { ScheduleProvider, useSchedule } from '../../../firebase/lib/features/schedule/schedule.provider';
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import PTFaceRegistrationModal from '../components/PTFaceRegistrationModal';
import PTFaceCheckinModal from '../components/PTFaceCheckinModal';
import PTCheckinStats from '../components/PTCheckinStats';
import Swal from 'sweetalert2';
import './PTSchedule.css';

// Helper: Format time
const formatTime = (time) => {
  if (!time) return '-';
  
  try {
    if (typeof time === 'string') {
      if (time.includes(':') && !time.includes('T')) {
        return time.substring(0, 5);
      }
      const date = new Date(time);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (time instanceof Date) {
      return time.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
  } catch (error) {
    console.error('Error formatting time:', error);
  }
  
  return '-';
};

// Helper: Convert timestamp to Date
const convertToDate = (timestamp) => {
  if (!timestamp) return null;
  
  if (timestamp instanceof Date) {
    return timestamp;
  } else if (timestamp?.seconds) {
    // Firestore Timestamp
    return new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'string') {
    return new Date(timestamp);
  } else {
    return new Date(timestamp);
  }
};

// Helper: Calculate working hours
const calculateWorkingHours = (checkin, checkout) => {
  try {
    if (!checkin || !checkout) return '-';
    
    const checkinTime = convertToDate(checkin.timestamp);
    const checkoutTime = convertToDate(checkout.timestamp);
    
    // Check if dates are valid
    if (!checkinTime || !checkoutTime || isNaN(checkinTime.getTime()) || isNaN(checkoutTime.getTime())) {
      console.warn('Invalid timestamps:', { checkin: checkin.timestamp, checkout: checkout.timestamp });
      return '-';
    }
    
    // Calculate difference
    const diffMs = checkoutTime - checkinTime;
    
    // Check if difference is negative (invalid)
    if (diffMs < 0) {
      console.warn('Negative time difference - checkout before checkin:', { 
        checkinTime: checkinTime.toISOString(), 
        checkoutTime: checkoutTime.toISOString() 
      });
      return '-';
    }
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log('✅ Working hours calculated:', {
      checkin: checkinTime.toLocaleString('vi-VN'),
      checkout: checkoutTime.toLocaleString('vi-VN'),
      hours: diffHrs,
      minutes: diffMins
    });
    
    return `${diffHrs}h ${diffMins}m`;
  } catch (error) {
    console.error('❌ Error calculating working hours:', error);
    return '-';
  }
};

// WeeklyDatePicker Component (simplified for PT view)
const PTWeeklyDatePicker = ({ selectedDate, onDateChange }) => {
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const startOfWeek = getStartOfWeek(selectedDate);
  const weekDays = getWeekDays(startOfWeek);

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatDayName = (date) => {
    return date.toLocaleDateString('vi-VN', { weekday: 'short' });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    onDateChange(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    onDateChange(newDate);
  };

  const goToCurrentWeek = () => {
    onDateChange(new Date());
  };

  return (
    <div className="pt-weekly-date-picker">
      <div className="pt-week-navigation">
        <button 
          className="pt-nav-button" 
          onClick={goToPreviousWeek}
          title="Tuần trước"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="pt-week-info">
          <h3 className="pt-week-title">
            Tuần {startOfWeek.getDate()}/{startOfWeek.getMonth() + 1} - {weekDays[6].getDate()}/{weekDays[6].getMonth() + 1}/{weekDays[6].getFullYear()}
          </h3>
          <button 
            className="pt-today-button" 
            onClick={goToCurrentWeek}
            title="Về tuần hiện tại"
          >
            <Calendar size={16} />
            Hôm nay
          </button>
        </div>
        
        <button 
          className="pt-nav-button" 
          onClick={goToNextWeek}
          title="Tuần sau"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="pt-week-days">
        {weekDays.map((day, index) => (
          <button
            key={index}
            className={`pt-day-button ${isSelected(day) ? 'selected' : ''} ${isToday(day) ? 'today' : ''}`}
            onClick={() => onDateChange(day)}
          >
            <div className="pt-day-name">{formatDayName(day)}</div>
            <div className="pt-day-number">{formatDate(day)}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Main Content Component
const PTScheduleContent = () => {
  const { currentUser } = useAuth();
  const { 
    schedules, 
    checkins, 
    loading: scheduleLoading, 
    selectedDate, 
    changeDate,
    getCheckinInfo,
    getDateString,
    getStartOfWeek,
    getWeekDays
  } = useSchedule();

  const [employee, setEmployee] = useState(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [showFaceRegistrationModal, setShowFaceRegistrationModal] = useState(false);
  const [showFaceCheckinModal, setShowFaceCheckinModal] = useState(false);

  // Handle delete Face ID
  const handleDeleteFaceID = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Xác nhận xóa Face ID',
      html: `
        <p>Bạn có chắc chắn muốn xóa Face ID của mình?</p>
        <p style="margin-top: 12px; color: #666; font-size: 14px;">
          Sau khi xóa, bạn có thể đăng ký lại Face ID mới.
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: '🗑️ Xóa Face ID',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        const response = await fetch(`${API_BASE_URL}/api/face/delete/${employee._id}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          // Reload employee data
          const empResponse = await EmployeeService.getEmployeeByEmail(currentUser?.email);
          if (empResponse.success && empResponse.data) {
            setEmployee(empResponse.data);
          }

          Swal.fire({
            icon: 'success',
            title: 'Đã xóa!',
            text: 'Xóa Face ID thành công. Bạn có thể đăng ký lại Face ID mới.',
            confirmButtonText: 'Đóng',
            confirmButtonColor: '#007bff',
            timer: 3000,
            timerProgressBar: true
          });
        } else {
          throw new Error(data.message || 'Xóa Face ID thất bại');
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: error.message || 'Có lỗi xảy ra khi xóa Face ID',
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#007bff'
        });
      }
    }
  };

  // Load employee data
  useEffect(() => {
    const loadEmployeeData = async () => {
      try {
        setEmployeeLoading(true);
        const response = await EmployeeService.getEmployeeByEmail(currentUser?.email);
        
        if (response.success && response.data) {
          setEmployee(response.data);
        } else {
          console.error('Failed to load employee:', response.error);
        }
      } catch (error) {
        console.error('Error loading employee data:', error);
      } finally {
        setEmployeeLoading(false);
      }
    };

    if (currentUser?.email) {
      loadEmployeeData();
    }
  }, [currentUser]);

  // Get current week days
  const weekDays = getWeekDays(getStartOfWeek(selectedDate));

  // Get schedule for specific day
  const getScheduleForDay = (date) => {
    const dateStr = getDateString(date);
    return schedules[dateStr]?.find(s => s.employeeId === employee?._id);
  };

  // Get status icon based on checkin status
  const getStatusIcon = (checkin, checkout) => {
    if (checkin && checkout) {
      return <CheckCircle className="status-icon completed" size={20} />;
    } else if (checkin) {
      return <Clock className="status-icon in-progress" size={20} />;
    } else {
      return <XCircle className="status-icon not-started" size={20} />;
    }
  };

  // Get status text
  const getStatusText = (checkin, checkout) => {
    if (checkin && checkout) {
      return 'Hoàn thành';
    } else if (checkin) {
      return 'Đang làm';
    } else {
      return 'Chưa check-in';
    }
  };

  const loading = employeeLoading || scheduleLoading;

  if (loading) {
    return (
      <div className="pt-schedule-page">
        <div className="pt-schedule-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="pt-schedule-page">
        <div className="pt-schedule-error">
          <p>Không tìm thấy thông tin nhân viên</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-schedule-page">
      {/* Header */}
      <div className="pt-schedule-header">
        <div className="header-left">
          <h1>📅 Lịch làm việc của tôi</h1>
          <p>Xem lịch làm việc và trạng thái check-in/check-out</p>
        </div>
        
        <div className="header-right">
          {/* Employee Info Badge */}
          <div className="pt-employee-badge">
            <div className="badge-avatar">
              {employee.avatarUrl ? (
                <img src={employee.avatarUrl} alt={employee.fullName || employee.name} />
              ) : (
                <span>{(employee.fullName || employee.name).charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="badge-info">
              <div className="badge-name">{employee.fullName || employee.name}</div>
              <div className={`badge-shift ${employee.shift}`}>
                {employee.shift === 'fulltime' ? '⏰ Fulltime' : '🕐 Partime'}
              </div>
            </div>
          </div>
          
          {/* Face ID Actions */}
          <div className="pt-face-actions">
            {!employee.faceRegistered ? (
              <button 
                className="btn-register-face-id"
                onClick={() => setShowFaceRegistrationModal(true)}
                title="Đăng ký Face ID để check-in/checkout nhanh hơn"
              >
                📷 Đăng ký Face ID
              </button>
            ) : (
              <>
                <button 
                  className="btn-face-checkin"
                  onClick={() => setShowFaceCheckinModal(true)}
                  title="Sử dụng Face ID để check-in/checkout"
                >
                  ✨ Face Check-in
                </button>
                <button 
                  className="btn-delete-face-id"
                  onClick={handleDeleteFaceID}
                  title="Xóa Face ID và đăng ký lại"
                >
                  🗑️ Xóa Face ID
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Date Picker */}
      <PTWeeklyDatePicker 
        selectedDate={selectedDate}
        onDateChange={changeDate}
      />

      {/* Shift Type Info & Face ID Status */}
      <div className="pt-info-cards">
        {/* Shift Info */}
        {employee.shift === 'fulltime' ? (
          <div className="shift-info-card fulltime">
            <div className="shift-icon">⏰</div>
            <div className="shift-details">
              <h3>Nhân viên Fulltime</h3>
              <p>Bạn làm việc toàn thời gian với lịch cố định hàng ngày (08:00 - 17:00)</p>
            </div>
          </div>
        ) : (
          <div className="shift-info-card parttime">
            <div className="shift-icon">🕐</div>
            <div className="shift-details">
              <h3>Nhân viên Partime</h3>
              <p>Bạn làm việc bán thời gian theo lịch được sắp xếp. Chỉ những ngày có lịch mới cần check-in.</p>
            </div>
          </div>
        )}

        {/* Face ID Status */}
        <div className={`face-id-status-card ${employee.faceRegistered ? 'registered' : 'unregistered'}`}>
          <div className="face-id-icon">{employee.faceRegistered ? '✅' : '📷'}</div>
          <div className="face-id-details">
            <h3>{employee.faceRegistered ? 'Face ID đã đăng ký' : 'Chưa có Face ID'}</h3>
            <p>
              {employee.faceRegistered 
                ? 'Bạn có thể sử dụng Face ID để check-in/checkout nhanh chóng'
                : 'Đăng ký Face ID để check-in/checkout nhanh hơn mà không cần QR code'
              }
            </p>
            {employee.faceRegistered && employee.faceIdCreatedAt && (
              <p className="registration-date">
                Đăng ký: {new Date(employee.faceIdCreatedAt.toDate?.() || employee.faceIdCreatedAt).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Checkin Statistics */}
      <PTCheckinStats employee={employee} />

      {/* Weekly Schedule Grid */}
      <div className="pt-schedule-grid">
        {weekDays.map((day, index) => {
          const schedule = getScheduleForDay(day);
          const { checkin, checkout } = getCheckinInfo(employee._id, day);
          const dateStr = getDateString(day);
          const isToday = day.toDateString() === new Date().toDateString();
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
          
          // Determine if employee works on this day
          const hasSchedule = employee.shift === 'fulltime' || schedule;

          return (
            <div 
              key={index} 
              className={`pt-schedule-card ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${!hasSchedule ? 'no-schedule' : ''}`}
            >
              {/* Date Header */}
              <div className="card-date-header">
                <div className="date-day">{day.toLocaleDateString('vi-VN', { weekday: 'long' })}</div>
                <div className="date-number">
                  {day.getDate()}/{day.getMonth() + 1}/{day.getFullYear()}
                </div>
                {isToday && <span className="today-badge">Hôm nay</span>}
              </div>

              {/* Schedule Info */}
              {hasSchedule ? (
                <div className="card-schedule-info">
                  {/* Working Hours */}
                  <div className="schedule-hours">
                    <Clock size={18} />
                    <span className="hours-text">
                      {employee.shift === 'fulltime' 
                        ? '08:00 - 17:00 (Fulltime)'
                        : `${formatTime(schedule?.startTime)} - ${formatTime(schedule?.endTime)}`
                      }
                    </span>
                  </div>

                  {/* Check-in Status */}
                  <div className={`checkin-status ${checkin && checkout ? 'completed' : checkin ? 'in-progress' : 'pending'}`}>
                    {getStatusIcon(checkin, checkout)}
                    <div className="status-details">
                      <div className="status-label">{getStatusText(checkin, checkout)}</div>
                      {checkin && (
                        <div className="status-time">
                          Check-in: {formatTime(checkin.timestamp)}
                        </div>
                      )}
                      {checkout && (
                        <div className="status-time">
                          Check-out: {formatTime(checkout.timestamp)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {schedule?.notes && (
                    <div className="schedule-notes">
                      <div className="notes-label">📝 Ghi chú:</div>
                      <div className="notes-text">{schedule.notes}</div>
                    </div>
                  )}

                  {/* Working Hours Summary (if completed) */}
                  {checkin && checkout && (
                    <div className="working-hours-summary">
                      <div className="summary-label">⏱️ Tổng giờ làm:</div>
                      <div className="summary-value">
                        {calculateWorkingHours(checkin, checkout)}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card-no-schedule">
                  <div className="no-schedule-icon">📭</div>
                  <div className="no-schedule-text">Không có lịch làm việc</div>
                  <div className="no-schedule-hint">
                    {employee.shift === 'parttime' && 'Bạn không có ca làm trong ngày này'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-schedule-legend">
        <div className="legend-title">Chú thích:</div>
        <div className="legend-items">
          <div className="legend-item">
            <CheckCircle className="legend-icon completed" size={16} />
            <span>Hoàn thành (Đã check-in & check-out)</span>
          </div>
          <div className="legend-item">
            <Clock className="legend-icon in-progress" size={16} />
            <span>Đang làm (Đã check-in)</span>
          </div>
          <div className="legend-item">
            <XCircle className="legend-icon not-started" size={16} />
            <span>Chưa check-in</span>
          </div>
        </div>
      </div>

      {/* Face Registration Modal */}
      {showFaceRegistrationModal && employee && (
        <PTFaceRegistrationModal
          isOpen={showFaceRegistrationModal}
          onClose={() => setShowFaceRegistrationModal(false)}
          employee={employee}
          onRegistrationSuccess={async () => {
            // Reload employee data to get updated faceRegistered status
            const response = await EmployeeService.getEmployeeByEmail(currentUser?.email);
            if (response.success && response.data) {
              setEmployee(response.data);
            }
          }}
        />
      )}

      {/* Face Checkin Modal */}
      {showFaceCheckinModal && (
        <PTFaceCheckinModal
          isOpen={showFaceCheckinModal}
          onClose={() => setShowFaceCheckinModal(false)}
          onCheckinSuccess={(checkinData) => {
            console.log('✅ Checkin success:', checkinData);
            // The schedule will auto-update via onSnapshot
          }}
        />
      )}
    </div>
  );
};

// Main Component with Provider
export default function PTSchedule() {
  return (
    <ScheduleProvider>
      <PTScheduleContent />
    </ScheduleProvider>
  );
}
