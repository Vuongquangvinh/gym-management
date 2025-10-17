import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { db } from "../../config/firebase.js";

/**
 * Class CheckinStats để thống kê dữ liệu check-in
 */
export class CheckinStatsModel {
  
  /**
   * Lấy thống kê tổng quan
   * @returns {Promise<Object>}
   */
  static async getOverallStats() {
    try {
      const checkinRef = collection(db, "checkins");
      const snapshot = await getDocs(checkinRef);
      
      const today = new Date();
      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);
      
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      let totalCheckins = 0;
      let todayCheckins = 0;
      let weekCheckins = 0;
      let monthCheckins = 0;
      let qrCheckins = 0;
      let manualCheckins = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totalCheckins++;
        
        // Parse checkedAt (handle both Timestamp and string)
        let checkedDate;
        if (data.checkedAt && data.checkedAt.toDate) {
          checkedDate = data.checkedAt.toDate();
        } else {
          checkedDate = new Date(data.checkedAt);
        }
        
        // Count by time periods
        if (checkedDate >= startOfToday) {
          todayCheckins++;
        }
        if (checkedDate >= startOfWeek) {
          weekCheckins++;
        }
        if (checkedDate >= startOfMonth) {
          monthCheckins++;
        }
        
        // Count by source
        if (data.source === 'QR') {
          qrCheckins++;
        } else {
          manualCheckins++;
        }
      });
      
      return {
        total: totalCheckins,
        today: todayCheckins,
        thisWeek: weekCheckins,
        thisMonth: monthCheckins,
        bySource: {
          qr: qrCheckins,
          manual: manualCheckins
        }
      };
    } catch (error) {
      console.error("Error getting overall stats:", error);
      throw error;
    }
  }
  
  /**
   * Lấy thống kê theo ngày trong khoảng thời gian
   * @param {Date} startDate 
   * @param {Date} endDate 
   * @returns {Promise<Array>}
   */
  static async getStatsByDateRange(startDate, endDate) {
    try {
      const checkinRef = collection(db, "checkins");
      
      // Convert to Firestore Timestamps
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);
      
      const q = query(
        checkinRef,
        where("checkedAt", ">=", startTimestamp),
        where("checkedAt", "<=", endTimestamp),
        orderBy("checkedAt", "asc")
      );
      
      const snapshot = await getDocs(q);
      
      // Group by date
      const statsByDate = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        let checkedDate;
        
        if (data.checkedAt && data.checkedAt.toDate) {
          checkedDate = data.checkedAt.toDate();
        } else {
          checkedDate = new Date(data.checkedAt);
        }
        
        const dateKey = checkedDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!statsByDate[dateKey]) {
          statsByDate[dateKey] = {
            date: dateKey,
            count: 0,
            qr: 0,
            manual: 0
          };
        }
        
        statsByDate[dateKey].count++;
        if (data.source === 'QR') {
          statsByDate[dateKey].qr++;
        } else {
          statsByDate[dateKey].manual++;
        }
      });
      
      return Object.values(statsByDate).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error("Error getting stats by date range:", error);
      throw error;
    }
  }
  
  /**
   * Lấy thống kê theo giờ trong ngày
   * @param {Date} date 
   * @returns {Promise<Array>}
   */
  static async getStatsByHour(date = new Date()) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const checkinRef = collection(db, "checkins");
      const startTimestamp = Timestamp.fromDate(startOfDay);
      const endTimestamp = Timestamp.fromDate(endOfDay);
      
      const q = query(
        checkinRef,
        where("checkedAt", ">=", startTimestamp),
        where("checkedAt", "<=", endTimestamp)
      );
      
      const snapshot = await getDocs(q);
      
      // Initialize hours 0-23
      const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: 0,
        qr: 0,
        manual: 0
      }));
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        let checkedDate;
        
        if (data.checkedAt && data.checkedAt.toDate) {
          checkedDate = data.checkedAt.toDate();
        } else {
          checkedDate = new Date(data.checkedAt);
        }
        
        const hour = checkedDate.getHours();
        hourlyStats[hour].count++;
        
        if (data.source === 'QR') {
          hourlyStats[hour].qr++;
        } else {
          hourlyStats[hour].manual++;
        }
      });
      
      return hourlyStats;
    } catch (error) {
      console.error("Error getting stats by hour:", error);
      throw error;
    }
  }
  
  /**
   * Lấy thống kê theo tuần trong tháng
   * @param {number} year 
   * @param {number} month (0-based)
   * @returns {Promise<Array>}
   */
  static async getStatsByWeekInMonth(year, month) {
    try {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      const checkinRef = collection(db, "checkins");
      const startTimestamp = Timestamp.fromDate(startOfMonth);
      const endTimestamp = Timestamp.fromDate(endOfMonth);
      
      const q = query(
        checkinRef,
        where("checkedAt", ">=", startTimestamp),
        where("checkedAt", "<=", endTimestamp)
      );
      
      const snapshot = await getDocs(q);
      
      // Group by week
      const weeklyStats = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        let checkedDate;
        
        if (data.checkedAt && data.checkedAt.toDate) {
          checkedDate = data.checkedAt.toDate();
        } else {
          checkedDate = new Date(data.checkedAt);
        }
        
        // Calculate week number in month
        const firstDayOfMonth = new Date(year, month, 1);
        const dayOfMonth = checkedDate.getDate();
        const firstDayWeekday = firstDayOfMonth.getDay();
        const weekNumber = Math.ceil((dayOfMonth + firstDayWeekday) / 7);
        
        if (!weeklyStats[weekNumber]) {
          weeklyStats[weekNumber] = {
            week: weekNumber,
            count: 0,
            qr: 0,
            manual: 0
          };
        }
        
        weeklyStats[weekNumber].count++;
        if (data.source === 'QR') {
          weeklyStats[weekNumber].qr++;
        } else {
          weeklyStats[weekNumber].manual++;
        }
      });
      
      return Object.values(weeklyStats).sort((a, b) => a.week - b.week);
    } catch (error) {
      console.error("Error getting stats by week:", error);
      throw error;
    }
  }
  
  /**
   * Lấy top giờ cao điểm
   * @param {Date} startDate 
   * @param {Date} endDate 
   * @returns {Promise<Array>}
   */
  static async getPeakHours(startDate, endDate) {
    try {
      const checkinRef = collection(db, "checkins");
      
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);
      
      const q = query(
        checkinRef,
        where("checkedAt", ">=", startTimestamp),
        where("checkedAt", "<=", endTimestamp)
      );
      
      const snapshot = await getDocs(q);
      
      const hourCounts = Array.from({ length: 24 }, () => 0);
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        let checkedDate;
        
        if (data.checkedAt && data.checkedAt.toDate) {
          checkedDate = data.checkedAt.toDate();
        } else {
          checkedDate = new Date(data.checkedAt);
        }
        
        const hour = checkedDate.getHours();
        hourCounts[hour]++;
      });
      
      // Get top 5 peak hours
      return hourCounts
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(item => ({
          hour: item.hour,
          hourDisplay: `${item.hour.toString().padStart(2, '0')}:00`,
          count: item.count
        }));
    } catch (error) {
      console.error("Error getting peak hours:", error);
      throw error;
    }
  }
}

export default CheckinStatsModel;