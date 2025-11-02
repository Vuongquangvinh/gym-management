import React from 'react';
import { Clock, User, CheckCircle, XCircle, Plus } from 'lucide-react';
import './WeeklyScheduleTable.css';

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
      <div className="weekly-schedule-table">
        <div className="loading-container">
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
      return <CheckCircle className="status-icon completed" size={16} />;
    } else if (checkin) {
      return <Clock className="status-icon in-progress" size={16} />;
    } else {
      return <XCircle className="status-icon not-started" size={16} />;
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
        <div className="schedule-info fulltime">
          <div className="schedule-time">
            {displayStartTime} - {displayEndTime} (Fulltime)
          </div>
          <div className="schedule-status">
            {statusIcon}
            <span className="status-text">{statusText}</span>
          </div>
          {schedule?.notes && (
            <div className="schedule-notes">
              <span className="notes-label">📝</span>
              <span className="notes-text">{schedule.notes}</span>
            </div>
          )}
        </div>
      );
    } else {
      // Parttime employees need schedule
      if (schedule) {
        return (
          <div className="schedule-info parttime">
            <div className="schedule-time">
              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
            </div>
            <div className="schedule-status">
              {statusIcon}
              <span className="status-text">{statusText}</span>
            </div>
            {schedule.notes && (
              <div className="schedule-notes">
                <span className="notes-label">📝</span>
                <span className="notes-text">{schedule.notes}</span>
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div className="no-schedule">
            Chưa có lịch
          </div>
        );
      }
    }
  };

  return (
    <div className="weekly-schedule-table">
      {/* Legend */}
      <div className="schedule-legend">
        <div className="legend-item">
          <div className="legend-color fulltime"></div>
          <span>Fulltime (08:00 - 17:00)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color parttime"></div>
          <span>Partime (theo lịch)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color no-schedule"></div>
          <span>Chưa có lịch</span>
        </div>
      </div>

      <table className="schedule-table">
        <colgroup>
          <col style={{ width: '250px' }} />
          {weekDays.map(() => (
            <col key={Math.random()} />
          ))}
          <col style={{ width: '200px' }} />
        </colgroup>
        <thead>
          <tr>
            <th className="employee-column">
              <div className="employee-header-content">
                <span>Nhân viên</span>
                <button 
                  className="add-schedule-btn"
                  onClick={onAddSchedule}
                  title="Thêm lịch làm việc"
                >
                  <Plus size={16} />
                  Thêm lịch
                </button>
              </div>
            </th>
            {weekDays.map((day, index) => (
              <th key={index} className="day-column">
                <div className="day-name">
                  {day.toLocaleDateString('vi-VN', { weekday: 'short' })}
                </div>
                <div className="day-date">
                  {day.getDate()}/{day.getMonth() + 1}
                </div>
              </th>
            ))}
            <th className="notes-column">
              <div className="notes-header">
                <span>📝 Ghi chú</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {employees
            .filter(employee => employee.status === 'active')
            .map((employee) => (
            <tr key={employee._id} className="employee-row">
              <td className="employee-info">
                <div className="employee-wrapper">
                  <div className="employee-avatar">
                    {employee.avatarUrl ? (
                      <img src={employee.avatarUrl} alt={employee.fullName || employee.name} />
                    ) : (
                      <span>{(employee.fullName || employee.name).charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="employee-details">
                    <div className="employee-name">{employee.fullName || employee.name}</div>
                    <div className="employee-position">{employee.position}</div>
                    <div className={`employee-shift ${employee.shift}`}>
                      {employee.shift === 'fulltime' ? 'Fulltime' : 'Partime'}
                    </div>
                  </div>
                </div>
              </td>
              
              {weekDays.map((day, index) => {
                const schedule = getScheduleForDay(employee._id, day);
                const { checkin, checkout } = getCheckinInfo(employee._id, day);
                const dayCheckins = [checkin, checkout].filter(Boolean); // Convert to array format
                const employeeType = getEmployeeType(employee);
                const cellContent = getCellContent(employee, schedule, dayCheckins, day);
                
                return (
                  <td 
                    key={index} 
                    className={`day-cell ${employeeType} ${schedule || employeeType === 'fulltime' ? 'has-schedule' : 'no-schedule'}`}
                    onClick={() => onScheduleClick(employee, day)}
                  >
                    {cellContent}
                  </td>
                );
              })}
              
              {/* Notes Column */}
              <td className="notes-cell">
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
                    return <div className="no-notes">Không có ghi chú</div>;
                  }
                  
                  return (
                    <div className="notes-list">
                      {allNotes.map((note, index) => (
                        <div key={index} className="note-item">
                          <div className="note-date">
                            {note.date.getDate()}/{note.date.getMonth() + 1}
                          </div>
                          <div className="note-text">
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
