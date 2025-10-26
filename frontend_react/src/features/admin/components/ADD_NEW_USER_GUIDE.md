# 📝 ADD NEW USER - TEMPLATE MỚI

## File: `AddNewUser.jsx`

File component đã được cải tiến để:

### ✨ Tính năng mới:
1. ✅ **Dropdown chọn gói tập** - Thay vì nhập ID thủ công
2. ✅ **Tự động tính ngày hết hạn** - Dựa trên Duration của gói
3. ✅ **Hiển thị thông tin gói đã chọn** - Loại gói, số buổi, discount
4. ✅ **Load packages từ Firestore** - Chỉ hiển thị gói active
5. ✅ **Validation tự động** - Kiểm tra trước khi submit
6. ✅ **Tích hợp PackageModel và SpendingUserModel**

### 📋 Các trường trong form:

#### Thông tin cá nhân (Cột 1):
- Họ và tên *
- Số điện thoại *
- Email
- Ngày sinh *
- Giới tính *

#### Thông tin gói tập (Cột 2):
- Ngày đăng ký *
- Gói tập * (Dropdown - tự động load từ Firestore)
- Ngày hết hạn * (Auto-calculated, readonly)
- Trạng thái gói tập *
- Nguồn khách hàng

#### Thông tin khác (Cột 3):
- Nhân viên phụ trách
- Mục tiêu tập luyện
- Vấn đề sức khỏe
- Cân nặng ban đầu
- Chiều cao ban đầu
- Avatar URL

### 🎯 Workflow:

```
1. User mở form
2. Component load danh sách packages từ Firestore
3. User chọn ngày đăng ký (mặc định hôm nay)
4. User chọn gói tập từ dropdown
   -> Hiển thị thông tin gói: Loại, Số buổi, Giảm giá
   -> Tự động tính ngày hết hạn = join_date + Duration
5. User điền thông tin khác
6. Submit -> Tạo SpendingUser trong Firestore
7. Thành công -> Reset form -> Đóng modal
```

### 💡 Ví dụ Sử Dụng:

```jsx
import AddNewUser from './features/admin/components/AddNewUser';

function AdminPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (userData) => {
    // Tùy chọn: Xử lý thêm trước khi lưu
    console.log('Creating user:', userData);
    // Component sẽ tự gọi SpendingUserModel.create() nếu không có onSubmit
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Thêm Hội Viên
      </button>

      <AddNewUser 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit} // Optional
      />
    </div>
  );
}
```

### 🔄 Auto-calculation Logic:

```javascript
// Khi chọn gói tập:
const handlePackageChange = (e) => {
  const packageId = e.target.value;
  const pkg = packages.find(p => p.PackageId === packageId);
  
  if (pkg && form.join_date) {
    const startDate = new Date(form.join_date);
    const endDate = pkg.calculateEndDate(startDate); // +Duration ngày
    setForm({
      ...form,
      current_package_id: packageId,
      package_end_date: endDate // Auto-fill
    });
  }
};

// Khi thay đổi ngày đăng ký:
const handleJoinDateChange = (e) => {
  const joinDate = e.target.value;
  
  if (selectedPackage && joinDate) {
    const startDate = new Date(joinDate);
    const endDate = selectedPackage.calculateEndDate(startDate);
    setForm({
      ...form,
      join_date: joinDate,
      package_end_date: endDate // Re-calculate
    });
  }
};
```

### 📦 Dependencies:

```javascript
import { PackageModel } from '../../../firebase/lib/features/package/packages.model.js';
import { SpendingUserModel } from '../../../firebase/lib/features/user/spendingUser.model.js';
```

### ⚠️ Lưu Ý:

1. **Firestore Rules**: Phải có rule cho collection `packages`
2. **Package Data**: Cần có ít nhất 1 package với `Status: "active"`
3. **Date Format**: Sử dụng ISO format (YYYY-MM-DD)
4. **Validation**: Tất cả trường có dấu * là bắt buộc

### 🚀 Cách Deploy:

1. Copy nội dung file template (xem attachment)
2. Paste vào `AddNewUser.jsx`
3. Save file
4. Test component:
   ```bash
   npm run dev
   ```

### 📸 UI Features:

- **Loading state**: "Đang tải gói tập..." khi load packages
- **Package info box**: Hiển thị khi chọn gói:
  - 📦 Loại gói (Theo thời gian / Theo buổi)
  - 🏋️ Số buổi (nếu gói theo buổi)
  - 🎉 % Giảm giá (nếu có discount)
- **Readonly end_date**: Background màu xám, không cho edit
- **Success message**: "✅ Tạo hội viên thành công!" (hiển thị 1.5s)
- **Auto-close**: Tự động đóng form sau khi tạo thành công

---

## 📄 Full Source Code

Do giới hạn encoding trong terminal, vui lòng:

1. Mở file `AddNewUser.jsx` trong VS Code
2. Xóa tất cả nội dung hiện tại
3. Copy code từ file `PackageRegistration.jsx` làm tham khảo
4. Điều chỉnh theo template sau:

### Key Changes:

```javascript
// OLD - Input thủ công:
<input name="current_package_id" value={form.current_package_id} onChange={handleChange} required />

// NEW - Dropdown tự động:
<select name="current_package_id" value={form.current_package_id} onChange={handlePackageChange} required>
  <option value="">-- Chọn gói tập --</option>
  {packages.map((pkg) => (
    <option key={pkg.PackageId} value={pkg.PackageId}>
      {pkg.PackageName} - {pkg.getFinalPrice().toLocaleString('vi-VN')}₫ ({pkg.Duration} ngày)
    </option>
  ))}
</select>
```

```javascript
// OLD - Input ngày thủ công:
<input name="package_end_date" type="date" value={form.package_end_date} onChange={handleChange} required />

// NEW - Auto-calculated, readonly:
<input 
  name="package_end_date" 
  type="date" 
  value={form.package_end_date} 
  readOnly
  style={{ backgroundColor: '#f5f5f5' }}
  title="Tự động tính dựa trên gói tập đã chọn"
  required 
/>
```

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** 18/10/2025  
**Version:** 2.0.0
