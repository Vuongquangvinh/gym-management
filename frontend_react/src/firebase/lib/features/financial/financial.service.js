import { RevenueService } from "../revenue/revenue.service.js";
import { ExpenseService } from "../expense/expense.service.js";
import SalaryService from "../../../../services/salary.service.js";
import { BudgetService } from "../budget/budget.service.js";

/**
 * 💼 Financial Service
 * Service tổng hợp tài chính: THU - CHI = LỢI NHUẬN
 */
export class FinancialService {
  /**
   * Get comprehensive financial report for a month
   */
  static async getMonthlyFinancialReport(year, month) {
    try {
      console.log(`📊 Generating financial report for ${month}/${year}...`);

      // Get revenue summary
      const revenueSummary = await RevenueService.getMonthlyRevenueSummary(
        year,
        month
      );

      // Get expense summary
      const expenseSummary = await ExpenseService.getMonthlyExpenseSummary(
        year,
        month
      );

      // Get payroll summary
      const payrollSummary = await SalaryService.getPayrollSummary(year, month);

      // Calculate profit/loss
      const totalRevenue = revenueSummary.totalRevenue;
      let totalExpenses = expenseSummary.totalExpenses;

      // Note: Chi phí vận hành phải được nhập từ trang "Quản lý Chi phí Vận hành"
      // Không nên ước tính tự động vì dễ gây sai lệch
      if (totalExpenses === 0 && totalRevenue > 0) {
        console.warn(
          `⚠️ Không có chi phí vận hành được ghi nhận cho tháng ${month}/${year}. Vui lòng thêm chi phí tại trang "Quản lý Chi phí Vận hành"`
        );
      }

      const totalSalary = payrollSummary.totals.netSalary;
      const totalCosts = totalExpenses + totalSalary;
      const netProfit = totalRevenue - totalCosts;

      // Calculate margins
      const grossProfit = totalRevenue - totalExpenses; // Không tính lương
      // Gross Margin: % còn lại sau chi phí vận hành = (Doanh thu - Chi phí VH) / Doanh thu
      const grossMargin =
        totalRevenue > 0
          ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
          : 0;
      // Net Margin: % lợi nhuận thực tế = (Lợi nhuận ròng) / Doanh thu
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // ROI calculation: Lợi nhuận ròng / Tổng chi phí
      const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

      return {
        period: {
          year,
          month,
          label: `Tháng ${month}/${year}`,
        },

        // Revenue (THU)
        revenue: {
          total: totalRevenue,
          byPackage: revenueSummary.byPackage,
          byPT: revenueSummary.byPT,
          orderCount: revenueSummary.orderCount,
        },

        // Expenses (CHI)
        expenses: {
          total: totalExpenses,
          byType: expenseSummary.byType,
          byCategory: expenseSummary.byCategory,
          expenseCount: expenseSummary.expenseCount,
        },

        // Salary (CHI LƯƠNG)
        salary: {
          total: totalSalary,
          employeeCount: payrollSummary.totalEmployees,
          breakdown: payrollSummary.breakdown,
          totals: payrollSummary.totals,
        },

        // Profit/Loss (LỢI NHUẬN)
        profitLoss: {
          grossProfit: grossProfit, // Lợi nhuận gộp (chưa trừ lương)
          totalCosts: totalCosts, // Tổng chi phí (bao gồm lương)
          netProfit: netProfit, // Lợi nhuận ròng
          grossMargin: grossMargin, // Biên lợi nhuận gộp (%)
          netMargin: netMargin, // Biên lợi nhuận ròng (%)
          roi: roi, // Tỷ suất lợi nhuận (%)
          status:
            netProfit > 0 ? "profit" : netProfit < 0 ? "loss" : "breakeven",
        },

        // Breakdown
        breakdown: {
          totalRevenue: totalRevenue,
          totalExpenses: totalExpenses,
          totalSalary: totalSalary,
          totalCosts: totalCosts,
          netProfit: netProfit,
        },
      };
    } catch (error) {
      console.error("❌ Get monthly financial report error:", error);
      throw error;
    }
  }

  /**
   * Get quarterly financial report
   */
  static async getQuarterlyFinancialReport(year, quarter) {
    try {
      console.log(`📊 Generating quarterly report for Q${quarter}/${year}...`);

      // Get revenue for quarter
      const revenueData = await RevenueService.getRevenueByQuarter(
        year,
        quarter
      );
      const totalRevenue = revenueData.totalRevenue;

      // Get expenses for quarter
      const expenses = await ExpenseService.getExpensesByQuarter(year, quarter);
      const totalExpenses = ExpenseService.calculateTotalExpenses(expenses);

      // Get salary for all 3 months
      const startMonth = (quarter - 1) * 3 + 1;
      let totalSalary = 0;
      const monthlyPayrolls = [];

      for (let i = 0; i < 3; i++) {
        const month = startMonth + i;
        try {
          const payroll = await SalaryService.getPayrollSummary(year, month);
          totalSalary += payroll.totals.netSalary;
          monthlyPayrolls.push(payroll);
        } catch (error) {
          console.warn(`No payroll data for ${month}/${year}`);
        }
      }

      // Calculate profit/loss
      const totalCosts = totalExpenses + totalSalary;
      const netProfit = totalRevenue - totalCosts;
      const grossProfit = totalRevenue - totalExpenses;
      const grossMargin =
        totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

      return {
        period: {
          year,
          quarter,
          label: `Quý ${quarter}/${year}`,
        },
        revenue: {
          total: totalRevenue,
        },
        expenses: {
          total: totalExpenses,
        },
        salary: {
          total: totalSalary,
          monthlyBreakdown: monthlyPayrolls,
        },
        profitLoss: {
          grossProfit,
          totalCosts,
          netProfit,
          grossMargin,
          netMargin,
          roi,
          status:
            netProfit > 0 ? "profit" : netProfit < 0 ? "loss" : "breakeven",
        },
        breakdown: {
          totalRevenue,
          totalExpenses,
          totalSalary,
          totalCosts,
          netProfit,
        },
      };
    } catch (error) {
      console.error("❌ Get quarterly financial report error:", error);
      throw error;
    }
  }

  /**
   * Get yearly financial report
   */
  static async getYearlyFinancialReport(year) {
    try {
      console.log(`📊 Generating yearly report for ${year}...`);

      // Get revenue for year
      const revenueData = await RevenueService.getRevenueByYear(year);
      const totalRevenue = revenueData.totalRevenue;

      // Get expenses for year
      const expenses = await ExpenseService.getExpensesByYear(year);
      const totalExpenses = ExpenseService.calculateTotalExpenses(expenses);

      // Get salary for all 12 months
      let totalSalary = 0;
      const monthlyPayrolls = [];

      for (let month = 1; month <= 12; month++) {
        try {
          const payroll = await SalaryService.getPayrollSummary(year, month);
          totalSalary += payroll.totals.netSalary;
          monthlyPayrolls.push(payroll);
        } catch (error) {
          console.warn(`No payroll data for ${month}/${year}`);
        }
      }

      // Calculate profit/loss
      const totalCosts = totalExpenses + totalSalary;
      const netProfit = totalRevenue - totalCosts;
      const grossProfit = totalRevenue - totalExpenses;
      const grossMargin =
        totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

      return {
        period: {
          year,
          label: `Năm ${year}`,
        },
        revenue: {
          total: totalRevenue,
        },
        expenses: {
          total: totalExpenses,
        },
        salary: {
          total: totalSalary,
          monthlyBreakdown: monthlyPayrolls,
        },
        profitLoss: {
          grossProfit,
          totalCosts,
          netProfit,
          grossMargin,
          netMargin,
          roi,
          status:
            netProfit > 0 ? "profit" : netProfit < 0 ? "loss" : "breakeven",
        },
        breakdown: {
          totalRevenue,
          totalExpenses,
          totalSalary,
          totalCosts,
          netProfit,
        },
      };
    } catch (error) {
      console.error("❌ Get yearly financial report error:", error);
      throw error;
    }
  }

  /**
   * Compare financial performance between two periods
   */
  static async compareFinancialPeriods(period1, period2) {
    try {
      let report1, report2;

      // Get reports based on period type
      if (period1.type === "monthly") {
        report1 = await FinancialService.getMonthlyFinancialReport(
          period1.year,
          period1.month
        );
        report2 = await FinancialService.getMonthlyFinancialReport(
          period2.year,
          period2.month
        );
      } else if (period1.type === "quarterly") {
        report1 = await FinancialService.getQuarterlyFinancialReport(
          period1.year,
          period1.quarter
        );
        report2 = await FinancialService.getQuarterlyFinancialReport(
          period2.year,
          period2.quarter
        );
      } else {
        report1 = await FinancialService.getYearlyFinancialReport(period1.year);
        report2 = await FinancialService.getYearlyFinancialReport(period2.year);
      }

      // Calculate differences
      const revenueDiff = report2.revenue.total - report1.revenue.total;
      const expensesDiff = report2.expenses.total - report1.expenses.total;
      const salaryDiff = report2.salary.total - report1.salary.total;
      const profitDiff =
        report2.profitLoss.netProfit - report1.profitLoss.netProfit;

      // Calculate percent changes
      const revenueChange =
        report1.revenue.total > 0
          ? (revenueDiff / report1.revenue.total) * 100
          : 0;
      const expensesChange =
        report1.expenses.total > 0
          ? (expensesDiff / report1.expenses.total) * 100
          : 0;
      const salaryChange =
        report1.salary.total > 0
          ? (salaryDiff / report1.salary.total) * 100
          : 0;
      const profitChange =
        report1.profitLoss.netProfit !== 0
          ? (profitDiff / Math.abs(report1.profitLoss.netProfit)) * 100
          : 0;

      return {
        period1: report1,
        period2: report2,
        comparison: {
          revenue: {
            diff: revenueDiff,
            percentChange: revenueChange,
            trend:
              revenueDiff > 0
                ? "increase"
                : revenueDiff < 0
                ? "decrease"
                : "stable",
          },
          expenses: {
            diff: expensesDiff,
            percentChange: expensesChange,
            trend:
              expensesDiff > 0
                ? "increase"
                : expensesDiff < 0
                ? "decrease"
                : "stable",
          },
          salary: {
            diff: salaryDiff,
            percentChange: salaryChange,
            trend:
              salaryDiff > 0
                ? "increase"
                : salaryDiff < 0
                ? "decrease"
                : "stable",
          },
          profit: {
            diff: profitDiff,
            percentChange: profitChange,
            trend:
              profitDiff > 0
                ? "increase"
                : profitDiff < 0
                ? "decrease"
                : "stable",
          },
        },
      };
    } catch (error) {
      console.error("❌ Compare financial periods error:", error);
      throw error;
    }
  }

  /**
   * Get break-even analysis
   */
  static async getBreakEvenAnalysis(year, month) {
    try {
      const report = await FinancialService.getMonthlyFinancialReport(
        year,
        month
      );

      // Fixed costs (rent, salaries, etc.)
      const fixedCosts = report.expenses.total + report.salary.total;

      // Variable costs (assuming 0 for simplicity, adjust based on business model)
      const variableCosts = 0;

      // Current revenue
      const currentRevenue = report.revenue.total;

      // Break-even revenue (revenue needed to cover all costs)
      const breakEvenRevenue = fixedCosts + variableCosts;

      // Revenue gap
      const revenueGap = breakEvenRevenue - currentRevenue;

      // Days to break-even (assuming 30 days in month)
      const dailyRevenue = currentRevenue / 30;
      const daysToBreakEven =
        dailyRevenue > 0 ? Math.ceil(revenueGap / dailyRevenue) : null;

      return {
        period: report.period,
        currentRevenue: currentRevenue,
        fixedCosts: fixedCosts,
        variableCosts: variableCosts,
        breakEvenRevenue: breakEvenRevenue,
        revenueGap: revenueGap,
        status:
          currentRevenue >= breakEvenRevenue
            ? "above_breakeven"
            : "below_breakeven",
        daysToBreakEven: daysToBreakEven,
        breakEvenMargin:
          currentRevenue > 0
            ? ((currentRevenue - breakEvenRevenue) / currentRevenue) * 100
            : 0,
      };
    } catch (error) {
      console.error("❌ Get break-even analysis error:", error);
      throw error;
    }
  }

  /**
   * Get cash flow analysis
   */
  static async getCashFlowAnalysis(year, month) {
    try {
      const report = await FinancialService.getMonthlyFinancialReport(
        year,
        month
      );

      // Cash inflow
      const cashInflow = report.revenue.total;

      // Cash outflow
      const cashOutflow = report.breakdown.totalCosts;

      // Net cash flow
      const netCashFlow = cashInflow - cashOutflow;

      // Categorize cash flows
      const operatingCashFlow = {
        inflow: report.revenue.total,
        outflow: report.expenses.total + report.salary.total,
        net:
          report.revenue.total - (report.expenses.total + report.salary.total),
      };

      return {
        period: report.period,
        cashInflow: cashInflow,
        cashOutflow: cashOutflow,
        netCashFlow: netCashFlow,
        operatingCashFlow: operatingCashFlow,
        cashFlowRatio: cashInflow > 0 ? (netCashFlow / cashInflow) * 100 : 0,
        status:
          netCashFlow > 0
            ? "positive"
            : netCashFlow < 0
            ? "negative"
            : "neutral",
      };
    } catch (error) {
      console.error("❌ Get cash flow analysis error:", error);
      throw error;
    }
  }

  /**
   * Get financial KPIs
   */
  static async getFinancialKPIs(year, month) {
    try {
      const report = await FinancialService.getMonthlyFinancialReport(
        year,
        month
      );

      return {
        period: report.period,
        kpis: {
          // Profitability
          grossMargin: report.profitLoss.grossMargin,
          netMargin: report.profitLoss.netMargin,
          roi: report.profitLoss.roi,

          // Efficiency
          revenuePerOrder:
            report.revenue.orderCount > 0
              ? report.revenue.total / report.revenue.orderCount
              : 0,
          revenuePerEmployee:
            report.salary.employeeCount > 0
              ? report.revenue.total / report.salary.employeeCount
              : 0,

          // Cost structure
          expenseRatio:
            report.revenue.total > 0
              ? (report.expenses.total / report.revenue.total) * 100
              : 0,
          salaryRatio:
            report.revenue.total > 0
              ? (report.salary.total / report.revenue.total) * 100
              : 0,
          costRatio:
            report.revenue.total > 0
              ? (report.breakdown.totalCosts / report.revenue.total) * 100
              : 0,
        },
      };
    } catch (error) {
      console.error("❌ Get financial KPIs error:", error);
      throw error;
    }
  }

  /**
   * Get financial trend analysis (last N months)
   */
  static async getFinancialTrends(year, month, monthsBack = 6) {
    try {
      const trends = [];

      for (let i = monthsBack - 1; i >= 0; i--) {
        let targetMonth = month - i;
        let targetYear = year;

        while (targetMonth <= 0) {
          targetMonth += 12;
          targetYear -= 1;
        }

        try {
          const report = await FinancialService.getMonthlyFinancialReport(
            targetYear,
            targetMonth
          );

          trends.push({
            year: targetYear,
            month: targetMonth,
            label: `${targetMonth}/${targetYear}`,
            revenue: report.revenue.total,
            expenses: report.expenses.total,
            salary: report.salary.total,
            costs: report.breakdown.totalCosts,
            profit: report.profitLoss.netProfit,
            margin: report.profitLoss.netMargin,
          });
        } catch (error) {
          console.warn(`No data for ${targetMonth}/${targetYear}`);
        }
      }

      // Calculate averages
      const avgRevenue =
        trends.reduce((sum, t) => sum + t.revenue, 0) / trends.length;
      const avgExpenses =
        trends.reduce((sum, t) => sum + t.expenses, 0) / trends.length;
      const avgProfit =
        trends.reduce((sum, t) => sum + t.profit, 0) / trends.length;

      return {
        period: {
          from: trends[0]?.label,
          to: trends[trends.length - 1]?.label,
        },
        trends: trends,
        averages: {
          revenue: avgRevenue,
          expenses: avgExpenses,
          profit: avgProfit,
        },
      };
    } catch (error) {
      console.error("❌ Get financial trends error:", error);
      throw error;
    }
  }

  /**
   * Export financial report to CSV
   */
  static exportFinancialReportToCSV(report) {
    const lines = [];

    lines.push(`Báo cáo tài chính - ${report.period.label}`);
    lines.push("");

    // Revenue section
    lines.push("THU NHẬP");
    lines.push(`Tổng doanh thu,${report.revenue.total}`);
    lines.push(`Số đơn hàng,${report.revenue.orderCount}`);
    lines.push("");

    // Expenses section
    lines.push("CHI PHÍ");
    lines.push(`Chi phí vận hành,${report.expenses.total}`);
    lines.push(`Chi phí lương,${report.salary.total}`);
    lines.push(`Tổng chi phí,${report.breakdown.totalCosts}`);
    lines.push("");

    // Profit/Loss section
    lines.push("LỢI NHUẬN");
    lines.push(`Lợi nhuận gộp,${report.profitLoss.grossProfit}`);
    lines.push(`Lợi nhuận ròng,${report.profitLoss.netProfit}`);
    lines.push(
      `Biên lợi nhuận gộp,${report.profitLoss.grossMargin.toFixed(2)}%`
    );
    lines.push(
      `Biên lợi nhuận ròng,${report.profitLoss.netMargin.toFixed(2)}%`
    );
    lines.push(`ROI,${report.profitLoss.roi.toFixed(2)}%`);

    return lines.join("\n");
  }
}
