import { PaymentOrderModel, PAYMENT_STATUS } from "../payment/index.js";
import {
  DailyRevenue,
  MonthlyRevenue,
  WeeklyRevenue,
  QuarterlyRevenue,
  YearlyRevenue,
  RevenueByPackage,
  RevenueByPT,
  RevenueSummary,
  RevenueComparison,
} from "./revenue.model.js";

/**
 * 💰 Revenue Service
 * Service tập trung xử lý tất cả logic liên quan đến doanh thu
 *
 * @description
 * Service này sử dụng PaymentOrderModel làm nguồn dữ liệu chính xác
 * thay vì UserModel (không chính xác vì không biết ai đã trả tiền)
 */
export class RevenueService {
  // ============================================
  // 📅 REVENUE BY TIME PERIOD
  // ============================================

  /**
   * Get revenue by day (enhanced version)
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<DailyRevenue[]>}
   */
  static async getRevenueByDay(startDate, endDate) {
    try {
      console.log("🔍 RevenueService.getRevenueByDay:", { startDate, endDate });

      // Sử dụng method có sẵn từ PaymentOrderModel
      const rawData = await PaymentOrderModel.getRevenueByDay(
        startDate,
        endDate
      );

      // Transform sang DailyRevenue model
      const result = rawData.map(
        (item) =>
          new DailyRevenue({
            date: item.date,
            revenue: item.revenue,
            orders: item.orders,
            avgOrderValue: item.orders > 0 ? item.revenue / item.orders : 0,
          })
      );

      console.log(`✅ Loaded ${result.length} days of revenue data`);
      return result;
    } catch (error) {
      console.error("❌ RevenueService.getRevenueByDay error:", error);
      throw error;
    }
  }

  /**
   * Get revenue by week
   * @param {number} year
   * @returns {Promise<WeeklyRevenue[]>}
   */
  static async getRevenueByWeek(year) {
    try {
      console.log("🔍 RevenueService.getRevenueByWeek:", { year });

      const result = await PaymentOrderModel.getAll({ limit: 2000 });
      const orders = result.orders.filter((o) => o.isPaid());

      const weekMap = new Map();

      orders.forEach((order) => {
        const orderDate =
          order.createdAt instanceof Date
            ? order.createdAt
            : new Date(order.createdAt);

        if (orderDate.getFullYear() !== year) return;

        // Tính week number (1-52)
        const weekNum = this.getWeekNumber(orderDate);
        const weekKey = `${year}-W${String(weekNum).padStart(2, "0")}`;

        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, {
            week: weekKey,
            weekNumber: weekNum,
            year: year,
            revenue: 0,
            orders: 0,
          });
        }

        const weekData = weekMap.get(weekKey);
        weekData.revenue += order.amount;
        weekData.orders += 1;
      });

      const weeklyData = Array.from(weekMap.values())
        .sort((a, b) => a.weekNumber - b.weekNumber)
        .map((item) => new WeeklyRevenue(item));

      console.log(`✅ Loaded ${weeklyData.length} weeks of revenue data`);
      return weeklyData;
    } catch (error) {
      console.error("❌ RevenueService.getRevenueByWeek error:", error);
      throw error;
    }
  }

  /**
   * Get revenue by month (enhanced with growth rate)
   * @param {number} year
   * @returns {Promise<MonthlyRevenue[]>}
   */
  static async getRevenueByMonth(year) {
    try {
      console.log("🔍 RevenueService.getRevenueByMonth:", { year });

      const rawData = await PaymentOrderModel.getRevenueByMonth(year);

      // Calculate growth rate (so với tháng trước)
      const result = rawData.map((item, index) => {
        const prevMonth = index > 0 ? rawData[index - 1] : null;
        const growth =
          prevMonth && prevMonth.revenue > 0
            ? ((item.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
            : 0;

        return new MonthlyRevenue({
          month: item.month,
          revenue: item.revenue,
          orders: item.orders,
          avgOrderValue: item.orders > 0 ? item.revenue / item.orders : 0,
          growth: growth,
        });
      });

      console.log(`✅ Loaded ${result.length} months of revenue data`);
      return result;
    } catch (error) {
      console.error("❌ RevenueService.getRevenueByMonth error:", error);
      throw error;
    }
  }

  /**
   * Get revenue by quarter
   * @param {number} year
   * @returns {Promise<QuarterlyRevenue[]>}
   */
  static async getRevenueByQuarter(year) {
    try {
      console.log("🔍 RevenueService.getRevenueByQuarter:", { year });

      const monthlyData = await PaymentOrderModel.getRevenueByMonth(year);

      const quarters = {
        Q1: { quarter: "Q1", year, months: [1, 2, 3], revenue: 0, orders: 0 },
        Q2: { quarter: "Q2", year, months: [4, 5, 6], revenue: 0, orders: 0 },
        Q3: { quarter: "Q3", year, months: [7, 8, 9], revenue: 0, orders: 0 },
        Q4: {
          quarter: "Q4",
          year,
          months: [10, 11, 12],
          revenue: 0,
          orders: 0,
        },
      };

      monthlyData.forEach((item) => {
        const month = parseInt(item.month.split("-")[1]);

        Object.values(quarters).forEach((q) => {
          if (q.months.includes(month)) {
            q.revenue += item.revenue;
            q.orders += item.orders;
          }
        });
      });

      const result = Object.values(quarters).map(
        (q) => new QuarterlyRevenue(q)
      );

      console.log(`✅ Loaded ${result.length} quarters of revenue data`);
      return result;
    } catch (error) {
      console.error("❌ RevenueService.getRevenueByQuarter error:", error);
      throw error;
    }
  }

  /**
   * Get monthly revenue summary (for financial reports)
   * @param {number} year
   * @param {number} month
   * @returns {Promise<Object>}
   */
  static async getMonthlyRevenueSummary(year, month) {
    try {
      console.log("🔍 RevenueService.getMonthlyRevenueSummary:", {
        year,
        month,
      });

      // Get all orders for this month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const result = await PaymentOrderModel.getAll({ limit: 5000 });

      console.log(`📦 Total orders loaded: ${result.orders.length}`);
      console.log(
        `📅 Filtering for date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
      );

      const orders = result.orders.filter((o) => {
        if (!o.isPaid()) {
          console.log(
            `⏭️ Skipping unpaid order: ${o.orderCode} (status: ${o.status})`
          );
          return false;
        }

        // Check if paidDate is valid
        // If order is PAID but has no paidDate, use createdAt as fallback
        let paidDate;
        if (!o.paidDate) {
          console.log(
            `⚠️ Order ${o.orderCode} is PAID but missing paidDate, using createdAt as fallback`
          );
          paidDate =
            o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
        } else {
          paidDate =
            o.paidDate instanceof Date ? o.paidDate : new Date(o.paidDate);
        }

        // Validate date
        if (isNaN(paidDate.getTime())) {
          console.log(
            `⚠️ Order ${o.orderCode} has invalid paidDate: ${o.paidDate}`
          );
          return false;
        }

        const inRange = paidDate >= startDate && paidDate <= endDate;

        if (!inRange) {
          console.log(
            `⏭️ Skipping order outside date range: ${
              o.orderCode
            } (paidDate: ${paidDate.toISOString()})`
          );
        }

        return inRange;
      });

      console.log(`✅ Filtered ${orders.length} paid orders in date range`);

      // Calculate total revenue
      const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);

      console.log(
        `💰 Total revenue calculated: ${totalRevenue.toLocaleString(
          "vi-VN"
        )} VND`
      );

      // Group by package
      const packageMap = new Map();
      orders.forEach((order) => {
        const pkgName = order.packageName || "Unknown Package";
        if (!packageMap.has(pkgName)) {
          packageMap.set(pkgName, {
            packageName: pkgName,
            count: 0,
            total: 0,
          });
        }
        const pkg = packageMap.get(pkgName);
        pkg.count++;
        pkg.total += order.amount;
      });

      // Group by PT
      const ptMap = new Map();
      orders.forEach((order) => {
        if (order.ptTrainerId) {
          const ptName = order.ptTrainerName || "Unknown PT";
          if (!ptMap.has(order.ptTrainerId)) {
            ptMap.set(order.ptTrainerId, {
              ptId: order.ptTrainerId,
              ptName: ptName,
              count: 0,
              total: 0,
            });
          }
          const pt = ptMap.get(order.ptTrainerId);
          pt.count++;
          pt.total += order.amount;
        }
      });

      return {
        year,
        month,
        totalRevenue,
        orderCount: orders.length,
        byPackage: Array.from(packageMap.values()).sort(
          (a, b) => b.total - a.total
        ),
        byPT: Array.from(ptMap.values()).sort((a, b) => b.total - a.total),
      };
    } catch (error) {
      console.error("❌ RevenueService.getMonthlyRevenueSummary error:", error);
      throw error;
    }
  }

  /**
   * Get revenue by year (for multi-year comparison)
   * @param {number} startYear
   * @param {number} endYear
   * @returns {Promise<YearlyRevenue[]>}
   */
  static async getRevenueByYear(startYear, endYear) {
    try {
      console.log("🔍 RevenueService.getRevenueByYear:", {
        startYear,
        endYear,
      });

      const result = await PaymentOrderModel.getAll({ limit: 5000 });
      const orders = result.orders.filter((o) => o.isPaid());

      const yearMap = new Map();

      orders.forEach((order) => {
        const orderDate =
          order.createdAt instanceof Date
            ? order.createdAt
            : new Date(order.createdAt);
        const year = orderDate.getFullYear();

        if (year < startYear || year > endYear) return;

        if (!yearMap.has(year)) {
          yearMap.set(year, { year, revenue: 0, orders: 0 });
        }

        const yearData = yearMap.get(year);
        yearData.revenue += order.amount;
        yearData.orders += 1;
      });

      const yearlyData = Array.from(yearMap.values())
        .sort((a, b) => a.year - b.year)
        .map(
          (item) =>
            new YearlyRevenue({
              ...item,
              avgMonthlyRevenue: item.revenue / 12,
            })
        );

      console.log(`✅ Loaded ${yearlyData.length} years of revenue data`);
      return yearlyData;
    } catch (error) {
      console.error("❌ RevenueService.getRevenueByYear error:", error);
      throw error;
    }
  }

  // ============================================
  // 📦 REVENUE BY CATEGORY
  // ============================================

  /**
   * Get revenue by package
   * @param {Object} options - {startDate, endDate, limit}
   * @returns {Promise<RevenueByPackage[]>}
   */
  static async getRevenueByPackage(options = {}) {
    try {
      console.log("🔍 RevenueService.getRevenueByPackage:", options);

      const { startDate, endDate, limit = 2000 } = options;

      const result = await PaymentOrderModel.getAll({ limit });
      let orders = result.orders.filter((o) => o.isPaid());

      // Filter by date range if provided
      if (startDate || endDate) {
        orders = orders.filter((order) => {
          const orderDate =
            order.createdAt instanceof Date
              ? order.createdAt
              : new Date(order.createdAt);

          if (startDate && orderDate < startDate) return false;
          if (endDate && orderDate > endDate) return false;
          return true;
        });
      }

      const packageMap = new Map();

      orders.forEach((order) => {
        const pkgId = order.packageId;

        if (!packageMap.has(pkgId)) {
          packageMap.set(pkgId, {
            packageId: pkgId,
            packageName: order.packageName,
            revenue: 0,
            orders: 0,
            users: new Set(),
          });
        }

        const pkgData = packageMap.get(pkgId);
        pkgData.revenue += order.amount;
        pkgData.orders += 1;
        pkgData.users.add(order.userId);
      });

      const packageRevenue = Array.from(packageMap.values())
        .map((item) => new RevenueByPackage(item))
        .sort((a, b) => b.revenue - a.revenue);

      console.log(`✅ Loaded revenue for ${packageRevenue.length} packages`);
      return packageRevenue;
    } catch (error) {
      console.error("❌ RevenueService.getRevenueByPackage error:", error);
      throw error;
    }
  }

  /**
   * Get revenue by PT (Personal Trainer)
   * Note: Requires ptId field - needs to join with contracts collection
   * @returns {Promise<RevenueByPT[]>}
   */
  static async getRevenueByPT() {
    try {
      console.log("🔍 RevenueService.getRevenueByPT");

      // TODO: Implement when contract integration is ready
      // Need to:
      // 1. Get all paid orders
      // 2. For each order, lookup contract by paymentOrderCode
      // 3. Get ptId from contract
      // 4. Group by ptId and calculate commission

      console.warn(
        "⚠️ getRevenueByPT: Requires contract integration - Not yet implemented"
      );
      return [];
    } catch (error) {
      console.error("❌ RevenueService.getRevenueByPT error:", error);
      throw error;
    }
  }

  // ============================================
  // 📊 SUMMARY & STATISTICS
  // ============================================

  /**
   * Get revenue summary for a period
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<RevenueSummary>}
   */
  static async getRevenueSummary(startDate, endDate) {
    try {
      console.log("🔍 RevenueService.getRevenueSummary:", {
        startDate,
        endDate,
      });

      const result = await PaymentOrderModel.getAll({ limit: 2000 });
      const orders = result.orders.filter((o) => {
        if (!o.isPaid()) return false;

        const orderDate =
          o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);

        return orderDate >= startDate && orderDate <= endDate;
      });

      // Calculate metrics
      const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
      const totalOrders = orders.length;
      const uniqueUsers = new Set(orders.map((o) => o.userId)).size;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Top package
      const packageRevenue = {};
      orders.forEach((o) => {
        if (!packageRevenue[o.packageId]) {
          packageRevenue[o.packageId] = {
            id: o.packageId,
            name: o.packageName,
            revenue: 0,
          };
        }
        packageRevenue[o.packageId].revenue += o.amount;
      });

      const topPackage =
        Object.values(packageRevenue).sort(
          (a, b) => b.revenue - a.revenue
        )[0] || null;

      // Growth rate (so với period trước)
      const periodDuration = endDate - startDate;
      const prevStartDate = new Date(startDate.getTime() - periodDuration);
      const prevEndDate = startDate;

      const prevOrders = result.orders.filter((o) => {
        if (!o.isPaid()) return false;
        const orderDate =
          o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
        return orderDate >= prevStartDate && orderDate < prevEndDate;
      });

      const prevRevenue = prevOrders.reduce((sum, o) => sum + o.amount, 0);
      const growthRate =
        prevRevenue > 0
          ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
          : 0;

      const summary = new RevenueSummary({
        totalRevenue,
        totalOrders,
        totalUsers: uniqueUsers,
        avgOrderValue,
        topPackage,
        topPT: null, // TODO: Implement when PT integration is ready
        growthRate,
        period: `${startDate.toISOString().split("T")[0]} to ${
          endDate.toISOString().split("T")[0]
        }`,
      });

      console.log("✅ Revenue summary calculated:", summary.getKPIs());
      return summary;
    } catch (error) {
      console.error("❌ RevenueService.getRevenueSummary error:", error);
      throw error;
    }
  }

  /**
   * Compare revenue between two periods
   * @param {Date} period1Start
   * @param {Date} period1End
   * @param {Date} period2Start
   * @param {Date} period2End
   * @returns {Promise<RevenueComparison>}
   */
  static async compareRevenue(
    period1Start,
    period1End,
    period2Start,
    period2End
  ) {
    try {
      console.log("🔍 RevenueService.compareRevenue");

      const [summary1, summary2] = await Promise.all([
        this.getRevenueSummary(period1Start, period1End),
        this.getRevenueSummary(period2Start, period2End),
      ]);

      const comparison = new RevenueComparison({
        period1: summary1.period,
        period2: summary2.period,
        revenue1: summary1.totalRevenue,
        revenue2: summary2.totalRevenue,
      });

      console.log("✅ Revenue comparison:", comparison.toJSON());
      return comparison;
    } catch (error) {
      console.error("❌ RevenueService.compareRevenue error:", error);
      throw error;
    }
  }

  /**
   * Get revenue for current month
   * @returns {Promise<MonthlyRevenue>}
   */
  static async getCurrentMonthRevenue() {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const monthlyData = await this.getRevenueByMonth(currentYear);
      const currentMonthData = monthlyData.find((m) => {
        const [year, month] = m.month.split("-");
        return (
          parseInt(year) === currentYear && parseInt(month) === currentMonth
        );
      });

      return (
        currentMonthData ||
        new MonthlyRevenue({
          month: `${currentYear}-${String(currentMonth).padStart(2, "0")}`,
          revenue: 0,
          orders: 0,
        })
      );
    } catch (error) {
      console.error("❌ RevenueService.getCurrentMonthRevenue error:", error);
      throw error;
    }
  }

  /**
   * Get revenue for today
   * @returns {Promise<DailyRevenue>}
   */
  static async getTodayRevenue() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dailyData = await this.getRevenueByDay(today, tomorrow);
      return (
        dailyData[0] ||
        new DailyRevenue({
          date: today.toISOString().split("T")[0],
          revenue: 0,
          orders: 0,
        })
      );
    } catch (error) {
      console.error("❌ RevenueService.getTodayRevenue error:", error);
      throw error;
    }
  }

  // ============================================
  // 🛠️ UTILITY METHODS
  // ============================================

  /**
   * Get week number from date (ISO 8601)
   * @param {Date} date
   * @returns {number} Week number (1-52)
   */
  static getWeekNumber(date) {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }

  /**
   * Format currency (VNĐ)
   * @param {number} amount
   * @returns {string}
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }

  /**
   * Format number
   * @param {number} num
   * @returns {string}
   */
  static formatNumber(num) {
    return new Intl.NumberFormat("vi-VN").format(num);
  }

  /**
   * Calculate percentage
   * @param {number} value
   * @param {number} total
   * @returns {number}
   */
  static calculatePercentage(value, total) {
    return total > 0 ? ((value / total) * 100).toFixed(2) : 0;
  }

  /**
   * Get date range for common periods
   * @param {string} period - 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year'
   * @returns {Object} {startDate, endDate}
   */
  static getDateRangeForPeriod(period) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "yesterday":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "this_week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "last_week":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - startDate.getDay() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "this_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }
}
