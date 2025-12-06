# 💰 Hướng Dẫn Hoàn Thiện Hệ Thống Quản Lý Tài Chính (Financial Management System)

> **Mục tiêu:** Xây dựng hệ thống quản lý tài chính TOÀN DIỆN bao gồm THU - CHI - LỢI NHUẬN, giúp quản lý gym hiệu quả

---

## 📋 Mục Lục

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Phân Tích Hiện Trạng](#2-phân-tích-hiện-trạng)
3. [Database Schema Design](#3-database-schema-design)
4. [Kiến Trúc Hệ Thống](#4-kiến-trúc-hệ-thống)
5. [Luồng Làm Việc Chi Tiết](#5-luồng-làm-việc-chi-tiết)
6. [Implementation Checklist](#6-implementation-checklist)
7. [API Reference](#7-api-reference)
8. [UI/UX Design](#8-uiux-design)
9. [Testing Guidelines](#9-testing-guidelines)
10. [Security & Permissions](#10-security--permissions)

---

## 1. Tổng Quan Hệ Thống

### 🎯 Mục Tiêu Chính

Xây dựng hệ thống quản lý tài chính **3 chiều: THU - CHI - LỢI NHUẬN**

#### A. Module THU (Revenue/Income)
- ✅ Doanh thu từ gói tập (Gym Packages)
- ✅ Doanh thu từ PT (Personal Training)
- ✅ Doanh thu từ dịch vụ khác (nếu có)
- ✅ Tracking theo thời gian thực

#### B. Module CHI (Expenses) - **MỚI**
- 💰 Chi phí nhân sự (Salaries & Wages)
  - Lương nhân viên cố định
  - Lương PT (cố định + hoa hồng)
  - Thưởng, phụ cấp
- 🏢 Chi phí cơ sở hạ tầng
  - Thuê mặt bằng
  - Điện, nước, internet
  - Bảo trì, sửa chữa
- 🚗 Chi phí vận hành
  - Bãi giữ xe
  - Vệ sinh
  - An ninh
- 🛒 Chi phí thiết bị
  - Mua sắm thiết bị mới
  - Bảo trì thiết bị
- 📢 Chi phí marketing
  - Quảng cáo
  - Khuyến mãi
- 📋 Chi phí khác

#### C. Module BÁO CÁO & PHÂN TÍCH
- 📊 Dashboard tổng quan (Revenue - Expense = Profit)
- 📈 Biểu đồ xu hướng
- 💹 Dự báo tài chính
- ⚠️ Cảnh báo chi phí bất thường

### 🎯 Yêu Cầu Hệ Thống

- **Chính xác:** Mọi giao dịch phải có chứng từ
- **Toàn diện:** Tracking đầy đủ thu chi
- **Bảo mật:** Chỉ admin/accountant được truy cập
- **Audit Trail:** Lưu lịch sử thay đổi
- **Real-time:** Cập nhật theo thời gian thực
- **Báo cáo:** Xuất Excel/PDF theo kỳ

### 🔑 Nguồn Dữ Liệu

#### 1. Thu Nhập (Revenue) - ĐÃ CÓ

**Collection:** `payment_orders`

```javascript
{
  orderCode: 1234567890,
  userId: "user123",
  userName: "Nguyễn Văn A",
  packageId: "pkg_basic",
  packageName: "Gói Cơ Bản 1 Tháng",
  amount: 500000,
  status: "PAID",
  createdAt: Timestamp,
  paidAt: Timestamp,
  verifiedWithPayOS: true,
  confirmedManually: false
}
```

#### 2. Chi Phí (Expenses) - **CẦN TẠO MỚI**

**Collection:** `expenses` (Firestore)

```javascript
{
  id: "exp_123456",
  type: "salary" | "rent" | "utilities" | "parking" | "equipment" | "marketing" | "maintenance" | "other",
  category: "human_resource" | "infrastructure" | "operations" | "equipment" | "marketing" | "other",
  title: "Lương tháng 12/2025",
  description: "Chi lương nhân viên và PT",
  amount: 50000000,
  currency: "VND",
  status: "paid" | "pending" | "cancelled",
  paymentMethod: "cash" | "bank_transfer" | "credit_card",
  transactionId: "TXN_123",
  
  // Reference
  employeeId: "emp_123",           // Nếu là lương nhân viên
  employeeName: "Trần Văn B",
  
  // Timing
  periodStart: Timestamp,          // Kỳ tính (VD: 01/12/2025)
  periodEnd: Timestamp,            // Kỳ tính (VD: 31/12/2025)
  dueDate: Timestamp,              // Hạn thanh toán
  paidDate: Timestamp,             // Ngày thanh toán thực tế
  
  // Documentation
  invoiceNumber: "INV-2025-001",
  receiptUrl: "https://...",       // Link ảnh/file chứng từ
  attachments: [],
  
  // Metadata
  createdBy: "admin_id",
  approvedBy: "manager_id",
  approvalStatus: "pending" | "approved" | "rejected",
  notes: "Ghi chú thêm",
  tags: ["salary", "december", "fixed"],
  
  // Audit
  createdAt: Timestamp,
  updatedAt: Timestamp,
  deletedAt: null
}
```

**Collection:** `expense_categories` (Cấu hình loại chi phí)

```javascript
{
  id: "cat_salary",
  name: "Lương nhân viên",
  type: "salary",
  category: "human_resource",
  icon: "💰",
  color: "#FF6B6B",
  isRecurring: true,              // Chi phí định kỳ
  recurringPeriod: "monthly",     // monthly/quarterly/yearly
  defaultAmount: 30000000,
  budgetLimit: 50000000,          // Ngân sách tối đa
  requiresApproval: true,
  active: true,
  createdAt: Timestamp
}
```

**Collection:** `budgets` (Ngân sách kế hoạch)

```javascript
{
  id: "budget_2025_12",
  period: "2025-12",
  periodType: "monthly",          // monthly/quarterly/yearly
  
  // Planned
  plannedRevenue: 100000000,
  plannedExpenses: {
    salary: 40000000,
    rent: 15000000,
    utilities: 5000000,
    parking: 2000000,
    equipment: 3000000,
    marketing: 5000000,
    other: 5000000
  },
  totalPlannedExpense: 75000000,
  plannedProfit: 25000000,
  
  // Actual (auto-calculated)
  actualRevenue: 0,
  actualExpenses: {},
  totalActualExpense: 0,
  actualProfit: 0,
  
  // Variance
  revenueVariance: 0,             // Actual - Planned
  expenseVariance: 0,
  profitVariance: 0,
  
  status: "draft" | "approved" | "active" | "closed",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 2. Phân Tích Hiện Trạng

### ✅ Điểm Mạnh - Phần THU (Revenue)

#### A. PaymentOrderModel (ĐÃ CÓ - HOÀN THIỆN)

```javascript
// ✅ Static methods đã có và hoạt động tốt
PaymentOrderModel.getRevenueByDay(startDate, endDate)
PaymentOrderModel.getRevenueByMonth(year)
PaymentOrderModel.getRevenueByEachUser()
```

**Kết quả trả về:**
- `getRevenueByDay()`: `[{date: "2025-12-05", revenue: 1500000, orders: 5}, ...]`
- `getRevenueByMonth()`: `[{month: "2025-12", revenue: 45000000, orders: 150}, ...]`
- `getRevenueByEachUser()`: `[{userId, userName, revenue, orders, packages}, ...]`

#### B. UI Components (ĐÃ CÓ - CẦN MỞ RỘNG)

1. **RevenueChart** - Biểu đồ doanh thu theo ngày/tháng ✅
2. **TopUsers** - Xếp hạng user theo doanh thu ✅

### ❌ Điểm Yếu - Thiếu Hoàn Toàn

#### A. KHÔNG CÓ Quản Lý Chi Phí (Expenses)

**Thiếu hoàn toàn:**
- ❌ Collection `expenses` để lưu chi phí
- ❌ Module quản lý lương nhân viên
- ❌ Module quản lý chi phí cố định (thuê mặt bằng, điện nước...)
- ❌ Module quản lý chi phí biến đổi (bãi xe, marketing...)
- ❌ Chứng từ/hóa đơn chi phí
- ❌ Workflow phê duyệt chi phí

#### B. KHÔNG CÓ Quản Lý Ngân Sách (Budget)

**Thiếu hoàn toàn:**
- ❌ Lập ngân sách theo kỳ (tháng/quý/năm)
- ❌ So sánh thực tế vs kế hoạch
- ❌ Cảnh báo vượt ngân sách
- ❌ Phân bổ ngân sách theo bộ phận

#### C. KHÔNG CÓ Báo Cáo Tài Chính Tổng Hợp

**Thiếu hoàn toàn:**
- ❌ Báo cáo lãi/lỗ (Income Statement)
- ❌ Báo cáo lưu chuyển tiền tệ (Cash Flow)
- ❌ Dashboard tổng quan tài chính
- ❌ KPI tài chính (ROI, Profit Margin, Break-even...)

#### D. KHÔNG CÓ Quản Lý Nhân Sự - Lương

**Thiếu hoàn toàn:**
- ❌ Bảng lương nhân viên
- ❌ Công thức tính lương (cố định + hoa hồng)
- ❌ Chấm công/tính ngày công
- ❌ Phụ cấp, thưởng
- ❌ Tính hoa hồng PT

#### E. Vấn Đề Với Hệ Thống Cũ

```javascript
// ❌ User.model.js - KHÔNG CHÍNH XÁC
static async calculatePackageRevenue(packageId) {
  const users = await UserModel.getUsersByPackageId(packageId);
  const totalRevenue = users.length * Number(price);
  return totalRevenue; // SAI: không biết ai đã trả tiền!
}
```

**Vấn đề:**
- Tính theo user đăng ký, không theo đơn đã PAID
- Không có thông tin thời gian thanh toán
- Không thể xuất báo cáo theo khoảng thời gian

---

## 3. Database Schema Design

### 📊 Firestore Collections Overview

```
gym-management (Database)
├── payment_orders/              ✅ Đã có - Thu nhập
├── expenses/                    ⭐ MỚI - Chi phí
├── expense_categories/          ⭐ MỚI - Danh mục chi phí
├── budgets/                     ⭐ MỚI - Ngân sách
├── salary_configs/              ⭐ MỚI - Cấu hình lương
├── employees/                   ✅ Đã có - Nhân viên
├── contracts/                   ✅ Đã có - Hợp đồng
└── financial_reports/           ⭐ MỚI - Báo cáo tài chính (cache)
```

### 📋 Chi Tiết Schema

#### 1. `expenses` Collection

```javascript
{
  // Primary fields
  id: "exp_2025120512345",
  expenseNumber: "EXP-2025-1234",      // Mã chi phí (auto-generated)
  
  // Classification
  type: "salary",                       // Loại chi phí chính
  category: "human_resource",           // Nhóm chi phí
  subCategory: "fixed_salary",          // Phân loại chi tiết
  
  // Details
  title: "Lương tháng 12/2025 - Nhân viên",
  description: "Chi lương cố định cho 10 nhân viên",
  amount: 30000000,
  currency: "VND",
  
  // Status & Payment
  status: "paid",                       // pending/paid/cancelled/rejected
  paymentMethod: "bank_transfer",       // cash/bank_transfer/credit_card
  transactionId: "TXN_123456",
  
  // Reference
  relatedTo: {
    type: "employee",                   // employee/vendor/supplier/other
    id: "emp_123",
    name: "Trần Văn B"
  },
  
  // Period (cho chi phí định kỳ)
  isRecurring: true,
  recurringPeriod: "monthly",           // monthly/quarterly/yearly
  periodStart: Timestamp("2025-12-01"),
  periodEnd: Timestamp("2025-12-31"),
  
  // Payment timing
  dueDate: Timestamp("2025-12-31"),
  paidDate: Timestamp("2025-12-30"),
  
  // Documentation
  invoiceNumber: "INV-2025-001",
  receiptUrl: "https://storage/receipts/...",
  attachments: [
    { name: "receipt.pdf", url: "...", type: "pdf" }
  ],
  
  // Approval workflow
  approvalStatus: "approved",           // pending/approved/rejected
  requestedBy: "manager_id",
  approvedBy: "admin_id",
  approvalDate: Timestamp,
  approvalNotes: "Đã kiểm tra chứng từ",
  
  // Metadata
  tags: ["salary", "december", "fixed"],
  notes: "Lương tháng 12, đã trừ BHXH",
  
  // Audit trail
  createdBy: "admin_id",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  deletedAt: null,
  
  // Accounting
  accountingPeriod: "2025-12",
  fiscalYear: 2025,
  costCenter: "operations",             // operations/marketing/admin
}
```

#### 2. `expense_categories` Collection

```javascript
{
  id: "cat_salary_fixed",
  code: "SAL-001",
  name: "Lương cố định nhân viên",
  nameEn: "Fixed Employee Salary",
  
  // Classification
  type: "salary",
  category: "human_resource",
  parentId: null,                       // Cho hierarchical categories
  level: 1,
  
  // Display
  icon: "💰",
  color: "#FF6B6B",
  order: 1,
  
  // Behavior
  isRecurring: true,
  recurringPeriod: "monthly",
  defaultAmount: 25000000,
  
  // Budget control
  hasBudgetLimit: true,
  monthlyBudgetLimit: 40000000,
  quarterlyBudgetLimit: 120000000,
  yearlyBudgetLimit: 480000000,
  
  // Approval
  requiresApproval: true,
  approvalThreshold: 10000000,          // Số tiền yêu cầu duyệt
  approverRole: "admin",
  requiresReceipt: true,
  
  // Status
  active: true,
  description: "Chi phí lương cố định hàng tháng cho nhân viên",
  
  // Accounting
  accountCode: "6411",                  // Mã tài khoản kế toán
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 3. `salary_configs` Collection

```javascript
{
  id: "salary_emp_123",
  employeeId: "emp_123",
  employeeName: "Trần Văn B",
  employeeRole: "trainer",              // staff/trainer/manager/admin
  
  // Salary components
  baseSalary: 10000000,                 // Lương cơ bản
  allowances: {
    housing: 2000000,                   // Phụ cấp nhà ở
    transportation: 500000,             // Phụ cấp đi lại
    meal: 1000000,                      // Phụ cấp ăn uống
    phone: 200000,                      // Phụ cấp điện thoại
    other: 0
  },
  totalAllowances: 3700000,
  
  // Commission (cho PT)
  hasCommission: true,
  commissionType: "percentage",         // percentage/fixed_per_session
  commissionRate: 20,                   // 20% doanh thu từ PT packages
  commissionBase: "revenue",            // revenue/profit
  minCommissionPerMonth: 2000000,
  
  // Deductions
  deductions: {
    insurance: 800000,                  // BHXH, BHYT, BHTN
    tax: 1000000,                       // Thuế TNCN
    advance: 0,                         // Tạm ứng
    other: 0
  },
  totalDeductions: 1800000,
  
  // Total
  grossSalary: 13700000,                // Base + Allowances
  netSalary: 11900000,                  // Gross - Deductions
  
  // Payment info
  bankName: "Vietcombank",
  bankAccount: "1234567890",
  paymentDay: 28,                       // Ngày trả lương hàng tháng
  
  // Period
  effectiveFrom: Timestamp("2025-01-01"),
  effectiveTo: null,                    // null = còn hiệu lực
  
  // Status
  status: "active",                     // active/inactive/suspended
  
  // Audit
  createdAt: Timestamp,
  updatedAt: Timestamp,
  updatedBy: "admin_id"
}
```

#### 4. `budgets` Collection

```javascript
{
  id: "budget_2025_12",
  budgetCode: "BUD-2025-12",
  
  // Period
  period: "2025-12",
  periodType: "monthly",                // monthly/quarterly/yearly
  fiscalYear: 2025,
  startDate: Timestamp("2025-12-01"),
  endDate: Timestamp("2025-12-31"),
  
  // === REVENUE (THU) ===
  plannedRevenue: {
    gymPackages: 80000000,              // Gói tập thường
    ptPackages: 20000000,               // Gói PT
    other: 5000000,
    total: 105000000
  },
  
  actualRevenue: {
    gymPackages: 0,                     // Auto-calculated from payment_orders
    ptPackages: 0,
    other: 0,
    total: 0
  },
  
  // === EXPENSES (CHI) ===
  plannedExpenses: {
    // Human Resource
    salary: {
      fixed: 30000000,                  // Lương cố định
      commission: 5000000,              // Hoa hồng PT
      bonus: 2000000,                   // Thưởng
      insurance: 3000000,               // BHXH
      subtotal: 40000000
    },
    
    // Infrastructure
    rent: 15000000,                     // Thuê mặt bằng
    utilities: {
      electricity: 3000000,
      water: 500000,
      internet: 500000,
      subtotal: 4000000
    },
    
    // Operations
    parking: 2000000,                   // Bãi giữ xe
    cleaning: 1000000,                  // Vệ sinh
    security: 2000000,                  // Bảo vệ
    operations_subtotal: 5000000,
    
    // Equipment
    equipmentPurchase: 5000000,
    equipmentMaintenance: 2000000,
    equipment_subtotal: 7000000,
    
    // Marketing
    advertising: 3000000,
    promotion: 2000000,
    marketing_subtotal: 5000000,
    
    // Other
    other: 2000000,
    
    // Total
    total: 78000000
  },
  
  actualExpenses: {
    salary: { fixed: 0, commission: 0, bonus: 0, insurance: 0, subtotal: 0 },
    rent: 0,
    utilities: { electricity: 0, water: 0, internet: 0, subtotal: 0 },
    parking: 0,
    cleaning: 0,
    security: 0,
    operations_subtotal: 0,
    equipmentPurchase: 0,
    equipmentMaintenance: 0,
    equipment_subtotal: 0,
    advertising: 0,
    promotion: 0,
    marketing_subtotal: 0,
    other: 0,
    total: 0                            // Auto-calculated from expenses
  },
  
  // === PROFIT (LỢI NHUẬN) ===
  plannedProfit: 27000000,              // plannedRevenue - plannedExpenses
  actualProfit: 0,                      // actualRevenue - actualExpenses
  
  // === VARIANCE (CHÊNH LỆCH) ===
  variance: {
    revenue: 0,                         // actual - planned
    expenses: 0,
    profit: 0,
    revenuePercent: 0,                  // (actual - planned) / planned * 100
    expensesPercent: 0,
    profitPercent: 0
  },
  
  // === STATUS ===
  status: "active",                     // draft/approved/active/closed
  
  // Approval
  approvedBy: "owner_id",
  approvalDate: Timestamp,
  
  // Metadata
  notes: "Ngân sách tháng 12/2025",
  createdBy: "admin_id",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastRecalculatedAt: Timestamp        // Lần cuối tính toán actual
}
```

#### 5. `financial_reports` Collection (Cache)

```javascript
{
  id: "report_2025_12_monthly",
  reportType: "monthly",                // daily/weekly/monthly/quarterly/yearly
  period: "2025-12",
  
  // Summary
  summary: {
    revenue: 95000000,
    expenses: 72000000,
    profit: 23000000,
    profitMargin: 24.21,                // (profit / revenue) * 100
    
    // Growth vs previous period
    revenueGrowth: 15.5,                // %
    expenseGrowth: 8.2,
    profitGrowth: 28.3
  },
  
  // Detailed breakdown
  revenueBreakdown: { /* ... */ },
  expenseBreakdown: { /* ... */ },
  
  // Top items
  topRevenuePackages: [],
  topExpenseCategories: [],
  
  // Cached data (for performance)
  chartData: { /* ... */ },
  
  // Metadata
  generatedAt: Timestamp,
  expiresAt: Timestamp,                 // Cache expiry
  version: 1
}
```

---

## 4. Kiến Trúc Hệ Thống

### 📂 Cấu Trúc Thư Mục Mới

```
frontend_react/src/firebase/lib/features/
│
├── payment/                              ✅ ĐÃ CÓ
│   ├── payment-order.model.js
│   ├── payment-order.service.js
│   └── README.md
│
├── revenue/                              ⭐ MỚI - Revenue Module
│   ├── index.js
│   ├── revenue.model.js
│   ├── revenue.service.js
│   ├── revenue-report.service.js
│   └── README.md
│
├── expense/                              ⭐ MỚI - Expense Module
│   ├── index.js
│   ├── expense.model.js
│   ├── expense.service.js
│   ├── expense-category.model.js
│   ├── expense-category.service.js
│   └── README.md
│
├── salary/                               ⭐ MỚI - Salary Module
│   ├── index.js
│   ├── salary-config.model.js
│   ├── salary-config.service.js
│   ├── salary-calculation.service.js
│   ├── payroll.service.js              # Tính lương hàng tháng
│   └── README.md
│
├── budget/                               ⭐ MỚI - Budget Module
│   ├── index.js
│   ├── budget.model.js
│   ├── budget.service.js
│   └── README.md
│
└── financial/                            ⭐ MỚI - Financial Module (Tổng hợp)
    ├── index.js
    ├── financial.service.js            # Core financial calculations
    ├── financial-report.service.js     # Report generation
    ├── profit-loss.service.js          # Income statement
    ├── cash-flow.service.js            # Cash flow statement
    └── README.md
```

### 🏗️ Kiến Trúc 4 Tầng

```
┌──────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                  │
│  - FinancialDashboard (Tổng quan THU-CHI-LỜI)                   │
│  - RevenueManagement (Quản lý thu)                               │
│  - ExpenseManagement (Quản lý chi)                               │
│  - SalaryManagement (Quản lý lương)                              │
│  - BudgetManagement (Quản lý ngân sách)                          │
│  - Reports (Báo cáo)                                              │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                    SERVICE LAYER                                  │
│  - FinancialService: Tổng hợp tài chính                          │
│  - RevenueService: Logic doanh thu                               │
│  - ExpenseService: Logic chi phí                                 │
│  - SalaryService: Tính lương, hoa hồng                           │
│  - BudgetService: Quản lý ngân sách                              │
│  - ReportService: Tạo báo cáo, xuất file                         │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                     MODEL LAYER                                   │
│  - PaymentOrderModel (Thu)                                       │
│  - ExpenseModel (Chi)                                             │
│  - SalaryConfigModel (Cấu hình lương)                            │
│  - BudgetModel (Ngân sách)                                       │
│  - ExpenseCategoryModel (Danh mục chi)                           │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                      DATA LAYER                                   │
│  Firestore Collections:                                          │
│  - payment_orders/                                               │
│  - expenses/                                                     │
│  - expense_categories/                                           │
│  - salary_configs/                                               │
│  - budgets/                                                      │
│  - financial_reports/ (cache)                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 🔄 Data Flow

```
USER ACTION
    ↓
UI COMPONENT
    ↓
SERVICE LAYER (Business Logic)
    ↓
MODEL LAYER (Data Validation)
    ↓
FIRESTORE (Persistence)
    ↓
TRIGGER/CLOUD FUNCTION (Auto-calculations)
    ↓
UPDATE CACHE & REPORTS
```

---

## 5. Luồng Làm Việc Chi Tiết

### 📝 PHASE 1: Tạo Revenue Service Foundation (1-2 ngày)

#### Step 1.1: Tạo Revenue Model

**File:** `frontend_react/src/firebase/lib/features/revenue/revenue.model.js`

```javascript
/**
 * 📊 Revenue Data Model
 * Định nghĩa cấu trúc dữ liệu cho các loại báo cáo
 */

export class DailyRevenue {
  constructor({ date, revenue, orders, avgOrderValue }) {
    this.date = date;                    // "2025-12-05"
    this.revenue = revenue;              // 1500000
    this.orders = orders;                // 5
    this.avgOrderValue = avgOrderValue;  // 300000
  }
}

export class MonthlyRevenue {
  constructor({ month, revenue, orders, avgOrderValue, growth }) {
    this.month = month;                  // "2025-12"
    this.revenue = revenue;              // 45000000
    this.orders = orders;                // 150
    this.avgOrderValue = avgOrderValue;  // 300000
    this.growth = growth;                // 15% (so với tháng trước)
  }
}

export class RevenueByPackage {
  constructor({ packageId, packageName, revenue, orders, users }) {
    this.packageId = packageId;
    this.packageName = packageName;
    this.revenue = revenue;
    this.orders = orders;
    this.users = new Set(users);         // Số user duy nhất
  }
  
  get uniqueUsers() {
    return this.users.size;
  }
}

export class RevenueByPT {
  constructor({ ptId, ptName, revenue, orders, clients, commission }) {
    this.ptId = ptId;
    this.ptName = ptName;
    this.revenue = revenue;              // Doanh thu từ PT packages
    this.orders = orders;
    this.clients = clients;              // Số client
    this.commission = commission;        // Hoa hồng PT nhận (nếu có)
  }
}

export class RevenueSummary {
  constructor({
    totalRevenue,
    totalOrders,
    totalUsers,
    avgOrderValue,
    topPackage,
    topPT,
    growthRate,
    period
  }) {
    this.totalRevenue = totalRevenue;
    this.totalOrders = totalOrders;
    this.totalUsers = totalUsers;
    this.avgOrderValue = avgOrderValue;
    this.topPackage = topPackage;
    this.topPT = topPT;
    this.growthRate = growthRate;        // % tăng trưởng
    this.period = period;                // "2025-12" hoặc "2025-Q4"
  }
}
```

#### Step 1.2: Tạo Revenue Service Core

**File:** `frontend_react/src/firebase/lib/features/revenue/revenue.service.js`

```javascript
import { PaymentOrderModel, PAYMENT_STATUS } from "../payment";
import {
  DailyRevenue,
  MonthlyRevenue,
  RevenueByPackage,
  RevenueByPT,
  RevenueSummary,
} from "./revenue.model.js";

/**
 * 💰 Revenue Service
 * Service tập trung xử lý tất cả logic liên quan đến doanh thu
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
      // Sử dụng method có sẵn từ PaymentOrderModel
      const rawData = await PaymentOrderModel.getRevenueByDay(startDate, endDate);
      
      // Transform sang DailyRevenue model
      return rawData.map(item => new DailyRevenue({
        date: item.date,
        revenue: item.revenue,
        orders: item.orders,
        avgOrderValue: item.orders > 0 ? item.revenue / item.orders : 0
      }));
    } catch (error) {
      console.error("❌ RevenueService.getRevenueByDay error:", error);
      throw error;
    }
  }
  
  /**
   * Get revenue by week
   * @param {number} year 
   * @returns {Promise<Object[]>} [{week: 1, revenue: xxx, orders: xx}, ...]
   */
  static async getRevenueByWeek(year) {
    try {
      const result = await PaymentOrderModel.getAll({ limit: 2000 });
      const orders = result.orders.filter(o => o.isPaid());
      
      const weekMap = new Map();
      
      orders.forEach(order => {
        const orderDate = order.createdAt instanceof Date 
          ? order.createdAt 
          : new Date(order.createdAt);
          
        if (orderDate.getFullYear() !== year) return;
        
        // Tính week number (1-52)
        const weekNum = this.getWeekNumber(orderDate);
        const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`;
        
        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, {
            week: weekKey,
            weekNumber: weekNum,
            revenue: 0,
            orders: 0
          });
        }
        
        const weekData = weekMap.get(weekKey);
        weekData.revenue += order.amount;
        weekData.orders += 1;
      });
      
      return Array.from(weekMap.values()).sort((a, b) => 
        a.weekNumber - b.weekNumber
      );
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
      const rawData = await PaymentOrderModel.getRevenueByMonth(year);
      
      // Calculate growth rate (so với tháng trước)
      return rawData.map((item, index) => {
        const prevMonth = index > 0 ? rawData[index - 1] : null;
        const growth = prevMonth 
          ? ((item.revenue - prevMonth.revenue) / prevMonth.revenue * 100)
          : 0;
          
        return new MonthlyRevenue({
          month: item.month,
          revenue: item.revenue,
          orders: item.orders,
          avgOrderValue: item.orders > 0 ? item.revenue / item.orders : 0,
          growth: growth
        });
      });
    } catch (error) {
      console.error("❌ RevenueService.getRevenueByMonth error:", error);
      throw error;
    }
  }
  
  /**
   * Get revenue by quarter
   * @param {number} year 
   * @returns {Promise<Object[]>} [{quarter: "Q1", revenue: xxx}, ...]
   */
  static async getRevenueByQuarter(year) {
    try {
      const monthlyData = await PaymentOrderModel.getRevenueByMonth(year);
      
      const quarters = {
        'Q1': { quarter: 'Q1', months: [1, 2, 3], revenue: 0, orders: 0 },
        'Q2': { quarter: 'Q2', months: [4, 5, 6], revenue: 0, orders: 0 },
        'Q3': { quarter: 'Q3', months: [7, 8, 9], revenue: 0, orders: 0 },
        'Q4': { quarter: 'Q4', months: [10, 11, 12], revenue: 0, orders: 0 }
      };
      
      monthlyData.forEach(item => {
        const month = parseInt(item.month.split('-')[1]);
        
        Object.values(quarters).forEach(q => {
          if (q.months.includes(month)) {
            q.revenue += item.revenue;
            q.orders += item.orders;
          }
        });
      });
      
      return Object.values(quarters);
    } catch (error) {
      console.error("❌ RevenueService.getRevenueByQuarter error:", error);
      throw error;
    }
  }
  
  /**
   * Get revenue by year (for multi-year comparison)
   * @param {number} startYear 
   * @param {number} endYear 
   * @returns {Promise<Object[]>}
   */
  static async getRevenueByYear(startYear, endYear) {
    try {
      const result = await PaymentOrderModel.getAll({ limit: 5000 });
      const orders = result.orders.filter(o => o.isPaid());
      
      const yearMap = new Map();
      
      orders.forEach(order => {
        const orderDate = order.createdAt instanceof Date 
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
      
      return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
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
   * @returns {Promise<RevenueByPackage[]>}
   */
  static async getRevenueByPackage() {
    try {
      const result = await PaymentOrderModel.getAll({ limit: 2000 });
      const orders = result.orders.filter(o => o.isPaid());
      
      const packageMap = new Map();
      
      orders.forEach(order => {
        const pkgId = order.packageId;
        
        if (!packageMap.has(pkgId)) {
          packageMap.set(pkgId, {
            packageId: pkgId,
            packageName: order.packageName,
            revenue: 0,
            orders: 0,
            users: new Set()
          });
        }
        
        const pkgData = packageMap.get(pkgId);
        pkgData.revenue += order.amount;
        pkgData.orders += 1;
        pkgData.users.add(order.userId);
      });
      
      return Array.from(packageMap.values())
        .map(item => new RevenueByPackage(item))
        .sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error("❌ RevenueService.getRevenueByPackage error:", error);
      throw error;
    }
  }
  
  /**
   * Get revenue by PT (Personal Trainer)
   * Note: Requires ptId field in contracts collection
   * @returns {Promise<RevenueByPT[]>}
   */
  static async getRevenueByPT() {
    try {
      // TODO: Cần join với contracts để lấy ptId
      // Hiện tại payment_orders không có ptId
      // Cần thêm logic:
      // 1. Get all paid orders
      // 2. For each order, lookup contract by paymentOrderCode
      // 3. Get ptId from contract
      // 4. Group by ptId
      
      console.warn("⚠️ getRevenueByPT: Requires contract integration");
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
      const result = await PaymentOrderModel.getAll({ limit: 2000 });
      const orders = result.orders.filter(o => {
        if (!o.isPaid()) return false;
        
        const orderDate = o.createdAt instanceof Date 
          ? o.createdAt 
          : new Date(o.createdAt);
          
        return orderDate >= startDate && orderDate <= endDate;
      });
      
      // Calculate metrics
      const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
      const totalOrders = orders.length;
      const uniqueUsers = new Set(orders.map(o => o.userId)).size;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Top package
      const packageRevenue = {};
      orders.forEach(o => {
        if (!packageRevenue[o.packageId]) {
          packageRevenue[o.packageId] = {
            id: o.packageId,
            name: o.packageName,
            revenue: 0
          };
        }
        packageRevenue[o.packageId].revenue += o.amount;
      });
      
      const topPackage = Object.values(packageRevenue)
        .sort((a, b) => b.revenue - a.revenue)[0] || null;
      
      // Growth rate (so với period trước)
      const periodDuration = endDate - startDate;
      const prevStartDate = new Date(startDate.getTime() - periodDuration);
      const prevEndDate = startDate;
      
      const prevOrders = result.orders.filter(o => {
        if (!o.isPaid()) return false;
        const orderDate = o.createdAt instanceof Date 
          ? o.createdAt 
          : new Date(o.createdAt);
        return orderDate >= prevStartDate && orderDate < prevEndDate;
      });
      
      const prevRevenue = prevOrders.reduce((sum, o) => sum + o.amount, 0);
      const growthRate = prevRevenue > 0 
        ? ((totalRevenue - prevRevenue) / prevRevenue * 100) 
        : 0;
      
      return new RevenueSummary({
        totalRevenue,
        totalOrders,
        totalUsers: uniqueUsers,
        avgOrderValue,
        topPackage,
        topPT: null, // TODO: Implement
        growthRate,
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
      });
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
   * @returns {Promise<Object>}
   */
  static async compareRevenue(period1Start, period1End, period2Start, period2End) {
    try {
      const [summary1, summary2] = await Promise.all([
        this.getRevenueSummary(period1Start, period1End),
        this.getRevenueSummary(period2Start, period2End)
      ]);
      
      return {
        period1: summary1,
        period2: summary2,
        comparison: {
          revenueDiff: summary1.totalRevenue - summary2.totalRevenue,
          revenueGrowth: summary2.totalRevenue > 0 
            ? ((summary1.totalRevenue - summary2.totalRevenue) / summary2.totalRevenue * 100)
            : 0,
          ordersDiff: summary1.totalOrders - summary2.totalOrders,
          ordersGrowth: summary2.totalOrders > 0
            ? ((summary1.totalOrders - summary2.totalOrders) / summary2.totalOrders * 100)
            : 0
        }
      };
    } catch (error) {
      console.error("❌ RevenueService.compareRevenue error:", error);
      throw error;
    }
  }
  
  // ============================================
  // 🛠️ UTILITY METHODS
  // ============================================
  
  /**
   * Get week number from date
   * @param {Date} date 
   * @returns {number} Week number (1-52)
   */
  static getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
  
  /**
   * Format currency (VNĐ)
   * @param {number} amount 
   * @returns {string}
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
}
```

#### Step 1.3: Create Index File

**File:** `frontend_react/src/firebase/lib/features/revenue/index.js`

```javascript
export { RevenueService } from './revenue.service.js';
export {
  DailyRevenue,
  MonthlyRevenue,
  RevenueByPackage,
  RevenueByPT,
  RevenueSummary
} from './revenue.model.js';
```

---

### 📝 PHASE 2: Advanced Features (2-3 ngày)

#### Step 2.1: Revenue Report Service

**File:** `frontend_react/src/firebase/lib/features/revenue/revenue-report.service.js`

```javascript
import { RevenueService } from './revenue.service.js';
import * as XLSX from 'xlsx';

/**
 * 📄 Revenue Report Service
 * Generate exportable reports (Excel, PDF, CSV)
 */
export class RevenueReportService {
  
  /**
   * Generate comprehensive monthly report
   * @param {number} year 
   * @param {number} month 
   * @returns {Promise<Object>}
   */
  static async generateMonthlyReport(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const [summary, dailyRevenue, packageRevenue] = await Promise.all([
      RevenueService.getRevenueSummary(startDate, endDate),
      RevenueService.getRevenueByDay(startDate, endDate),
      RevenueService.getRevenueByPackage()
    ]);
    
    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      summary,
      dailyBreakdown: dailyRevenue,
      packageBreakdown: packageRevenue,
      generatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Export to Excel
   * @param {Object} reportData 
   * @param {string} filename 
   */
  static exportToExcel(reportData, filename = 'revenue-report.xlsx') {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Summary
    const summaryData = [
      ['Báo Cáo Doanh Thu'],
      ['Kỳ báo cáo:', reportData.period],
      ['Tổng doanh thu:', reportData.summary.totalRevenue],
      ['Tổng đơn hàng:', reportData.summary.totalOrders],
      ['Tổng khách hàng:', reportData.summary.totalUsers],
      ['Giá trị TB/đơn:', reportData.summary.avgOrderValue],
      ['Tăng trưởng:', `${reportData.summary.growthRate.toFixed(2)}%`]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');
    
    // Sheet 2: Daily breakdown
    const dailyData = [
      ['Ngày', 'Doanh thu', 'Số đơn', 'Giá trị TB'],
      ...reportData.dailyBreakdown.map(d => [
        d.date,
        d.revenue,
        d.orders,
        d.avgOrderValue
      ])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Theo ngày');
    
    // Sheet 3: Package breakdown
    const packageData = [
      ['Gói tập', 'Doanh thu', 'Số đơn', 'Số khách hàng'],
      ...reportData.packageBreakdown.map(p => [
        p.packageName,
        p.revenue,
        p.orders,
        p.uniqueUsers
      ])
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(packageData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Theo gói');
    
    // Generate file
    XLSX.writeFile(wb, filename);
  }
  
  /**
   * Export to CSV
   * @param {Array} data 
   * @param {string} filename 
   */
  static exportToCSV(data, filename = 'revenue-data.csv') {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
}
```

#### Step 2.2: Revenue Cache Service (Optional)

**File:** `frontend_react/src/firebase/lib/features/revenue/revenue-cache.service.js`

```javascript
/**
 * 💾 Revenue Cache Service
 * Cache frequently accessed revenue data
 */
export class RevenueCacheService {
  static cache = new Map();
  static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Get cached data or fetch new
   * @param {string} key 
   * @param {Function} fetchFn 
   * @returns {Promise<any>}
   */
  static async getCached(key, fetchFn) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`✅ Cache HIT: ${key}`);
      return cached.data;
    }
    
    console.log(`❌ Cache MISS: ${key}, fetching...`);
    const data = await fetchFn();
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
  
  /**
   * Clear all cache
   */
  static clearCache() {
    this.cache.clear();
    console.log('🗑️ Revenue cache cleared');
  }
  
  /**
   * Clear specific cache
   * @param {string} key 
   */
  static clearCacheKey(key) {
    this.cache.delete(key);
    console.log(`🗑️ Cache cleared: ${key}`);
  }
}
```

---

### 📝 PHASE 3: UI Components (2-3 ngày)

#### Step 3.1: Revenue Dashboard

**File:** `frontend_react/src/features/revenue/RevenueDashboard.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  ShoppingCart,
  People
} from '@mui/icons-material';
import { RevenueService } from '../../firebase/lib/features/revenue';

const RevenueDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [period, setPeriod] = useState('month'); // 'day', 'week', 'month', 'quarter', 'year'
  
  useEffect(() => {
    loadDashboard();
  }, [period]);
  
  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch(period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7 * 12); // 12 weeks
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 12); // 12 months
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 12); // 4 quarters
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 3); // 3 years
          break;
      }
      
      const data = await RevenueService.getRevenueSummary(startDate, endDate);
      setSummary(data);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📊 Dashboard Doanh Thu
      </Typography>
      
      {/* Period selector */}
      <Select value={period} onChange={e => setPeriod(e.target.value)}>
        <MenuItem value="day">Theo ngày</MenuItem>
        <MenuItem value="week">Theo tuần</MenuItem>
        <MenuItem value="month">Theo tháng</MenuItem>
        <MenuItem value="quarter">Theo quý</MenuItem>
        <MenuItem value="year">Theo năm</MenuItem>
      </Select>
      
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <AttachMoney color="primary" />
              <Typography variant="h6">Tổng Doanh Thu</Typography>
              <Typography variant="h4">
                {RevenueService.formatCurrency(summary.totalRevenue)}
              </Typography>
              <Typography variant="body2" color={summary.growthRate >= 0 ? 'success.main' : 'error.main'}>
                {summary.growthRate >= 0 ? '↑' : '↓'} {Math.abs(summary.growthRate).toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <ShoppingCart color="secondary" />
              <Typography variant="h6">Tổng Đơn Hàng</Typography>
              <Typography variant="h4">{summary.totalOrders}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <People color="info" />
              <Typography variant="h6">Khách Hàng</Typography>
              <Typography variant="h4">{summary.totalUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <TrendingUp color="success" />
              <Typography variant="h6">Giá Trị TB/Đơn</Typography>
              <Typography variant="h4">
                {RevenueService.formatCurrency(summary.avgOrderValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts section */}
      {/* TODO: Add RevenueChart component here */}
      
      {/* Top packages */}
      {summary.topPackage && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6">🏆 Gói Tập Bán Chạy Nhất</Typography>
            <Typography variant="h5">{summary.topPackage.name}</Typography>
            <Typography>{RevenueService.formatCurrency(summary.topPackage.revenue)}</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RevenueDashboard;
```

---

## 5. Implementation Checklist

### ✅ Phase 1: Foundation (1-2 ngày)

- [ ] Tạo folder `frontend_react/src/firebase/lib/features/revenue/`
- [ ] Tạo `revenue.model.js` với các data models
- [ ] Tạo `revenue.service.js` với core methods
- [ ] Tạo `index.js` để export
- [ ] Test các methods cơ bản:
  - [ ] `getRevenueByDay()`
  - [ ] `getRevenueByMonth()`
  - [ ] `getRevenueByPackage()`
  - [ ] `getRevenueSummary()`

### ✅ Phase 2: Advanced Features (2-3 ngày)

- [ ] Tạo `revenue-report.service.js`
- [ ] Implement export Excel
- [ ] Implement export CSV
- [ ] Tạo `revenue-cache.service.js` (optional)
- [ ] Implement các methods nâng cao:
  - [ ] `getRevenueByWeek()`
  - [ ] `getRevenueByQuarter()`
  - [ ] `getRevenueByYear()`
  - [ ] `compareRevenue()`
  - [ ] `getRevenueByPT()` (requires contract integration)

### ✅ Phase 3: UI Integration (2-3 ngày)

- [ ] Tạo `RevenueDashboard.jsx`
- [ ] Update `RevenueChart.jsx` để dùng RevenueService
- [ ] Tạo `RevenueComparison.jsx` (so sánh periods)
- [ ] Tạo `RevenueByPackage.jsx` (breakdown by package)
- [ ] Tạo `RevenueExport.jsx` (export buttons)
- [ ] Add navigation/routing

### ✅ Phase 4: Testing & Optimization (1-2 ngày)

- [ ] Unit tests cho RevenueService
- [ ] Integration tests với Firestore
- [ ] Performance testing với dataset lớn
- [ ] Cache optimization
- [ ] Error handling improvements
- [ ] Documentation updates

### ✅ Phase 5: Migration & Cleanup (1 ngày)

- [ ] Migrate các component cũ sang dùng RevenueService
- [ ] Deprecate `UserModel.calculatePackageRevenue()`
- [ ] Update README files
- [ ] Clean up unused code

---

## 6. API Reference

### RevenueService Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getRevenueByDay()` | `startDate`, `endDate` | `DailyRevenue[]` | Doanh thu theo ngày |
| `getRevenueByWeek()` | `year` | `Object[]` | Doanh thu theo tuần |
| `getRevenueByMonth()` | `year` | `MonthlyRevenue[]` | Doanh thu theo tháng |
| `getRevenueByQuarter()` | `year` | `Object[]` | Doanh thu theo quý |
| `getRevenueByYear()` | `startYear`, `endYear` | `Object[]` | Doanh thu theo năm |
| `getRevenueByPackage()` | - | `RevenueByPackage[]` | Doanh thu theo gói |
| `getRevenueByPT()` | - | `RevenueByPT[]` | Doanh thu theo PT |
| `getRevenueSummary()` | `startDate`, `endDate` | `RevenueSummary` | Tổng quan doanh thu |
| `compareRevenue()` | 4 dates | `Object` | So sánh 2 periods |

---

## 7. Testing Guidelines

### Unit Tests

```javascript
import { RevenueService } from './revenue.service';

describe('RevenueService', () => {
  test('getRevenueByDay returns correct data', async () => {
    const startDate = new Date('2025-12-01');
    const endDate = new Date('2025-12-31');
    
    const data = await RevenueService.getRevenueByDay(startDate, endDate);
    
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('date');
    expect(data[0]).toHaveProperty('revenue');
    expect(data[0]).toHaveProperty('orders');
  });
  
  test('getRevenueSummary calculates correctly', async () => {
    const startDate = new Date('2025-12-01');
    const endDate = new Date('2025-12-31');
    
    const summary = await RevenueService.getRevenueSummary(startDate, endDate);
    
    expect(summary.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(summary.totalOrders).toBeGreaterThanOrEqual(0);
    expect(summary.avgOrderValue).toBe(summary.totalRevenue / summary.totalOrders);
  });
});
```

### Integration Tests

```javascript
// Test with real Firestore data
test('Integration: Full revenue flow', async () => {
  // 1. Create test payment orders
  // 2. Query revenue
  // 3. Verify calculations
  // 4. Cleanup test data
});
```

---

## 8. Best Practices

### 🎯 Do's

✅ **Luôn filter theo status PAID**
```javascript
const orders = allOrders.filter(o => o.isPaid());
```

✅ **Dùng Date objects, không dùng strings**
```javascript
const orderDate = order.createdAt instanceof Date 
  ? order.createdAt 
  : new Date(order.createdAt);
```

✅ **Handle null/undefined**
```javascript
const revenue = order.amount || 0;
```

✅ **Cache cho queries phức tạp**
```javascript
const data = await RevenueCacheService.getCached('monthly-2025', 
  () => RevenueService.getRevenueByMonth(2025)
);
```

✅ **Limit queries**
```javascript
const result = await PaymentOrderModel.getAll({ limit: 1000 });
```

### ❌ Don'ts

❌ **Đừng tính doanh thu từ User.model**
```javascript
// SAI
const revenue = users.length * price; // Không biết ai đã trả tiền
```

❌ **Đừng query không có limit**
```javascript
// SAI
const allOrders = await getDocs(collection(db, 'payment_orders'));
```

❌ **Đừng parse string dates thủ công**
```javascript
// SAI
const date = order.createdAt.split('T')[0];
```

❌ **Đừng hardcode values**
```javascript
// SAI
const limit = 1000; // Nên dùng constant hoặc config
```

---

## 9. Performance Optimization

### Query Optimization

1. **Indexed Fields**
   ```javascript
   // Firestore indexes cần có:
   // - userId + status + createdAt
   // - status + createdAt
   // - packageId + status + createdAt
   ```

2. **Pagination**
   ```javascript
   static async getRevenueByDayPaginated(startDate, endDate, pageSize = 30) {
     // Implement cursor-based pagination
   }
   ```

3. **Aggregation (Future)**
   ```javascript
   // Sử dụng Firebase Extensions hoặc Cloud Functions
   // để tính toán và lưu aggregated data
   ```

---

## 10. Migration Plan

### Step-by-Step Migration

1. **Deploy new RevenueService** (không breaking changes)
2. **Update UI components** một cái một
3. **Deprecate old methods** với console warnings
4. **Monitor performance** trong 1-2 tuần
5. **Remove old code** sau khi stable

### Rollback Plan

- Giữ lại UserModel methods cũ như backup
- Có feature flag để switch giữa old/new
- Monitor errors và performance metrics

---

## 11. Future Enhancements

### Phase 6: Advanced Analytics (Future)

- 📊 Forecasting (dự đoán doanh thu)
- 📈 Cohort analysis (phân tích nhóm khách hàng)
- 💡 Revenue insights (AI-powered recommendations)
- 🔔 Revenue alerts (thông báo khi doanh thu bất thường)
- 📱 Mobile dashboard
- 🌍 Multi-currency support

---

## 12. FAQ

### Q: Tại sao không dùng User.model để tính doanh thu?

**A:** Vì User.model không chứa thông tin thanh toán thực tế. Chỉ biết user đăng ký gói nào, không biết:
- Đã thanh toán chưa
- Thanh toán bao nhiêu
- Khi nào thanh toán
- Phương thức thanh toán

### Q: Làm sao để tính doanh thu theo PT?

**A:** Cần join với `contracts` collection:
```javascript
payment_order -> orderCode
contract -> paymentOrderCode
contract -> ptId
```

### Q: Performance có bị ảnh hưởng không?

**A:** Có thể bị chậm với dataset lớn. Giải pháp:
1. Implement caching
2. Sử dụng Firestore composite indexes
3. Pre-aggregate data với Cloud Functions
4. Pagination cho large queries

### Q: Có cần thay đổi database schema không?

**A:** Không! Sử dụng schema hiện tại. Có thể add thêm indexes để tăng tốc.

---

## 📝 Kết Luận

Việc xây dựng hệ thống doanh thu dựa trên `PaymentOrderModel` sẽ:

✅ **Chính xác hơn** - Dựa trên đơn đã thanh toán thực tế
✅ **Toàn diện hơn** - Hỗ trợ nhiều loại báo cáo
✅ **Linh hoạt hơn** - Dễ mở rộng và customize
✅ **Maintainable hơn** - Code clean, separation of concerns

**Timeline ước tính:** 7-10 ngày cho full implementation

**Team size:** 1-2 developers

**Priority:** HIGH - Đây là tính năng quan trọng cho business analytics

---

## 📚 References

- [PaymentOrderModel Documentation](./frontend_react/src/firebase/lib/features/payment/README.md)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

---

**Document version:** 1.0  
**Created:** December 5, 2025  
**Last updated:** December 5, 2025  
**Author:** GitHub Copilot  
**Status:** 📝 DRAFT - Ready for implementation
