# 💸 Expense Module

Module quản lý chi phí cho hệ thống gym management.

## 📁 Cấu trúc

```
expense/
├── expense.model.js          # Model chi phí
├── expense-category.model.js # Model danh mục chi phí
├── expense.service.js        # Service xử lý nghiệp vụ
├── index.js                  # Export module
└── README.md                 # Documentation
```

## 🎯 Tính năng chính

### 1. ExpenseModel

Model quản lý chi phí với đầy đủ workflow:

**Thuộc tính:**
- `id`, `expenseNumber` - Mã định danh
- `type`, `category` - Phân loại chi phí
- `amount` - Số tiền
- `status` - Trạng thái: pending/paid/cancelled/rejected
- `approvalStatus` - Phê duyệt: pending/approved/rejected
- `expenseDate`, `dueDate`, `paidDate` - Ngày tháng
- `vendorName`, `vendorContact` - Nhà cung cấp
- `paymentMethod` - Phương thức thanh toán
- `receiptUrl`, `attachments` - Chứng từ
- `isRecurring`, `recurringPeriod` - Chi phí định kỳ

**Methods:**
- CRUD: `save()`, `getById()`, `getAll()`, `delete()`
- Workflow: `approve()`, `reject()`, `markAsPaid()`, `cancel()`
- Status checks: `isPaid()`, `isPending()`, `isOverdue()`, `needsApproval()`
- Formatters: `getFormattedAmount()`, `getTypeLabel()`, `getStatusLabel()`

### 2. ExpenseCategoryModel

Model quản lý danh mục chi phí:

**Thuộc tính:**
- `code`, `name` - Mã và tên
- `type`, `category` - Phân loại
- `icon`, `color` - Hiển thị UI
- `monthlyBudgetLimit`, `quarterlyBudgetLimit`, `yearlyBudgetLimit` - Giới hạn ngân sách
- `requiresApproval`, `approvalThreshold` - Yêu cầu phê duyệt
- `isRecurring`, `recurringPeriod` - Chi phí định kỳ
- `defaultAmount` - Số tiền mặc định

**15 Preset Categories:**
1. 💰 Lương cố định (Fixed Salary)
2. 🏋️ Hoa hồng PT (PT Commission)
3. 🏢 Thuê mặt bằng (Rent)
4. ⚡ Điện (Electricity)
5. 💧 Nước (Water)
6. 🌐 Internet
7. 🚗 Bãi giữ xe (Parking)
8. 🧹 Vệ sinh (Cleaning)
9. 🛡️ Bảo vệ (Security)
10. 🏋️‍♂️ Mua thiết bị (Equipment)
11. 🔧 Bảo trì (Maintenance)
12. 📢 Quảng cáo (Advertising)
13. 🎁 Khuyến mãi (Promotion)

### 3. ExpenseService

Service xử lý logic nghiệp vụ:

**Query Methods:**
- `getExpensesByDay(date)`
- `getExpensesByMonth(year, month)`
- `getExpensesByQuarter(year, quarter)`
- `getExpensesByYear(year)`
- `getExpensesByDateRange(start, end, options)`
- `getExpensesByVendor(vendorName)`
- `searchExpenses(searchTerm)`

**Summary Methods:**
- `getDailyExpenseSummary(date)`
- `getMonthlyExpenseSummary(year, month)`
- `getQuarterlyExpenseSummary(year, quarter)`
- `getYearlyExpenseSummary(year)`
- `getExpenseStatistics(year, month)`
- `compareExpenses(period1Start, period1End, period2Start, period2End)`

**Workflow Methods:**
- `createExpense(data)` - Tạo chi phí mới
- `approveExpense(id, approverInfo)` - Phê duyệt
- `rejectExpense(id, rejectInfo)` - Từ chối
- `markAsPaid(id, paymentInfo)` - Đánh dấu đã thanh toán
- `bulkApproveExpenses(ids, approverInfo)` - Phê duyệt hàng loạt

**Special Methods:**
- `getPendingApprovals()` - Lấy chi phí chờ duyệt
- `getOverdueExpenses()` - Lấy chi phí quá hạn
- `getUpcomingExpenses(days)` - Lấy chi phí sắp đến hạn
- `getRecurringExpenses()` - Lấy chi phí định kỳ
- `exportToCSV(expenses)` - Export Excel

## 📖 Ví dụ sử dụng

### Tạo chi phí mới

```javascript
import { ExpenseService, EXPENSE_TYPE, EXPENSE_CATEGORY } from './features/expense';

// Tạo chi phí lương
const salaryExpense = await ExpenseService.createExpense({
  type: EXPENSE_TYPE.SALARY,
  category: EXPENSE_CATEGORY.HUMAN_RESOURCE,
  amount: 25000000,
  description: "Lương tháng 12/2024",
  vendorName: "Nhân viên ABC",
  dueDate: new Date("2024-12-05"),
  categoryId: "salary-category-id",
});
```

### Lấy báo cáo chi phí tháng

```javascript
// Lấy tất cả chi phí tháng 12/2024
const summary = await ExpenseService.getMonthlyExpenseSummary(2024, 12);

console.log("Tổng chi:", summary.totalExpenses);
console.log("Số lượng:", summary.expenseCount);
console.log("Chờ duyệt:", summary.pendingCount);
console.log("Theo loại:", summary.byType);
console.log("Theo danh mục:", summary.byCategory);
```

### Phê duyệt chi phí

```javascript
// Lấy danh sách chờ duyệt
const pendingExpenses = await ExpenseService.getPendingApprovals();

// Phê duyệt
await ExpenseService.approveExpense(expenseId, {
  approverId: "admin-id",
  approverName: "Admin",
  approverRole: "admin",
  approvalNote: "Đã duyệt",
});

// Hoặc từ chối
await ExpenseService.rejectExpense(expenseId, {
  rejectedBy: "admin-id",
  rejectedName: "Admin",
  rejectReason: "Không đủ chứng từ",
});
```

### Đánh dấu đã thanh toán

```javascript
await ExpenseService.markAsPaid(expenseId, {
  paidBy: "accountant-id",
  paidByName: "Kế toán",
  paymentNote: "Đã chuyển khoản",
  transactionId: "TXN123456",
});
```

### Xem chi phí quá hạn

```javascript
const overdueExpenses = await ExpenseService.getOverdueExpenses();

overdueExpenses.forEach(expense => {
  console.log(`${expense.expenseNumber}: Quá hạn ${expense.getDaysUntilDue()} ngày`);
});
```

### Xem chi phí sắp đến hạn (7 ngày tới)

```javascript
const upcomingExpenses = await ExpenseService.getUpcomingExpenses(7);

upcomingExpenses.forEach(expense => {
  console.log(`${expense.expenseNumber}: Còn ${expense.getDaysUntilDue()} ngày`);
});
```

### So sánh chi phí giữa 2 tháng

```javascript
const comparison = await ExpenseService.compareExpenses(
  new Date("2024-11-01"),
  new Date("2024-11-30"),
  new Date("2024-12-01"),
  new Date("2024-12-31")
);

console.log("Tháng 11:", comparison.period1.total);
console.log("Tháng 12:", comparison.period2.total);
console.log("Chênh lệch:", comparison.comparison.difference);
console.log("Thay đổi:", comparison.comparison.percentChange + "%");
console.log("Xu hướng:", comparison.comparison.trend); // increase/decrease/stable
```

### Thống kê chi phí

```javascript
const stats = await ExpenseService.getExpenseStatistics(2024, 12);

console.log("Tổng đã trả:", stats.totalPaid);
console.log("Tổng chưa trả:", stats.totalPending);
console.log("Trung bình:", stats.averageExpense);
console.log("Lớn nhất:", stats.largestExpense.amount);
console.log("Nhỏ nhất:", stats.smallestExpense.amount);
```

### Khởi tạo categories mặc định

```javascript
import { ExpenseCategoryModel } from './features/expense';

// Tạo 15 categories mặc định
await ExpenseCategoryModel.initializePresetCategories();
```

### Lấy categories theo loại

```javascript
// Lấy tất cả categories loại salary
const salaryCategories = await ExpenseCategoryModel.getByType(EXPENSE_TYPE.SALARY);

// Lấy tất cả categories danh mục nhân sự
const hrCategories = await ExpenseCategoryModel.getByCategory(EXPENSE_CATEGORY.HUMAN_RESOURCE);
```

### Export Excel

```javascript
const expenses = await ExpenseService.getExpensesByMonth(2024, 12);
const csvData = ExpenseService.exportToCSV(expenses);

// Download file
const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
const link = document.createElement("a");
link.href = URL.createObjectURL(blob);
link.download = "chi-phi-thang-12-2024.csv";
link.click();
```

## 🔄 Workflow

### 1. Tạo chi phí mới
```
User tạo → Check category rules → Auto-set approval status → Save to Firestore
```

### 2. Phê duyệt chi phí
```
Pending → Admin approve/reject → Approved/Rejected → Update status
```

### 3. Thanh toán chi phí
```
Approved → Mark as paid → Update paidDate → Status = paid
```

## 🔐 Security Rules (Firestore)

```javascript
match /expenses/{expenseId} {
  // Chỉ admin và kế toán có thể tạo/sửa
  allow create, update: if request.auth != null && 
    (request.auth.token.role == 'admin' || request.auth.token.role == 'accountant');
  
  // Ai cũng có thể đọc (nếu đã đăng nhập)
  allow read: if request.auth != null;
  
  // Chỉ admin mới có thể xóa
  allow delete: if request.auth != null && request.auth.token.role == 'admin';
}

match /expense_categories/{categoryId} {
  // Chỉ admin có thể tạo/sửa/xóa
  allow write: if request.auth != null && request.auth.token.role == 'admin';
  
  // Ai cũng có thể đọc
  allow read: if request.auth != null;
}
```

## 📊 Data Structure

### Expense Document
```javascript
{
  expenseNumber: "EXP-20241205-001",
  type: "salary",
  category: "human_resource",
  amount: 25000000,
  status: "paid",
  approvalStatus: "approved",
  expenseDate: Timestamp,
  dueDate: Timestamp,
  paidDate: Timestamp,
  vendorName: "Nhân viên ABC",
  description: "Lương tháng 12",
  paymentMethod: "bank_transfer",
  receiptUrl: "https://...",
  createdBy: "user-id",
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### Expense Category Document
```javascript
{
  code: "SAL-001",
  name: "Lương cố định",
  type: "salary",
  category: "human_resource",
  icon: "💰",
  color: "#FF6B6B",
  isRecurring: true,
  recurringPeriod: "monthly",
  monthlyBudgetLimit: 40000000,
  requiresApproval: true,
  approvalThreshold: 10000000,
  active: true,
  createdAt: Timestamp,
}
```

## 🚀 Next Steps

Sau khi hoàn thành Expense Module, tiếp tục với:

1. **Phase 3: Salary Module** - Tính lương nhân viên, hoa hồng PT
2. **Phase 4: Budget Module** - Quản lý ngân sách, so sánh kế hoạch vs thực tế
3. **Phase 5: Financial Service** - Tổng hợp THU-CHI-LỢI NHUẬN
4. **Phase 6: UI Dashboard** - Giao diện quản lý tài chính

---

✅ **Expense Module hoàn thành!**
