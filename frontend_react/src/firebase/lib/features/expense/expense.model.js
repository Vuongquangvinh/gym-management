import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  limit as fsLimit,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";

/**
 * Expense Status Constants
 */
export const EXPENSE_STATUS = {
  PENDING: "pending", // Chờ thanh toán
  PAID: "paid", // Đã thanh toán
  CANCELLED: "cancelled", // Đã hủy
  REJECTED: "rejected", // Bị từ chối
};

/**
 * Expense Type Constants
 */
export const EXPENSE_TYPE = {
  SALARY: "salary", // Lương
  RENT: "rent", // Thuê mặt bằng
  UTILITIES: "utilities", // Điện, nước, internet
  PARKING: "parking", // Bãi giữ xe
  EQUIPMENT: "equipment", // Thiết bị
  MAINTENANCE: "maintenance", // Bảo trì
  MARKETING: "marketing", // Marketing
  CLEANING: "cleaning", // Vệ sinh
  SECURITY: "security", // Bảo vệ
  INSURANCE: "insurance", // Bảo hiểm
  OTHER: "other", // Khác
};

/**
 * Expense Category Constants
 */
export const EXPENSE_CATEGORY = {
  HUMAN_RESOURCE: "human_resource", // Nhân sự
  INFRASTRUCTURE: "infrastructure", // Cơ sở hạ tầng
  OPERATIONS: "operations", // Vận hành
  EQUIPMENT: "equipment", // Thiết bị
  MARKETING: "marketing", // Marketing
  OTHER: "other", // Khác
};

/**
 * Payment Method Constants
 */
export const PAYMENT_METHOD = {
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
  CREDIT_CARD: "credit_card",
  E_WALLET: "e_wallet",
};

/**
 * Approval Status Constants
 */
export const APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

/**
 * 💸 Expense Model
 * Model cho chi phí trong hệ thống gym
 */
export class ExpenseModel {
  constructor({
    id = "",
    expenseNumber = "",

    // Classification
    type = EXPENSE_TYPE.OTHER,
    category = EXPENSE_CATEGORY.OTHER,
    subCategory = "",

    // Details
    title = "",
    description = "",
    amount = 0,
    currency = "VND",

    // Status & Payment
    status = EXPENSE_STATUS.PENDING,
    paymentMethod = PAYMENT_METHOD.CASH,
    transactionId = "",

    // Reference
    relatedTo = null, // {type, id, name}

    // Period (cho chi phí định kỳ)
    isRecurring = false,
    recurringPeriod = "monthly",
    periodStart = null,
    periodEnd = null,

    // Payment timing
    dueDate = null,
    paidDate = null,

    // Documentation
    invoiceNumber = "",
    receiptUrl = "",
    attachments = [],

    // Approval workflow
    approvalStatus = APPROVAL_STATUS.PENDING,
    requestedBy = "",
    approvedBy = "",
    approvalDate = null,
    approvalNotes = "",

    // Metadata
    tags = [],
    notes = "",

    // Audit trail
    createdBy = "",
    createdAt = null,
    updatedAt = null,
    deletedAt = null,

    // Accounting
    accountingPeriod = "",
    fiscalYear = new Date().getFullYear(),
    costCenter = "",
  } = {}) {
    this.id = id;
    this.expenseNumber = expenseNumber || this.generateExpenseNumber();

    this.type = type;
    this.category = category;
    this.subCategory = subCategory;

    this.title = title;
    this.description = description;
    this.amount = amount;
    this.currency = currency;

    this.status = status;
    this.paymentMethod = paymentMethod;
    this.transactionId = transactionId;

    this.relatedTo = relatedTo;

    this.isRecurring = isRecurring;
    this.recurringPeriod = recurringPeriod;
    this.periodStart = periodStart;
    this.periodEnd = periodEnd;

    this.dueDate = dueDate;
    this.paidDate = paidDate;

    this.invoiceNumber = invoiceNumber;
    this.receiptUrl = receiptUrl;
    this.attachments = attachments;

    this.approvalStatus = approvalStatus;
    this.requestedBy = requestedBy;
    this.approvedBy = approvedBy;
    this.approvalDate = approvalDate;
    this.approvalNotes = approvalNotes;

    this.tags = tags;
    this.notes = notes;

    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;

    this.accountingPeriod =
      accountingPeriod || this.calculateAccountingPeriod();
    this.fiscalYear = fiscalYear;
    this.costCenter = costCenter;
  }

  /**
   * Generate expense number
   * Format: EXP-YYYYMMDD-XXXXX
   */
  generateExpenseNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");
    return `EXP-${year}${month}${day}-${random}`;
  }

  /**
   * Calculate accounting period (YYYY-MM)
   */
  calculateAccountingPeriod() {
    const date = this.paidDate || this.createdAt || new Date();
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  /**
   * Check if expense is paid
   */
  isPaid() {
    return this.status === EXPENSE_STATUS.PAID;
  }

  /**
   * Check if expense is pending
   */
  isPending() {
    return this.status === EXPENSE_STATUS.PENDING;
  }

  /**
   * Check if expense is cancelled
   */
  isCancelled() {
    return this.status === EXPENSE_STATUS.CANCELLED;
  }

  /**
   * Check if expense is overdue
   */
  isOverdue() {
    if (this.isPaid() || !this.dueDate) return false;
    const now = new Date();
    const due =
      this.dueDate instanceof Date ? this.dueDate : new Date(this.dueDate);
    return now > due;
  }

  /**
   * Check if expense is approved
   */
  isApproved() {
    return this.approvalStatus === APPROVAL_STATUS.APPROVED;
  }

  /**
   * Check if expense needs approval
   */
  needsApproval() {
    return this.approvalStatus === APPROVAL_STATUS.PENDING;
  }

  /**
   * Get formatted amount
   */
  getFormattedAmount() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: this.currency,
    }).format(this.amount);
  }

  /**
   * Get type label
   */
  getTypeLabel() {
    const labels = {
      [EXPENSE_TYPE.SALARY]: "Lương",
      [EXPENSE_TYPE.RENT]: "Thuê mặt bằng",
      [EXPENSE_TYPE.UTILITIES]: "Điện, nước, internet",
      [EXPENSE_TYPE.PARKING]: "Bãi giữ xe",
      [EXPENSE_TYPE.EQUIPMENT]: "Thiết bị",
      [EXPENSE_TYPE.MAINTENANCE]: "Bảo trì",
      [EXPENSE_TYPE.MARKETING]: "Marketing",
      [EXPENSE_TYPE.CLEANING]: "Vệ sinh",
      [EXPENSE_TYPE.SECURITY]: "Bảo vệ",
      [EXPENSE_TYPE.INSURANCE]: "Bảo hiểm",
      [EXPENSE_TYPE.OTHER]: "Khác",
    };
    return labels[this.type] || this.type;
  }

  /**
   * Get category label
   */
  getCategoryLabel() {
    const labels = {
      [EXPENSE_CATEGORY.HUMAN_RESOURCE]: "Nhân sự",
      [EXPENSE_CATEGORY.INFRASTRUCTURE]: "Cơ sở hạ tầng",
      [EXPENSE_CATEGORY.OPERATIONS]: "Vận hành",
      [EXPENSE_CATEGORY.EQUIPMENT]: "Thiết bị",
      [EXPENSE_CATEGORY.MARKETING]: "Marketing",
      [EXPENSE_CATEGORY.OTHER]: "Khác",
    };
    return labels[this.category] || this.category;
  }

  /**
   * Get status label
   */
  getStatusLabel() {
    const labels = {
      [EXPENSE_STATUS.PENDING]: "Chờ thanh toán",
      [EXPENSE_STATUS.PAID]: "Đã thanh toán",
      [EXPENSE_STATUS.CANCELLED]: "Đã hủy",
      [EXPENSE_STATUS.REJECTED]: "Bị từ chối",
    };
    return labels[this.status] || this.status;
  }

  /**
   * Get status color
   */
  getStatusColor() {
    const colors = {
      [EXPENSE_STATUS.PENDING]: "warning",
      [EXPENSE_STATUS.PAID]: "success",
      [EXPENSE_STATUS.CANCELLED]: "default",
      [EXPENSE_STATUS.REJECTED]: "error",
    };
    return colors[this.status] || "default";
  }

  /**
   * Get days until due
   */
  getDaysUntilDue() {
    if (!this.dueDate || this.isPaid()) return null;
    const now = new Date();
    const due =
      this.dueDate instanceof Date ? this.dueDate : new Date(this.dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  }

  /**
   * Convert to Firestore format
   */
  toFirestore() {
    return {
      expenseNumber: this.expenseNumber,

      type: this.type,
      category: this.category,
      subCategory: this.subCategory,

      title: this.title,
      description: this.description,
      amount: this.amount,
      currency: this.currency,

      status: this.status,
      paymentMethod: this.paymentMethod,
      transactionId: this.transactionId,

      relatedTo: this.relatedTo,

      isRecurring: this.isRecurring,
      recurringPeriod: this.recurringPeriod,
      periodStart: this.periodStart,
      periodEnd: this.periodEnd,

      dueDate: this.dueDate,
      paidDate: this.paidDate,

      invoiceNumber: this.invoiceNumber,
      receiptUrl: this.receiptUrl,
      attachments: this.attachments,

      approvalStatus: this.approvalStatus,
      requestedBy: this.requestedBy,
      approvedBy: this.approvedBy,
      approvalDate: this.approvalDate,
      approvalNotes: this.approvalNotes,

      tags: this.tags,
      notes: this.notes,

      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: serverTimestamp(),
      deletedAt: this.deletedAt,

      accountingPeriod: this.accountingPeriod,
      fiscalYear: this.fiscalYear,
      costCenter: this.costCenter,
    };
  }

  /**
   * Create from Firestore document
   */
  static fromFirestore(doc) {
    if (!doc.exists()) return null;

    const data = doc.data();
    return new ExpenseModel({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      dueDate: data.dueDate?.toDate?.() || data.dueDate,
      paidDate: data.paidDate?.toDate?.() || data.paidDate,
      periodStart: data.periodStart?.toDate?.() || data.periodStart,
      periodEnd: data.periodEnd?.toDate?.() || data.periodEnd,
      approvalDate: data.approvalDate?.toDate?.() || data.approvalDate,
      deletedAt: data.deletedAt?.toDate?.() || data.deletedAt,
    });
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      expenseNumber: this.expenseNumber,
      type: this.type,
      category: this.category,
      title: this.title,
      amount: this.amount,
      status: this.status,
      dueDate: this.dueDate,
      paidDate: this.paidDate,
      approvalStatus: this.approvalStatus,
      accountingPeriod: this.accountingPeriod,
    };
  }

  // ============================================
  // FIRESTORE OPERATIONS
  // ============================================

  /**
   * Get Firestore collection reference
   */
  static collectionRef() {
    return collection(db, "expenses");
  }

  /**
   * Get Firestore document reference
   */
  static docRef(expenseId) {
    return doc(db, "expenses", expenseId);
  }

  /**
   * Save expense to Firestore
   */
  async save() {
    try {
      const data = this.toFirestore();

      if (this.id) {
        // Update existing
        const docRef = ExpenseModel.docRef(this.id);
        await updateDoc(docRef, data);
        console.log("✅ Expense updated:", this.id);
      } else {
        // Create new
        data.createdAt = serverTimestamp();
        const docRef = await addDoc(ExpenseModel.collectionRef(), data);
        this.id = docRef.id;
        console.log("✅ Expense created:", this.id);
      }

      return this;
    } catch (error) {
      console.error("❌ Save expense error:", error);
      throw error;
    }
  }

  /**
   * Get expense by ID
   */
  static async getById(expenseId) {
    try {
      const docRef = ExpenseModel.docRef(expenseId);
      const docSnap = await getDoc(docRef);
      return ExpenseModel.fromFirestore(docSnap);
    } catch (error) {
      console.error("❌ Get expense error:", error);
      throw error;
    }
  }

  /**
   * Get all expenses with filters
   */
  static async getAll(options = {}) {
    try {
      const {
        status = null,
        type = null,
        category = null,
        startDate = null,
        endDate = null,
        limit = 100,
      } = options;

      let q = query(ExpenseModel.collectionRef());

      // Filters
      if (status) {
        q = query(q, where("status", "==", status));
      }
      if (type) {
        q = query(q, where("type", "==", type));
      }
      if (category) {
        q = query(q, where("category", "==", category));
      }

      // Order and limit
      q = query(q, orderBy("createdAt", "desc"), fsLimit(limit));

      const querySnapshot = await getDocs(q);
      let expenses = [];

      querySnapshot.forEach((doc) => {
        const expense = ExpenseModel.fromFirestore(doc);
        if (expense) {
          // Filter by date if provided
          if (startDate || endDate) {
            const expenseDate = expense.paidDate || expense.createdAt;
            if (startDate && expenseDate < startDate) return;
            if (endDate && expenseDate > endDate) return;
          }
          expenses.push(expense);
        }
      });

      console.log(`✅ Loaded ${expenses.length} expenses`);
      return expenses;
    } catch (error) {
      console.error("❌ Get all expenses error:", error);
      throw error;
    }
  }

  /**
   * Delete expense (soft delete)
   */
  async delete() {
    try {
      const docRef = ExpenseModel.docRef(this.id);
      await updateDoc(docRef, {
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      this.deletedAt = new Date();
      console.log("✅ Expense deleted (soft):", this.id);
      return this;
    } catch (error) {
      console.error("❌ Delete expense error:", error);
      throw error;
    }
  }

  /**
   * Hard delete expense
   */
  async hardDelete() {
    try {
      const docRef = ExpenseModel.docRef(this.id);
      await deleteDoc(docRef);
      console.log("✅ Expense deleted (hard):", this.id);
      return true;
    } catch (error) {
      console.error("❌ Hard delete expense error:", error);
      throw error;
    }
  }

  /**
   * Update expense status
   */
  async updateStatus(newStatus, additionalData = {}) {
    try {
      this.status = newStatus;

      if (newStatus === EXPENSE_STATUS.PAID && !this.paidDate) {
        this.paidDate = new Date();
      }

      Object.assign(this, additionalData);

      await this.save();
      console.log("✅ Expense status updated:", this.id, newStatus);
      return this;
    } catch (error) {
      console.error("❌ Update status error:", error);
      throw error;
    }
  }

  /**
   * Approve expense
   */
  async approve(approvedBy, notes = "") {
    try {
      this.approvalStatus = APPROVAL_STATUS.APPROVED;
      this.approvedBy = approvedBy;
      this.approvalDate = new Date();
      this.approvalNotes = notes;

      await this.save();
      console.log("✅ Expense approved:", this.id);
      return this;
    } catch (error) {
      console.error("❌ Approve expense error:", error);
      throw error;
    }
  }

  /**
   * Reject expense
   */
  async reject(rejectedBy, notes = "") {
    try {
      this.approvalStatus = APPROVAL_STATUS.REJECTED;
      this.approvedBy = rejectedBy;
      this.approvalDate = new Date();
      this.approvalNotes = notes;
      this.status = EXPENSE_STATUS.REJECTED;

      await this.save();
      console.log("✅ Expense rejected:", this.id);
      return this;
    } catch (error) {
      console.error("❌ Reject expense error:", error);
      throw error;
    }
  }
}
