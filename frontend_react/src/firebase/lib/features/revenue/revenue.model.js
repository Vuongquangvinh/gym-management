/**
 * 📊 Revenue Data Models
 * Định nghĩa cấu trúc dữ liệu cho các loại báo cáo doanh thu
 */

/**
 * Daily Revenue Model
 * Doanh thu theo ngày
 */
export class DailyRevenue {
  constructor({ date, revenue, orders, avgOrderValue } = {}) {
    this.date = date; // "2025-12-05"
    this.revenue = revenue || 0; // 1500000
    this.orders = orders || 0; // 5
    this.avgOrderValue = avgOrderValue || (orders > 0 ? revenue / orders : 0);
  }

  /**
   * Format revenue as currency
   */
  getFormattedRevenue() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.revenue);
  }

  /**
   * Format date
   */
  getFormattedDate() {
    return new Date(this.date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  /**
   * Get day of week
   */
  getDayOfWeek() {
    const days = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];
    return days[new Date(this.date).getDay()];
  }

  toJSON() {
    return {
      date: this.date,
      revenue: this.revenue,
      orders: this.orders,
      avgOrderValue: this.avgOrderValue,
    };
  }
}

/**
 * Monthly Revenue Model
 * Doanh thu theo tháng
 */
export class MonthlyRevenue {
  constructor({ month, revenue, orders, avgOrderValue, growth } = {}) {
    this.month = month; // "2025-12"
    this.revenue = revenue || 0; // 45000000
    this.orders = orders || 0; // 150
    this.avgOrderValue = avgOrderValue || (orders > 0 ? revenue / orders : 0);
    this.growth = growth || 0; // 15% (so với tháng trước)
  }

  /**
   * Get month name
   */
  getMonthName() {
    const [year, month] = this.month.split("-");
    return `Tháng ${parseInt(month)}/${year}`;
  }

  /**
   * Format revenue
   */
  getFormattedRevenue() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.revenue);
  }

  /**
   * Get growth indicator
   */
  getGrowthIndicator() {
    if (this.growth > 0) return "↑";
    if (this.growth < 0) return "↓";
    return "→";
  }

  /**
   * Get growth color
   */
  getGrowthColor() {
    if (this.growth > 0) return "success";
    if (this.growth < 0) return "error";
    return "default";
  }

  toJSON() {
    return {
      month: this.month,
      revenue: this.revenue,
      orders: this.orders,
      avgOrderValue: this.avgOrderValue,
      growth: this.growth,
    };
  }
}

/**
 * Revenue By Package Model
 * Doanh thu theo gói tập
 */
export class RevenueByPackage {
  constructor({ packageId, packageName, revenue, orders, users } = {}) {
    this.packageId = packageId || "";
    this.packageName = packageName || "Unknown Package";
    this.revenue = revenue || 0;
    this.orders = orders || 0;
    this.users = users instanceof Set ? users : new Set(users || []);
  }

  /**
   * Get unique user count
   */
  get uniqueUsers() {
    return this.users.size;
  }

  /**
   * Get average revenue per user
   */
  get avgRevenuePerUser() {
    return this.uniqueUsers > 0 ? this.revenue / this.uniqueUsers : 0;
  }

  /**
   * Format revenue
   */
  getFormattedRevenue() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.revenue);
  }

  /**
   * Get revenue percentage of total
   */
  getRevenuePercentage(totalRevenue) {
    return totalRevenue > 0
      ? ((this.revenue / totalRevenue) * 100).toFixed(2)
      : 0;
  }

  toJSON() {
    return {
      packageId: this.packageId,
      packageName: this.packageName,
      revenue: this.revenue,
      orders: this.orders,
      uniqueUsers: this.uniqueUsers,
      avgRevenuePerUser: this.avgRevenuePerUser,
    };
  }
}

/**
 * Revenue By PT Model
 * Doanh thu theo Personal Trainer
 */
export class RevenueByPT {
  constructor({ ptId, ptName, revenue, orders, clients, commission } = {}) {
    this.ptId = ptId || "";
    this.ptName = ptName || "Unknown PT";
    this.revenue = revenue || 0; // Doanh thu từ PT packages
    this.orders = orders || 0;
    this.clients = clients || 0; // Số client
    this.commission = commission || 0; // Hoa hồng PT nhận (nếu có)
  }

  /**
   * Get average revenue per client
   */
  get avgRevenuePerClient() {
    return this.clients > 0 ? this.revenue / this.clients : 0;
  }

  /**
   * Get net revenue (after commission)
   */
  get netRevenue() {
    return this.revenue - this.commission;
  }

  /**
   * Get commission rate
   */
  get commissionRate() {
    return this.revenue > 0
      ? ((this.commission / this.revenue) * 100).toFixed(2)
      : 0;
  }

  /**
   * Format revenue
   */
  getFormattedRevenue() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.revenue);
  }

  /**
   * Format commission
   */
  getFormattedCommission() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.commission);
  }

  toJSON() {
    return {
      ptId: this.ptId,
      ptName: this.ptName,
      revenue: this.revenue,
      orders: this.orders,
      clients: this.clients,
      commission: this.commission,
      netRevenue: this.netRevenue,
      commissionRate: this.commissionRate,
    };
  }
}

/**
 * Revenue Summary Model
 * Tổng quan doanh thu
 */
export class RevenueSummary {
  constructor({
    totalRevenue = 0,
    totalOrders = 0,
    totalUsers = 0,
    avgOrderValue = 0,
    topPackage = null,
    topPT = null,
    growthRate = 0,
    period = "",
  } = {}) {
    this.totalRevenue = totalRevenue;
    this.totalOrders = totalOrders;
    this.totalUsers = totalUsers;
    this.avgOrderValue =
      avgOrderValue || (totalOrders > 0 ? totalRevenue / totalOrders : 0);
    this.topPackage = topPackage; // {id, name, revenue}
    this.topPT = topPT; // {id, name, revenue}
    this.growthRate = growthRate; // % tăng trưởng
    this.period = period; // "2025-12" hoặc "2025-Q4"
  }

  /**
   * Format total revenue
   */
  getFormattedTotalRevenue() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.totalRevenue);
  }

  /**
   * Format average order value
   */
  getFormattedAvgOrderValue() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.avgOrderValue);
  }

  /**
   * Get growth indicator
   */
  getGrowthIndicator() {
    if (this.growthRate > 0) return "↑";
    if (this.growthRate < 0) return "↓";
    return "→";
  }

  /**
   * Get growth status
   */
  getGrowthStatus() {
    if (this.growthRate > 10) return "excellent";
    if (this.growthRate > 0) return "good";
    if (this.growthRate === 0) return "stable";
    return "declining";
  }

  /**
   * Get KPIs
   */
  getKPIs() {
    return {
      totalRevenue: this.totalRevenue,
      totalOrders: this.totalOrders,
      totalUsers: this.totalUsers,
      avgOrderValue: this.avgOrderValue,
      revenuePerUser:
        this.totalUsers > 0 ? this.totalRevenue / this.totalUsers : 0,
      orderRate:
        this.totalUsers > 0
          ? (this.totalOrders / this.totalUsers).toFixed(2)
          : 0,
      growthRate: this.growthRate,
    };
  }

  toJSON() {
    return {
      totalRevenue: this.totalRevenue,
      totalOrders: this.totalOrders,
      totalUsers: this.totalUsers,
      avgOrderValue: this.avgOrderValue,
      topPackage: this.topPackage,
      topPT: this.topPT,
      growthRate: this.growthRate,
      period: this.period,
    };
  }
}

/**
 * Weekly Revenue Model
 * Doanh thu theo tuần
 */
export class WeeklyRevenue {
  constructor({ week, weekNumber, year, revenue, orders } = {}) {
    this.week = week; // "2025-W48"
    this.weekNumber = weekNumber || 0; // 48
    this.year = year || new Date().getFullYear();
    this.revenue = revenue || 0;
    this.orders = orders || 0;
  }

  /**
   * Get week label
   */
  getWeekLabel() {
    return `Tuần ${this.weekNumber}/${this.year}`;
  }

  /**
   * Format revenue
   */
  getFormattedRevenue() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.revenue);
  }

  toJSON() {
    return {
      week: this.week,
      weekNumber: this.weekNumber,
      year: this.year,
      revenue: this.revenue,
      orders: this.orders,
    };
  }
}

/**
 * Quarterly Revenue Model
 * Doanh thu theo quý
 */
export class QuarterlyRevenue {
  constructor({ quarter, year, revenue, orders, months } = {}) {
    this.quarter = quarter; // "Q1", "Q2", "Q3", "Q4"
    this.year = year || new Date().getFullYear();
    this.revenue = revenue || 0;
    this.orders = orders || 0;
    this.months = months || []; // [1, 2, 3] for Q1
  }

  /**
   * Get quarter label
   */
  getQuarterLabel() {
    return `${this.quarter}/${this.year}`;
  }

  /**
   * Get quarter name
   */
  getQuarterName() {
    const quarterNames = {
      Q1: "Quý 1 (Jan-Mar)",
      Q2: "Quý 2 (Apr-Jun)",
      Q3: "Quý 3 (Jul-Sep)",
      Q4: "Quý 4 (Oct-Dec)",
    };
    return quarterNames[this.quarter] || this.quarter;
  }

  /**
   * Format revenue
   */
  getFormattedRevenue() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.revenue);
  }

  toJSON() {
    return {
      quarter: this.quarter,
      year: this.year,
      revenue: this.revenue,
      orders: this.orders,
      months: this.months,
    };
  }
}

/**
 * Yearly Revenue Model
 * Doanh thu theo năm
 */
export class YearlyRevenue {
  constructor({ year, revenue, orders, avgMonthlyRevenue } = {}) {
    this.year = year || new Date().getFullYear();
    this.revenue = revenue || 0;
    this.orders = orders || 0;
    this.avgMonthlyRevenue = avgMonthlyRevenue || revenue / 12;
  }

  /**
   * Format revenue
   */
  getFormattedRevenue() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.revenue);
  }

  /**
   * Format average monthly revenue
   */
  getFormattedAvgMonthlyRevenue() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.avgMonthlyRevenue);
  }

  toJSON() {
    return {
      year: this.year,
      revenue: this.revenue,
      orders: this.orders,
      avgMonthlyRevenue: this.avgMonthlyRevenue,
    };
  }
}

/**
 * Revenue Comparison Model
 * So sánh doanh thu giữa 2 kỳ
 */
export class RevenueComparison {
  constructor({ period1, period2, revenue1, revenue2 } = {}) {
    this.period1 = period1; // Summary của period 1
    this.period2 = period2; // Summary của period 2
    this.revenue1 = revenue1 || 0;
    this.revenue2 = revenue2 || 0;
  }

  /**
   * Get revenue difference
   */
  get revenueDiff() {
    return this.revenue1 - this.revenue2;
  }

  /**
   * Get revenue growth percentage
   */
  get revenueGrowth() {
    return this.revenue2 > 0
      ? ((this.revenueDiff / this.revenue2) * 100).toFixed(2)
      : 0;
  }

  /**
   * Is growing?
   */
  get isGrowing() {
    return this.revenueDiff > 0;
  }

  /**
   * Format difference
   */
  getFormattedDiff() {
    const formatted = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Math.abs(this.revenueDiff));

    return this.revenueDiff >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  toJSON() {
    return {
      period1: this.period1,
      period2: this.period2,
      revenue1: this.revenue1,
      revenue2: this.revenue2,
      revenueDiff: this.revenueDiff,
      revenueGrowth: this.revenueGrowth,
      isGrowing: this.isGrowing,
    };
  }
}
