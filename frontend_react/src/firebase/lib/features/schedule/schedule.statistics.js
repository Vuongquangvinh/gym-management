import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.js';

/**
 * Service tính toán thống kê checkin/checkout cho PT (Real-time với onSnapshot)
 */
export class ScheduleStatisticsService {
  /**
   * Subscribe to statistics với real-time updates
   * @param {string} employeeId - ID của employee
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @param {function} onUpdate - Callback khi có update
   * @param {function} onError - Callback khi có lỗi
   * @returns {function} Unsubscribe function
   */
  static subscribeToStats(employeeId, startDate, endDate, onUpdate, onError) {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log(`📊 [Real-time] Subscribing to stats for ${employeeId} from ${startDateStr} to ${endDateStr}`);

      const checkinsRef = collection(db, 'employee_checkins');
      const q = query(
        checkinsRef,
        where('employeeId', '==', employeeId),
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          console.log(`🔄 Stats real-time update: ${snapshot.size} checkins`);
          const stats = ScheduleStatisticsService._processStatsSnapshot(snapshot, startDate, endDate, startDateStr, endDateStr);
          if (onUpdate) onUpdate(stats);
        },
        (error) => {
          console.error('❌ Stats onSnapshot error:', error);
          if (onError) onError(error);
        }
      );
    } catch (error) {
      console.error('❌ Error setting up stats subscription:', error);
      if (onError) onError(error);
      return () => {};
    }
  }

  /**
   * Process snapshot data và tính toán statistics
   * @private
   */
  static _processStatsSnapshot(snapshot, startDate, endDate, startDateStr, endDateStr) {
    try {
      // Group by date and type
      const checkinsByDate = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        const date = data.date;
        
        if (!checkinsByDate[date]) {
          checkinsByDate[date] = {
            checkin: null,
            checkout: null
          };
        }
        
        if (data.checkinType === 'checkin') {
          checkinsByDate[date].checkin = {
            ...data,
            timestamp: data.timestamp instanceof Timestamp 
              ? data.timestamp.toDate() 
              : new Date(data.timestamp)
          };
        } else if (data.checkinType === 'checkout') {
          checkinsByDate[date].checkout = {
            ...data,
            timestamp: data.timestamp instanceof Timestamp 
              ? data.timestamp.toDate() 
              : new Date(data.timestamp)
          };
        }
      });

      // Calculate statistics
      let totalDaysWorked = 0;
      let totalDaysWithCheckin = 0;
      let totalDaysWithCheckout = 0;
      let totalDaysCompleted = 0;
      let totalWorkingHours = 0;
      let totalWorkingMinutes = 0;
      const daysDetail = [];

      Object.keys(checkinsByDate).forEach(date => {
        const day = checkinsByDate[date];
        const hasCheckin = day.checkin !== null;
        const hasCheckout = day.checkout !== null;
        
        if (hasCheckin) totalDaysWithCheckin++;
        if (hasCheckout) totalDaysWithCheckout++;
        
        if (hasCheckin && hasCheckout) {
          totalDaysCompleted++;
          totalDaysWorked++;
          
          // Calculate working hours
          const checkinTime = day.checkin.timestamp;
          const checkoutTime = day.checkout.timestamp;
          const diffMs = checkoutTime - checkinTime;
          
          if (diffMs > 0) {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            totalWorkingHours += hours;
            totalWorkingMinutes += minutes;
            
            daysDetail.push({
              date,
              checkinTime,
              checkoutTime,
              hours,
              minutes,
              totalMinutes: hours * 60 + minutes,
              status: 'completed'
            });
          }
        } else if (hasCheckin && !hasCheckout) {
          daysDetail.push({
            date,
            checkinTime: day.checkin.timestamp,
            checkoutTime: null,
            hours: 0,
            minutes: 0,
            totalMinutes: 0,
            status: 'in_progress'
          });
        }
      });

      // Convert total minutes overflow to hours
      totalWorkingHours += Math.floor(totalWorkingMinutes / 60);
      totalWorkingMinutes = totalWorkingMinutes % 60;

      // Calculate averages
      const avgHoursPerDay = totalDaysCompleted > 0 
        ? (totalWorkingHours + totalWorkingMinutes / 60) / totalDaysCompleted 
        : 0;

      const stats = {
        period: {
          startDate: startDateStr,
          endDate: endDateStr,
          totalDays: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
        },
        summary: {
          totalDaysWorked,
          totalDaysWithCheckin,
          totalDaysWithCheckout,
          totalDaysCompleted,
          totalWorkingHours,
          totalWorkingMinutes,
          totalWorkingTimeFormatted: `${totalWorkingHours}h ${totalWorkingMinutes}m`,
          avgHoursPerDay: avgHoursPerDay.toFixed(1),
          avgHoursPerDayFormatted: `${Math.floor(avgHoursPerDay)}h ${Math.floor((avgHoursPerDay % 1) * 60)}m`
        },
        details: daysDetail.sort((a, b) => new Date(b.date) - new Date(a.date))
      };

      return stats;
    } catch (error) {
      console.error('❌ Error processing stats:', error);
      return null;
    }
  }

  /**
   * Helper: Get start of week (Monday)
   */
  static getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  /**
   * Get completion rate (%)
   */
  static getCompletionRate(completed, total) {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }
}

export default ScheduleStatisticsService;
