# 💼 Hệ thống Quản lý Tài chính - THU CHI LỢI NHUẬN

Hệ thống quản lý tài chính toàn diện cho phòng gym, bao gồm doanh thu, chi phí, lương, ngân sách và báo cáo lợi nhuận.

## 🎯 Tổng quan

Hệ thống được xây dựng với 6 modules chính:

1. **Revenue Module** 📈 - Quản lý doanh thu từ đơn hàng
2. **Expense Module** 💸 - Quản lý chi phí vận hành
3. **Salary Module** 💰 - Tính lương và hoa hồng nhân viên
4. **Budget Module** 📊 - Lập ngân sách và theo dõi thực hiện
5. **Financial Service** 💼 - Tổng hợp THU-CHI-LỢI NHUẬN
6. **Financial Dashboard** 🖥️ - Giao diện báo cáo tài chính

## 📁 Cấu trúc Project

```
frontend_react/src/
├── firebase/lib/features/
│   ├── revenue/
│   │   ├── revenue.model.js          # 9 revenue models
│   │   ├── revenue.service.js        # 15 revenue methods
│   │   ├── index.js
│   │   └── README.md
│   │
│   ├── expense/
│   │   ├── expense.model.js          # Expense CRUD + workflow
│   │   ├── expense-category.model.js # 15 preset categories
│   │   ├── expense.service.js        # 30+ expense methods
│   │   ├── index.js
│   │   └── README.md
│   │
│   ├── salary/
│   │   ├── salary-config.model.js    # Salary configuration
│   │   ├── salary.service.js         # Payroll calculations
│   │   └── index.js
│   │
│   ├── budget/
│   │   ├── budget.model.js           # Budget tracking
│   │   ├── budget.service.js         # Budget analysis
│   │   └── index.js
│   │
│   └── financial/
│       ├── financial.service.js      # Financial aggregation
│       └── index.js
│
└── pages/financial/
    └── FinancialDashboard.jsx        # UI Dashboard
```

## 🚀 Cài đặt và Sử dụng

### 1. Khởi tạo Firestore Collections

Hệ thống cần các collections sau:

```javascript
// Firestore Collections
- payment_orders      // Đơn hàng (có sẵn)
- expenses           // Chi phí
- expense_categories // Danh mục chi phí
- salary_configs     // Cấu hình lương
- budgets           // Ngân sách
```

### 2. Khởi tạo Expense Categories

```javascript
import { ExpenseCategoryModel } from './firebase/lib/features/expense';

// Tạo 15 categories mặc định
await ExpenseCategoryModel.initializePresetCategories();
```

### 3. Import Dashboard vào Router

```javascript
// App.jsx hoặc routes
import FinancialDashboard from './pages/financial/FinancialDashboard';

// Add route
<Route path="/financial" element={<FinancialDashboard />} />
```

### 4. Truy cập Dashboard

Mở trình duyệt và truy cập:
```
http://localhost:5173/financial
```

## 📖 Hướng dẫn sử dụng nhanh

### Xem báo cáo tài chính tháng

```javascript
import { FinancialService } from './firebase/lib/features/financial';

const report = await FinancialService.getMonthlyFinancialReport(2024, 12);

console.log("Doanh thu:", report.revenue.total);
console.log("Chi phí:", report.breakdown.totalCosts);
console.log("Lợi nhuận:", report.profitLoss.netProfit);
console.log("ROI:", report.profitLoss.roi + "%");
```

### Tạo chi phí mới

```javascript
import { ExpenseService, EXPENSE_TYPE, EXPENSE_CATEGORY } from './firebase/lib/features/expense';

const expense = await ExpenseService.createExpense({
  type: EXPENSE_TYPE.RENT,
  category: EXPENSE_CATEGORY.INFRASTRUCTURE,
  amount: 15000000,
  description: "Thuê mặt bằng tháng 12",
  dueDate: new Date("2024-12-05"),
  vendorName: "Chủ nhà",
});
```

### Tính lương nhân viên

```javascript
import { SalaryService } from './firebase/lib/features/salary';

// Tính lương 1 nhân viên
const salary = await SalaryService.calculateSalary("employee-id", 2024, 12);

// Hoặc tính lương tất cả
const payroll = await SalaryService.processPayroll(2024, 12);
console.log("Tổng lương:", payroll.totalPayroll);
```

### Tạo ngân sách

```javascript
import { BudgetService, BUDGET_PERIOD } from './firebase/lib/features/budget';

const budget = await BudgetService.createBudgetFromCategories({
  name: "Ngân sách tháng 12/2024",
  period: BUDGET_PERIOD.MONTHLY,
  year: 2024,
  month: 12,
});

// Cập nhật thực tế so với kế hoạch
await BudgetService.updateBudgetActuals(budget.id);
```

### So sánh 2 tháng

```javascript
const comparison = await FinancialService.compareFinancialPeriods(
  { type: "monthly", year: 2024, month: 11 },
  { type: "monthly", year: 2024, month: 12 }
);

console.log("Tăng trưởng doanh thu:", comparison.comparison.revenue.percentChange + "%");
console.log("Tăng trưởng lợi nhuận:", comparison.comparison.profit.percentChange + "%");
```

## 📊 Dashboard Features

Dashboard có 4 tabs chính:

### Tab 1: Tổng quan
- 4 Summary Cards: Doanh thu, Chi phí, Lợi nhuận, ROI
- Cơ cấu tài chính (Revenue - Costs = Profit)
- Biên lợi nhuận (Gross Margin, Net Margin, ROI)

### Tab 2: Chi tiết Thu Chi
- Doanh thu theo gói tập
- Chi phí theo loại
- Chi tiết lương (cơ bản, phụ cấp, hoa hồng)

### Tab 3: KPIs
- Doanh thu / Đơn hàng
- Doanh thu / Nhân viên
- Tỷ lệ chi phí
- Các chỉ số hiệu suất khác

### Tab 4: Xu hướng
- Biểu đồ 6 tháng gần nhất
- So sánh doanh thu, chi phí, lợi nhuận
- Tính trung bình

## 🔥 Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Payment orders (có sẵn)
    match /payment_orders/{orderId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Expenses
    match /expenses/{expenseId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
        (request.auth.token.role == 'admin' || request.auth.token.role == 'accountant');
      allow delete: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Expense categories
    match /expense_categories/{categoryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Salary configs
    match /salary_configs/{configId} {
      allow read: if request.auth != null && request.auth.token.role == 'admin';
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Budgets
    match /budgets/{budgetId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'admin' || request.auth.token.role == 'accountant');
    }
  }
}
```

## 📈 Công thức tính toán

### 1. Doanh thu (Revenue)
```
Tổng doanh thu = Σ(Đơn hàng đã thanh toán)
```

### 2. Chi phí (Expenses)
```
Tổng chi phí = Chi phí vận hành + Chi phí lương
```

### 3. Lợi nhuận (Profit)
```
Lợi nhuận gộp = Doanh thu - Chi phí vận hành
Lợi nhuận ròng = Doanh thu - Tổng chi phí
```

### 4. Biên lợi nhuận (Margin)
```
Gross Margin = (Lợi nhuận gộp / Doanh thu) × 100%
Net Margin = (Lợi nhuận ròng / Doanh thu) × 100%
```

### 5. ROI (Return on Investment)
```
ROI = (Lợi nhuận ròng / Tổng chi phí) × 100%
```

### 6. Lương nhân viên
```
Lương cơ bản
+ Phụ cấp
+ Hoa hồng (nếu có)
+ Làm thêm giờ
+ Thưởng
- Khấu trừ
- Bảo hiểm (BHXH, BHYT, BHTN)
- Thuế
= Lương thực nhận
```

## 🎨 UI Components

Dashboard sử dụng Material-UI:

```javascript
// Components được sử dụng
- Container, Grid, Paper
- Card, CardContent
- Typography, Box
- Button, Select, MenuItem
- Tabs, Tab
- Chip, Alert
- CircularProgress
- Icons: TrendingUp, TrendingDown, AttachMoney, etc.
```

## 🔧 Customization

### Thêm expense category mới

```javascript
const newCategory = new ExpenseCategoryModel({
  code: "CUSTOM-001",
  name: "Chi phí tùy chỉnh",
  type: "other",
  category: "operations",
  icon: "🔧",
  color: "#FF5733",
  monthlyBudgetLimit: 5000000,
  requiresApproval: true,
  approvalThreshold: 1000000,
});

await newCategory.save();
```

### Thêm loại lương mới

```javascript
const salaryConfig = new SalaryConfigModel({
  employeeId: "emp-123",
  employeeName: "Nguyễn Văn A",
  employeeRole: EMPLOYEE_ROLE.PT,
  salaryType: SALARY_TYPE.MIXED,
  baseSalary: 10000000,
  hasCommission: true,
  commissionRate: 10, // 10%
});

await salaryConfig.save();
```

## 📊 Export Excel

Dashboard có nút "Xuất Excel" để export báo cáo:

```javascript
// Tự động tạo file CSV
bao-cao-tai-chinh-12-2024.csv
```

## 🚨 Lưu ý quan trọng

1. **Dữ liệu ban đầu**: Cần có dữ liệu payment_orders để tính doanh thu
2. **Expense Categories**: Chạy `initializePresetCategories()` lần đầu
3. **Salary Config**: Tạo cấu hình lương cho từng nhân viên
4. **Permissions**: Chỉ admin và accountant mới có quyền tạo/sửa chi phí

## 🎯 Workflow hoàn chỉnh

### Tháng mới:
1. Tạo ngân sách tháng mới
2. Tạo chi phí định kỳ (thuê mặt bằng, điện nước, internet...)
3. Tính lương cuối tháng
4. Tạo expense cho lương
5. Xem báo cáo tài chính
6. Export Excel để lưu trữ

### Hàng ngày:
1. Tạo chi phí phát sinh (nếu có)
2. Phê duyệt chi phí chờ duyệt
3. Đánh dấu chi phí đã thanh toán
4. Xem dashboard để theo dõi

## 🔗 Integration với các module khác

- **UserModel**: Lấy thông tin khách hàng
- **PaymentOrderModel**: Lấy doanh thu
- **EmployeeModel**: Lấy thông tin nhân viên
- **ContractModel**: Tính hoa hồng PT

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra console log
2. Xem Firestore rules
3. Kiểm tra dữ liệu collections
4. Đọc README của từng module

---

## ✅ Checklist triển khai

- [ ] 1. Tạo Firestore collections
- [ ] 2. Chạy initializePresetCategories()
- [ ] 3. Tạo salary configs cho nhân viên
- [ ] 4. Add route `/financial` vào router
- [ ] 5. Test tạo expense
- [ ] 6. Test tính lương
- [ ] 7. Test tạo ngân sách
- [ ] 8. Test xem dashboard
- [ ] 9. Test export Excel
- [ ] 10. Setup Firestore security rules

---

**🎉 Hệ thống hoàn chỉnh và sẵn sàng sử dụng!**

Truy cập: `http://localhost:5173/financial`
