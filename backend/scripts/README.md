# 🎭 Mock Data Scripts

Scripts để tạo và quản lý mock data cho Gym Management System.

## 📁 Files

- `seed-mock-data.js` - Tạo mock data vào Firestore
- `cleanup-mock-data.js` - Xóa toàn bộ mock data
- `quick-start.js` - Interactive CLI menu

## 🚀 Quick Start

### Cách 1: Sử dụng Interactive Menu (Recommended)
```bash
cd backend
node scripts/quick-start.js
```

### Cách 2: Sử dụng NPM Scripts
```bash
cd backend

# Generate mock data
npm run seed

# Cleanup mock data
npm run cleanup

# Interactive menu
npm run mock:menu
```

### Cách 3: Chạy Trực Tiếp
```bash
cd backend

# Generate
node scripts/seed-mock-data.js

# Cleanup
node scripts/cleanup-mock-data.js
```

## 📊 Data Generated

- 👥 50 Users
- 💼 15 Employees
- 📦 5 Packages
- 💰 100 Payment Orders
- 📄 80 Contracts
- 🏋️ 500 Check-ins
- 💸 50 Expenses
- 📂 7 Expense Categories
- ⭐ 60 PT Reviews
- 📅 100 Schedules
- 🔔 80 Notifications
- 💳 10 Spending Users

**Total: ~1,000 documents**

## 📖 Documentation

See [MOCK_DATA_GUIDE.md](../../MOCK_DATA_GUIDE.md) for detailed usage guide.

## ⚠️ Important

**NEVER run cleanup script on production!** These scripts are for development/testing only.
