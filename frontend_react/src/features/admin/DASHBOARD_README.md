# Dashboard Quản lý Phòng Gym - Hướng dẫn

## 🎯 Tính năng chính

Dashboard này cung cấp cái nhìn tổng quan về hoạt động của phòng gym với dữ liệu thời gian thực từ Firebase Firestore.

### 1. Thống kê tổng quan (Real-time)

- **Thành viên hoạt động**: Số lượng members có trạng thái Active
- **Check-ins hôm nay**: Tổng số lượt check-in trong ngày
- **Gói tập đang mở**: Số lượng packages đang active
- **Doanh thu (Triệu)**: Tổng giá trị các gói tập đang active

### 2. Check-ins gần đây

Hiển thị 5 lượt check-in mới nhất với thời gian tương đối (vừa xong, 10 phút trước, 1 giờ trước...)

### 3. Biểu đồ check-in 7 ngày

Biểu đồ đường thể hiện xu hướng check-in trong 7 ngày gần nhất, giúp theo dõi hoạt động của phòng gym.

### 4. Quick Actions

#### ➕ Tạo member
- Nhanh chóng chuyển đến trang tạo thành viên mới

#### 📦 Tạo gói
- Chuyển đến trang tạo gói tập mới

#### 📱 Check-in nhanh
- **Tính năng nổi bật**: Modal check-in nhanh với tìm kiếm thông minh
- Tìm kiếm thành viên theo tên hoặc số điện thoại
- Hiển thị thông tin chi tiết: avatar, tên, SĐT, email, trạng thái membership
- Kiểm tra tự động:
  - Membership status phải là Active
  - Gói tập chưa hết hạn
- Check-in thành công sẽ tự động refresh dashboard

#### 👥 Quản lý members
- Chuyển đến trang danh sách và quản lý thành viên

#### 📋 Lịch sử check-in
- Xem chi tiết lịch sử check-in của tất cả thành viên

## 🔄 Tự động cập nhật

Dashboard tự động làm mới dữ liệu mỗi 30 giây để đảm bảo thông tin luôn mới nhất.

## 🎨 Trải nghiệm người dùng

- Loading states cho tất cả các thao tác
- Error handling và thông báo lỗi rõ ràng
- Responsive design
- UI/UX hiện đại với màu sắc phù hợp với trạng thái (Active = xanh lá, Expired = đỏ, etc.)

## 📊 Nguồn dữ liệu

Tất cả dữ liệu được lấy trực tiếp từ Firebase Firestore:
- Collection `users`: Thông tin thành viên
- Collection `checkins`: Lịch sử check-in
- Collection `packages`: Gói tập

## 🚀 Cải tiến so với phiên bản cũ

1. ✅ **Dữ liệu thật** thay vì mock data
2. ✅ **Real-time updates** mỗi 30 giây
3. ✅ **Check-in nhanh** với modal tìm kiếm thông minh
4. ✅ **Validation** đầy đủ trước khi check-in
5. ✅ **Better UX** với loading states và error handling
6. ✅ **Biểu đồ cải tiến** với labels theo ngày trong tuần
7. ✅ **Quick navigation** đến các trang quản lý khác

## 🔧 Technical Details

### Services sử dụng:
- `dashboardService.js`: Tổng hợp tất cả dữ liệu dashboard
- `checkin.service.js`: Xử lý check-in operations
- Firebase Firestore: Database real-time

### Tối ưu hiệu năng:
- Sử dụng `getCountFromServer()` để đếm nhanh hơn
- Cache package data khi tính doanh thu
- Parallel queries với `Promise.all()`
- Debounce search trong modal (300ms)

## 📝 Lưu ý

- Dashboard chỉ hiển thị members và packages có `isActive = true`
- Check-in chỉ được thực hiện với members có status Active và gói tập còn hạn
- Doanh thu được tính dựa trên giá gói của các members đang active
