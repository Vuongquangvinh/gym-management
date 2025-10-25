import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import './TimeSlotManager.css';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Thứ 2' },
  { value: 'tuesday', label: 'Thứ 3' },
  { value: 'wednesday', label: 'Thứ 4' },
  { value: 'thursday', label: 'Thứ 5' },
  { value: 'friday', label: 'Thứ 6' },
  { value: 'saturday', label: 'Thứ 7' },
  { value: 'sunday', label: 'Chủ nhật' }
];

// Khung giờ cố định 1.5-2 tiếng, mỗi khung chỉ 1 khách
const FIXED_TIME_SLOTS = [
  { id: 'slot1', startTime: '06:00', endTime: '08:00', duration: 120, label: '6:00 - 8:00 (2h)' },
  { id: 'slot2', startTime: '08:00', endTime: '10:00', duration: 120, label: '8:00 - 10:00 (2h)' },
  { id: 'slot3', startTime: '10:00', endTime: '12:00', duration: 120, label: '10:00 - 12:00 (2h)' },
  { id: 'slot4', startTime: '12:00', endTime: '14:00', duration: 120, label: '12:00 - 14:00 (2h)' },
  { id: 'slot5', startTime: '14:00', endTime: '16:00', duration: 120, label: '14:00 - 16:00 (2h)' },
  { id: 'slot6', startTime: '16:00', endTime: '18:00', duration: 120, label: '16:00 - 18:00 (2h)' },
  { id: 'slot7', startTime: '18:00', endTime: '20:00', duration: 120, label: '18:00 - 20:00 (2h)' },
  { id: 'slot8', startTime: '20:00', endTime: '22:00', duration: 120, label: '20:00 - 22:00 (2h)' }
];

export default function TimeSlotManager({ 
  availableTimeSlots = [], 
  customTimeSlots = [], 
  onTimeSlotsChange, 
  sessionDuration = 60 
}) {
  const [activeTab, setActiveTab] = useState('regular'); // 'regular' or 'custom'
  const [regularSlots, setRegularSlots] = useState(availableTimeSlots);
  const [customSlots, setCustomSlots] = useState(customTimeSlots);
  
  // Use ref to store callback to prevent infinite loops
  const onTimeSlotsChangeRef = useRef(onTimeSlotsChange);
  
  // Helper function to get day abbreviation
  const getDayAbbr = (dayValue, dayLabel) => {
    const dayAbbrMap = {
      'monday': '2',
      'tuesday': '3', 
      'wednesday': '4',
      'thursday': '5',
      'friday': '6',
      'saturday': '7',
      'sunday': 'CN'
    };
    return dayAbbrMap[dayValue] || dayLabel.charAt(dayLabel.length - 1);
  };
  
  // Update ref when callback changes
  useEffect(() => {
    onTimeSlotsChangeRef.current = onTimeSlotsChange;
  }, [onTimeSlotsChange]);
  
  // Custom slot form
  const [newCustomSlot, setNewCustomSlot] = useState({
    name: '',
    startTime: '',
    endTime: '',
    days: [],
    priority: 1,
    isRecurring: true
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncingFromProps, setIsSyncingFromProps] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    // Only sync from props if user hasn't started interacting
    // This allows initial load of saved data but prevents overriding user changes
    if (availableTimeSlots.length > 0 && !hasUserInteracted) {
      console.log('🔄 Syncing from props (saved data):', availableTimeSlots);
      setIsSyncingFromProps(true);
      setRegularSlots(availableTimeSlots);
      setIsInitialized(true);
      // Clear sync flag after state update
      setTimeout(() => setIsSyncingFromProps(false), 50);
    }
  }, [availableTimeSlots, hasUserInteracted]);

  useEffect(() => {
    setCustomSlots(customTimeSlots);
  }, [customTimeSlots]);

  // Convert fixed slots to model format
  const convertToModelFormat = useCallback((regularSlots) => {
    const modelSlots = [];
    
    regularSlots.forEach(daySlot => {
      if (daySlot.fixedSlots) {
        daySlot.fixedSlots.forEach(fixedSlot => {
          // Map day name to number (0=Sunday, 1=Monday, etc.)
          const dayMap = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6
          };
          
          modelSlots.push({
            id: `${daySlot.day}_${fixedSlot.id}`,
            dayOfWeek: dayMap[daySlot.day],
            startTime: fixedSlot.startTime,
            endTime: fixedSlot.endTime,
            isActive: true,
            note: `Khung cố định ${fixedSlot.duration} phút`
          });
        });
      }
    });
    
    return modelSlots;
  }, []);

  // Memoize converted slots to prevent unnecessary recalculation
  const convertedSlots = useMemo(() => {
    return convertToModelFormat(regularSlots);
  }, [regularSlots, convertToModelFormat]);

  // Helper function to notify parent - only call when user makes changes
  const notifyParent = useCallback((newRegularSlots = null, newCustomSlots = null) => {
    if (isSyncingFromProps) {
      console.log('⏸️ Blocked notification - syncing from props');
      return;
    }
    
    if (onTimeSlotsChangeRef.current) {
      const slotsToUse = newRegularSlots || regularSlots;
      const customSlotsToUse = newCustomSlots || customSlots;
      const currentSlots = convertToModelFormat(slotsToUse);
      console.log('📢 Notifying parent with slots:', currentSlots.length, 'from state:', slotsToUse);
      onTimeSlotsChangeRef.current({
        availableTimeSlots: currentSlots,
        customTimeSlots: customSlotsToUse
      });
    }
  }, [regularSlots, customSlots, isSyncingFromProps, convertToModelFormat]);

  // Handle fixed time slot toggle (khung giờ cố định)
  const handleFixedSlotToggle = (day, fixedSlot) => {
    console.log('🎯 Click:', day, fixedSlot.id);
    console.log('📊 Current regularSlots before update:', regularSlots);
    
    // Mark that user has started interacting
    setHasUserInteracted(true);
    
    let updatedState = null;
    
    setRegularSlots(prev => {
      console.log('📊 Previous state in setter:', prev);
      const daySlots = prev.find(slot => slot.day === day);
      console.log('📊 Found daySlots for', day, ':', daySlots);
      
      if (daySlots) {
        const slotExists = daySlots.fixedSlots?.some(slot => slot.id === fixedSlot.id);
        console.log('📊 Slot exists check:', slotExists);
        
        if (slotExists) {
          // Remove fixed slot
          const newFixedSlots = (daySlots.fixedSlots || []).filter(slot => slot.id !== fixedSlot.id);
          if (newFixedSlots.length === 0) {
            updatedState = prev.filter(slot => slot.day !== day);
            console.log('✅ Removed day:', day, 'New state length:', updatedState.length);
            return updatedState;
          }
          updatedState = prev.map(slot => 
            slot.day === day ? { ...slot, fixedSlots: newFixedSlots } : slot
          );
          console.log('✅ Removed slot:', fixedSlot.id, 'from', day);
          return updatedState;
        } else {
          // Add fixed slot
          updatedState = prev.map(slot => 
            slot.day === day 
              ? { ...slot, fixedSlots: [...(slot.fixedSlots || []), fixedSlot] }
              : slot
          );
          console.log('✅ Added slot:', fixedSlot.id, 'to', day);
          return updatedState;
        }
      } else {
        // Create new day slot with fixed slot
        updatedState = [...prev, { day, fixedSlots: [fixedSlot] }];
        console.log('✅ Created new day:', day, 'with slot:', fixedSlot.id);
        return updatedState;
      }
    });
    
    // Notify parent with the updated state
    setTimeout(() => {
      notifyParent(updatedState);
    }, 0);
    
    // Verify state was actually updated
    setTimeout(() => {
      console.log('🔄 State after update:', regularSlots.length, 'items');
    }, 100);
  };

  const isFixedSlotSelected = useCallback((day, fixedSlotId) => {
    const daySlots = regularSlots.find(slot => slot.day === day);
    const isSelected = daySlots?.fixedSlots?.some(slot => slot.id === fixedSlotId) || false;
    return isSelected;
  }, [regularSlots]);

  const addCustomSlot = () => {
    // Mark that user has started interacting
    setHasUserInteracted(true);
    
    if (!newCustomSlot.name.trim() || !newCustomSlot.startTime || !newCustomSlot.endTime || newCustomSlot.days.length === 0) {
      toast.error('Vui lòng điền đầy đủ thông tin khung giờ tùy chỉnh', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (newCustomSlot.startTime >= newCustomSlot.endTime) {
      toast.error('Giờ bắt đầu phải nhỏ hơn giờ kết thúc', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const newSlot = {
      id: `custom_${Date.now()}`,
      name: newCustomSlot.name.trim(),
      startTime: newCustomSlot.startTime,
      endTime: newCustomSlot.endTime,
      days: [...newCustomSlot.days],
      priority: newCustomSlot.priority,
      isRecurring: newCustomSlot.isRecurring
    };

    const updatedCustomSlots = [...customSlots, newSlot];
    setCustomSlots(updatedCustomSlots);
    
    toast.success(`Thêm khung giờ tùy chỉnh "${newSlot.name}" thành công!`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
    
    // Reset form
    setNewCustomSlot({
      name: '',
      startTime: '',
      endTime: '',
      days: [],
      priority: 1,
      isRecurring: true
    });
    
    // Notify parent after adding custom slot
    setTimeout(() => {
      notifyParent(null, updatedCustomSlots);
    }, 0);
  };

  const removeCustomSlot = (id) => {
    // Mark that user has started interacting
    setHasUserInteracted(true);
    
    const slotToRemove = customSlots.find(slot => slot.id === id);
    const updatedCustomSlots = customSlots.filter(slot => slot.id !== id);
    setCustomSlots(updatedCustomSlots);
    
    toast.success(`Xóa khung giờ "${slotToRemove?.name || 'tùy chỉnh'}" thành công!`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
    
    // Notify parent after removing custom slot
    setTimeout(() => {
      notifyParent(null, updatedCustomSlots);
    }, 0);
  };

  const handleCustomSlotDayToggle = (day) => {
    setNewCustomSlot(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const calculateEndTime = (startTime, duration) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // Auto-calculate end time when start time or duration changes
  useEffect(() => {
    if (newCustomSlot.startTime) {
      const endTime = calculateEndTime(newCustomSlot.startTime, sessionDuration);
      if (endTime !== newCustomSlot.endTime) {
        setNewCustomSlot(prev => ({ ...prev, endTime }));
      }
    }
  }, [newCustomSlot.startTime, sessionDuration]);

  return (
    <div className="time-slot-manager">
      <div className="time-slot-tabs">
        <button 
          type="button"
          className={`tab-button ${activeTab === 'regular' ? 'active' : ''}`}
          onClick={() => setActiveTab('regular')}
        >
          <span className="icon">📅</span>
          Khung giờ hàng tuần
        </button>
        <button 
          type="button"
          className={`tab-button ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          <span className="icon">⚡</span>
          Khung giờ tùy chỉnh
        </button>
      </div>

      {activeTab === 'regular' && (
        <div className="regular-slots-section">
          <div className="section-header">
            <h4>Khung giờ hàng tuần cố định</h4>
            <p>Chọn các khung giờ mà bạn có thể dạy hàng tuần</p>
          </div>

          <div className="time-grid">
            <div className="section-subtitle">
              <p>Chọn các khung giờ cố định (2h) mà bạn có thể dạy.</p>
            </div>

            <div className="fixed-slots-grid">
              {FIXED_TIME_SLOTS.map(fixedSlot => (
                <div key={fixedSlot.id} className="fixed-slot-row">
                  <div className="slot-info">
                    <div className="slot-time">{fixedSlot.label}</div>
                    <div className="slot-duration">{fixedSlot.duration} phút</div>
                  </div>
                  <div className="slot-days">
                    {DAYS_OF_WEEK.map(day => (
                      <div key={`${day.value}-${fixedSlot.id}`} className="day-slot">
                        <button
                          type="button"
                          className={`day-button ${isFixedSlotSelected(day.value, fixedSlot.id) ? 'selected' : ''}`}
                          onClick={() => handleFixedSlotToggle(day.value, fixedSlot)}
                          title={`${day.label} - ${fixedSlot.label}`}
                        >
                          <span className="day-abbr">{getDayAbbr(day.value, day.label)}</span>
                          {isFixedSlotSelected(day.value, fixedSlot.id) && (
                            <span className="check-mark">✓</span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'custom' && (
        <div className="custom-slots-section">
          <div className="section-header">
            <h4>Khung giờ tùy chỉnh</h4>
            <p>Tạo các khung giờ linh hoạt với tên riêng</p>
          </div>

          {/* Add new custom slot form */}
          <div className="custom-slot-form">
            <div className="form-row">
              <div className="form-group">
                <label>Tên khung giờ</label>
                <input
                  type="text"
                  value={newCustomSlot.name}
                  onChange={(e) => setNewCustomSlot(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Khung sáng sớm, Khung tối muộn..."
                />
              </div>
              <div className="form-group">
                <label>Độ ưu tiên</label>
                <select
                  value={newCustomSlot.priority}
                  onChange={(e) => setNewCustomSlot(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                >
                  <option value={1}>Cao</option>
                  <option value={2}>Trung bình</option>
                  <option value={3}>Thấp</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Giờ bắt đầu</label>
                <input
                  type="time"
                  value={newCustomSlot.startTime}
                  onChange={(e) => setNewCustomSlot(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Giờ kết thúc (tự động: +{sessionDuration} phút)</label>
                <input
                  type="time"
                  value={newCustomSlot.endTime}
                  onChange={(e) => setNewCustomSlot(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Các ngày trong tuần</label>
              <div className="days-selector">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    className={`day-button ${newCustomSlot.days.includes(day.value) ? 'selected' : ''}`}
                    onClick={() => handleCustomSlotDayToggle(day.value)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newCustomSlot.isRecurring}
                  onChange={(e) => setNewCustomSlot(prev => ({ ...prev, isRecurring: e.target.checked }))}
                />
                Lặp lại hàng tuần
              </label>
            </div>

            <button
              type="button"
              className="add-slot-button"
              onClick={addCustomSlot}
            >
              <span className="icon">➕</span>
              Thêm khung giờ
            </button>
          </div>

          {/* Display existing custom slots */}
          {customSlots.length > 0 && (
            <div className="custom-slots-list">
              <h5>Khung giờ tùy chỉnh hiện có</h5>
              <div className="slots-grid">
                {customSlots.map(slot => (
                  <div key={slot.id} className="custom-slot-card">
                    <div className="slot-header">
                      <h6>{slot.name}</h6>
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeCustomSlot(slot.id)}
                        title="Xóa khung giờ"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="slot-details">
                      <p><strong>Thời gian:</strong> {slot.startTime} - {slot.endTime}</p>
                      <p><strong>Ngày:</strong> {slot.days.map(day => 
                        DAYS_OF_WEEK.find(d => d.value === day)?.label
                      ).join(', ')}</p>
                      <p><strong>Ưu tiên:</strong> {
                        slot.priority === 1 ? 'Cao' : 
                        slot.priority === 2 ? 'Trung bình' : 'Thấp'
                      }</p>
                      {slot.isRecurring && <span className="recurring-badge">🔄 Lặp lại</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="time-slots-summary">
        <h5>Tổng quan khung giờ</h5>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-number">{regularSlots.reduce((total, day) => total + (day.fixedSlots?.length || 0), 0)}</span>
            <span className="stat-label">Khung giờ cố định</span>
          </div>
          <div className="stat">
            <span className="stat-number">{customSlots.length}</span>
            <span className="stat-label">Khung giờ tùy chỉnh</span>
          </div>
          <div className="stat">
            <span className="stat-number">{sessionDuration}</span>
            <span className="stat-label">Phút/buổi</span>
          </div>
        </div>
      </div>
    </div>
  );
}