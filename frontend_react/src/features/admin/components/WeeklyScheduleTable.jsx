import React from 'react';
import { Clock, User, CheckCircle, XCircle, Plus } from 'lucide-react';
import styles from './WeeklyScheduleTable.module.css';

const WeeklyScheduleTable = ({ 
  weekDays, 
  employees, 
  schedules, 
  checkins, 
  onScheduleClick,
  onAddSchedule,
  getCheckinInfo 
}) => {
  // Safety checks
  if (!weekDays || !employees) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.loading}>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }
  const formatTime = (time) => {
    if (!time) return '-';
    
    try {
      // Handle different time formats
      if (typeof time === 'string') {
        // If it's already a time string like "09:00"
        if (time.includes(':') && !time.includes('T')) {
          return time.substring(0, 5); // HH:MM
        }
        // If it's a timestamp string like "2025-10-28T08:10:11.266Z", convert to Date
        const date = new Date(time);
        if (isNaN(date.getTime())) {
          return '-';
        }
        const formattedTime = date.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        return formattedTime;
      } else if (time instanceof Date) {
        // If it's a Date object
        return time.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      }
    } catch (error) {
      // Silent error handling
    }
    
    return '-';
  };

  const getScheduleForDay = (employeeId, date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules[dateStr]?.find(s => s.employeeId === employeeId);
  };

  const getCheckinForDay = (employeeId, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayCheckins = checkins[dateStr] || {};
    const employeeCheckins = dayCheckins[employeeId] || [];
    
    return employeeCheckins;
  };

  const getEmployeeType = (employee) => {
    return employee.shift === 'fulltime' ? 'fulltime' : 'parttime';
  };

  const getStatusIcon = (employee, schedule, checkins) => {
    // Handle both array format and object format from getCheckinInfo
    let checkin, checkout;
    
    if (Array.isArray(checkins)) {
      checkin = checkins.find(c => c && c.checkinType === 'checkin');
      checkout = checkins.find(c => c && c.checkinType === 'checkout');
    } else {
      // If checkins is an object with checkin/checkout properties
      checkin = checkins.checkin;
      checkout = checkins.checkout;
    }
    
    if (checkin && checkout) {
      return <CheckCircle className={`${styles.statusIcon} ${styles.completed}`} size={16} />;
    } else if (checkin) {
      return <Clock className={`${styles.statusIcon} ${styles.inProgress}`} size={16} />;
    } else {
      return <XCircle className={`${styles.statusIcon} ${styles.notStarted}`} size={16} />;
    }
  };

  const getStatusText = (employee, schedule, checkins) => {
    // Handle both array format and object format from getCheckinInfo
    let checkin, checkout;
    
    if (Array.isArray(checkins)) {
      checkin = checkins.find(c => c && c.checkinType === 'checkin');
      checkout = checkins.find(c => c && c.checkinType === 'checkout');
    } else {
      // If checkins is an object with checkin/checkout properties
      checkin = checkins.checkin;
      checkout = checkins.checkout;
    }
    
    if (checkin && checkout) {
      return `Hoàn thành (${formatTime(checkin.timestamp)} - ${formatTime(checkout.timestamp)})`;
    } else if (checkin) {
      return `Đang làm (Đã Check-in: ${formatTime(checkin.timestamp)})`;
    } else {
      return 'Chưa check-in';
    }
  };

  const getCellContent = (employee, schedule, checkins, date) => {
    const employeeType = getEmployeeType(employee);
    const statusIcon = getStatusIcon(employee, schedule, checkins);
    const statusText = getStatusText(employee, schedule, checkins);
    
    if (employeeType === 'fulltime') {
      // Fulltime employees can have custom schedule or default hours
      const displayStartTime = schedule?.startTime ? formatTime(schedule.startTime) : '08:00';
      const displayEndTime = schedule?.endTime ? formatTime(schedule.endTime) : '17:00';
      
      return (
        <div className={`${styles.scheduleInfo} ${styles.fulltime}`}>
          <div className={styles.timeRange}>
            {displayStartTime} - {displayEndTime} (Fulltime)
          </div>
          <div className={styles.statusInfo}>
            {statusIcon}
            <span className={styles.statusText}>{statusText}</span>
          </div>
          {schedule?.notes && (
            <div className={styles.scheduleNotes}>
              <span className={styles.noteIcon}>📝</span>
              <span className={styles.noteText}>{schedule.notes}</span>
            </div>
          )}
        </div>
      );
    } else {
      // Parttime employees need schedule
      if (schedule) {
        return (
          <div className={`${styles.scheduleInfo} ${styles.parttime}`}>
            <div className={styles.timeRange}>
              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
            </div>
            <div className={styles.statusInfo}>
              {statusIcon}
              <span className={styles.statusText}>{statusText}</span>
            </div>
            {schedule.notes && (
              <div className={styles.scheduleNotes}>
                <span className={styles.noteIcon}>📝</span>
                <span className={styles.noteText}>{schedule.notes}</span>
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div className={styles.noSchedule}>
            Chưa có lịch
          </div>
        );
      }
    }
  };

  return (
    <div className={styles.tableContainer}>
      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.fulltime}`}></div>
          <span>Fulltime (08:00 - 17:00)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.parttime}`}></div>
          <span>Partime (theo lịch)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.noSchedule}`}></div>
          <span>Chưa có lịch</span>
        </div>
      </div>

      <table className={styles.scheduleTable}>
        <colgroup>
          <col style={{ width: '250px' }} />
          {weekDays.map(() => (
            <col key={Math.random()} />
          ))}
          <col style={{ width: '200px' }} />
        </colgroup>
        <thead>
          <tr>
            <th className={styles.employeeHeader}>
              <div className={styles.headerContent}>
                <span>Nhân viên</span>
                <button 
                  className={styles.addScheduleBtn}
                  onClick={onAddSchedule}
                  title="Thêm lịch làm việc"
                >
                  <Plus size={16} />
                  Thêm lịch
                </button>
              </div>
            </th>
            {weekDays.map((day, index) => (
              <th key={index} className={styles.dayHeader}>
                <div className={styles.dayName}>
                  {day.toLocaleDateString('vi-VN', { weekday: 'short' })}
                </div>
                <div className={styles.dayDate}>
                  {day.getDate()}/{day.getMonth() + 1}
                </div>
              </th>
            ))}
            <th className={styles.notesHeader}>
              <div className={styles.headerContent}>
                <span>📝 Ghi chú</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {employees
            .filter(employee => employee.status === 'active')
            .map((employee) => (
            <tr key={employee._id} className={styles.employeeRow}>
              <td className={styles.employeeCell}>
                <div className={styles.employeeInfo}>
                  <div className={styles.employeeAvatar}>
                    {employee.avatarUrl ? (
                      <img src={employee.avatarUrl} alt={employee.fullName || employee.name} />
                    ) : (
                      <span>{(employee.fullName || employee.name).charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className={styles.employeeDetails}>
                    <div className={styles.employeeName}>{employee.fullName || employee.name}</div>
                    <div className={styles.employeePosition}>{employee.position}</div>
                    <div className={`${styles.employeeShift} ${styles[employee.shift]}`}>
                      {employee.shift === 'fulltime' ? 'Fulltime' : 'Partime'}
                    </div>
                  </div>
                </div>
              </td>
              
              {weekDays.map((day, index) => {
                const schedule = getScheduleForDay(employee._id, day);
                const checkinInfo = getCheckinInfo(employee._id, day);
                const dayCheckins = [checkinInfo.checkin, checkinInfo.checkout].filter(Boolean);
                const employeeType = getEmployeeType(employee);
                const cellContent = getCellContent(employee, schedule, dayCheckins, day);
                
                return (
                  <td 
                    key={index} 
                    className={`${styles.scheduleCell} ${styles[employeeType]} ${schedule || employeeType === 'fulltime' ? styles.hasSchedule : styles.noSchedule}`}
                    onClick={() => onScheduleClick(employee, day)}
                  >
                    {cellContent}
                  </td>
                );
              })}
              
              {/* Notes Column */}
              <td className={styles.notesCell}>
                {(() => {
                  // Collect all notes for this employee across the week
                  const allNotes = weekDays.map(day => {
                    const schedule = getScheduleForDay(employee._id, day);
                    return schedule?.notes ? {
                      date: day,
                      notes: schedule.notes
                    } : null;
                  }).filter(Boolean);
                  
                  if (allNotes.length === 0) {
                    return <div className={styles.noNotes}>Không có ghi chú</div>;
                  }
                  
                  return (
                    <div className={styles.notesList}>
                      {allNotes.map((note, index) => (
                        <div key={index} className={styles.noteItem}>
                          <div className={styles.noteDate}>
                            {note.date.getDate()}/{note.date.getMonth() + 1}
                          </div>
                          <div className={styles.noteContent}>
                            {note.notes}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeeklyScheduleTable;

