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
  onTimeSlotsChange, 
  sessionDuration = 60 
}) {
  const [regularSlots, setRegularSlots] = useState(availableTimeSlots || []);
  
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
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncingFromProps, setIsSyncingFromProps] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    // Only sync from props if user hasn't started interacting
    // This allows initial load of saved data but prevents overriding user changes
    if (availableTimeSlots && availableTimeSlots.length > 0 && !hasUserInteracted) {
      console.log('🔄 Syncing from props (saved data):', availableTimeSlots);
      setIsSyncingFromProps(true);
      setRegularSlots(availableTimeSlots || []);
      setIsInitialized(true);
      // Clear sync flag after state update
      setTimeout(() => setIsSyncingFromProps(false), 50);
    }
  }, [availableTimeSlots, hasUserInteracted]);

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
  const notifyParent = useCallback((newRegularSlots = null) => {
    if (isSyncingFromProps) {
      console.log('⏸️ Blocked notification - syncing from props');
      return;
    }
    
    if (onTimeSlotsChangeRef.current) {
      const slotsToUse = newRegularSlots || regularSlots;
      const currentSlots = convertToModelFormat(slotsToUse);
      console.log('📢 Notifying parent with slots:', currentSlots.length, 'from state:', slotsToUse);
      onTimeSlotsChangeRef.current({
        availableTimeSlots: currentSlots,
        customTimeSlots: []
      });
    }
  }, [regularSlots, isSyncingFromProps, convertToModelFormat]);

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

  return (
    <div className="time-slot-manager">
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

      {/* Summary */}
      <div className="time-slots-summary">
        <h5>Tổng quan khung giờ</h5>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-number">{regularSlots.reduce((total, day) => total + (day.fixedSlots?.length || 0), 0)}</span>
            <span className="stat-label">Khung giờ cố định</span>
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