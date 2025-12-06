import { ExpenseModel } from "./expense.model.js";
import { ExpenseCategoryModel } from "./expense-category.model.js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  startAt,
  endAt,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";

/**
 * 💼 Expense Service
 * Service xử lý logic nghiệp vụ cho chi phí
 */
export class ExpenseService {
  /**
   * Create a new expense
   */
  static async createExpense(expenseData) {
    try {
      // Get category to check approval requirements
      if (expenseData.categoryId) {
        const category = await ExpenseCategoryModel.getById(
          expenseData.categoryId
        );
        if (category) {
          // Auto-set approval status based on category rules
          if (category.requiresApprovalForAmount(expenseData.amount)) {
            expenseData.approvalStatus = "pending";
          } else {
            expenseData.approvalStatus = "approved";
          }

          // Check budget limits
          if (category.exceedsBudget(expenseData.amount, "monthly")) {
            console.warn("⚠️ Expense exceeds monthly budget limit");
          }
        }
      }

      const expense = new ExpenseModel(expenseData);
      await expense.save();

      console.log("✅ Expense created successfully:", expense.id);
      return expense;
    } catch (error) {
      console.error("❌ Create expense error:", error);
      throw error;
    }
  }

  /**
   * Get expenses by date range
   * Query theo createdAt để tránh lỗi index, sau đó filter theo accountingPeriod hoặc dueDate
   */
  static async getExpensesByDateRange(startDate, endDate, options = {}) {
    try {
      const { type = null, category = null, status = null } = options;

      // Query tất cả expenses, sau đó filter trong code
      let q = query(collection(db, "expenses"), orderBy("createdAt", "desc"));

      if (type) {
        q = query(q, where("type", "==", type));
      }

      if (category) {
        q = query(q, where("category", "==", category));
      }

      if (status) {
        q = query(q, where("status", "==", status));
      }

      const snapshot = await getDocs(q);
      const expenses = [];
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();

      snapshot.forEach((doc) => {
        const expense = ExpenseModel.fromFirestore(doc);
        if (!expense) return;

        // Ưu tiên: accountingPeriod -> dueDate -> createdAt
        let expenseTime = null;

        if (expense.accountingPeriod) {
          // accountingPeriod format: "YYYY-MM"
          const [year, month] = expense.accountingPeriod.split("-").map(Number);
          expenseTime = new Date(year, month - 1, 15).getTime(); // Giữa tháng
        } else if (expense.dueDate) {
          expenseTime = expense.dueDate.toDate().getTime();
        } else if (expense.createdAt) {
          expenseTime = expense.createdAt.toDate().getTime();
        }

        if (expenseTime && expenseTime >= startTime && expenseTime <= endTime) {
          expenses.push(expense);
        }
      });

      console.log(
        `✅ Loaded ${
          expenses.length
        } expenses from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
      );
      return expenses;
    } catch (error) {
      console.error("❌ Get expenses by date range error:", error);
      throw error;
    }
  }

  /**
   * Get expenses by day
   */
  static async getExpensesByDay(date) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      return await ExpenseService.getExpensesByDateRange(startOfDay, endOfDay);
    } catch (error) {
      console.error("❌ Get expenses by day error:", error);
      throw error;
    }
  }

  /**
   * Get expenses by month
   */
  static async getExpensesByMonth(year, month) {
    try {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      return await ExpenseService.getExpensesByDateRange(
        startOfMonth,
        endOfMonth
      );
    } catch (error) {
      console.error("❌ Get expenses by month error:", error);
      throw error;
    }
  }

  /**
   * Get expenses by quarter
   */
  static async getExpensesByQuarter(year, quarter) {
    try {
      const startMonth = (quarter - 1) * 3;
      const startOfQuarter = new Date(year, startMonth, 1);
      const endOfQuarter = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);

      return await ExpenseService.getExpensesByDateRange(
        startOfQuarter,
        endOfQuarter
      );
    } catch (error) {
      console.error("❌ Get expenses by quarter error:", error);
      throw error;
    }
  }

  /**
   * Get expenses by year
   */
  static async getExpensesByYear(year) {
    try {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      return await ExpenseService.getExpensesByDateRange(
        startOfYear,
        endOfYear
      );
    } catch (error) {
      console.error("❌ Get expenses by year error:", error);
      throw error;
    }
  }

  /**
   * Calculate total expenses
   * Tính tổng chi phí đã thanh toán HOẶC đã được phê duyệt
   */
  static calculateTotalExpenses(expenses) {
    return expenses
      .filter(
        (exp) => exp.status === "paid" || exp.approvalStatus === "approved"
      )
      .reduce((sum, exp) => sum + exp.amount, 0);
  }

  /**
   * Get expense summary by type
   */
  static getExpenseSummaryByType(expenses) {
    const summary = {};

    expenses
      .filter(
        (exp) => exp.status === "paid" || exp.approvalStatus === "approved"
      )
      .forEach((expense) => {
        if (!summary[expense.type]) {
          summary[expense.type] = {
            type: expense.type,
            typeLabel: expense.getTypeLabel(),
            count: 0,
            total: 0,
            expenses: [],
          };
        }

        summary[expense.type].count++;
        summary[expense.type].total += expense.amount;
        summary[expense.type].expenses.push(expense);
      });

    return Object.values(summary).sort((a, b) => b.total - a.total);
  }

  /**
   * Get expense summary by category
   */
  static getExpenseSummaryByCategory(expenses) {
    const summary = {};

    expenses
      .filter(
        (exp) => exp.status === "paid" || exp.approvalStatus === "approved"
      )
      .forEach((expense) => {
        if (!summary[expense.category]) {
          summary[expense.category] = {
            category: expense.category,
            categoryLabel: expense.getCategoryLabel(),
            count: 0,
            total: 0,
            expenses: [],
          };
        }

        summary[expense.category].count++;
        summary[expense.category].total += expense.amount;
        summary[expense.category].expenses.push(expense);
      });

    return Object.values(summary).sort((a, b) => b.total - a.total);
  }

  /**
   * Get daily expense summary
   */
  static async getDailyExpenseSummary(date) {
    try {
      const expenses = await ExpenseService.getExpensesByDay(date);

      return {
        date: date,
        totalExpenses: ExpenseService.calculateTotalExpenses(expenses),
        expenseCount: expenses.filter((exp) => exp.status === "paid").length,
        pendingCount: expenses.filter((exp) => exp.status === "pending").length,
        byType: ExpenseService.getExpenseSummaryByType(expenses),
        byCategory: ExpenseService.getExpenseSummaryByCategory(expenses),
        expenses: expenses,
      };
    } catch (error) {
      console.error("❌ Get daily expense summary error:", error);
      throw error;
    }
  }

  /**
   * Get monthly expense summary
   */
  static async getMonthlyExpenseSummary(year, month) {
    try {
      const expenses = await ExpenseService.getExpensesByMonth(year, month);

      return {
        year: year,
        month: month,
        totalExpenses: ExpenseService.calculateTotalExpenses(expenses),
        expenseCount: expenses.filter(
          (exp) => exp.status === "paid" || exp.approvalStatus === "approved"
        ).length,
        pendingCount: expenses.filter(
          (exp) => exp.status === "pending" || exp.approvalStatus === "pending"
        ).length,
        byType: ExpenseService.getExpenseSummaryByType(expenses),
        byCategory: ExpenseService.getExpenseSummaryByCategory(expenses),
        expenses: expenses,
      };
    } catch (error) {
      console.error("❌ Get monthly expense summary error:", error);
      throw error;
    }
  }

  /**
   * Get quarterly expense summary
   */
  static async getQuarterlyExpenseSummary(year, quarter) {
    try {
      const expenses = await ExpenseService.getExpensesByQuarter(year, quarter);

      return {
        year: year,
        quarter: quarter,
        totalExpenses: ExpenseService.calculateTotalExpenses(expenses),
        expenseCount: expenses.filter((exp) => exp.status === "paid").length,
        pendingCount: expenses.filter((exp) => exp.status === "pending").length,
        byType: ExpenseService.getExpenseSummaryByType(expenses),
        byCategory: ExpenseService.getExpenseSummaryByCategory(expenses),
        expenses: expenses,
      };
    } catch (error) {
      console.error("❌ Get quarterly expense summary error:", error);
      throw error;
    }
  }

  /**
   * Get yearly expense summary
   */
  static async getYearlyExpenseSummary(year) {
    try {
      const expenses = await ExpenseService.getExpensesByYear(year);

      return {
        year: year,
        totalExpenses: ExpenseService.calculateTotalExpenses(expenses),
        expenseCount: expenses.filter((exp) => exp.status === "paid").length,
        pendingCount: expenses.filter((exp) => exp.status === "pending").length,
        byType: ExpenseService.getExpenseSummaryByType(expenses),
        byCategory: ExpenseService.getExpenseSummaryByCategory(expenses),
        expenses: expenses,
      };
    } catch (error) {
      console.error("❌ Get yearly expense summary error:", error);
      throw error;
    }
  }

  /**
   * Get pending approvals
   */
  static async getPendingApprovals() {
    try {
      const q = query(
        collection(db, "expenses"),
        where("approvalStatus", "==", "pending"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const expenses = [];

      snapshot.forEach((doc) => {
        const expense = ExpenseModel.fromFirestore(doc);
        if (expense) expenses.push(expense);
      });

      console.log(`✅ Loaded ${expenses.length} pending approvals`);
      return expenses;
    } catch (error) {
      console.error("❌ Get pending approvals error:", error);
      throw error;
    }
  }

  /**
   * Approve expense
   */
  static async approveExpense(expenseId, approverInfo) {
    try {
      const expense = await ExpenseModel.getById(expenseId);
      if (!expense) {
        throw new Error("Expense not found");
      }

      await expense.approve(approverInfo);
      console.log("✅ Expense approved:", expenseId);
      return expense;
    } catch (error) {
      console.error("❌ Approve expense error:", error);
      throw error;
    }
  }

  /**
   * Reject expense
   */
  static async rejectExpense(expenseId, rejectInfo) {
    try {
      const expense = await ExpenseModel.getById(expenseId);
      if (!expense) {
        throw new Error("Expense not found");
      }

      await expense.reject(rejectInfo);
      console.log("✅ Expense rejected:", expenseId);
      return expense;
    } catch (error) {
      console.error("❌ Reject expense error:", error);
      throw error;
    }
  }

  /**
   * Mark expense as paid
   */
  static async markAsPaid(expenseId, paymentInfo = {}) {
    try {
      const expense = await ExpenseModel.getById(expenseId);
      if (!expense) {
        throw new Error("Expense not found");
      }

      await expense.markAsPaid(paymentInfo);
      console.log("✅ Expense marked as paid:", expenseId);
      return expense;
    } catch (error) {
      console.error("❌ Mark as paid error:", error);
      throw error;
    }
  }

  /**
   * Get overdue expenses
   */
  static async getOverdueExpenses() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, "expenses"),
        where("status", "==", "pending"),
        where("dueDate", "<", Timestamp.fromDate(today)),
        orderBy("dueDate", "asc")
      );

      const snapshot = await getDocs(q);
      const expenses = [];

      snapshot.forEach((doc) => {
        const expense = ExpenseModel.fromFirestore(doc);
        if (expense && expense.isOverdue()) {
          expenses.push(expense);
        }
      });

      console.log(`✅ Loaded ${expenses.length} overdue expenses`);
      return expenses;
    } catch (error) {
      console.error("❌ Get overdue expenses error:", error);
      throw error;
    }
  }

  /**
   * Get upcoming expenses (due in next N days)
   */
  static async getUpcomingExpenses(daysAhead = 7) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + daysAhead);
      futureDate.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, "expenses"),
        where("status", "==", "pending"),
        where("dueDate", ">=", Timestamp.fromDate(today)),
        where("dueDate", "<=", Timestamp.fromDate(futureDate)),
        orderBy("dueDate", "asc")
      );

      const snapshot = await getDocs(q);
      const expenses = [];

      snapshot.forEach((doc) => {
        const expense = ExpenseModel.fromFirestore(doc);
        if (expense) expenses.push(expense);
      });

      console.log(
        `✅ Loaded ${expenses.length} upcoming expenses (next ${daysAhead} days)`
      );
      return expenses;
    } catch (error) {
      console.error("❌ Get upcoming expenses error:", error);
      throw error;
    }
  }

  /**
   * Get recurring expenses
   */
  static async getRecurringExpenses() {
    try {
      const q = query(
        collection(db, "expenses"),
        where("isRecurring", "==", true),
        where("active", "==", true),
        orderBy("dueDate", "asc")
      );

      const snapshot = await getDocs(q);
      const expenses = [];

      snapshot.forEach((doc) => {
        const expense = ExpenseModel.fromFirestore(doc);
        if (expense) expenses.push(expense);
      });

      console.log(`✅ Loaded ${expenses.length} recurring expenses`);
      return expenses;
    } catch (error) {
      console.error("❌ Get recurring expenses error:", error);
      throw error;
    }
  }

  /**
   * Compare expenses between two periods
   */
  static async compareExpenses(
    period1Start,
    period1End,
    period2Start,
    period2End
  ) {
    try {
      const period1Expenses = await ExpenseService.getExpensesByDateRange(
        period1Start,
        period1End
      );
      const period2Expenses = await ExpenseService.getExpensesByDateRange(
        period2Start,
        period2End
      );

      const period1Total =
        ExpenseService.calculateTotalExpenses(period1Expenses);
      const period2Total =
        ExpenseService.calculateTotalExpenses(period2Expenses);

      const difference = period2Total - period1Total;
      const percentChange =
        period1Total > 0 ? (difference / period1Total) * 100 : 0;

      return {
        period1: {
          start: period1Start,
          end: period1End,
          total: period1Total,
          count: period1Expenses.filter((exp) => exp.status === "paid").length,
          byType: ExpenseService.getExpenseSummaryByType(period1Expenses),
        },
        period2: {
          start: period2Start,
          end: period2End,
          total: period2Total,
          count: period2Expenses.filter((exp) => exp.status === "paid").length,
          byType: ExpenseService.getExpenseSummaryByType(period2Expenses),
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
      console.error("❌ Compare expenses error:", error);
      throw error;
    }
  }

  /**
   * Get expense statistics
   */
  static async getExpenseStatistics(year, month) {
    try {
      const expenses = await ExpenseService.getExpensesByMonth(year, month);

      const paidExpenses = expenses.filter((exp) => exp.status === "paid");
      const pendingExpenses = expenses.filter(
        (exp) => exp.status === "pending"
      );
      const overdueExpenses = expenses.filter((exp) => exp.isOverdue());

      const totalPaid = ExpenseService.calculateTotalExpenses(expenses);
      const totalPending = pendingExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const averageExpense =
        paidExpenses.length > 0 ? totalPaid / paidExpenses.length : 0;

      // Get largest expense
      const largestExpense = paidExpenses.reduce(
        (max, exp) => (exp.amount > (max?.amount || 0) ? exp : max),
        null
      );

      // Get smallest expense
      const smallestExpense = paidExpenses.reduce(
        (min, exp) => (exp.amount < (min?.amount || Infinity) ? exp : min),
        null
      );

      return {
        year: year,
        month: month,
        totalPaid: totalPaid,
        totalPending: totalPending,
        totalOverdue: overdueExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        paidCount: paidExpenses.length,
        pendingCount: pendingExpenses.length,
        overdueCount: overdueExpenses.length,
        averageExpense: averageExpense,
        largestExpense: largestExpense,
        smallestExpense: smallestExpense,
        byType: ExpenseService.getExpenseSummaryByType(expenses),
        byCategory: ExpenseService.getExpenseSummaryByCategory(expenses),
      };
    } catch (error) {
      console.error("❌ Get expense statistics error:", error);
      throw error;
    }
  }

  /**
   * Get expense by vendor
   */
  static async getExpensesByVendor(vendorName) {
    try {
      const q = query(
        collection(db, "expenses"),
        where("vendorName", "==", vendorName),
        orderBy("expenseDate", "desc")
      );

      const snapshot = await getDocs(q);
      const expenses = [];

      snapshot.forEach((doc) => {
        const expense = ExpenseModel.fromFirestore(doc);
        if (expense) expenses.push(expense);
      });

      console.log(
        `✅ Loaded ${expenses.length} expenses for vendor: ${vendorName}`
      );
      return expenses;
    } catch (error) {
      console.error("❌ Get expenses by vendor error:", error);
      throw error;
    }
  }

  /**
   * Search expenses
   */
  static async searchExpenses(searchTerm) {
    try {
      // Get all expenses (in production, use Algolia or similar for better search)
      const allExpenses = await ExpenseModel.getAll();

      const lowerSearchTerm = searchTerm.toLowerCase();

      const results = allExpenses.filter(
        (expense) =>
          expense.description?.toLowerCase().includes(lowerSearchTerm) ||
          expense.vendorName?.toLowerCase().includes(lowerSearchTerm) ||
          expense.notes?.toLowerCase().includes(lowerSearchTerm) ||
          expense.expenseNumber?.toLowerCase().includes(lowerSearchTerm)
      );

      console.log(
        `✅ Found ${results.length} expenses matching: ${searchTerm}`
      );
      return results;
    } catch (error) {
      console.error("❌ Search expenses error:", error);
      throw error;
    }
  }

  /**
   * Bulk approve expenses
   */
  static async bulkApproveExpenses(expenseIds, approverInfo) {
    try {
      const results = [];

      for (const expenseId of expenseIds) {
        try {
          const expense = await ExpenseService.approveExpense(
            expenseId,
            approverInfo
          );
          results.push({ expenseId, success: true, expense });
        } catch (error) {
          results.push({ expenseId, success: false, error: error.message });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      console.log(
        `✅ Bulk approved ${successCount}/${expenseIds.length} expenses`
      );

      return results;
    } catch (error) {
      console.error("❌ Bulk approve expenses error:", error);
      throw error;
    }
  }

  /**
   * Export expenses to CSV format
   */
  static exportToCSV(expenses) {
    const headers = [
      "Mã chi phí",
      "Ngày chi",
      "Loại",
      "Danh mục",
      "Số tiền",
      "Nhà cung cấp",
      "Mô tả",
      "Trạng thái",
      "Phê duyệt",
      "Hạn thanh toán",
      "Ngày thanh toán",
    ].join(",");

    const rows = expenses.map((expense) =>
      [
        expense.expenseNumber,
        expense.expenseDate.toLocaleDateString("vi-VN"),
        expense.getTypeLabel(),
        expense.getCategoryLabel(),
        expense.amount,
        expense.vendorName || "",
        `"${expense.description || ""}"`,
        expense.getStatusLabel(),
        expense.getApprovalStatusLabel(),
        expense.dueDate ? expense.dueDate.toLocaleDateString("vi-VN") : "",
        expense.paidDate ? expense.paidDate.toLocaleDateString("vi-VN") : "",
      ].join(",")
    );

    return [headers, ...rows].join("\n");
  }
}
