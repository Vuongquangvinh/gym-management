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
 * 📂 Expense Category Model
 * Model cho danh mục chi phí
 */
export class ExpenseCategoryModel {
  constructor({
    id = "",
    code = "",
    name = "",
    nameEn = "",

    // Classification
    type = "",
    category = "",
    parentId = null,
    level = 1,

    // Display
    icon = "📋",
    color = "#666666",
    order = 0,

    // Behavior
    isRecurring = false,
    recurringPeriod = "monthly",
    defaultAmount = 0,

    // Budget control
    hasBudgetLimit = false,
    monthlyBudgetLimit = 0,
    quarterlyBudgetLimit = 0,
    yearlyBudgetLimit = 0,

    // Approval
    requiresApproval = false,
    approvalThreshold = 0,
    approverRole = "admin",
    requiresReceipt = true,

    // Status
    active = true,
    description = "",

    // Accounting
    accountCode = "",

    // Metadata
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.nameEn = nameEn;

    this.type = type;
    this.category = category;
    this.parentId = parentId;
    this.level = level;

    this.icon = icon;
    this.color = color;
    this.order = order;

    this.isRecurring = isRecurring;
    this.recurringPeriod = recurringPeriod;
    this.defaultAmount = defaultAmount;

    this.hasBudgetLimit = hasBudgetLimit;
    this.monthlyBudgetLimit = monthlyBudgetLimit;
    this.quarterlyBudgetLimit = quarterlyBudgetLimit;
    this.yearlyBudgetLimit = yearlyBudgetLimit;

    this.requiresApproval = requiresApproval;
    this.approvalThreshold = approvalThreshold;
    this.approverRole = approverRole;
    this.requiresReceipt = requiresReceipt;

    this.active = active;
    this.description = description;

    this.accountCode = accountCode;

    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Get formatted default amount
   */
  getFormattedDefaultAmount() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.defaultAmount);
  }

  /**
   * Get formatted budget limit
   */
  getFormattedBudgetLimit(period = "monthly") {
    let amount = 0;
    switch (period) {
      case "monthly":
        amount = this.monthlyBudgetLimit;
        break;
      case "quarterly":
        amount = this.quarterlyBudgetLimit;
        break;
      case "yearly":
        amount = this.yearlyBudgetLimit;
        break;
    }

    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }

  /**
   * Check if amount exceeds budget
   */
  exceedsBudget(amount, period = "monthly") {
    if (!this.hasBudgetLimit) return false;

    let limit = 0;
    switch (period) {
      case "monthly":
        limit = this.monthlyBudgetLimit;
        break;
      case "quarterly":
        limit = this.quarterlyBudgetLimit;
        break;
      case "yearly":
        limit = this.yearlyBudgetLimit;
        break;
    }

    return amount > limit;
  }

  /**
   * Check if amount requires approval
   */
  requiresApprovalForAmount(amount) {
    if (!this.requiresApproval) return false;
    return amount >= this.approvalThreshold;
  }

  /**
   * Get recurring period label
   */
  getRecurringPeriodLabel() {
    const labels = {
      daily: "Hàng ngày",
      weekly: "Hàng tuần",
      monthly: "Hàng tháng",
      quarterly: "Hàng quý",
      yearly: "Hàng năm",
    };
    return labels[this.recurringPeriod] || this.recurringPeriod;
  }

  /**
   * Convert to Firestore format
   */
  toFirestore() {
    return {
      code: this.code,
      name: this.name,
      nameEn: this.nameEn,

      type: this.type,
      category: this.category,
      parentId: this.parentId,
      level: this.level,

      icon: this.icon,
      color: this.color,
      order: this.order,

      isRecurring: this.isRecurring,
      recurringPeriod: this.recurringPeriod,
      defaultAmount: this.defaultAmount,

      hasBudgetLimit: this.hasBudgetLimit,
      monthlyBudgetLimit: this.monthlyBudgetLimit,
      quarterlyBudgetLimit: this.quarterlyBudgetLimit,
      yearlyBudgetLimit: this.yearlyBudgetLimit,

      requiresApproval: this.requiresApproval,
      approvalThreshold: this.approvalThreshold,
      approverRole: this.approverRole,
      requiresReceipt: this.requiresReceipt,

      active: this.active,
      description: this.description,

      accountCode: this.accountCode,

      createdAt: this.createdAt,
      updatedAt: serverTimestamp(),
    };
  }

  /**
   * Create from Firestore document
   */
  static fromFirestore(doc) {
    if (!doc.exists()) return null;

    const data = doc.data();
    return new ExpenseCategoryModel({
      id: doc.id,
      ...data,
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
      code: this.code,
      name: this.name,
      type: this.type,
      category: this.category,
      icon: this.icon,
      color: this.color,
      isRecurring: this.isRecurring,
      defaultAmount: this.defaultAmount,
      active: this.active,
    };
  }

  // ============================================
  // FIRESTORE OPERATIONS
  // ============================================

  /**
   * Get Firestore collection reference
   */
  static collectionRef() {
    return collection(db, "expense_categories");
  }

  /**
   * Get Firestore document reference
   */
  static docRef(categoryId) {
    return doc(db, "expense_categories", categoryId);
  }

  /**
   * Save category to Firestore
   */
  async save() {
    try {
      const data = this.toFirestore();

      if (this.id) {
        // Update existing
        const docRef = ExpenseCategoryModel.docRef(this.id);
        await updateDoc(docRef, data);
        console.log("✅ Expense category updated:", this.id);
      } else {
        // Create new
        data.createdAt = serverTimestamp();
        const docRef = await addDoc(ExpenseCategoryModel.collectionRef(), data);
        this.id = docRef.id;
        console.log("✅ Expense category created:", this.id);
      }

      return this;
    } catch (error) {
      console.error("❌ Save expense category error:", error);
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  static async getById(categoryId) {
    try {
      const docRef = ExpenseCategoryModel.docRef(categoryId);
      const docSnap = await getDoc(docRef);
      return ExpenseCategoryModel.fromFirestore(docSnap);
    } catch (error) {
      console.error("❌ Get expense category error:", error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  static async getAll(options = {}) {
    try {
      const { activeOnly = true, orderByField = "order" } = options;

      let q = query(ExpenseCategoryModel.collectionRef());

      if (activeOnly) {
        q = query(q, where("active", "==", true));
      }

      q = query(q, orderBy(orderByField, "asc"));

      const querySnapshot = await getDocs(q);
      const categories = [];

      querySnapshot.forEach((doc) => {
        const category = ExpenseCategoryModel.fromFirestore(doc);
        if (category) categories.push(category);
      });

      console.log(`✅ Loaded ${categories.length} expense categories`);
      return categories;
    } catch (error) {
      console.error("❌ Get all expense categories error:", error);
      throw error;
    }
  }

  /**
   * Get categories by type
   */
  static async getByType(type) {
    try {
      const q = query(
        ExpenseCategoryModel.collectionRef(),
        where("type", "==", type),
        where("active", "==", true),
        orderBy("order", "asc")
      );

      const querySnapshot = await getDocs(q);
      const categories = [];

      querySnapshot.forEach((doc) => {
        const category = ExpenseCategoryModel.fromFirestore(doc);
        if (category) categories.push(category);
      });

      console.log(`✅ Loaded ${categories.length} categories for type:`, type);
      return categories;
    } catch (error) {
      console.error("❌ Get categories by type error:", error);
      throw error;
    }
  }

  /**
   * Get categories by category
   */
  static async getByCategory(category) {
    try {
      const q = query(
        ExpenseCategoryModel.collectionRef(),
        where("category", "==", category),
        where("active", "==", true),
        orderBy("order", "asc")
      );

      const querySnapshot = await getDocs(q);
      const categories = [];

      querySnapshot.forEach((doc) => {
        const cat = ExpenseCategoryModel.fromFirestore(doc);
        if (cat) categories.push(cat);
      });

      console.log(
        `✅ Loaded ${categories.length} categories for category:`,
        category
      );
      return categories;
    } catch (error) {
      console.error("❌ Get categories by category error:", error);
      throw error;
    }
  }

  /**
   * Deactivate category
   */
  async deactivate() {
    try {
      this.active = false;
      await this.save();
      console.log("✅ Expense category deactivated:", this.id);
      return this;
    } catch (error) {
      console.error("❌ Deactivate category error:", error);
      throw error;
    }
  }

  /**
   * Activate category
   */
  async activate() {
    try {
      this.active = true;
      await this.save();
      console.log("✅ Expense category activated:", this.id);
      return this;
    } catch (error) {
      console.error("❌ Activate category error:", error);
      throw error;
    }
  }

  // ============================================
  // PRESET CATEGORIES
  // ============================================

  /**
   * Get default preset categories
   */
  static getPresetCategories() {
    return [
      // Human Resource
      {
        code: "SAL-001",
        name: "Lương cố định",
        nameEn: "Fixed Salary",
        type: "salary",
        category: "human_resource",
        icon: "💰",
        color: "#FF6B6B",
        isRecurring: true,
        recurringPeriod: "monthly",
        defaultAmount: 25000000,
        hasBudgetLimit: true,
        monthlyBudgetLimit: 40000000,
        requiresApproval: true,
        approvalThreshold: 10000000,
        requiresReceipt: true,
        accountCode: "6411",
        description: "Lương cố định hàng tháng cho nhân viên",
        order: 1,
      },
      {
        code: "SAL-002",
        name: "Hoa hồng PT",
        nameEn: "PT Commission",
        type: "salary",
        category: "human_resource",
        icon: "🏋️",
        color: "#4ECDC4",
        isRecurring: true,
        recurringPeriod: "monthly",
        defaultAmount: 5000000,
        hasBudgetLimit: true,
        monthlyBudgetLimit: 15000000,
        requiresApproval: true,
        approvalThreshold: 5000000,
        accountCode: "6412",
        description: "Hoa hồng cho Personal Trainer",
        order: 2,
      },

      // Infrastructure
      {
        code: "RENT-001",
        name: "Thuê mặt bằng",
        nameEn: "Rent",
        type: "rent",
        category: "infrastructure",
        icon: "🏢",
        color: "#95E1D3",
        isRecurring: true,
        recurringPeriod: "monthly",
        defaultAmount: 15000000,
        hasBudgetLimit: true,
        monthlyBudgetLimit: 20000000,
        requiresApproval: true,
        approvalThreshold: 10000000,
        requiresReceipt: true,
        accountCode: "6271",
        description: "Chi phí thuê mặt bằng phòng gym",
        order: 10,
      },
      {
        code: "UTIL-001",
        name: "Điện",
        nameEn: "Electricity",
        type: "utilities",
        category: "infrastructure",
        icon: "⚡",
        color: "#FFE66D",
        isRecurring: true,
        recurringPeriod: "monthly",
        defaultAmount: 3000000,
        hasBudgetLimit: true,
        monthlyBudgetLimit: 5000000,
        requiresApproval: false,
        requiresReceipt: true,
        accountCode: "6272",
        description: "Tiền điện hàng tháng",
        order: 11,
      },
      {
        code: "UTIL-002",
        name: "Nước",
        nameEn: "Water",
        type: "utilities",
        category: "infrastructure",
        icon: "💧",
        color: "#4A90E2",
        isRecurring: true,
        recurringPeriod: "monthly",
        defaultAmount: 500000,
        hasBudgetLimit: true,
        monthlyBudgetLimit: 1000000,
        requiresApproval: false,
        requiresReceipt: true,
        accountCode: "6272",
        description: "Tiền nước hàng tháng",
        order: 12,
      },
      {
        code: "UTIL-003",
        name: "Internet",
        nameEn: "Internet",
        type: "utilities",
        category: "infrastructure",
        icon: "🌐",
        color: "#9B59B6",
        isRecurring: true,
        recurringPeriod: "monthly",
        defaultAmount: 500000,
        hasBudgetLimit: true,
        monthlyBudgetLimit: 1000000,
        requiresApproval: false,
        accountCode: "6272",
        description: "Cước internet",
        order: 13,
      },

      // Operations
      {
        code: "PARK-001",
        name: "Bãi giữ xe",
        nameEn: "Parking",
        type: "parking",
        category: "operations",
        icon: "🚗",
        color: "#34495E",
        isRecurring: true,
        recurringPeriod: "monthly",
        defaultAmount: 2000000,
        hasBudgetLimit: true,
        monthlyBudgetLimit: 3000000,
        requiresApproval: false,
        accountCode: "6273",
        description: "Chi phí bãi giữ xe cho khách hàng",
        order: 20,
      },
      {
        code: "CLEAN-001",
        name: "Vệ sinh",
        nameEn: "Cleaning",
        type: "cleaning",
        category: "operations",
        icon: "🧹",
        color: "#3498DB",
        isRecurring: true,
        recurringPeriod: "monthly",
        defaultAmount: 1000000,
        hasBudgetLimit: true,
        monthlyBudgetLimit: 2000000,
        requiresApproval: false,
        accountCode: "6273",
        description: "Chi phí vệ sinh, dọn dẹp",
        order: 21,
      },
      {
        code: "SEC-001",
        name: "Bảo vệ",
        nameEn: "Security",
        type: "security",
        category: "operations",
        icon: "🛡️",
        color: "#E74C3C",
        isRecurring: true,
        recurringPeriod: "monthly",
        defaultAmount: 2000000,
        hasBudgetLimit: true,
        monthlyBudgetLimit: 3000000,
        requiresApproval: false,
        accountCode: "6273",
        description: "Chi phí bảo vệ",
        order: 22,
      },

      // Equipment
      {
        code: "EQP-001",
        name: "Mua thiết bị",
        nameEn: "Equipment Purchase",
        type: "equipment",
        category: "equipment",
        icon: "🏋️‍♂️",
        color: "#F39C12",
        isRecurring: false,
        defaultAmount: 5000000,
        hasBudgetLimit: true,
        monthlyBudgetLimit: 10000000,
        requiresApproval: true,
        approvalThreshold: 3000000,
        requiresReceipt: true,
        accountCode: "6274",
        description: "Mua sắm thiết bị tập luyện",
        order: 30,
      },
      {
        code: "MAINT-001",
        name: "Bảo trì thiết bị",
        nameEn: "Equipment Maintenance",
        type: "maintenance",
        category: "equipment",
        icon: "🔧",
        color: "#16A085",
        isRecurring: true,
        recurringPeriod: "quarterly",
        defaultAmount: 2000000,
        hasBudgetLimit: true,
        quarterlyBudgetLimit: 5000000,
        requiresApproval: false,
        accountCode: "6275",
        description: "Bảo trì, sửa chữa thiết bị",
        order: 31,
      },

      // Marketing
      {
        code: "MKT-001",
        name: "Quảng cáo",
        nameEn: "Advertising",
        type: "marketing",
        category: "marketing",
        icon: "📢",
        color: "#E67E22",
        isRecurring: true,
        recurringPeriod: "monthly",
        defaultAmount: 3000000,
        hasBudgetLimit: true,
        monthlyBudgetLimit: 5000000,
        requiresApproval: true,
        approvalThreshold: 2000000,
        accountCode: "6421",
        description: "Chi phí quảng cáo, marketing",
        order: 40,
      },
      {
        code: "MKT-002",
        name: "Khuyến mãi",
        nameEn: "Promotion",
        type: "marketing",
        category: "marketing",
        icon: "🎁",
        color: "#1ABC9C",
        isRecurring: false,
        defaultAmount: 2000000,
        hasBudgetLimit: true,
        monthlyBudgetLimit: 3000000,
        requiresApproval: true,
        approvalThreshold: 1000000,
        accountCode: "6422",
        description: "Chi phí khuyến mãi, quà tặng",
        order: 41,
      },
    ];
  }

  /**
   * Initialize preset categories
   */
  static async initializePresetCategories() {
    try {
      const presets = ExpenseCategoryModel.getPresetCategories();
      const created = [];

      for (const preset of presets) {
        const category = new ExpenseCategoryModel(preset);
        await category.save();
        created.push(category);
      }

      console.log(`✅ Initialized ${created.length} preset categories`);
      return created;
    } catch (error) {
      console.error("❌ Initialize preset categories error:", error);
      throw error;
    }
  }
}
