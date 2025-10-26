# 🏋️ Hướng Dẫn Tương Tác User - Package

## 📋 Tổng Quan

Hệ thống quản lý phòng gym cho phép:
- ✅ Admin tạo và quản lý các gói tập
- ✅ User đăng ký gói tập
- ✅ Tự động tính toán ngày hết hạn
- ✅ Quản lý gói theo thời gian hoặc theo buổi
- ✅ Áp dụng discount tự động

## 🔐 Firestore Rules

Đảm bảo bạn đã thêm rule cho collection `packages` trong file `firestore.rules`:

```javascript
// Packages collection
match /packages/{packageId} {
  allow read: if true; // Cho phép mọi người xem gói tập
  allow write: if true; // Chỉ admin mới được tạo/sửa/xóa gói
}
```

**Sau khi sửa file rules, nhớ deploy:**
```bash
firebase deploy --only firestore:rules
```

## 📦 Cấu Trúc Package

```javascript
{
  PackageId: string,           // Auto-generated
  PackageName: string,         // Tên gói tập
  PackageType: "time" | "session", // Gói theo thời gian hoặc buổi
  Description: string,         // Mô tả
  Duration: number,            // Số ngày có hiệu lực
  Price: number,               // Giá gốc
  Status: "active" | "inactive", // Trạng thái
  NumberOfSession: number,     // Số buổi (nếu là gói theo buổi)
  Discount: number,            // % giảm giá
  StartDayDiscount: Date,      // Ngày bắt đầu giảm giá
  EndDayDiscount: Date,        // Ngày kết thúc giảm giá
  UsageCondition: string,      // Điều kiện sử dụng
  CreatedAt: Timestamp,
  UpdatedAt: Timestamp
}
```

## 👤 Cấu Trúc User (liên quan đến Package)

```javascript
{
  _id: string,
  full_name: string,
  current_package_id: string,     // ID của gói tập hiện tại
  package_end_date: Date,         // Ngày hết hạn
  remaining_sessions: number,     // Số buổi còn lại (nếu gói theo buổi)
  membership_status: "Active" | "Expired" | "Frozen" | "Trial",
  // ... các field khác
}
```

## 🚀 Các Tính Năng Chính

### 1. **PackageModel Methods**

#### Tạo gói tập mới
```javascript
import { PackageModel } from "./firebase/lib/features/package/packages.model.js";

const packageData = {
  PackageName: "Gói 3 Tháng Premium",
  PackageType: "time",
  Description: "Gói tập 3 tháng không giới hạn",
  Duration: 90,
  Price: 2000000,
  Status: "active",
};

const newPackage = await PackageModel.create(packageData);
```

#### Lấy danh sách gói tập
```javascript
// Lấy tất cả gói active
const activePackages = await PackageModel.getAll({ status: "active" });

// Lấy tất cả gói
const allPackages = await PackageModel.getAll();
```

#### Lấy gói tập theo ID
```javascript
const package = await PackageModel.getById("packageId");
```

#### Cập nhật gói tập
```javascript
await PackageModel.update("packageId", {
  Price: 2500000,
  Discount: 15
});
```

#### Xóa gói tập
```javascript
await PackageModel.delete("packageId");
```

#### Tính giá sau discount
```javascript
const package = await PackageModel.getById("packageId");
const finalPrice = package.getFinalPrice(); // Tự động áp dụng discount nếu còn hạn
```

#### Tính ngày hết hạn
```javascript
const package = await PackageModel.getById("packageId");
const endDate = package.calculateEndDate(new Date()); // Tính từ hôm nay
```

---

### 2. **UserModel Methods (Package Interaction)**

#### Lấy thông tin gói tập hiện tại
```javascript
import UserModel from "./firebase/lib/features/user/user.model.js";

const user = await UserModel.getById("userId");
const currentPackage = await user.getCurrentPackage();
console.log(currentPackage);
```

#### Đăng ký gói tập mới
```javascript
const user = await UserModel.getById("userId");
const result = await user.registerPackage("packageId");

console.log(result);
// {
//   success: true,
//   package: {...},
//   endDate: Date,
//   message: "Đăng ký gói tập thành công"
// }
```

#### Gia hạn gói tập hiện tại
```javascript
const user = await UserModel.getById("userId");
const result = await user.renewPackage();

console.log(result.endDate); // Ngày hết hạn mới
```

#### Kiểm tra gói tập còn hiệu lực
```javascript
const user = await UserModel.getById("userId");
const isActive = user.isPackageActive(); // true/false
```

#### Lấy số ngày còn lại
```javascript
const user = await UserModel.getById("userId");
const daysRemaining = user.getDaysRemaining(); // số ngày
```

#### Sử dụng 1 buổi tập (gói theo buổi)
```javascript
const user = await UserModel.getById("userId");
const result = await user.useSession();

console.log(result.remainingSessions); // Số buổi còn lại
```

---

## 💡 Ví Dụ Workflow Hoàn Chỉnh

```javascript
// 1. Admin tạo gói tập
const packageData = {
  PackageName: "Gói 3 Tháng",
  PackageType: "time",
  Duration: 90,
  Price: 2000000,
  Status: "active",
  Discount: 10,
  StartDayDiscount: new Date("2025-01-01"),
  EndDayDiscount: new Date("2025-01-31"),
};
const newPackage = await PackageModel.create(packageData);

// 2. User xem danh sách gói tập
const packages = await PackageModel.getAll({ status: "active" });

// 3. User đăng ký gói tập
const user = await UserModel.getByPhoneNumber("0987654321");
await user.registerPackage(newPackage.id);

// 4. Kiểm tra thông tin
const currentPackage = await user.getCurrentPackage();
console.log("Gói tập:", currentPackage.PackageName);
console.log("Giá:", currentPackage.getFinalPrice());
console.log("Ngày hết hạn:", user.package_end_date);
console.log("Số ngày còn lại:", user.getDaysRemaining());

// 5. User check-in (nếu gói theo buổi)
if (currentPackage.PackageType === "session") {
  await user.useSession();
}

// 6. Gia hạn khi hết hạn
if (!user.isPackageActive()) {
  await user.renewPackage();
}
```

---

## 🎯 Use Cases

### Use Case 1: Đăng ký gói theo thời gian
```javascript
// Gói 3 tháng không giới hạn
const user = await UserModel.getById("userId");
await user.registerPackage("time-package-id");
// ✅ Tự động set package_end_date = hôm nay + 90 ngày
// ✅ Tự động set membership_status = "Active"
// ✅ remaining_sessions = null
```

### Use Case 2: Đăng ký gói theo buổi
```javascript
// Gói 20 buổi
const user = await UserModel.getById("userId");
await user.registerPackage("session-package-id");
// ✅ Tự động set package_end_date = hôm nay + Duration
// ✅ Tự động set membership_status = "Active"
// ✅ remaining_sessions = 20
```

### Use Case 3: Check-in và trừ buổi
```javascript
const user = await UserModel.getById("userId");
await user.useSession();
// ✅ remaining_sessions giảm 1
// ✅ last_checkin_time được cập nhật
// ✅ Nếu hết buổi → membership_status = "Expired"
```

### Use Case 4: Gia hạn gói tập
```javascript
const user = await UserModel.getById("userId");
await user.renewPackage();
// ✅ Nếu chưa hết hạn → gia hạn từ ngày hết hạn cũ
// ✅ Nếu đã hết hạn → gia hạn từ hôm nay
```

---

## ⚠️ Lưu Ý

1. **Validation Package:**
   - `PackageModel.create()` tự động validate dữ liệu với Joi
   - Đảm bảo `Status` phải là "active" hoặc "inactive"
   - `PackageType` phải là "time" hoặc "session"

2. **Tính toán ngày hết hạn:**
   - `Duration` tính bằng **ngày**
   - Ví dụ: Duration = 90 → 3 tháng

3. **Discount:**
   - Chỉ áp dụng khi ngày hiện tại nằm trong khoảng `StartDayDiscount` và `EndDayDiscount`
   - Sử dụng `getFinalPrice()` để lấy giá đã giảm

4. **Gói theo buổi:**
   - Cần có `NumberOfSession`
   - Mỗi lần check-in gọi `useSession()` để trừ 1 buổi
   - Khi hết buổi → tự động chuyển `membership_status` thành "Expired"

5. **Firestore Rules:**
   - Nhớ deploy rules sau khi thêm collection `packages`
   - Production: nên giới hạn quyền write chỉ cho admin

---

## 📚 Tài Liệu Liên Quan

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Joi Validation](https://joi.dev/api/)
- File example: `src/examples/packageUserExample.js`

---

## 🐛 Troubleshooting

### Lỗi: "Missing or insufficient permissions"
**Nguyên nhân:** Chưa thêm rule cho collection `packages` hoặc chưa deploy

**Giải pháp:**
```bash
# Kiểm tra file backend/firestore.rules
# Sau đó deploy
firebase deploy --only firestore:rules
```

### Lỗi: "Gói tập không tồn tại"
**Nguyên nhân:** PackageId không đúng hoặc package đã bị xóa

**Giải pháp:**
```javascript
// Kiểm tra package có tồn tại không
const pkg = await PackageModel.getById(packageId);
if (!pkg) {
  console.log("Package không tồn tại");
}
```

### Lỗi: "Không còn buổi tập nào"
**Nguyên nhân:** User đã hết buổi trong gói theo buổi

**Giải pháp:**
```javascript
// Kiểm tra trước khi check-in
if (user.remaining_sessions > 0) {
  await user.useSession();
} else {
  console.log("Hết buổi tập, vui lòng gia hạn");
}
```

---

**Cập nhật lần cuối:** 18/10/2025
