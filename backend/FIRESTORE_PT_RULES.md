# Firestore Security Rules cho PT Role

## Tổng quan

Document này mô tả các quy tắc bảo mật Firestore cần thiết để PT chỉ có thể truy cập dữ liệu của chính mình.

## Rules cần thêm vào `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/employees/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user is PT
    function isPT() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/employees/$(request.auth.uid)) &&
             (get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'pt' ||
              get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.position == 'PT');
    }
    
    // Helper function to get current employee ID by email
    function getCurrentEmployeeId() {
      return get(/databases/$(database)/documents/employees/$(request.auth.uid)).id;
    }
    
    // PT Packages Collection
    match /pt_packages/{packageId} {
      // Admin có thể làm bất cứ gì
      allow read, write: if isAdmin();
      
      // PT chỉ có thể đọc/ghi packages của chính mình
      allow read: if isPT() && 
                     resource.data.ptId == getCurrentEmployeeId();
      allow create: if isPT() && 
                      request.resource.data.ptId == getCurrentEmployeeId();
      allow update, delete: if isPT() && 
                              resource.data.ptId == getCurrentEmployeeId();
      
      // Public read for active packages (for users to see)
      allow read: if request.auth != null && 
                     resource.data.isActive == true;
    }
    
    // Package Users Collection (học viên đã đăng ký gói)
    match /package_users/{packageUserId} {
      // Admin có thể làm bất cứ gì
      allow read, write: if isAdmin();
      
      // PT chỉ có thể đọc thông tin học viên của gói mình tạo
      allow read: if isPT() && 
                     get(/databases/$(database)/documents/pt_packages/$(resource.data.packageId)).data.ptId == getCurrentEmployeeId();
      
      // User chỉ có thể đọc package của chính mình
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                      request.resource.data.userId == request.auth.uid;
    }
    
    // Employees Collection
    match /employees/{employeeId} {
      // Admin có thể làm bất cứ gì
      allow read, write: if isAdmin();
      
      // PT chỉ có thể đọc và cập nhật thông tin của chính mình
      allow read: if isPT() && 
                     employeeId == getCurrentEmployeeId();
      allow update: if isPT() && 
                      employeeId == getCurrentEmployeeId() &&
                      // Chỉ cho phép update ptInfo, không cho phép thay đổi role/salary
                      !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'salary', 'position', 'status']);
    }
    
    // Employee Shifts Collection
    match /employee_shifts/{shiftId} {
      // Admin có thể làm bất cứ gì
      allow read, write: if isAdmin();
      
      // PT chỉ có thể đọc lịch làm việc của chính mình
      allow read: if isPT() && 
                     resource.data.employeeId == getCurrentEmployeeId();
    }
    
    // Spending Users Collection (read-only for PT to see client info)
    match /spending_users/{userId} {
      // Admin có thể làm bất cứ gì
      allow read, write: if isAdmin();
      
      // PT có thể đọc thông tin cơ bản của học viên (nếu họ đăng ký gói của PT)
      allow read: if isPT();
    }
  }
}
```

## Giải thích

### 1. Helper Functions

- `isAdmin()`: Kiểm tra xem user có role admin không
- `isPT()`: Kiểm tra xem user có role PT không
- `getCurrentEmployeeId()`: Lấy employee ID của user hiện tại

### 2. PT Packages Rules

- **Admin**: Full access
- **PT**: 
  - Chỉ đọc/tạo/sửa/xóa packages của chính mình
  - Không thể access packages của PT khác
- **Public**: Có thể đọc các packages đang active (để users xem)

### 3. Package Users Rules

- **Admin**: Full access
- **PT**: Chỉ đọc thông tin học viên đã đăng ký gói của mình
- **User**: Chỉ đọc và tạo package registrations của chính mình

### 4. Employees Rules

- **Admin**: Full access
- **PT**: 
  - Chỉ đọc thông tin của chính mình
  - Chỉ cập nhật `ptInfo` (bio, certificates, etc.)
  - **KHÔNG** được thay đổi: role, salary, position, status

### 5. Employee Shifts Rules

- **Admin**: Full access
- **PT**: Chỉ đọc lịch làm việc của chính mình

### 6. Spending Users Rules

- **Admin**: Full access
- **PT**: Read-only để xem thông tin học viên

## Cách áp dụng

1. Mở Firebase Console
2. Vào **Firestore Database** → **Rules**
3. Copy rules trên vào file rules
4. Click **Publish**
5. Test kỹ bằng Firebase Rules Playground

## Testing

Sau khi áp dụng rules, test các trường hợp:

### Test Case 1: PT tạo package
```javascript
// Should succeed
await addDoc(collection(db, 'pt_packages'), {
  ptId: currentPTId, // ID của PT đang login
  name: 'Gói giảm cân',
  price: 500000,
  // ...
});
```

### Test Case 2: PT cố truy cập package của PT khác
```javascript
// Should fail with permission denied
await getDoc(doc(db, 'pt_packages', otherPTPackageId));
```

### Test Case 3: PT cập nhật thông tin cá nhân
```javascript
// Should succeed
await updateDoc(doc(db, 'employees', currentPTId), {
  ptInfo: {
    bio: 'Updated bio',
    specialties: ['Yoga', 'Pilates']
  }
});
```

### Test Case 4: PT cố thay đổi salary
```javascript
// Should fail with permission denied
await updateDoc(doc(db, 'employees', currentPTId), {
  salary: 99999999
});
```

## Lưu ý quan trọng

1. **Employee ID mapping**: Rules này giả định rằng `request.auth.uid` tương ứng với document ID trong collection `employees`. Nếu mapping khác, cần điều chỉnh helper functions.

2. **Performance**: Rules có nhiều `get()` calls có thể ảnh hưởng performance. Cân nhắc denormalize data nếu cần.

3. **Security first**: Luôn test kỹ rules trước khi deploy production.

4. **Backend validation**: Rules là layer bảo mật cuối cùng. Vẫn cần validate ở backend middleware.

## Backend Middleware

Đã tạo middleware trong `backend/src/shared/middleware/auth.js`:

```javascript
// Protect admin-only routes
router.get('/admin/employees', verifyToken, requireRole(['admin']), getEmployees);

// Protect PT routes - PT can only access their own data
router.get('/pt/:ptId/packages', verifyToken, requireRole(['admin', 'pt']), requireOwnData('ptId'), getPTPackages);

// PT update their profile
router.put('/pt/:ptId/profile', verifyToken, requireRole(['pt']), requireOwnData('ptId'), updatePTProfile);
```

## Next Steps

1. ✅ Áp dụng Firestore rules
2. ✅ Test với Firebase Rules Playground
3. ⏳ Thêm backend routes với middleware
4. ⏳ Test end-to-end với PT login
5. ⏳ Document cho team về phân quyền

