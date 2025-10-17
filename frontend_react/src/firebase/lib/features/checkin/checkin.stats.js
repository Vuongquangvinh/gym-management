import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { db } from '../../config/firebase.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
/**
 * CheckinStats - Model để thống kê check-in
 */
export class CheckinStats {
  static async getTodayStats() {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const checkinRef = collection(db, "checkins");
      const q = query(
        checkinRef,
        where("checkedAt", ">=", Timestamp.fromDate(startOfDay)),
        where("checkedAt", "<=", Timestamp.fromDate(endOfDay))
      );

      const snapshot = await getDocs(q);
      return {
        total: snapshot.size,
        qrScans: snapshot.docs.filter(doc => doc.data().source === 'QR').length,
        manual: snapshot.docs.filter(doc => doc.data().source === 'manual').length
      };
    } catch (error) {
      console.error("Error getting today stats:", error);
      return { total: 0, qrScans: 0, manual: 0 };
    }
  }

  static async getWeekStats() {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Thứ 2 đầu tuần
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const checkinRef = collection(db, "checkins");
      const q = query(
        checkinRef,
        where("checkedAt", ">=", Timestamp.fromDate(startOfWeek)),
        where("checkedAt", "<=", Timestamp.fromDate(endOfWeek))
      );

      const snapshot = await getDocs(q);
      return {
        total: snapshot.size,
        qrScans: snapshot.docs.filter(doc => doc.data().source === 'QR').length,
        manual: snapshot.docs.filter(doc => doc.data().source === 'manual').length,
        daily: this.groupByDay(snapshot.docs, startOfWeek, endOfWeek)
      };
    } catch (error) {
      console.error("Error getting week stats:", error);
      return { total: 0, qrScans: 0, manual: 0, daily: [] };
    }
  }

  static async getMonthStats() {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const checkinRef = collection(db, "checkins");
      const q = query(
        checkinRef,
        where("checkedAt", ">=", Timestamp.fromDate(startOfMonth)),
        where("checkedAt", "<=", Timestamp.fromDate(endOfMonth))
      );

      const snapshot = await getDocs(q);
      return {
        total: snapshot.size,
        qrScans: snapshot.docs.filter(doc => doc.data().source === 'QR').length,
        manual: snapshot.docs.filter(doc => doc.data().source === 'manual').length,
        daily: this.groupByDay(snapshot.docs, startOfMonth, endOfMonth)
      };
    } catch (error) {
      console.error("Error getting month stats:", error);
      return { total: 0, qrScans: 0, manual: 0, daily: [] };
    }
  }

  static async getPeakHours(days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const checkinRef = collection(db, "checkins");
      const q = query(
        checkinRef,
        where("checkedAt", ">=", Timestamp.fromDate(startDate)),
        where("checkedAt", "<=", Timestamp.fromDate(endDate)),
        orderBy("checkedAt", "desc")
      );

      const snapshot = await getDocs(q);
      const hourlyStats = Array(24).fill(0);

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        let checkedAt;
        
        if (data.checkedAt && data.checkedAt.toDate) {
          checkedAt = data.checkedAt.toDate();
        } else {
          checkedAt = new Date(data.checkedAt);
        }
        
        const hour = checkedAt.getHours();
        hourlyStats[hour]++;
      });

      // Tìm khung giờ cao điểm (top 3)
      const peakHours = hourlyStats
        .map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .filter(item => item.count > 0);

      return {
        hourlyStats,
        peakHours: peakHours.map(item => ({
          hour: `${item.hour}:00 - ${item.hour + 1}:00`,
          count: item.count
        }))
      };
    } catch (error) {
      console.error("Error getting peak hours:", error);
      return { hourlyStats: Array(24).fill(0), peakHours: [] };
    }
  }

  static async getComparisonStats() {
    try {
      // Hôm nay vs hôm qua
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const todayStats = await this.getStatsForDate(today);
      const yesterdayStats = await this.getStatsForDate(yesterday);

      // Tuần này vs tuần trước
      const thisWeekStats = await this.getWeekStats();
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - 7);
      const lastWeekStats = await this.getWeekStatsForDate(lastWeekStart);

      return {
        today: {
          current: todayStats.total,
          previous: yesterdayStats.total,
          change: this.calculatePercentageChange(todayStats.total, yesterdayStats.total)
        },
        week: {
          current: thisWeekStats.total,
          previous: lastWeekStats.total,
          change: this.calculatePercentageChange(thisWeekStats.total, lastWeekStats.total)
        }
      };
    } catch (error) {
      console.error("Error getting comparison stats:", error);
      return {
        today: { current: 0, previous: 0, change: 0 },
        week: { current: 0, previous: 0, change: 0 }
      };
    }
  }

  // Helper methods
  static groupByDay(docs, startDate, endDate) {
    const daily = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayStart = new Date(current);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);

      const dayDocs = docs.filter(doc => {
        const data = doc.data();
        let checkedAt;
        
        if (data.checkedAt && data.checkedAt.toDate) {
          checkedAt = data.checkedAt.toDate();
        } else {
          checkedAt = new Date(data.checkedAt);
        }
        
        return checkedAt >= dayStart && checkedAt <= dayEnd;
      });

      daily.push({
        date: current.toISOString().split('T')[0],
        count: dayDocs.length,
        qrScans: dayDocs.filter(doc => doc.data().source === 'QR').length,
        manual: dayDocs.filter(doc => doc.data().source === 'manual').length
      });

      current.setDate(current.getDate() + 1);
    }

    return daily;
  }

  static async getStatsForDate(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const checkinRef = collection(db, "checkins");
    const q = query(
      checkinRef,
      where("checkedAt", ">=", Timestamp.fromDate(startOfDay)),
      where("checkedAt", "<=", Timestamp.fromDate(endOfDay))
    );

    const snapshot = await getDocs(q);
    return { total: snapshot.size };
  }

  static async getWeekStatsForDate(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const checkinRef = collection(db, "checkins");
    const q = query(
      checkinRef,
      where("checkedAt", ">=", Timestamp.fromDate(startDate)),
      where("checkedAt", "<=", Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(q);
    return { total: snapshot.size };
  }

  static calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Xuất dữ liệu check-in ra file Excel
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @param {string} fileName - Tên file (không cần extension)
   */
  static async exportToExcel(startDate, endDate, fileName = 'checkin-stats') {
    try {
      const checkinRef = collection(db, "checkins");
      const q = query(
        checkinRef,
        where("checkedAt", ">=", Timestamp.fromDate(startDate)),
        where("checkedAt", "<=", Timestamp.fromDate(endDate)),
        orderBy("checkedAt", "desc")
      );

      const snapshot = await getDocs(q);
      
      // Chuẩn bị dữ liệu cho Excel
      const checkinData = snapshot.docs.map((doc, index) => {
        const data = doc.data();
        const checkedAt = data.checkedAt.toDate();
        
        return {
          'STT': index + 1,
          'Thành viên': data.memberName || 'N/A',
          'Số điện thoại': data.memberPhone || 'N/A',
          'Thời gian check-in': checkedAt.toLocaleString('vi-VN'),
          'Ngày': checkedAt.toLocaleDateString('vi-VN'),
          'Giờ': checkedAt.toLocaleTimeString('vi-VN'),
          'Phương thức': data.source === 'QR' ? 'QR Code' : 'Thủ công',
          'ID Check-in': doc.id,
          'Package ID': data.packageId || 'N/A'
        };
      });

      // Tạo summary statistics
      const totalCheckins = checkinData.length;
      const qrScans = checkinData.filter(item => item['Phương thức'] === 'QR Code').length;
      const manualCheckins = checkinData.filter(item => item['Phương thức'] === 'Thủ công').length;

      // Thống kê theo ngày
      const dailyStats = {};
      checkinData.forEach(item => {
        const date = item['Ngày'];
        if (!dailyStats[date]) {
          dailyStats[date] = { total: 0, qr: 0, manual: 0 };
        }
        dailyStats[date].total++;
        if (item['Phương thức'] === 'QR Code') {
          dailyStats[date].qr++;
        } else {
          dailyStats[date].manual++;
        }
      });

      const dailyStatsData = Object.entries(dailyStats).map(([date, stats]) => ({
        'Ngày': date,
        'Tổng check-in': stats.total,
        'QR Code': stats.qr,
        'Thủ công': stats.manual,
        'Tỷ lệ QR (%)': Math.round((stats.qr / stats.total) * 100)
      }));

      // Tạo workbook
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Tổng quan
      const summaryData = [
        ['BÁOCÁO THỐNG KÊ CHECK-IN', ''],
        ['Từ ngày:', startDate.toLocaleDateString('vi-VN')],
        ['Đến ngày:', endDate.toLocaleDateString('vi-VN')],
        ['Ngày xuất báo cáo:', new Date().toLocaleString('vi-VN')],
        ['', ''],
        ['TỔNG QUAN', ''],
        ['Tổng số check-in:', totalCheckins],
        ['Check-in bằng QR Code:', qrScans],
        ['Check-in thủ công:', manualCheckins],
        ['Tỷ lệ QR Code (%):', totalCheckins > 0 ? Math.round((qrScans / totalCheckins) * 100) : 0],
        ['Tỷ lệ thủ công (%):', totalCheckins > 0 ? Math.round((manualCheckins / totalCheckins) * 100) : 0]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan');

      // Sheet 2: Chi tiết check-in
      const detailSheet = XLSX.utils.json_to_sheet(checkinData);
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Chi tiết check-in');

      // Sheet 3: Thống kê theo ngày
      const dailySheet = XLSX.utils.json_to_sheet(dailyStatsData);
      XLSX.utils.book_append_sheet(workbook, dailySheet, 'Thống kê theo ngày');

      // Xuất file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const currentDate = new Date().toISOString().split('T')[0];
      saveAs(fileData, `${fileName}_${currentDate}.xlsx`);

      return {
        success: true,
        message: `Đã xuất ${totalCheckins} bản ghi check-in thành công!`,
        stats: { total: totalCheckins, qr: qrScans, manual: manualCheckins }
      };

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra khi xuất file Excel: ' + error.message
      };
    }
  }
}

export default CheckinStats;