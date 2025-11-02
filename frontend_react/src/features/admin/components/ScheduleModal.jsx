import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, User, Trash2 } from 'lucide-react';
import { useSchedule } from '../../../firebase/lib/features/schedule/schedule.provider.jsx';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import './ScheduleModal.css';

const ScheduleModal = ({ 
  isOpen, 
  onClose, 
  employee, 
  selectedDate, 
  employees = [],
  schedules = {}
}) => {
  const { removeSchedule, getCheckinInfo } = useSchedule();
  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [currentScheduleId, setCurrentScheduleId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
      
      if (employee) {
        // Load existing schedule data if available
        const daySchedules = schedules[dateStr] || [];
        const existingSchedule = daySchedules.find(s => s.employeeId === employee._id);
        
        if (existingSchedule) {
          // Load existing schedule data
          setFormData({
            employeeId: employee._id,
            date: dateStr,
            startTime: existingSchedule.startTime || '09:00',
            endTime: existingSchedule.endTime || '17:00',
            notes: existingSchedule.notes || ''
          });
          setCurrentScheduleId(existingSchedule._id || existingSchedule.id || null);
        } else {
          // New schedule - use defaults based on employee shift
          const defaultStartTime = employee.shift === 'fulltime' ? '08:00' : '09:00';
          const defaultEndTime = employee.shift === 'fulltime' ? '17:00' : '17:00';
          
          setFormData({
            employeeId: employee._id,
            date: dateStr,
            startTime: defaultStartTime,
            endTime: defaultEndTime,
            notes: ''
          });
          setCurrentScheduleId(null);
        }
      } else {
        // Add new schedule - no employee selected yet
        setFormData({
          employeeId: '',
          date: dateStr,
          startTime: '09:00',
          endTime: '17:00',
          notes: ''
        });
      }
    }
  }, [isOpen, selectedDate, employee, schedules]);

  // Load schedule data when employeeId changes (for add new schedule case)
  useEffect(() => {
    if (isOpen && !employee && formData.employeeId && formData.date) {
      const daySchedules = schedules[formData.date] || [];
      const existingSchedule = daySchedules.find(s => s.employeeId === formData.employeeId);
      
      if (existingSchedule) {
        setFormData(prev => ({
          ...prev,
          startTime: existingSchedule.startTime || prev.startTime,
          endTime: existingSchedule.endTime || prev.endTime,
          notes: existingSchedule.notes || prev.notes
        }));
        setCurrentScheduleId(existingSchedule._id || existingSchedule.id || null);
      } else {
        // No existing schedule - set defaults based on employee shift
        const selectedEmployeeFromList = employees.find(emp => emp._id === formData.employeeId);
        if (selectedEmployeeFromList) {
          const defaultStartTime = selectedEmployeeFromList.shift === 'fulltime' ? '08:00' : '09:00';
          const defaultEndTime = selectedEmployeeFromList.shift === 'fulltime' ? '17:00' : '17:00';
          
          setFormData(prev => ({
            ...prev,
            startTime: defaultStartTime,
            endTime: defaultEndTime
          }));
        }
        setCurrentScheduleId(null);
      }
    }
  }, [formData.employeeId, formData.date, isOpen, employee, schedules, employees]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If employee is already selected (from clicking on a cell), use that employee
    let selectedEmployee;
    if (employee) {
      selectedEmployee = employee;
    } else if (formData.employeeId) {
      selectedEmployee = employees.find(emp => emp._id === formData.employeeId);
    } else {
      alert('Vui lòng chọn nhân viên');
      return;
    }

    if (!formData.date || !formData.startTime || !formData.endTime) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      alert('Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }

    if (!selectedEmployee) {
      alert('Nhân viên không tồn tại. Vui lòng chọn lại nhân viên.');
      return;
    }

    setIsSaving(true);
    
    try {
      const scheduleData = {
        employeeId: selectedEmployee._id,
        employeeName: selectedEmployee.fullName || selectedEmployee.name,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        notes: formData.notes,
        status: 'active'
      };

      // Use Firebase service directly
      const { createSchedule } = await import('../../../firebase/lib/features/schedule/schedule.service.js');
      await createSchedule(scheduleData);
      
      alert('Lưu lịch làm việc thành công!');
      onClose();
      setFormData({
        date: '',
        startTime: '09:00',
        endTime: '17:00',
        notes: ''
      });
    } catch (error) {
      // Show specific error messages
      if (error.message.includes('đã checkin')) {
        alert('⚠️ ' + error.message + '\n\nVui lòng chọn ngày khác hoặc liên hệ quản trị viên.');
      } else if (error.message.includes('đã có lịch')) {
        alert('ℹ️ Lịch đã được cập nhật thành công!');
        onClose();
        setFormData({
          date: '',
          startTime: '09:00',
          endTime: '17:00',
          notes: ''
        });
        return;
      } else {
        alert('Lỗi lưu lịch: ' + error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      employeeId: '',
      date: '',
      startTime: '09:00',
      endTime: '17:00',
      notes: ''
    });
    setCurrentScheduleId(null);
    onClose();
  };

  // Check if schedule can be deleted (no check-in yet)
  const canDeleteSchedule = () => {
    if (!currentScheduleId) return false;
    
    const employeeId = employee?._id || formData.employeeId;
    const date = formData.date ? new Date(formData.date) : selectedDate;
    
    if (!employeeId || !date) return false;
    
    const { checkin } = getCheckinInfo(employeeId, date);
    return !checkin; // Can delete if no check-in found
  };

  const handleDeleteClick = async () => {
    if (!canDeleteSchedule()) {
      Swal.fire({
        icon: 'error',
        title: 'Không thể xóa',
        text: 'Nhân viên đã check-in hôm nay!',
        confirmButtonText: 'Đóng',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa lịch làm việc này?',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    });

    if (result.isConfirmed && currentScheduleId) {
      setIsSaving(true);
      try {
        await removeSchedule(currentScheduleId);
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Xóa lịch làm việc thành công!',
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#1976d2'
        });
        handleClose();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: error.message || 'Lỗi xóa lịch làm việc',
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#1976d2'
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="schedule-modal-overlay">
      <div className="schedule-modal">
        <div className="modal-header">
        <div className="modal-title">
          <Calendar className="title-icon" size={20} />
          <span>
            {employee 
              ? `Lịch làm việc - ${employee.fullName || employee.name}`
              : 'Thêm lịch làm việc'
            }
          </span>
        </div>
          <button className="close-button" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-content">
            {/* Employee Info or Selection */}
            {employee ? (
              <div className="employee-info-section">
                <div className="employee-avatar">
                  {employee.avatarUrl ? (
                    <img src={employee.avatarUrl} alt={employee.fullName || employee.name} />
                  ) : (
                    <span>{(employee.fullName || employee.name).charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="employee-details">
                  <h3>{employee.fullName || employee.name}</h3>
                  <p>{employee.position}</p>
                  <span className={`shift-badge ${employee.shift}`}>
                    {employee.shift === 'fulltime' ? 'Fulltime' : 'Parttime'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="employeeId">
                  <User size={16} />
                  Chọn nhân viên
                </label>
                <select
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {(() => {
                    const activeEmployees = employees.filter(emp => emp.status === 'active');
                    
                    if (activeEmployees.length === 0) {
                      return (
                        <option value="" disabled>
                          Không có nhân viên đang làm việc
                        </option>
                      );
                    }
                    
                    return activeEmployees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.fullName || emp.name} - {emp.position}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            )}

            {/* Form Fields */}
            <div className="form-fields">
              <div className="form-group">
                <label htmlFor="date">
                  <Calendar size={16} />
                  Ngày làm việc
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">
                    <Clock size={16} />
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endTime">
                    <Clock size={16} />
                    Giờ kết thúc
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Nhập ghi chú cho lịch làm việc..."
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            {currentScheduleId && (
              <button
                type="button"
                className="btn-delete"
                onClick={handleDeleteClick}
                disabled={isSaving}
                title={canDeleteSchedule() ? 'Xóa lịch làm việc' : 'Không thể xóa vì đã check-in'}
              >
                <Trash2 size={16} />
                Xóa lịch
              </button>
            )}
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
              disabled={isSaving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={isSaving}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu lịch'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default ScheduleModal;
