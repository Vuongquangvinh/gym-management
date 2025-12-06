import SalaryRecordModel from "../firebase/lib/features/salary/salaryRecord.model.js";
import { SalaryConfigModel } from "../firebase/lib/features/salary/salary-config.model.js";
import EmployeeModel from "../firebase/lib/features/employee/employee.model.js";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/lib/config/firebase.js";

/**
 * SalaryService - Logic tính lương và quản lý bảng lương
 */
export class SalaryService {
  /**
   * Lấy cấu hình lương cho nhân viên từ employee.salary
   * Tạm thời không dùng salary_configs collection
   */
  static async getSalaryConfigForEmployee(employee) {
    try {
      // Dùng trực tiếp thông tin từ employee
      return {
        baseSalary: employee.salary || 0,
        salaryType: "MONTHLY",
        allowances: {
          housing: 0,
          transport: 0,
          meal: 0,
          phone: 0,
        },
        deductions: {
          insurance: 0,
          tax: 0,
        },
      };
    } catch (error) {
      console.error("Error getting salary config:", error);
      throw error;
    }
  }

  /**
   * Tạo bảng lương cho 1 nhân viên trong tháng
   */
  static async generateSalaryRecordForEmployee(
    employeeId,
    month,
    year,
    overrides = {}
  ) {
    try {
      // Lấy thông tin nhân viên
      const employee = await EmployeeModel.getById(employeeId);

      if (employee.status !== "active") {
        throw new Error("Nhân viên không ở trạng thái active");
      }

      // Lấy cấu hình lương
      const config = await this.getSalaryConfigForEmployee(employee);

      // Tạo salary record
      const salaryRecord = new SalaryRecordModel({
        employeeId: employee._id,
        employeeName: employee.fullName,
        position: employee.position,
        month,
        year,

        baseSalary: config.baseSalary || employee.salary,
        salaryType: config.salaryType || "MONTHLY",

        allowances: config.allowances || {
          housing: 0,
          transport: 0,
          meal: 0,
          phone: 0,
          other: 0,
        },

        deductions: config.deductions || {
          insurance: 0,
          tax: 0,
          advance: 0,
          other: 0,
        },

        standardWorkDays: 26,
        actualWorkDays: 26, // Mặc định full công
        absentDays: 0,
        lateDays: 0,

        overtimeHours: 0,
        overtimeRate: 1.5,

        bonuses: 0,
        penalties: 0,

        commission: 0,
        commissionRate: employee.commissionRate || 0,

        status: "PENDING",

        // Override với các giá trị tùy chỉnh
        ...overrides,
      });

      // Tính toán và lưu
      await salaryRecord.save();

      return salaryRecord;
    } catch (error) {
      console.error("Error generating salary record:", error);
      throw error;
    }
  }

  /**
   * Tạo bảng lương cho TẤT CẢ nhân viên active trong tháng
   */
  static async generateMonthlySalaryRecords(month, year) {
    try {
      console.log(`📊 Generating salary records for ${month}/${year}...`);

      // Lấy tất cả nhân viên active
      const { employees } = await EmployeeModel.getAll(
        { status: "active" },
        1000
      );

      console.log(`👥 Found ${employees.length} active employees`);

      const results = {
        success: [],
        failed: [],
        skipped: [],
      };

      for (const employee of employees) {
        try {
          // Kiểm tra xem đã có bảng lương chưa
          const existingRecords = await SalaryRecordModel.getByMonthYear(
            month,
            year
          );
          const exists = existingRecords.some(
            (r) => r.employeeId === employee._id
          );

          if (exists) {
            results.skipped.push({
              employeeId: employee._id,
              name: employee.fullName,
              reason: "Bảng lương đã tồn tại",
            });
            continue;
          }

          // Tạo salary record
          const record = await this.generateSalaryRecordForEmployee(
            employee._id,
            month,
            year
          );

          results.success.push({
            employeeId: employee._id,
            name: employee.fullName,
            recordId: record._id,
          });

          console.log(`✅ Created salary for ${employee.fullName}`);
        } catch (error) {
          results.failed.push({
            employeeId: employee._id,
            name: employee.fullName,
            error: error.message,
          });

          console.error(`❌ Failed for ${employee.fullName}:`, error.message);
        }
      }

      console.log(`\n📊 Summary:
        ✅ Success: ${results.success.length}
        ⏭️  Skipped: ${results.skipped.length}
        ❌ Failed: ${results.failed.length}
      `);

      return results;
    } catch (error) {
      console.error("Error generating monthly salary records:", error);
      throw error;
    }
  }

  /**
   * Tính hoa hồng cho PT từ doanh thu
   */
  static async calculatePTCommission(employeeId, month, year) {
    try {
      const employee = await EmployeeModel.getById(employeeId);

      if (employee.position !== "PT" || employee.commissionRate === 0) {
        return 0;
      }

      // Lấy tất cả payment_orders của PT trong tháng
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const q = query(
        collection(db, "payment_orders"),
        where("ptId", "==", employeeId),
        where("status", "==", "PAID"),
        where("paidDate", ">=", startDate),
        where("paidDate", "<=", endDate)
      );

      const snapshot = await getDocs(q);

      let totalRevenue = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        totalRevenue += data.amount || 0;
      });

      const commission = (totalRevenue * employee.commissionRate) / 100;

      console.log(
        `💰 PT ${employee.fullName} commission: ${commission.toLocaleString(
          "vi-VN"
        )} VND from ${totalRevenue.toLocaleString("vi-VN")} VND revenue (${
          employee.commissionRate
        }%)`
      );

      return commission;
    } catch (error) {
      console.error("Error calculating PT commission:", error);
      return 0;
    }
  }

  /**
   * Lấy báo cáo lương tháng
   */
  static async getMonthlySalaryReport(month, year) {
    try {
      const records = await SalaryRecordModel.getByMonthYear(month, year);

      const report = {
        month,
        year,
        totalEmployees: records.length,
        totalGrossSalary: 0,
        totalNetSalary: 0,
        totalAllowances: 0,
        totalDeductions: 0,
        totalOvertimePay: 0,
        totalBonuses: 0,
        totalPenalties: 0,
        totalCommission: 0,
        byStatus: {
          PENDING: 0,
          APPROVED: 0,
          PAID: 0,
        },
        byPosition: {},
        records: [],
      };

      records.forEach((record) => {
        report.totalGrossSalary += record.grossSalary;
        report.totalNetSalary += record.netSalary;

        const allowances = Object.values(record.allowances).reduce(
          (sum, val) => sum + (val || 0),
          0
        );
        const deductions = Object.values(record.deductions).reduce(
          (sum, val) => sum + (val || 0),
          0
        );

        report.totalAllowances += allowances;
        report.totalDeductions += deductions;
        report.totalOvertimePay += record.overtimePay;
        report.totalBonuses += record.bonuses;
        report.totalPenalties += record.penalties;
        report.totalCommission += record.commission;

        report.byStatus[record.status] =
          (report.byStatus[record.status] || 0) + 1;

        if (!report.byPosition[record.position]) {
          report.byPosition[record.position] = {
            count: 0,
            totalSalary: 0,
          };
        }
        report.byPosition[record.position].count += 1;
        report.byPosition[record.position].totalSalary += record.netSalary;

        report.records.push({
          id: record._id,
          employeeId: record.employeeId,
          employeeName: record.employeeName,
          position: record.position,
          grossSalary: record.grossSalary,
          netSalary: record.netSalary,
          status: record.status,
        });
      });

      return report;
    } catch (error) {
      console.error("Error getting monthly salary report:", error);
      throw error;
    }
  }

  /**
   * Tính tổng chi phí lương cho Financial Dashboard
   */
  static async getTotalSalaryExpense(month, year) {
    try {
      const records = await SalaryRecordModel.getByMonthYear(month, year);

      // Chỉ tính những bảng lương đã PAID
      const paidRecords = records.filter((r) => r.status === "PAID");

      const total = paidRecords.reduce(
        (sum, record) => sum + record.netSalary,
        0
      );

      return total;
    } catch (error) {
      console.error("Error getting total salary expense:", error);
      return 0;
    }
  }

  /**
   * Cập nhật hoa hồng cho tất cả PT trong tháng
   */
  static async updatePTCommissionsForMonth(month, year) {
    try {
      const records = await SalaryRecordModel.getByMonthYear(month, year);
      const ptRecords = records.filter((r) => r.position === "PT");

      console.log(`💰 Updating commissions for ${ptRecords.length} PTs...`);

      for (const record of ptRecords) {
        const commission = await this.calculatePTCommission(
          record.employeeId,
          month,
          year
        );

        if (commission > 0) {
          record.commission = commission;
          await record.save();
          console.log(
            `✅ Updated commission for ${
              record.employeeName
            }: ${commission.toLocaleString("vi-VN")} VND`
          );
        }
      }

      console.log(`✅ Commission update completed`);
    } catch (error) {
      console.error("Error updating PT commissions:", error);
      throw error;
    }
  }

  /**
   * Lấy tổng hợp bảng lương tháng cho Financial Dashboard
   */
  static async getPayrollSummary(year, month) {
    try {
      console.log(`💰 getPayrollSummary called for ${month}/${year}`);
      const records = await SalaryRecordModel.getByMonthYear(month, year);
      console.log(`📊 Found ${records.length} salary records:`, records);

      const summary = {
        totalEmployees: records.length,
        breakdown: {
          byStatus: {
            PENDING: records.filter((r) => r.status === "PENDING").length,
            APPROVED: records.filter((r) => r.status === "APPROVED").length,
            PAID: records.filter((r) => r.status === "PAID").length,
          },
          byPosition: {},
        },
        totals: {
          baseSalary: 0,
          allowances: 0,
          deductions: 0,
          overtimePay: 0,
          bonuses: 0,
          penalties: 0,
          commission: 0,
          grossSalary: 0,
          netSalary: 0,
        },
      };

      records.forEach((record) => {
        // Tính tổng các khoản
        const allowances = Object.values(record.allowances || {}).reduce(
          (sum, val) => sum + (val || 0),
          0
        );
        const deductions = Object.values(record.deductions || {}).reduce(
          (sum, val) => sum + (val || 0),
          0
        );

        summary.totals.baseSalary += record.baseSalary || 0;
        summary.totals.allowances += allowances;
        summary.totals.deductions += deductions;
        summary.totals.overtimePay += record.overtimePay || 0;
        summary.totals.bonuses += record.bonuses || 0;
        summary.totals.penalties += record.penalties || 0;
        summary.totals.commission += record.commission || 0;
        summary.totals.grossSalary += record.grossSalary || 0;
        summary.totals.netSalary += record.netSalary || 0;

        // Phân nhóm theo position
        const position = record.position || "Unknown";
        if (!summary.breakdown.byPosition[position]) {
          summary.breakdown.byPosition[position] = {
            count: 0,
            totalSalary: 0,
          };
        }
        summary.breakdown.byPosition[position].count += 1;
        summary.breakdown.byPosition[position].totalSalary +=
          record.netSalary || 0;
      });

      console.log(`✅ Payroll summary calculated:`, summary);
      return summary;
    } catch (error) {
      console.error("Error getting payroll summary:", error);
      return {
        totalEmployees: 0,
        breakdown: {
          byStatus: { PENDING: 0, APPROVED: 0, PAID: 0 },
          byPosition: {},
        },
        totals: {
          baseSalary: 0,
          allowances: 0,
          deductions: 0,
          overtimePay: 0,
          bonuses: 0,
          penalties: 0,
          commission: 0,
          grossSalary: 0,
          netSalary: 0,
        },
      };
    }
  }
}

export default SalaryService;
