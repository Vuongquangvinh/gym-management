import { SalaryConfigModel } from "./salary-config.model.js";
import { ExpenseService } from "../expense/expense.service.js";
import {
  ExpenseModel,
  EXPENSE_TYPE,
  EXPENSE_CATEGORY,
} from "../expense/expense.model.js";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";

/**
 * 💰 Salary Service
 * Service xử lý tính lương và hoa hồng
 */
export class SalaryService {
  /**
   * Calculate salary for an employee for a specific period
   */
  static async calculateSalary(employeeId, year, month, options = {}) {
    try {
      const {
        workHours = null,
        overtimeHours = 0,
        bonuses = 0,
        penalties = 0,
      } = options;

      // Get salary config
      const config = await SalaryConfigModel.getByEmployeeId(employeeId);
      if (!config) {
        throw new Error(
          `No active salary config found for employee: ${employeeId}`
        );
      }

      // Calculate sales amount (for commission)
      let salesAmount = 0;
      if (config.hasCommission && config.employeeRole === "pt") {
        salesAmount = await SalaryService.calculatePTSalesAmount(
          employeeId,
          year,
          month
        );
      }

      // Calculate actual work hours if not provided
      const actualWorkHours =
        workHours !== null ? workHours : config.standardWorkHours;

      // Calculate net salary
      const netSalary = config.calculateNetSalary({
        workHours: actualWorkHours,
        overtimeHours,
        salesAmount,
        bonuses,
        penalties,
      });

      return {
        employeeId: config.employeeId,
        employeeName: config.employeeName,
        employeeRole: config.employeeRole,
        year,
        month,
        config: config,

        // Salary components
        baseSalary: config.baseSalary,
        allowances: config.totalAllowances,
        commission: config.calculateCommission(salesAmount),
        overtimePay: config.calculateOvertimePay(overtimeHours),
        bonuses: bonuses,

        // Deductions
        deductions: config.totalDeductions,
        penalties: penalties,
        insurance: config.calculateTotalInsurance(),
        tax:
          (config.baseSalary + config.totalAllowances) * (config.taxRate / 100),

        // Final
        grossSalary:
          config.baseSalary +
          config.totalAllowances +
          config.calculateCommission(salesAmount) +
          config.calculateOvertimePay(overtimeHours) +
          bonuses,
        netSalary: netSalary,

        // Work info
        workHours: actualWorkHours,
        standardWorkHours: config.standardWorkHours,
        overtimeHours: overtimeHours,

        // Sales info (for PT)
        salesAmount: salesAmount,
      };
    } catch (error) {
      console.error("❌ Calculate salary error:", error);
      throw error;
    }
  }

  /**
   * Calculate PT sales amount from payment orders
   */
  static async calculatePTSalesAmount(employeeId, year, month) {
    try {
      // Import PaymentOrderModel to get PT revenue
      // For now, return 0 as placeholder
      // TODO: Integrate with PaymentOrderModel.getRevenueByPT()

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      // Query payment_orders for this PT trainer
      const q = query(
        collection(db, "payment_orders"),
        where("ptTrainerId", "==", employeeId),
        where("status", "==", "paid"),
        where("paidDate", ">=", Timestamp.fromDate(startOfMonth)),
        where("paidDate", "<=", Timestamp.fromDate(endOfMonth))
      );

      const snapshot = await getDocs(q);
      let totalSales = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        totalSales += data.amount || 0;
      });

      console.log(
        `✅ PT ${employeeId} sales for ${month}/${year}: ${totalSales}`
      );
      return totalSales;
    } catch (error) {
      console.error("❌ Calculate PT sales error:", error);
      return 0;
    }
  }

  /**
   * Process payroll for all employees
   */
  static async processPayroll(year, month, options = {}) {
    try {
      const configs = await SalaryConfigModel.getAll({ activeOnly: true });
      const results = [];

      for (const config of configs) {
        try {
          const salary = await SalaryService.calculateSalary(
            config.employeeId,
            year,
            month,
            options[config.employeeId] || {}
          );

          results.push({
            success: true,
            employeeId: config.employeeId,
            salary: salary,
          });
        } catch (error) {
          results.push({
            success: false,
            employeeId: config.employeeId,
            error: error.message,
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      console.log(
        `✅ Processed payroll: ${successCount}/${configs.length} employees`
      );

      return {
        year,
        month,
        totalEmployees: configs.length,
        successCount: successCount,
        failedCount: configs.length - successCount,
        results: results,
        totalPayroll: results
          .filter((r) => r.success)
          .reduce((sum, r) => sum + r.salary.netSalary, 0),
      };
    } catch (error) {
      console.error("❌ Process payroll error:", error);
      throw error;
    }
  }

  /**
   * Create salary expenses in expense system
   */
  static async createSalaryExpenses(year, month, payrollResults) {
    try {
      const expenses = [];

      for (const result of payrollResults.results) {
        if (!result.success) continue;

        const salary = result.salary;

        // Create expense for this salary
        const expense = await ExpenseService.createExpense({
          type: EXPENSE_TYPE.SALARY,
          category: EXPENSE_CATEGORY.HUMAN_RESOURCE,
          amount: salary.netSalary,
          description: `Lương tháng ${month}/${year} - ${salary.employeeName}`,
          expenseDate: new Date(year, month - 1, 25), // Ngày 25 hàng tháng
          dueDate: new Date(year, month - 1, 28), // Hạn thanh toán ngày 28
          vendorName: salary.employeeName,
          vendorContact: salary.employeeId,
          status: "pending",
          approvalStatus: "pending",
          notes: JSON.stringify({
            baseSalary: salary.baseSalary,
            allowances: salary.allowances,
            commission: salary.commission,
            overtimePay: salary.overtimePay,
            bonuses: salary.bonuses,
            deductions: salary.deductions,
            penalties: salary.penalties,
            insurance: salary.insurance,
            tax: salary.tax,
          }),
        });

        expenses.push(expense);
      }

      console.log(`✅ Created ${expenses.length} salary expenses`);
      return expenses;
    } catch (error) {
      console.error("❌ Create salary expenses error:", error);
      throw error;
    }
  }

  /**
   * Get payroll summary for a month
   */
  static async getPayrollSummary(year, month) {
    try {
      const payroll = await SalaryService.processPayroll(year, month);

      const salaryBreakdown = payroll.results
        .filter((r) => r.success)
        .map((r) => ({
          employeeId: r.salary.employeeId,
          employeeName: r.salary.employeeName,
          role: r.salary.employeeRole,
          baseSalary: r.salary.baseSalary,
          allowances: r.salary.allowances,
          commission: r.salary.commission,
          overtimePay: r.salary.overtimePay,
          bonuses: r.salary.bonuses,
          grossSalary: r.salary.grossSalary,
          deductions: r.salary.deductions,
          penalties: r.salary.penalties,
          insurance: r.salary.insurance,
          tax: r.salary.tax,
          netSalary: r.salary.netSalary,
        }));

      // Calculate totals
      const totals = salaryBreakdown.reduce(
        (acc, salary) => ({
          baseSalary: acc.baseSalary + salary.baseSalary,
          allowances: acc.allowances + salary.allowances,
          commission: acc.commission + salary.commission,
          overtimePay: acc.overtimePay + salary.overtimePay,
          bonuses: acc.bonuses + salary.bonuses,
          grossSalary: acc.grossSalary + salary.grossSalary,
          deductions: acc.deductions + salary.deductions,
          penalties: acc.penalties + salary.penalties,
          insurance: acc.insurance + salary.insurance,
          tax: acc.tax + salary.tax,
          netSalary: acc.netSalary + salary.netSalary,
        }),
        {
          baseSalary: 0,
          allowances: 0,
          commission: 0,
          overtimePay: 0,
          bonuses: 0,
          grossSalary: 0,
          deductions: 0,
          penalties: 0,
          insurance: 0,
          tax: 0,
          netSalary: 0,
        }
      );

      return {
        year,
        month,
        totalEmployees: payroll.totalEmployees,
        breakdown: salaryBreakdown,
        totals: totals,
      };
    } catch (error) {
      console.error("❌ Get payroll summary error:", error);
      throw error;
    }
  }

  /**
   * Get salary history for an employee
   */
  static async getSalaryHistory(
    employeeId,
    startYear,
    startMonth,
    endYear,
    endMonth
  ) {
    try {
      const history = [];

      let currentYear = startYear;
      let currentMonth = startMonth;

      while (
        currentYear < endYear ||
        (currentYear === endYear && currentMonth <= endMonth)
      ) {
        try {
          const salary = await SalaryService.calculateSalary(
            employeeId,
            currentYear,
            currentMonth
          );
          history.push(salary);
        } catch (error) {
          console.warn(`No salary data for ${currentMonth}/${currentYear}`);
        }

        // Move to next month
        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
      }

      console.log(`✅ Loaded ${history.length} months of salary history`);
      return history;
    } catch (error) {
      console.error("❌ Get salary history error:", error);
      throw error;
    }
  }

  /**
   * Compare salary between months
   */
  static async compareSalary(employeeId, year1, month1, year2, month2) {
    try {
      const salary1 = await SalaryService.calculateSalary(
        employeeId,
        year1,
        month1
      );
      const salary2 = await SalaryService.calculateSalary(
        employeeId,
        year2,
        month2
      );

      const difference = salary2.netSalary - salary1.netSalary;
      const percentChange =
        salary1.netSalary > 0 ? (difference / salary1.netSalary) * 100 : 0;

      return {
        employee: {
          id: employeeId,
          name: salary1.employeeName,
        },
        period1: {
          year: year1,
          month: month1,
          netSalary: salary1.netSalary,
        },
        period2: {
          year: year2,
          month: month2,
          netSalary: salary2.netSalary,
        },
        comparison: {
          difference: difference,
          percentChange: percentChange,
          trend:
            difference > 0
              ? "increase"
              : difference < 0
              ? "decrease"
              : "stable",
        },
      };
    } catch (error) {
      console.error("❌ Compare salary error:", error);
      throw error;
    }
  }

  /**
   * Get top earners for a month
   */
  static async getTopEarners(year, month, limit = 10) {
    try {
      const payroll = await SalaryService.processPayroll(year, month);

      const topEarners = payroll.results
        .filter((r) => r.success)
        .map((r) => ({
          employeeId: r.salary.employeeId,
          employeeName: r.salary.employeeName,
          employeeRole: r.salary.employeeRole,
          netSalary: r.salary.netSalary,
          commission: r.salary.commission,
          bonuses: r.salary.bonuses,
        }))
        .sort((a, b) => b.netSalary - a.netSalary)
        .slice(0, limit);

      return topEarners;
    } catch (error) {
      console.error("❌ Get top earners error:", error);
      throw error;
    }
  }

  /**
   * Get commission summary for PTs
   */
  static async getPTCommissionSummary(year, month) {
    try {
      const configs = await SalaryConfigModel.getAll({ activeOnly: true });
      const ptConfigs = configs.filter(
        (c) => c.employeeRole === "pt" && c.hasCommission
      );

      const commissions = [];

      for (const config of ptConfigs) {
        try {
          const salesAmount = await SalaryService.calculatePTSalesAmount(
            config.employeeId,
            year,
            month
          );
          const commission = config.calculateCommission(salesAmount);

          commissions.push({
            employeeId: config.employeeId,
            employeeName: config.employeeName,
            salesAmount: salesAmount,
            commission: commission,
            commissionRate: config.commissionRate,
          });
        } catch (error) {
          console.warn(`Error calculating commission for ${config.employeeId}`);
        }
      }

      // Sort by commission (highest first)
      commissions.sort((a, b) => b.commission - a.commission);

      const totalSales = commissions.reduce((sum, c) => sum + c.salesAmount, 0);
      const totalCommission = commissions.reduce(
        (sum, c) => sum + c.commission,
        0
      );

      return {
        year,
        month,
        totalPTs: commissions.length,
        totalSales: totalSales,
        totalCommission: totalCommission,
        commissions: commissions,
      };
    } catch (error) {
      console.error("❌ Get PT commission summary error:", error);
      throw error;
    }
  }

  /**
   * Export payroll to CSV
   */
  static exportPayrollToCSV(payrollSummary) {
    const headers = [
      "Mã NV",
      "Họ tên",
      "Chức vụ",
      "Lương cơ bản",
      "Phụ cấp",
      "Hoa hồng",
      "Làm thêm",
      "Thưởng",
      "Tổng lương",
      "Khấu trừ",
      "Phạt",
      "Bảo hiểm",
      "Thuế",
      "Thực nhận",
    ].join(",");

    const rows = payrollSummary.breakdown.map((salary) =>
      [
        salary.employeeId,
        salary.employeeName,
        salary.role,
        salary.baseSalary,
        salary.allowances,
        salary.commission,
        salary.overtimePay,
        salary.bonuses,
        salary.grossSalary,
        salary.deductions,
        salary.penalties,
        salary.insurance,
        salary.tax,
        salary.netSalary,
      ].join(",")
    );

    // Add totals row
    const totals = payrollSummary.totals;
    const totalsRow = [
      "",
      "TỔNG CỘNG",
      "",
      totals.baseSalary,
      totals.allowances,
      totals.commission,
      totals.overtimePay,
      totals.bonuses,
      totals.grossSalary,
      totals.deductions,
      totals.penalties,
      totals.insurance,
      totals.tax,
      totals.netSalary,
    ].join(",");

    return [headers, ...rows, totalsRow].join("\n");
  }
}
