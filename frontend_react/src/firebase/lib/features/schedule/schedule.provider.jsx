import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import ScheduleModel from './schedule.model.js';
import { 
  subscribeSchedulesByDate, 
  subscribeCheckinsByDate,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleStats
} from './schedule.service.js';

// Create context
const ScheduleContext = createContext();

// Provider component
export function ScheduleProvider({ children }) {
  const [schedules, setSchedules] = useState({}); // { 'YYYY-MM-DD': [schedules] }
  const [checkins, setCheckins] = useState({}); // { 'YYYY-MM-DD': { employeeId: [checkins] } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'day' or 'week'
  const [stats, setStats] = useState({
    totalSchedules: 0,
    schedulesByTime: {},
    totalHours: 0
  });

  // Get date string for API calls
  const getDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Get start of week (Monday)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Get all days in the week
  const getWeekDays = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Load schedule data for selected date/week with realtime updates
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const datesToLoad = viewMode === 'week' 
      ? getWeekDays(getStartOfWeek(selectedDate))
      : [selectedDate];
    
    console.log('📅 Setting up realtime listeners for dates:', datesToLoad.map(d => getDateString(d)));
    
    const unsubscribers = [];
    
    // Setup realtime listeners for each date
    datesToLoad.forEach(date => {
      const dateStr = getDateString(date);
      
      // Setup realtime listener for schedules
      const unsubscribeSchedules = subscribeSchedulesByDate(
        dateStr,
        (schedules) => {
          console.log('🔄 Schedule realtime update received for', dateStr, ':', schedules.length);
          setSchedules(prev => ({
            ...prev,
            [dateStr]: schedules
          }));
          setLoading(false);
        },
        (error) => {
          console.error('❌ Schedule onSnapshot error for', dateStr, ':', error);
          setError(error.message);
          setLoading(false);
          toast.error('Lỗi tải lịch làm việc: ' + error.message);
        }
      );

      // Setup realtime listener for checkins
      const unsubscribeCheckins = subscribeCheckinsByDate(
        dateStr,
        (checkinsData) => {
          console.log('🔄 Checkin realtime update received for', dateStr, ':', Object.keys(checkinsData).length);
          setCheckins(prev => ({
            ...prev,
            [dateStr]: checkinsData
          }));
          setLoading(false);
        },
        (error) => {
          console.error('❌ Checkin onSnapshot error for', dateStr, ':', error);
          setError(error.message);
          setLoading(false);
          toast.error('Lỗi tải dữ liệu checkin: ' + error.message);
        }
      );
      
      unsubscribers.push(unsubscribeSchedules, unsubscribeCheckins);
    });
    
    // Load stats for the first date
    loadStats(getDateString(datesToLoad[0]));
    
    // Cleanup listeners
    return () => {
      console.log('🧹 Cleaning up realtime listeners');
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [selectedDate, viewMode]);

  // Load statistics
  const loadStats = useCallback(async (dateStr) => {
    try {
      const statsData = await getScheduleStats(dateStr);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  // Create new schedule
  const addSchedule = useCallback(async (scheduleData) => {
    try {
      setLoading(true);
      setError(null);
      
      const scheduleId = await createSchedule(scheduleData);
      console.log('✅ Schedule created:', scheduleId);
      
      toast.success('Tạo lịch làm việc thành công!');
      return scheduleId;
    } catch (error) {
      console.error('Error creating schedule:', error);
      setError(error.message);
      toast.error('Lỗi tạo lịch làm việc: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update existing schedule
  const updateScheduleData = useCallback(async (scheduleId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      
      await updateSchedule(scheduleId, updateData);
      console.log('✅ Schedule updated:', scheduleId);
      
      toast.success('Cập nhật lịch làm việc thành công!');
      return true;
    } catch (error) {
      console.error('Error updating schedule:', error);
      setError(error.message);
      toast.error('Lỗi cập nhật lịch làm việc: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete schedule
  const removeSchedule = useCallback(async (scheduleId) => {
    try {
      setLoading(true);
      setError(null);
      
      await deleteSchedule(scheduleId);
      console.log('✅ Schedule deleted:', scheduleId);
      
      toast.success('Xóa lịch làm việc thành công!');
      return true;
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setError(error.message);
      toast.error('Lỗi xóa lịch làm việc: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Change selected date
  const changeDate = useCallback((newDate) => {
    setSelectedDate(newDate);
    setError(null);
  }, []);

  // Get checkin info for employee on specific date
  const getCheckinInfo = useCallback((employeeId, date = selectedDate) => {
    const dateStr = getDateString(date);
    const dayCheckins = checkins[dateStr] || {};
    const employeeCheckins = dayCheckins[employeeId] || [];
    
    const checkin = employeeCheckins.find(c => c.checkinType === 'checkin');
    const checkout = employeeCheckins.find(c => c.checkinType === 'checkout');
    
    return { checkin, checkout };
  }, [checkins, selectedDate]);

  // Get working employees for selected date
  const getWorkingEmployees = useCallback((allEmployees, date = selectedDate) => {
    const dateStr = getDateString(date);
    const daySchedules = schedules[dateStr] || [];
    const working = [];
    
    // Fulltime employees work every day
    const fulltimeEmployees = allEmployees.filter(emp => emp.shift === 'fulltime');
    fulltimeEmployees.forEach(emp => {
      working.push({
        ...emp,
        scheduleType: 'fulltime',
        startTime: '08:00',
        endTime: '17:00'
      });
    });

    // Parttime employees with scheduled shifts
    daySchedules.forEach(schedule => {
      const emp = allEmployees.find(e => e._id === schedule.employeeId);
      if (emp) {
        working.push({
          ...emp,
          scheduleType: 'parttime',
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          scheduleId: schedule._id
        });
      }
    });

    return working;
  }, [schedules, selectedDate]);

  // Get week days for current selected date
  const getCurrentWeekDays = useCallback(() => {
    return getWeekDays(getStartOfWeek(selectedDate));
  }, [selectedDate]);

  const contextValue = {
    // State
    schedules,
    checkins,
    loading,
    error,
    selectedDate,
    viewMode,
    stats,
    
    // Actions
    addSchedule,
    updateScheduleData,
    removeSchedule,
    changeDate,
    setViewMode,
    getCheckinInfo,
    getWorkingEmployees,
    getCurrentWeekDays,
    loadStats,
    
    // Utilities
    getDateString,
    getStartOfWeek,
    getWeekDays
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
}

// Hook to use schedule context
export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within ScheduleProvider');
  }
  return context;
};

// Export context for advanced usage
export { ScheduleContext };
