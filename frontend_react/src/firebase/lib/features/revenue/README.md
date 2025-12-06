# 💰 Revenue Module

Module quản lý và tính toán doanh thu cho hệ thống Gym Management.

## 📁 Cấu trúc

```
revenue/
├── revenue.model.js          # Data models
├── revenue.service.js        # Business logic
├── revenue-report.service.js # Report generation
├── index.js                  # Export module
└── README.md                 # Documentation
```

## 📊 Data Models

### 1. DailyRevenue
Doanh thu theo ngày

```javascript
const dailyRevenue = new DailyRevenue({
  date: "2025-12-05",
  revenue: 1500000,
  orders: 5,
  avgOrderValue: 300000
});

console.log(dailyRevenue.getFormattedRevenue()); // "1.500.000 ₫"
console.log(dailyRevenue.getDayOfWeek());        // "Thứ 5"
```

### 2. MonthlyRevenue
Doanh thu theo tháng

```javascript
const monthlyRevenue = new MonthlyRevenue({
  month: "2025-12",
  revenue: 45000000,
  orders: 150,
  growth: 15.5
});

console.log(monthlyRevenue.getMonthName());       // "Tháng 12/2025"
console.log(monthlyRevenue.getGrowthIndicator()); // "↑"
console.log(monthlyRevenue.getGrowthColor());     // "success"
```

### 3. RevenueByPackage
Doanh thu theo gói tập

```javascript
const packageRevenue = new RevenueByPackage({
  packageId: "pkg_basic",
  packageName: "Gói Cơ Bản",
  revenue: 20000000,
  orders: 40,
  users: ["user1", "user2", "user3"]
});

console.log(packageRevenue.uniqueUsers);          // 3
console.log(packageRevenue.avgRevenuePerUser);    // 6666666.67
```

### 4. RevenueByPT
Doanh thu theo Personal Trainer

```javascript
const ptRevenue = new RevenueByPT({
  ptId: "pt_123",
  ptName: "Nguyễn Văn A",
  revenue: 10000000,
  orders: 15,
  clients: 10,
  commission: 2000000
});

console.log(ptRevenue.netRevenue);                // 8000000
console.log(ptRevenue.commissionRate);            // "20.00"
```

### 5. RevenueSummary
Tổng quan doanh thu

```javascript
const summary = new RevenueSummary({
  totalRevenue: 100000000,
  totalOrders: 300,
  totalUsers: 150,
  avgOrderValue: 333333,
  growthRate: 15.5,
  period: "2025-12"
});

console.log(summary.getKPIs());
// {
//   totalRevenue: 100000000,
//   totalOrders: 300,
//   totalUsers: 150,
//   avgOrderValue: 333333,
//   revenuePerUser: 666666.67,
//   orderRate: "2.00",
//   growthRate: 15.5
// }
```

### 6. WeeklyRevenue
Doanh thu theo tuần

```javascript
const weeklyRevenue = new WeeklyRevenue({
  week: "2025-W48",
  weekNumber: 48,
  year: 2025,
  revenue: 7000000,
  orders: 25
});

console.log(weeklyRevenue.getWeekLabel()); // "Tuần 48/2025"
```

### 7. QuarterlyRevenue
Doanh thu theo quý

```javascript
const quarterlyRevenue = new QuarterlyRevenue({
  quarter: "Q4",
  year: 2025,
  revenue: 120000000,
  orders: 400,
  months: [10, 11, 12]
});

console.log(quarterlyRevenue.getQuarterName()); // "Quý 4 (Oct-Dec)"
```

### 8. YearlyRevenue
Doanh thu theo năm

```javascript
const yearlyRevenue = new YearlyRevenue({
  year: 2025,
  revenue: 500000000,
  orders: 1500,
  avgMonthlyRevenue: 41666667
});

console.log(yearlyRevenue.getFormattedRevenue()); // "500.000.000 ₫"
```

### 9. RevenueComparison
So sánh doanh thu giữa 2 kỳ

```javascript
const comparison = new RevenueComparison({
  period1: "2025-12",
  period2: "2025-11",
  revenue1: 100000000,
  revenue2: 85000000
});

console.log(comparison.revenueDiff);      // 15000000
console.log(comparison.revenueGrowth);    // "17.65"
console.log(comparison.isGrowing);        // true
console.log(comparison.getFormattedDiff()); // "+15.000.000 ₫"
```

## 🚀 Usage

### Import Models

```javascript
import {
  DailyRevenue,
  MonthlyRevenue,
  RevenueByPackage,
  RevenueByPT,
  RevenueSummary,
  WeeklyRevenue,
  QuarterlyRevenue,
  YearlyRevenue,
  RevenueComparison
} from '@/firebase/lib/features/revenue';
```

### Using in Components

```jsx
import React, { useState, useEffect } from 'react';
import { RevenueService } from '@/firebase/lib/features/revenue';

const RevenueChart = () => {
  const [dailyData, setDailyData] = useState([]);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const data = await RevenueService.getRevenueByDay(startDate, endDate);
    setDailyData(data);
  };
  
  return (
    <div>
      {dailyData.map(day => (
        <div key={day.date}>
          <span>{day.getFormattedDate()}</span>
          <span>{day.getFormattedRevenue()}</span>
          <span>{day.orders} đơn</span>
        </div>
      ))}
    </div>
  );
};
```

## 📝 Common Methods

### Formatting Methods

All revenue models have formatting methods:

- `getFormattedRevenue()` - Format số tiền thành VNĐ
- `getFormattedDate()` - Format ngày tháng
- `toJSON()` - Convert to plain object

### Calculation Methods

- `avgOrderValue` - Giá trị trung bình đơn hàng
- `uniqueUsers` - Số lượng user duy nhất
- `avgRevenuePerUser` - Doanh thu trung bình/user
- `netRevenue` - Doanh thu sau hoa hồng
- `commissionRate` - Tỷ lệ hoa hồng

## 🎨 Display Helpers

### Growth Indicators

```javascript
const monthly = new MonthlyRevenue({ growth: 15.5 });
monthly.getGrowthIndicator(); // "↑"
monthly.getGrowthColor();     // "success"

const declining = new MonthlyRevenue({ growth: -5.2 });
declining.getGrowthIndicator(); // "↓"
declining.getGrowthColor();     // "error"
```

### Status

```javascript
const summary = new RevenueSummary({ growthRate: 15 });
summary.getGrowthStatus(); 
// "excellent" (> 10%)
// "good" (> 0%)
// "stable" (= 0%)
// "declining" (< 0%)
```

## 🔧 Best Practices

### 1. Always validate data

```javascript
const revenue = new DailyRevenue({
  date: "2025-12-05",
  revenue: data.revenue || 0,  // Default to 0
  orders: data.orders || 0
});
```

### 2. Use formatting methods in UI

```javascript
// ✅ GOOD
<span>{revenue.getFormattedRevenue()}</span>

// ❌ BAD
<span>{revenue.revenue.toLocaleString()}</span>
```

### 3. Use toJSON() for API/storage

```javascript
const revenueData = dailyRevenue.toJSON();
await saveToDatabase(revenueData);
```

## 📚 Next Steps

1. ✅ Models created
2. ⏳ Create RevenueService
3. ⏳ Create ReportService
4. ⏳ Create UI components
5. ⏳ Add tests

---

**Version:** 1.0  
**Created:** December 5, 2025  
**Status:** ✅ Models Complete, Service In Progress
