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

/**
 * Salary Types
 */
export const SALARY_TYPE = {
  FIXED: "fixed", // Lương cố định
  HOURLY: "hourly", // Theo giờ
  COMMISSION: "commission", // Hoa hồng
  MIXED: "mixed", // Kết hợp cố định + hoa hồng
};

/**
 * Employee Role
 */
export const EMPLOYEE_ROLE = {
  MANAGER: "manager", // Quản lý
  RECEPTIONIST: "receptionist", // Lễ tân
  PT: "pt", // Personal Trainer
  CLEANER: "cleaner", // Vệ sinh
  SECURITY: "security", // Bảo vệ
  ACCOUNTANT: "accountant", // Kế toán
  MARKETING: "marketing", // Marketing
  OTHER: "other", // Khác
};

/**
 * Salary Status
 */
export const SALARY_STATUS = {
  ACTIVE: "active", // Đang áp dụng
  INACTIVE: "inactive", // Không áp dụng
  PENDING: "pending", // Chờ duyệt
};

/**
 * Payment Frequency
 */
export const PAYMENT_FREQUENCY = {
  MONTHLY: "monthly", // Hàng tháng
  WEEKLY: "weekly", // Hàng tuần
  BIWEEKLY: "biweekly", // 2 tuần/lần
  DAILY: "daily", // Hàng ngày
};

/**
 * Commission Type
 */
export const COMMISSION_TYPE = {
  PERCENTAGE: "percentage", // Phần trăm
  FIXED_AMOUNT: "fixed_amount", // Số tiền cố định
  TIERED: "tiered", // Theo bậc
};

/**
 * 💰 Salary Config Model
 * Cấu hình lương cho nhân viên
 */
export class SalaryConfigModel {
  constructor({
    id = "",

    // Employee info
    employeeId = "",
    employeeName = "",
    employeeRole = "",

    // Salary structure
    salaryType = SALARY_TYPE.FIXED,
    baseSalary = 0,
    hourlyRate = 0,

    // Commission
    hasCommission = false,
    commissionType = COMMISSION_TYPE.PERCENTAGE,
    commissionRate = 0, // Phần trăm hoặc số tiền cố định
    commissionTiers = [], // Bậc hoa hồng

    // Allowances (Phụ cấp)
    allowances = [],
    totalAllowances = 0,

    // Deductions (Khấu trừ)
    deductions = [],
    totalDeductions = 0,

    // Payment
    paymentFrequency = PAYMENT_FREQUENCY.MONTHLY,
    paymentMethod = "bank_transfer",
    bankAccount = "",
    bankName = "",

    // Tax & Insurance (Thuế & Bảo hiểm)
    taxRate = 0,
    socialInsurance = 0, // BHXH
    healthInsurance = 0, // BHYT
    unemploymentInsurance = 0, // BHTN

    // Working hours
    standardWorkHours = 176, // Giờ công chuẩn/tháng (22 ngày * 8 giờ)
    overtimeRate = 1.5, // Hệ số làm thêm giờ

    // Status
    status = SALARY_STATUS.ACTIVE,
    effectiveDate = new Date(),
    endDate = null,

    // Notes
    notes = "",

    // Metadata
    createdBy = "",
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id;

    this.employeeId = employeeId;
    this.employeeName = employeeName;
    this.employeeRole = employeeRole;

    this.salaryType = salaryType;
    this.baseSalary = baseSalary;
    this.hourlyRate = hourlyRate;

    this.hasCommission = hasCommission;
    this.commissionType = commissionType;
    this.commissionRate = commissionRate;
    this.commissionTiers = commissionTiers;

    this.allowances = allowances;
    this.totalAllowances = totalAllowances;

    this.deductions = deductions;
    this.totalDeductions = totalDeductions;

    this.paymentFrequency = paymentFrequency;
    this.paymentMethod = paymentMethod;
    this.bankAccount = bankAccount;
    this.bankName = bankName;

    this.taxRate = taxRate;
    this.socialInsurance = socialInsurance;
    this.healthInsurance = healthInsurance;
    this.unemploymentInsurance = unemploymentInsurance;

    this.standardWorkHours = standardWorkHours;
    this.overtimeRate = overtimeRate;

    this.status = status;
    this.effectiveDate = effectiveDate;
    this.endDate = endDate;

    this.notes = notes;

    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Calculate total salary (không bao gồm hoa hồng)
   */
  calculateBaseTotalSalary() {
    return this.baseSalary + this.totalAllowances - this.totalDeductions;
  }

  /**
   * Calculate commission từ doanh số
   */
  calculateCommission(salesAmount) {
    if (!this.hasCommission) return 0;

    switch (this.commissionType) {
      case COMMISSION_TYPE.PERCENTAGE:
        return salesAmount * (this.commissionRate / 100);

      case COMMISSION_TYPE.FIXED_AMOUNT:
        return this.commissionRate;

      case COMMISSION_TYPE.TIERED:
        return this.calculateTieredCommission(salesAmount);

      default:
        return 0;
    }
  }

  /**
   * Calculate tiered commission (hoa hồng theo bậc)
   */
  calculateTieredCommission(salesAmount) {
    let commission = 0;
    let remainingAmount = salesAmount;

    // Sort tiers by minAmount
    const sortedTiers = [...this.commissionTiers].sort(
      (a, b) => a.minAmount - b.minAmount
    );

    for (let i = 0; i < sortedTiers.length; i++) {
      const tier = sortedTiers[i];
      const nextTier = sortedTiers[i + 1];

      if (remainingAmount <= 0) break;

      let tierAmount = 0;
      if (nextTier) {
        // Có bậc tiếp theo
        tierAmount = Math.min(
          remainingAmount,
          nextTier.minAmount - tier.minAmount
        );
      } else {
        // Bậc cuối cùng
        tierAmount = remainingAmount;
      }

      commission += tierAmount * (tier.rate / 100);
      remainingAmount -= tierAmount;
    }

    return commission;
  }

  /**
   * Calculate overtime pay
   */
  calculateOvertimePay(overtimeHours) {
    return this.hourlyRate * overtimeHours * this.overtimeRate;
  }

  /**
   * Calculate total insurance
   */
  calculateTotalInsurance() {
    return (
      this.socialInsurance + this.healthInsurance + this.unemploymentInsurance
    );
  }

  /**
   * Calculate net salary (lương thực nhận)
   */
  calculateNetSalary(options = {}) {
    const {
      workHours = this.standardWorkHours,
      overtimeHours = 0,
      salesAmount = 0,
      bonuses = 0,
      penalties = 0,
    } = options;

    let totalSalary = 0;

    // Base salary calculation
    if (
      this.salaryType === SALARY_TYPE.FIXED ||
      this.salaryType === SALARY_TYPE.MIXED
    ) {
      totalSalary = this.baseSalary;
    } else if (this.salaryType === SALARY_TYPE.HOURLY) {
      totalSalary = this.hourlyRate * workHours;
    }

    // Add allowances
    totalSalary += this.totalAllowances;

    // Add commission
    if (this.hasCommission && salesAmount > 0) {
      totalSalary += this.calculateCommission(salesAmount);
    }

    // Add overtime
    if (overtimeHours > 0) {
      totalSalary += this.calculateOvertimePay(overtimeHours);
    }

    // Add bonuses
    totalSalary += bonuses;

    // Subtract deductions
    totalSalary -= this.totalDeductions;

    // Subtract penalties
    totalSalary -= penalties;

    // Subtract insurance
    totalSalary -= this.calculateTotalInsurance();

    // Subtract tax
    const taxAmount = totalSalary * (this.taxRate / 100);
    totalSalary -= taxAmount;

    return Math.max(0, totalSalary); // Không âm
  }

  /**
   * Get formatted base salary
   */
  getFormattedBaseSalary() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.baseSalary);
  }

  /**
   * Get salary type label
   */
  getSalaryTypeLabel() {
    const labels = {
      [SALARY_TYPE.FIXED]: "Lương cố định",
      [SALARY_TYPE.HOURLY]: "Theo giờ",
      [SALARY_TYPE.COMMISSION]: "Hoa hồng",
      [SALARY_TYPE.MIXED]: "Kết hợp",
    };
    return labels[this.salaryType] || this.salaryType;
  }

  /**
   * Get role label
   */
  getRoleLabel() {
    const labels = {
      [EMPLOYEE_ROLE.MANAGER]: "Quản lý",
      [EMPLOYEE_ROLE.RECEPTIONIST]: "Lễ tân",
      [EMPLOYEE_ROLE.PT]: "Personal Trainer",
      [EMPLOYEE_ROLE.CLEANER]: "Vệ sinh",
      [EMPLOYEE_ROLE.SECURITY]: "Bảo vệ",
      [EMPLOYEE_ROLE.ACCOUNTANT]: "Kế toán",
      [EMPLOYEE_ROLE.MARKETING]: "Marketing",
      [EMPLOYEE_ROLE.OTHER]: "Khác",
    };
    return labels[this.employeeRole] || this.employeeRole;
  }

  /**
   * Get status label
   */
  getStatusLabel() {
    const labels = {
      [SALARY_STATUS.ACTIVE]: "Đang áp dụng",
      [SALARY_STATUS.INACTIVE]: "Không áp dụng",
      [SALARY_STATUS.PENDING]: "Chờ duyệt",
    };
    return labels[this.status] || this.status;
  }

  /**
   * Check if active
   */
  isActive() {
    return this.status === SALARY_STATUS.ACTIVE;
  }

  /**
   * Add allowance
   */
  addAllowance(allowance) {
    this.allowances.push(allowance);
    this.recalculateTotalAllowances();
  }

  /**
   * Remove allowance
   */
  removeAllowance(index) {
    this.allowances.splice(index, 1);
    this.recalculateTotalAllowances();
  }

  /**
   * Recalculate total allowances
   */
  recalculateTotalAllowances() {
    this.totalAllowances = this.allowances.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
  }

  /**
   * Add deduction
   */
  addDeduction(deduction) {
    this.deductions.push(deduction);
    this.recalculateTotalDeductions();
  }

  /**
   * Remove deduction
   */
  removeDeduction(index) {
    this.deductions.splice(index, 1);
    this.recalculateTotalDeductions();
  }

  /**
   * Recalculate total deductions
   */
  recalculateTotalDeductions() {
    this.totalDeductions = this.deductions.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
  }

  /**
   * Convert to Firestore format
   */
  toFirestore() {
    return {
      employeeId: this.employeeId,
      employeeName: this.employeeName,
      employeeRole: this.employeeRole,

      salaryType: this.salaryType,
      baseSalary: this.baseSalary,
      hourlyRate: this.hourlyRate,

      hasCommission: this.hasCommission,
      commissionType: this.commissionType,
      commissionRate: this.commissionRate,
      commissionTiers: this.commissionTiers,

      allowances: this.allowances,
      totalAllowances: this.totalAllowances,

      deductions: this.deductions,
      totalDeductions: this.totalDeductions,

      paymentFrequency: this.paymentFrequency,
      paymentMethod: this.paymentMethod,
      bankAccount: this.bankAccount,
      bankName: this.bankName,

      taxRate: this.taxRate,
      socialInsurance: this.socialInsurance,
      healthInsurance: this.healthInsurance,
      unemploymentInsurance: this.unemploymentInsurance,

      standardWorkHours: this.standardWorkHours,
      overtimeRate: this.overtimeRate,

      status: this.status,
      effectiveDate: this.effectiveDate,
      endDate: this.endDate,

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
    return new SalaryConfigModel({
      id: doc.id,
      ...data,
      effectiveDate: data.effectiveDate?.toDate?.() || data.effectiveDate,
      endDate: data.endDate?.toDate?.() || data.endDate,
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
      employeeId: this.employeeId,
      employeeName: this.employeeName,
      baseSalary: this.baseSalary,
      salaryType: this.salaryType,
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
    return collection(db, "salary_configs");
  }

  /**
   * Get Firestore document reference
   */
  static docRef(configId) {
    return doc(db, "salary_configs", configId);
  }

  /**
   * Save config to Firestore
   */
  async save() {
    try {
      const data = this.toFirestore();

      if (this.id) {
        // Update existing
        const docRef = SalaryConfigModel.docRef(this.id);
        await updateDoc(docRef, data);
        console.log("✅ Salary config updated:", this.id);
      } else {
        // Create new
        const docRef = await addDoc(SalaryConfigModel.collectionRef(), data);
        this.id = docRef.id;
        console.log("✅ Salary config created:", this.id);
      }

      return this;
    } catch (error) {
      console.error("❌ Save salary config error:", error);
      throw error;
    }
  }

  /**
   * Get config by ID
   */
  static async getById(configId) {
    try {
      const docRef = SalaryConfigModel.docRef(configId);
      const docSnap = await getDoc(docRef);
      return SalaryConfigModel.fromFirestore(docSnap);
    } catch (error) {
      console.error("❌ Get salary config error:", error);
      throw error;
    }
  }

  /**
   * Get config by employee ID
   */
  static async getByEmployeeId(employeeId) {
    try {
      const q = query(
        SalaryConfigModel.collectionRef(),
        where("employeeId", "==", employeeId),
        where("status", "==", SALARY_STATUS.ACTIVE),
        orderBy("effectiveDate", "desc")
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return null;

      // Return the most recent active config
      return SalaryConfigModel.fromFirestore(querySnapshot.docs[0]);
    } catch (error) {
      console.error("❌ Get salary config by employee error:", error);
      throw error;
    }
  }

  /**
   * Get all configs
   */
  static async getAll(options = {}) {
    try {
      const { activeOnly = false } = options;

      let q = query(SalaryConfigModel.collectionRef());

      if (activeOnly) {
        q = query(q, where("status", "==", SALARY_STATUS.ACTIVE));
      }

      q = query(q, orderBy("createdAt", "desc"));

      const querySnapshot = await getDocs(q);
      const configs = [];

      querySnapshot.forEach((doc) => {
        const config = SalaryConfigModel.fromFirestore(doc);
        if (config) configs.push(config);
      });

      console.log(`✅ Loaded ${configs.length} salary configs`);
      return configs;
    } catch (error) {
      console.error("❌ Get all salary configs error:", error);
      throw error;
    }
  }

  /**
   * Deactivate config
   */
  async deactivate() {
    try {
      this.status = SALARY_STATUS.INACTIVE;
      this.endDate = new Date();
      await this.save();
      console.log("✅ Salary config deactivated:", this.id);
      return this;
    } catch (error) {
      console.error("❌ Deactivate config error:", error);
      throw error;
    }
  }

  /**
   * Activate config
   */
  async activate() {
    try {
      this.status = SALARY_STATUS.ACTIVE;
      this.endDate = null;
      await this.save();
      console.log("✅ Salary config activated:", this.id);
      return this;
    } catch (error) {
      console.error("❌ Activate config error:", error);
      throw error;
    }
  }
}
