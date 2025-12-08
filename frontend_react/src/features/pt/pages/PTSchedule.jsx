import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/lib/features/auth/authContext';
import EmployeeService from '../../../firebase/lib/features/employee/employee.service';
import ContractService from '../../../firebase/lib/features/contract/contract.service';
import { ScheduleProvider, useSchedule } from '../../../firebase/lib/features/schedule/schedule.provider';
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, XCircle, User, Phone, Mail, Search, Filter, X } from 'lucide-react';
import PTFaceRegistrationModal from '../components/PTFaceRegistrationModal';
import PTFaceCheckinModal from '../components/PTFaceCheckinModal';
import PTCheckinStats from '../components/PTCheckinStats';
import Swal from 'sweetalert2';
import styles  from './PTSchedule.module.css';

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
    <div className={styles.ptWeeklyDatePicker}>
      <div className={styles.ptWeekNavigation}>
        <button 
          className={styles.ptNavButton} 
          onClick={goToPreviousWeek}
          title="Tuần trước"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className={styles.ptWeekInfo}>
          <h3 className={styles.ptWeekTitle}>
            Tuần {startOfWeek.getDate()}/{startOfWeek.getMonth() + 1} - {weekDays[6].getDate()}/{weekDays[6].getMonth() + 1}/{weekDays[6].getFullYear()}
          </h3>
          <button 
            className={styles.ptTodayButton} 
            onClick={goToCurrentWeek}
            title="Về tuần hiện tại"
          >
            <Calendar size={16} />
            Hôm nay
          </button>
        </div>
        
        <button 
          className={styles.ptNavButton} 
          onClick={goToNextWeek}
          title="Tuần sau"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className={styles.ptWeekDays}>
        {weekDays.map((day, index) => (
          <button
            key={index}
            className={`${styles.ptDayButton} ${isSelected(day) ? styles.selected : ''} ${isToday(day) ? styles.today : ''}`}
            onClick={() => onDateChange(day)}
          >
            <div className={styles.ptDayName}>{formatDayName(day)}</div>
            <div className={styles.ptDayNumber}>{formatDate(day)}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Member Detail Modal Component
const MemberDetailModal = ({ member, isOpen, onClose }) => {
  if (!isOpen) return null;

  const contract = member.contract;
  const user = member.user;

  return (
    <div className={styles.memberDetailModalOverlay} onClick={onClose}>
      <div className={styles.memberDetailModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>
            <User size={20} />
            Thông tin học viên
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Avatar & Basic Info */}
          <div className={styles.memberProfile}>
            <div className={styles.memberAvatarLarge}>
              {user?.photoURL || user?.avatar ? (
                <img src={user.photoURL || user.avatar} alt={member.fullName} />
              ) : (
                <span>{member.fullName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className={styles.memberProfileInfo}>
              <h4>{member.fullName}</h4>
              {user?.email && (
                <div className={styles.infoRow}>
                  <Mail size={16} />
                  <span>{user.email}</span>
                </div>
              )}
              {user?.phone && (
                <div className={styles.infoRow}>
                  <Phone size={16} />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contract Info */}
          <div className={styles.infoSection}>
            <h5>📋 Thông tin gói tập</h5>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Loại gói:</span>
                <span className={styles.value}>{contract?.packageId?.name || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Số buổi còn lại:</span>
                <span className={`${styles.value} ${styles.highlight}`}>{contract?.sessionsRemaining || 0} buổi</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Trạng thái:</span>
                <span className={`${styles.value} ${styles.status} ${contract?.status}`}>
                  {contract?.status === 'active' ? '✅ Đang hoạt động' : 
                   contract?.status === 'expired' ? '⏰ Hết hạn' : 
                   contract?.status === 'cancelled' ? '❌ Đã hủy' : 'N/A'}
                </span>
              </div>
              {contract?.startDate && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>Ngày bắt đầu:</span>
                  <span className={styles.value}>
                    {new Date(contract.startDate.toDate?.() || contract.startDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
              {contract?.endDate && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>Ngày kết thúc:</span>
                  <span className={styles.value}>
                    {new Date(contract.endDate.toDate?.() || contract.endDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Schedule */}
          {contract?.weeklySchedule?.schedule && (
            <div className={styles.infoSection}>
              <h5>📅 Lịch tập trong tuần</h5>
              <div className={styles.weeklyScheduleGrid}>
                {Object.entries(contract.weeklySchedule.schedule).map(([day, slot]) => {
                  const dayNames = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };
                  return (
                    <div key={day} className={styles.scheduleSlot}>
                      <span className={styles.dayLabel}>{dayNames[day]}</span>
                      <span className={styles.timeLabel}>{slot.startTime} - {slot.endTime}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {contract?.notes && (
            <div className={styles.infoSection}>
              <h5>📝 Ghi chú</h5>
              <p className={styles.notesText}>{contract.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Time Slot Component
const TimeSlotSection = ({ timeSlot, members, onMemberClick, slotDate }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // slotDate là ngày đang render (Date object)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const slotDay = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());

  // So sánh giờ
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const endTime = timeSlot.split('-')[1]?.trim();

  let isPast = false;
  if (slotDay < today) {
    isPast = true;
  } else if (slotDay.getTime() === today.getTime()) {
    // Nếu là hôm nay, so sánh giờ
    isPast = endTime && endTime <= currentTime;
  }

  return (
    <div className={`${styles.timeSlotSection}${isPast ? ' '+styles.past : ''}`}>
      <div className={styles.timeSlotHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.timeSlotInfo}>
          <Clock size={18} />
          <span className={styles.timeRange}>{timeSlot}</span>
          <span className={styles.memberCountBadge}>{members.length}</span>
        </div>
        <ChevronRight size={18} className={isExpanded ? styles.rotated : ''} />
      </div>

      {isExpanded && (
        <div className={styles.timeSlotMembers}>
          {members.map((member, idx) => (
            <div 
              key={idx} 
              className={styles.memberCard}
              onClick={() => onMemberClick(member)}
            >
              <div className={styles.memberCardAvatar}>
                {member.user?.photoURL || member.user?.avatar ? (
                  <img src={member.user.photoURL || member.user.avatar} alt={member.fullName} />
                ) : (
                  <span>{member.fullName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className={styles.memberCardInfo}>
                <div className={styles.memberCardName}>{member.fullName}</div>
                <div className={styles.memberCardMeta}>
                  <span className={styles.memberTime}>{member.startTime} - {member.endTime}</span>
                  {member.contract?.sessionsRemaining !== undefined && (
                    <span className={styles.sessionsRemaining}>
                      {member.contract.sessionsRemaining} buổi còn lại
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.memberCardStatus}>
                <span className={`${styles.statusBadge} ${member.contract?.status}`}>
                  {member.contract?.status === 'active' ? '✓' : 
                   member.contract?.status === 'expired' ? '⏰' : '?'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Content Component
const PTScheduleContent = () => {
  const { currentUser } = useAuth();
  const { 
    loading: scheduleLoading, 
    selectedDate, 
    changeDate,
    getStartOfWeek,
    getWeekDays
  } = useSchedule();

  const [employee, setEmployee] = useState(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [showFaceRegistrationModal, setShowFaceRegistrationModal] = useState(false);
  const [showFaceCheckinModal, setShowFaceCheckinModal] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null); // Track which day is expanded
  const [ptContracts, setPtContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetail, setShowMemberDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, expired
  const [showFilters, setShowFilters] = useState(false);
  
  // Load PT contracts and member schedules
  useEffect(() => {
    const fetchContracts = async () => {
      if (!employee?._id) return;
      setContractsLoading(true);
      try {
        const res = await ContractService.getPTClientsWithContracts(employee._id);
        if (res.success && Array.isArray(res.data)) {
          setPtContracts(res.data);
        } else {
          setPtContracts([]);
        }
      } catch {
        setPtContracts([]);
      } finally {
        setContractsLoading(false);
      }
    };
    fetchContracts();
  }, [employee?._id]);

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

  // Group members by time slots
  const groupMembersByTimeSlot = (members) => {
    const groups = {};
    members.forEach(member => {
      const timeSlot = `${member.startTime} - ${member.endTime}`;
      if (!groups[timeSlot]) {
        groups[timeSlot] = [];
      }
      groups[timeSlot].push(member);
    });
    // Sort by start time
    return Object.entries(groups).sort((a, b) => {
      const timeA = a[0].split(' - ')[0];
      const timeB = b[0].split(' - ')[0];
      return timeA.localeCompare(timeB);
    });
  };

  // Filter and search members
  const filterMembers = (members) => {
    let filtered = members;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.user?.phone?.includes(searchTerm)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(m => m.contract?.status === filterStatus);
    }

    return filtered;
  };

  // Calculate daily statistics
  const calculateDayStats = (members, currentDay) => {
    const total = members.length;
    const expired = members.filter(m => m.contract?.status === 'expired').length;
    
    // Đếm tổng số khung giờ khác nhau trong ngày
    const uniqueTimeSlots = new Set(members.map(m => `${m.startTime}-${m.endTime}`));
    const totalTimeSlots = uniqueTimeSlots.size;
    
    // Đếm số khung giờ còn lại (chưa qua endTime)
    const now = new Date();
    const isToday = currentDay.toDateString() === now.toDateString();
    
    let remainingTimeSlots = totalTimeSlots;
    if (isToday) {
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      remainingTimeSlots = Array.from(uniqueTimeSlots).filter(slot => {
        const endTime = slot.split('-')[1];
        return endTime > currentTime;
      }).length;
    } else if (currentDay > now) {
      // Ngày trong tương lai - tất cả khung giờ đều còn lại
      remainingTimeSlots = totalTimeSlots;
    } else {
      // Ngày trong quá khứ - không còn khung giờ nào
      remainingTimeSlots = 0;
    }
    
    return { total, expired, totalTimeSlots, remainingTimeSlots };
  };

  // Open member detail modal
  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowMemberDetail(true);
  };

  const loading = employeeLoading || scheduleLoading || contractsLoading;

  if (loading) {
    return (
      <div className={styles.ptSchedulePage}>
        <div className={styles.ptScheduleLoading}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className={styles.ptSchedulePage}>
        <div className={styles.ptScheduleError}>
          <p>Không tìm thấy thông tin nhân viên</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ptSchedulePage}>
      {/* Header */}
      <div className={styles.ptScheduleHeader}>
        <div className={styles.headerLeft}>
          <h1>📅 Lịch làm việc của tôi</h1>
          <p>Xem lịch làm việc và trạng thái check-in/check-out</p>
        </div>
        
        <div className={styles.headerRight}>
          {/* Employee Info Badge */}
          <div className={styles.ptEmployeeBadge}>
            <div className={styles.badgeAvatar}>
              {employee.avatarUrl ? (
                <img src={employee.avatarUrl} alt={employee.fullName || employee.name} />
              ) : (
                <span>{(employee.fullName || employee.name).charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className={styles.badgeInfo}>
              <div className={styles.badgeName}>{employee.fullName || employee.name}</div>
              <div className={`${styles.badgeShift} ${employee.shift}`}>
                {employee.shift === 'fulltime' ? '⏰ Fulltime' : '🕐 Partime'}
              </div>
            </div>
          </div>
          
          {/* Face ID Actions */}
          <div className={styles.ptFaceActions}>
            {!employee.faceRegistered ? (
              <button 
                className={styles.btnRegisterFaceId}
                onClick={() => setShowFaceRegistrationModal(true)}
                title="Đăng ký Face ID để check-in/checkout nhanh hơn"
              >
                📷 Đăng ký Face ID
              </button>
            ) : (
              <>
                <button 
                  className={styles.btnFaceCheckin}
                  onClick={() => setShowFaceCheckinModal(true)}
                  title="Sử dụng Face ID để check-in/checkout"
                >
                  ✨ Face Check-in
                </button>
                <button 
                  className={styles.btnDeleteFaceId}
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
      <div className={styles.ptInfoCards}>
        {/* Shift Info */}
        {employee.shift === 'fulltime' ? (
          <div className={`${styles.shiftInfoCard} ${styles.fulltime}`}>
            <div className={styles.shiftIcon}>⏰</div>
            <div className={styles.shiftDetails}>
              <h3>Nhân viên Fulltime</h3>
              <p>Bạn làm việc toàn thời gian với lịch cố định hàng ngày (08:00 - 17:00)</p>
            </div>
          </div>
        ) : (
          <div className={`${styles.shiftInfoCard} ${styles.parttime}`}>
            <div className={styles.shiftIcon}>🕐</div>
            <div className={styles.shiftDetails}>
              <h3>Nhân viên Partime</h3>
              <p>Bạn làm việc bán thời gian theo lịch được sắp xếp. Chỉ những ngày có lịch mới cần check-in.</p>
            </div>
          </div>
        )}

        {/* Face ID Status */}
        <div className={`${styles.faceIdStatusCard} ${employee.faceRegistered ? styles.registered : styles.unregistered}`}>
          <div className={styles.faceIdIcon}>{employee.faceRegistered ? '✅' : '📷'}</div>
          <div className={styles.faceIdDetails}>
            <h3>{employee.faceRegistered ? 'Face ID đã đăng ký' : 'Chưa có Face ID'}</h3>
            <p>
              {employee.faceRegistered 
                ? 'Bạn có thể sử dụng Face ID để check-in/checkout nhanh chóng'
                : 'Đăng ký Face ID để check-in/checkout nhanh hơn mà không cần QR code'
              }
            </p>
            {employee.faceRegistered && employee.faceIdCreatedAt && (
              <p className={styles.registrationDate}>
                Đăng ký: {new Date(employee.faceIdCreatedAt.toDate?.() || employee.faceIdCreatedAt).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Checkin Statistics */}
      <PTCheckinStats employee={employee} />

     

      {/* Filter Options */}
     

      {/* Weekly Schedule Accordion */}
      <div className={styles.ptScheduleAccordion}>
        {weekDays.map((day, index) => {
          // Lấy thứ trong tuần (1=Thứ 2, ..., 7=Chủ nhật)
          const jsDay = day.getDay();
          const dayOfWeek = jsDay === 0 ? 7 : jsDay; // Firestore: 1=Mon, ..., 7=Sun

          // Lọc các contract có weeklySchedule cho ngày này
          let membersForDay = ptContracts
            .map((c) => {
              const slot = c.contract?.weeklySchedule?.schedule?.[dayOfWeek];
              if (slot) {
                return {
                  fullName: c.userName,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  user: c.user,
                  contract: c.contract,
                };
              }
              return null;
            })
            .filter(Boolean);

          // Apply filters
          membersForDay = filterMembers(membersForDay);

          // Group by time slots
          const timeSlotGroups = groupMembersByTimeSlot(membersForDay);
          
          // Calculate stats
          const stats = calculateDayStats(membersForDay, day);

          const isToday = day.toDateString() === new Date().toDateString();
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
          const dayKey = day.toDateString();
          const isExpanded = expandedDay === dayKey;

          const toggleDay = () => {
            setExpandedDay(isExpanded ? null : dayKey);
          };

          return (
            <div
              key={index}
              className={`${styles.ptScheduleAccordionItem} ${isToday ? styles.today : ''} ${isPast ? styles.past : ''} ${isExpanded ? styles.expanded : ''}`}
            >
              {/* Accordion Header - Always visible */}
              <div className={styles.accordionHeader} onClick={toggleDay}>
                <div className={styles.headerContent}>
                  <div className={styles.dayInfo}>
                    <div className={styles.dayName}>{day.toLocaleDateString('vi-VN', { weekday: 'long' })}</div>
                    <div className={styles.dayDate}>{day.getDate()}/{day.getMonth() + 1}/{day.getFullYear()}</div>
                  </div>
                  <div className={styles.memberCount}>
                    <span className={styles.countBadge}>{membersForDay.length} học viên</span>
                    {isToday && <span className={styles.todayBadgeSmall}>Hôm nay</span>}
                  </div>
                </div>
                <div className={styles.toggleIcon}>
                  <ChevronRight size={20} className={isExpanded ? styles.rotated : ''} />
                </div>
              </div>

              {/* Accordion Content - Expandable */}
              {isExpanded && (
                <div className={styles.accordionContent}>
                  {membersForDay.length > 0 ? (
                    <>
                      {/* Day Statistics */}
                      <div className={styles.dayStatistics}>
                        <div className={`${styles.statItem} ${styles.statTotalStudents}`}>
                          <span className={styles.statLabel}>Tổng học viên:</span>
                          <span className={styles.statValue}>{stats.total}</span>
                        </div>
                        <div className={`${styles.statItem} ${styles.statTotalSlots}`}>
                          <span className={styles.statLabel}>Tổng khung giờ:</span>
                          <span className={styles.statValue}>{stats.totalTimeSlots}</span>
                        </div>
                        <div className={`${styles.statItem} ${styles.statRemainingSlots}`}>
                          <span className={styles.statLabel}>Khung giờ còn lại:</span>
                          <span className={`${styles.statValue} ${styles.highlight}`}>{stats.remainingTimeSlots}</span>
                        </div>
                        {stats.expired > 0 && (
                          <div className={styles.statItem}>
                            <span className={styles.statLabel}>Gói hết hạn:</span>
                            <span className={`${styles.statValue} ${styles.expired}`}>{stats.expired}</span>
                          </div>
                        )}
                      </div>

                      {/* Time Slots */}
                      <div className={styles.timeSlotsContainer}>
                        {timeSlotGroups.map(([timeSlot, members]) => (
                          <TimeSlotSection
                            key={timeSlot}
                            timeSlot={timeSlot}
                            members={members}
                            onMemberClick={handleMemberClick}
                            slotDate={day}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className={styles.noMembersScheduled}>
                      <span className={styles.noMemberIcon}>👤</span>
                      <span className={styles.noMemberText}>
                        {searchTerm || filterStatus !== 'all' 
                          ? 'Không tìm thấy học viên phù hợp'
                          : 'Chưa có học viên đăng ký'
                        }
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>


      {/* Tổng hợp khung giờ & member đăng ký trong ngày */}
      

      {/* Legend */}
      <div className={styles.ptScheduleLegend}>
        <div className={styles.legendTitle}>Chú thích:</div>
        <div className={styles.legendItems}>
          <div className={styles.legendItem}>
            <CheckCircle className={`${styles.legendIcon} ${styles.completed}`} size={16} />
            <span>Hoàn thành (Đã check-in & check-out)</span>
          </div>
          <div className={styles.legendItem}>
            <Clock className={`${styles.legendIcon} ${styles.inProgress}`} size={16} />
            <span>Đang làm (Đã check-in)</span>
          </div>
          <div className={styles.legendItem}>
            <XCircle className={`${styles.legendIcon} ${styles.notStarted}`} size={16} />
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

      {/* Member Detail Modal */}
      {showMemberDetail && selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          isOpen={showMemberDetail}
          onClose={() => {
            setShowMemberDetail(false);
            setSelectedMember(null);
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