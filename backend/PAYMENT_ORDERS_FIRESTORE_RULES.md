# 🔐 Firestore Security Rules - Payment Orders

## Rules đã thêm cho collection `payment_orders`

```javascript
match /payment_orders/{orderCode} {
  // User có thể đọc đơn hàng của mình
  allow read: if request.auth != null && 
    (resource.data.userId == request.auth.uid || 
     exists(/databases/$(database)/documents/employees/$(request.auth.uid)));
  
  // Chỉ backend và admin mới được tạo/sửa đơn hàng
  allow create, update: if true;
  
  // Chỉ admin mới được xóa
  allow delete: if true;
}
```

## 📖 Giải thích

### 🔍 Read Permission (Đọc)
```javascript
allow read: if request.auth != null && 
  (resource.data.userId == request.auth.uid || 
   exists(/databases/$(database)/documents/employees/$(request.auth.uid)));
```

**Ai được phép đọc:**
1. ✅ **User thường** - Chỉ đọc được đơn hàng của mình
   - Phải đăng nhập (`request.auth != null`)
   - userId trong đơn hàng phải trùng với uid của user (`resource.data.userId == request.auth.uid`)

2. ✅ **Admin/Employee** - Đọc được tất cả đơn hàng
   - Phải có document trong collection `employees`
   - Kiểm tra bằng `exists(/databases/.../employees/$(request.auth.uid))`

**Ví dụ:**
```javascript
// User "abc123" chỉ đọc được đơn có userId = "abc123"
// Admin có document trong employees collection đọc được tất cả
```

### ✏️ Create/Update Permission (Tạo/Sửa)
```javascript
allow create, update: if true;
```

**Hiện tại:** Cho phép tất cả (Development mode)

**Production nên là:**
```javascript
allow create, update: if request.auth != null;
```

**Ai được phép tạo/sửa:**
- ✅ Backend service (khi nhận webhook từ PayOS)
- ✅ Admin (xác nhận thủ công)
- ✅ User (cập nhật thông tin đơn hàng của mình)

### 🗑️ Delete Permission (Xóa)
```javascript
allow delete: if true;
```

**Hiện tại:** Cho phép tất cả (Development mode)

**Production nên là:**
```javascript
allow delete: if request.auth != null && 
  exists(/databases/$(database)/documents/employees/$(request.auth.uid));
```

**Ai được phép xóa:**
- ✅ Chỉ Admin/Employee

## 🔄 Deployment

### Deploy rules lên Firebase
```bash
cd backend
firebase deploy --only firestore:rules
```

### Kiểm tra rules
```bash
firebase firestore:rules
```

## 🧪 Test Rules

### Test 1: User đọc đơn hàng của mình ✅
```javascript
// User uid = "user123"
// Order: { userId: "user123", orderCode: 123456 }
// Result: ALLOW ✅
```

### Test 2: User đọc đơn hàng của người khác ❌
```javascript
// User uid = "user123"
// Order: { userId: "user456", orderCode: 789012 }
// Result: DENY ❌
```

### Test 3: Admin đọc bất kỳ đơn hàng nào ✅
```javascript
// Admin uid = "admin789" (có trong employees collection)
// Order: { userId: "user456", orderCode: 789012 }
// Result: ALLOW ✅
```

### Test 4: User chưa đăng nhập ❌
```javascript
// No auth
// Result: DENY ❌ (Missing authentication)
```

## 🚀 Production Recommendations

### Tăng cường bảo mật cho Production:

```javascript
match /payment_orders/{orderCode} {
  // READ: User đọc đơn của mình, Admin đọc tất cả
  allow read: if request.auth != null && 
    (resource.data.userId == request.auth.uid || 
     get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.Role == 'admin');
  
  // CREATE: Chỉ authenticated users
  allow create: if request.auth != null;
  
  // UPDATE: Owner hoặc Admin
  allow update: if request.auth != null && 
    (resource.data.userId == request.auth.uid || 
     get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.Role == 'admin');
  
  // DELETE: Chỉ Admin
  allow delete: if request.auth != null && 
    get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.Role == 'admin';
}
```

### Validate dữ liệu khi tạo/sửa:

```javascript
match /payment_orders/{orderCode} {
  allow create: if request.auth != null &&
    request.resource.data.keys().hasAll(['orderCode', 'userId', 'amount', 'status']) &&
    request.resource.data.amount > 0 &&
    request.resource.data.status in ['PENDING', 'PAID', 'CANCELLED', 'FAILED', 'EXPIRED'];
  
  allow update: if request.auth != null &&
    (resource.data.userId == request.auth.uid || 
     get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.Role == 'admin');
}
```

## 📊 Query Permissions

### User queries (chỉ đơn của mình)
```javascript
// ✅ Được phép
const q = query(
  collection(db, "payment_orders"),
  where("userId", "==", currentUser.uid)
);

// ❌ Không được phép (truy vấn tất cả)
const q = query(collection(db, "payment_orders"));
```

### Admin queries (tất cả đơn)
```javascript
// ✅ Được phép (vì admin có trong employees)
const q = query(collection(db, "payment_orders"));
```

## 🐛 Troubleshooting

### Lỗi: "Missing or insufficient permissions"

**Nguyên nhân 1:** User chưa đăng nhập
```javascript
// Giải pháp
if (!currentUser) {
  navigate('/login');
  return;
}
```

**Nguyên nhân 2:** User đang query tất cả đơn (không phải admin)
```javascript
// ❌ Sai
const orders = await PaymentOrderService.getAllOrders();

// ✅ Đúng
const orders = await PaymentOrderService.getUserOrders(currentUser.uid);
```

**Nguyên nhân 3:** Rules chưa được deploy
```bash
cd backend
firebase deploy --only firestore:rules
```

**Nguyên nhân 4:** User không có quyền đọc đơn hàng của người khác
```javascript
// Kiểm tra isAdmin trước khi query all
if (isAdmin) {
  orders = await getAllOrders();
} else {
  orders = await getUserOrders(userId);
}
```

## 📝 Notes

1. **Development vs Production:**
   - Development: `allow read, write: if true` (dễ test)
   - Production: Thêm authentication và authorization checks

2. **Performance:**
   - Rules được evaluate ở server-side
   - Không ảnh hưởng performance client
   - Cache rules để tối ưu

3. **Security Best Practices:**
   - Luôn validate dữ liệu
   - Không tin tưởng client-side validation
   - Sử dụng get() để check roles (nhưng cẩn thận với performance)
   - Test kỹ rules trước khi deploy production

4. **Testing:**
   - Sử dụng Firebase Emulator để test rules locally
   - Firebase Console có Rules Playground để test

---

**Last Updated:** 2025-10-29  
**Deploy Status:** ✅ Deployed  
**Environment:** Development
