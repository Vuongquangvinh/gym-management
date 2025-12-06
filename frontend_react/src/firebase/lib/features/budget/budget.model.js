import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";
import { ExpenseService } from "../expense/expense.service.js";

/**
 * Budget Period
 */
export const BUDGET_PERIOD = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  YEARLY: "yearly",
};

/**
 * Budget Status
 */
export const BUDGET_STATUS = {
  DRAFT: "draft", // Bản nháp
  ACTIVE: "active", // Đang áp dụng
  COMPLETED: "completed", // Hoàn thành
  CANCELLED: "cancelled", // Hủy bỏ
};

/**
 * 📊 Budget Model
 * Quản lý ngân sách (kế hoạch chi tiêu)
 */
export class BudgetModel {
  constructor({
    id = "",

    // Budget info
    name = "",
    description = "",
    period = BUDGET_PERIOD.MONTHLY,

    // Time range
    year = new Date().getFullYear(),
    month = null, // For monthly budget
    quarter = null, // For quarterly budget
    startDate = null,
    endDate = null,

    // Budget amounts by category
    categoryBudgets = [], // [{ categoryId, categoryName, type, plannedAmount, actualAmount, variance }]

    // Total amounts
    totalPlannedAmount = 0,
    totalActualAmount = 0,
    totalVariance = 0,

    // Status
    status = BUDGET_STATUS.DRAFT,

    // Tracking
    lastCalculatedAt = null,

    // Notes
    notes = "",

    // Metadata
    createdBy = "",
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id;

    this.name = name;
    this.description = description;
    this.period = period;

    this.year = year;
    this.month = month;
    this.quarter = quarter;
    this.startDate = startDate;
    this.endDate = endDate;

    this.categoryBudgets = categoryBudgets;

    this.totalPlannedAmount = totalPlannedAmount;
    this.totalActualAmount = totalActualAmount;
    this.totalVariance = totalVariance;

    this.status = status;

    this.lastCalculatedAt = lastCalculatedAt;

    this.notes = notes;

    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Calculate variance (chênh lệch kế hoạch vs thực tế)
   */
  calculateVariance() {
    this.totalVariance = this.totalActualAmount - this.totalPlannedAmount;

    // Update each category variance
    this.categoryBudgets = this.categoryBudgets.map((cat) => ({
      ...cat,
      variance: cat.actualAmount - cat.plannedAmount,
      variancePercent:
        cat.plannedAmount > 0
          ? ((cat.actualAmount - cat.plannedAmount) / cat.plannedAmount) * 100
          : 0,
    }));
  }

  /**
   * Get variance percentage
   */
  getVariancePercent() {
    if (this.totalPlannedAmount === 0) return 0;
    return (this.totalVariance / this.totalPlannedAmount) * 100;
  }

  /**
   * Check if over budget
   */
  isOverBudget() {
    return this.totalActualAmount > this.totalPlannedAmount;
  }

  /**
   * Check if under budget
   */
  isUnderBudget() {
    return this.totalActualAmount < this.totalPlannedAmount;
  }

  /**
   * Get budget utilization percentage
   */
  getUtilizationPercent() {
    if (this.totalPlannedAmount === 0) return 0;
    return (this.totalActualAmount / this.totalPlannedAmount) * 100;
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget() {
    return this.totalPlannedAmount - this.totalActualAmount;
  }

  /**
   * Get formatted total planned
   */
  getFormattedTotalPlanned() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.totalPlannedAmount);
  }

  /**
   * Get formatted total actual
   */
  getFormattedTotalActual() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.totalActualAmount);
  }

  /**
   * Get formatted variance
   */
  getFormattedVariance() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.totalVariance);
  }

  /**
   * Get period label
   */
  getPeriodLabel() {
    if (this.period === BUDGET_PERIOD.MONTHLY) {
      return `Tháng ${this.month}/${this.year}`;
    } else if (this.period === BUDGET_PERIOD.QUARTERLY) {
      return `Quý ${this.quarter}/${this.year}`;
    } else {
      return `Năm ${this.year}`;
    }
  }

  /**
   * Get status label
   */
  getStatusLabel() {
    const labels = {
      [BUDGET_STATUS.DRAFT]: "Bản nháp",
      [BUDGET_STATUS.ACTIVE]: "Đang áp dụng",
      [BUDGET_STATUS.COMPLETED]: "Hoàn thành",
      [BUDGET_STATUS.CANCELLED]: "Hủy bỏ",
    };
    return labels[this.status] || this.status;
  }

  /**
   * Add category budget
   */
  addCategoryBudget(categoryBudget) {
    this.categoryBudgets.push(categoryBudget);
    this.recalculateTotals();
  }

  /**
   * Update category budget
   */
  updateCategoryBudget(categoryId, updates) {
    const index = this.categoryBudgets.findIndex(
      (c) => c.categoryId === categoryId
    );
    if (index !== -1) {
      this.categoryBudgets[index] = {
        ...this.categoryBudgets[index],
        ...updates,
      };
      this.recalculateTotals();
    }
  }

  /**
   * Remove category budget
   */
  removeCategoryBudget(categoryId) {
    this.categoryBudgets = this.categoryBudgets.filter(
      (c) => c.categoryId !== categoryId
    );
    this.recalculateTotals();
  }

  /**
   * Recalculate totals
   */
  recalculateTotals() {
    this.totalPlannedAmount = this.categoryBudgets.reduce(
      (sum, cat) => sum + (cat.plannedAmount || 0),
      0
    );

    this.totalActualAmount = this.categoryBudgets.reduce(
      (sum, cat) => sum + (cat.actualAmount || 0),
      0
    );

    this.calculateVariance();
  }

  /**
   * Update actual amounts from expenses
   */
  async updateActualAmounts() {
    try {
      let expenses = [];

      if (this.period === BUDGET_PERIOD.MONTHLY) {
        expenses = await ExpenseService.getExpensesByMonth(
          this.year,
          this.month
        );
      } else if (this.period === BUDGET_PERIOD.QUARTERLY) {
        expenses = await ExpenseService.getExpensesByQuarter(
          this.year,
          this.quarter
        );
      } else {
        expenses = await ExpenseService.getExpensesByYear(this.year);
      }

      // Group expenses by type
      const expensesByType = {};
      expenses
        .filter((exp) => exp.status === "paid")
        .forEach((exp) => {
          if (!expensesByType[exp.type]) {
            expensesByType[exp.type] = 0;
          }
          expensesByType[exp.type] += exp.amount;
        });

      // Update actual amounts for each category
      this.categoryBudgets = this.categoryBudgets.map((cat) => ({
        ...cat,
        actualAmount: expensesByType[cat.type] || 0,
      }));

      this.recalculateTotals();
      this.lastCalculatedAt = new Date();

      console.log("✅ Updated actual amounts from expenses");
    } catch (error) {
      console.error("❌ Update actual amounts error:", error);
      throw error;
    }
  }

  /**
   * Convert to Firestore format
   */
  toFirestore() {
    return {
      name: this.name,
      description: this.description,
      period: this.period,

      year: this.year,
      month: this.month,
      quarter: this.quarter,
      startDate: this.startDate,
      endDate: this.endDate,

      categoryBudgets: this.categoryBudgets,

      totalPlannedAmount: this.totalPlannedAmount,
      totalActualAmount: this.totalActualAmount,
      totalVariance: this.totalVariance,

      status: this.status,

      lastCalculatedAt: this.lastCalculatedAt,

      notes: this.notes,

      createdBy: this.createdBy,
      createdAt: this.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  }

  /**
   * Create from Firestore document
   */
  static fromFirestore(doc) {
    if (!doc.exists()) return null;

    const data = doc.data();
    return new BudgetModel({
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate?.() || data.startDate,
      endDate: data.endDate?.toDate?.() || data.endDate,
      lastCalculatedAt:
        data.lastCalculatedAt?.toDate?.() || data.lastCalculatedAt,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    });
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      period: this.period,
      totalPlannedAmount: this.totalPlannedAmount,
      totalActualAmount: this.totalActualAmount,
      status: this.status,
    };
  }

  // ============================================
  // FIRESTORE OPERATIONS
  // ============================================

  /**
   * Get Firestore collection reference
   */
  static collectionRef() {
    return collection(db, "budgets");
  }

  /**
   * Get Firestore document reference
   */
  static docRef(budgetId) {
    return doc(db, "budgets", budgetId);
  }

  /**
   * Save budget to Firestore
   */
  async save() {
    try {
      const data = this.toFirestore();

      if (this.id) {
        // Update existing
        const docRef = BudgetModel.docRef(this.id);
        await updateDoc(docRef, data);
        console.log("✅ Budget updated:", this.id);
      } else {
        // Create new
        const docRef = await addDoc(BudgetModel.collectionRef(), data);
        this.id = docRef.id;
        console.log("✅ Budget created:", this.id);
      }

      return this;
    } catch (error) {
      console.error("❌ Save budget error:", error);
      throw error;
    }
  }

  /**
   * Get budget by ID
   */
  static async getById(budgetId) {
    try {
      const docRef = BudgetModel.docRef(budgetId);
      const docSnap = await getDoc(docRef);
      return BudgetModel.fromFirestore(docSnap);
    } catch (error) {
      console.error("❌ Get budget error:", error);
      throw error;
    }
  }

  /**
   * Get all budgets
   */
  static async getAll(options = {}) {
    try {
      const { year = null, period = null, status = null } = options;

      let q = query(BudgetModel.collectionRef());

      if (year) {
        q = query(q, where("year", "==", year));
      }

      if (period) {
        q = query(q, where("period", "==", period));
      }

      if (status) {
        q = query(q, where("status", "==", status));
      }

      q = query(q, orderBy("createdAt", "desc"));

      const querySnapshot = await getDocs(q);
      const budgets = [];

      querySnapshot.forEach((doc) => {
        const budget = BudgetModel.fromFirestore(doc);
        if (budget) budgets.push(budget);
      });

      console.log(`✅ Loaded ${budgets.length} budgets`);
      return budgets;
    } catch (error) {
      console.error("❌ Get all budgets error:", error);
      throw error;
    }
  }

  /**
   * Get budget for specific period
   */
  static async getBudgetForPeriod(year, period, monthOrQuarter) {
    try {
      let q = query(
        BudgetModel.collectionRef(),
        where("year", "==", year),
        where("period", "==", period),
        where("status", "==", BUDGET_STATUS.ACTIVE)
      );

      if (period === BUDGET_PERIOD.MONTHLY) {
        q = query(q, where("month", "==", monthOrQuarter));
      } else if (period === BUDGET_PERIOD.QUARTERLY) {
        q = query(q, where("quarter", "==", monthOrQuarter));
      }

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return null;

      // Return the first active budget
      return BudgetModel.fromFirestore(querySnapshot.docs[0]);
    } catch (error) {
      console.error("❌ Get budget for period error:", error);
      throw error;
    }
  }

  /**
   * Activate budget
   */
  async activate() {
    try {
      this.status = BUDGET_STATUS.ACTIVE;
      await this.save();
      console.log("✅ Budget activated:", this.id);
      return this;
    } catch (error) {
      console.error("❌ Activate budget error:", error);
      throw error;
    }
  }

  /**
   * Complete budget
   */
  async complete() {
    try {
      // Update actual amounts before completing
      await this.updateActualAmounts();

      this.status = BUDGET_STATUS.COMPLETED;
      await this.save();
      console.log("✅ Budget completed:", this.id);
      return this;
    } catch (error) {
      console.error("❌ Complete budget error:", error);
      throw error;
    }
  }

  /**
   * Cancel budget
   */
  async cancel() {
    try {
      this.status = BUDGET_STATUS.CANCELLED;
      await this.save();
      console.log("✅ Budget cancelled:", this.id);
      return this;
    } catch (error) {
      console.error("❌ Cancel budget error:", error);
      throw error;
    }
  }
}
