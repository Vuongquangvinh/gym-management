# 📅 Hướng Dẫn Sử Dụng Lịch PT Nâng Cấp

## 🎯 Tổng Quan

Hệ thống lịch làm việc PT đã được nâng cấp với nhiều tính năng chuyên nghiệp giúp PT quản lý lịch và học viên hiệu quả hơn.

## ✨ Các Tính Năng Mới

### 1. 🔍 Tìm Kiếm & Lọc Học Viên

#### Tìm Kiếm
- **Vị trí**: Thanh tìm kiếm ở đầu trang lịch
- **Tìm theo**: 
  - Tên học viên
  - Email
  - Số điện thoại
- **Cách dùng**: Nhập từ khóa vào ô tìm kiếm, kết quả hiển thị ngay lập tức
- **Xóa tìm kiếm**: Click nút "X" trong ô tìm kiếm

#### Bộ Lọc
- **Nút Lọc**: Click nút "Lọc" bên cạnh thanh tìm kiếm
- **Các tùy chọn**:
  - **Tất cả**: Hiển thị tất cả học viên
  - **Đang hoạt động**: Chỉ hiển thị học viên có hợp đồng active
  - **Hết hạn**: Chỉ hiển thị học viên có hợp đồng hết hạn

### 2. ⏰ Phân Nhóm Theo Khung Giờ

#### Cấu Trúc Mới
- Mỗi ngày được chia thành các **khung giờ** (time slots)
- Học viên được nhóm theo khung giờ tập
- Dễ dàng xem có bao nhiêu học viên trong mỗi khung giờ

#### Thông Tin Khung Giờ
- **Icon đồng hồ**: Biểu tượng thời gian
- **Khung giờ**: Thời gian bắt đầu - kết thúc (VD: 06:00 - 07:00)
- **Số lượng**: Badge màu xanh hiển thị số học viên trong khung giờ đó

#### Mở/Đóng Khung Giờ
- Click vào header của khung giờ để mở/đóng danh sách học viên
- Mặc định tất cả khung giờ đều mở

### 3. 👤 Thẻ Học Viên Chi Tiết

#### Hiển Thị Trên Thẻ
- **Avatar**: Ảnh đại diện hoặc chữ cái đầu tên
- **Tên học viên**: Tên đầy đủ
- **Khung giờ tập**: Thời gian bắt đầu - kết thúc
- **Số buổi còn lại**: Hiển thị bằng màu xanh
- **Trạng thái**: 
  - ✓ (màu xanh) = Đang hoạt động
  - ⏰ (màu đỏ) = Hết hạn

#### Tương Tác
- **Hover**: Thẻ nhấc lên với hiệu ứng shadow khi di chuột qua
- **Click**: Mở modal thông tin chi tiết học viên

### 4. 📊 Thống Kê Trong Ngày

Khi mở một ngày, hiển thị các số liệu thống kê:

- **Tổng học viên**: Tổng số học viên đăng ký trong ngày
- **Đang hoạt động**: Số học viên có hợp đồng active (màu xanh)
- **Hết hạn**: Số học viên có hợp đồng hết hạn (màu đỏ)
- **Tổng buổi còn lại**: Tổng số buổi tập còn lại của tất cả học viên

### 5. 💼 Modal Thông Tin Chi Tiết Học Viên

#### Cách Mở
- Click vào bất kỳ thẻ học viên nào

#### Thông Tin Hiển Thị

##### Phần 1: Thông Tin Cá Nhân
- **Avatar lớn**: Ảnh đại diện 80x80px
- **Tên đầy đủ**
- **Email**: Với icon thư
- **Số điện thoại**: Với icon điện thoại

##### Phần 2: Thông Tin Gói Tập
- **Loại gói**: Tên gói tập đã đăng ký
- **Số buổi còn lại**: Hiển thị nổi bật bằng màu xanh
- **Trạng thái**: 
  - ✅ Đang hoạt động
  - ⏰ Hết hạn
  - ❌ Đã hủy
- **Ngày bắt đầu**: Ngày bắt đầu hợp đồng
- **Ngày kết thúc**: Ngày hết hạn hợp đồng

##### Phần 3: Lịch Tập Trong Tuần
- Hiển thị tất cả các ngày trong tuần học viên đăng ký tập
- Format: **T2, T3, T4...** với khung giờ tương ứng
- Dạng lưới, dễ nhìn

##### Phần 4: Ghi Chú
- Hiển thị các ghi chú đặc biệt (nếu có)
- Có thể là ghi chú về sức khỏe, mục tiêu, hoặc yêu cầu đặc biệt

#### Đóng Modal
- Click nút "X" góc trên bên phải
- Click ra ngoài modal

### 6. 📈 Badge Trạng Thái

#### Trên Header Ngày
- **Số học viên**: Badge tròn màu xanh
- **Số hoạt động**: Badge màu xanh lá nhạt (chỉ hiện khi > 0)
- **Hôm nay**: Badge màu vàng (chỉ hiện cho ngày hiện tại)

### 7. 🎨 Giao Diện & Màu Sắc

#### Màu Sắc Chính
- **Primary**: #007bff (Xanh dương) - Cho các nút, link, highlight
- **Success**: #28a745 (Xanh lá) - Cho trạng thái active
- **Danger**: #dc3545 (Đỏ) - Cho trạng thái expired
- **Light**: #f8f9fa (Xám nhạt) - Cho background

#### Hiệu Ứng
- **Hover**: Transform translateY(-2px) + shadow
- **Click**: Smooth transition
- **Animation**: Fade in, slide up cho modal
- **Loading**: Spinner animation

## 📱 Responsive Design

### Desktop (> 768px)
- Thẻ học viên: Grid 3 cột (auto-fill, minmax 300px)
- Thống kê: Grid 4 cột
- Modal: Max-width 600px

### Mobile (< 768px)
- Thanh tìm kiếm & lọc: Stack theo chiều dọc
- Thẻ học viên: 1 cột
- Thống kê: 2 cột
- Modal: Full screen với margin 10px

## 🎯 Use Cases

### Case 1: Xem Lịch Hôm Nay
1. Mở trang lịch
2. Ngày hôm nay có badge "Hôm nay" màu vàng
3. Click vào để xem chi tiết
4. Xem các khung giờ và học viên đã đăng ký

### Case 2: Tìm Học Viên Cụ Thể
1. Nhập tên/email/SĐT vào thanh tìm kiếm
2. Kết quả lọc ngay lập tức
3. Click vào thẻ học viên để xem chi tiết
4. Kiểm tra số buổi còn lại, lịch tập

### Case 3: Quản Lý Học Viên Hết Hạn
1. Click nút "Lọc"
2. Chọn "Hết hạn"
3. Xem danh sách học viên có hợp đồng hết hạn
4. Liên hệ để gia hạn

### Case 4: Chuẩn Bị Cho Ca Tập
1. Mở ngày cần xem
2. Xem thống kê: tổng học viên, số hoạt động
3. Xem từng khung giờ
4. Click vào học viên để xem thông tin chi tiết
5. Chuẩn bị bài tập phù hợp

### Case 5: Kiểm Tra Thông Tin Chi Tiết
1. Click vào bất kỳ học viên nào
2. Xem đầy đủ thông tin cá nhân
3. Kiểm tra gói tập, số buổi còn lại
4. Xem lịch tập trong tuần
5. Đọc ghi chú đặc biệt (nếu có)

## 🔄 Tích Hợp Với Tính Năng Cũ

### Giữ Nguyên
- ✅ Chọn tuần (week picker)
- ✅ Thông tin PT (avatar, shift type)
- ✅ Face ID registration & check-in
- ✅ Statistics checkin
- ✅ Legend (chú thích)

### Nâng Cấp
- 🚀 Accordion từng ngày
- 🚀 Hiển thị học viên chi tiết hơn
- 🚀 Phân nhóm theo khung giờ
- 🚀 Modal thông tin đầy đủ

## 🎓 Tips & Best Practices

### Cho PT
1. **Mỗi sáng**: Kiểm tra lịch hôm nay để chuẩn bị
2. **Trước ca tập**: Xem lại thông tin học viên trong khung giờ đó
3. **Cuối ngày**: Review số buổi còn lại của học viên
4. **Hàng tuần**: Lọc học viên hết hạn để liên hệ gia hạn

### Tối Ưu Trải Nghiệm
1. Sử dụng tìm kiếm để nhanh chóng tìm học viên
2. Sử dụng bộ lọc để quản lý theo trạng thái
3. Click vào học viên để xem thông tin chi tiết thay vì nhớ
4. Để ý badge số hoạt động để biết tình trạng chung

## 🐛 Troubleshooting

### Không Thấy Học Viên
- Kiểm tra bộ lọc có đang bật "Hết hạn" không
- Xóa từ khóa tìm kiếm
- Đảm bảo học viên đã được gán cho PT

### Modal Không Mở
- Kiểm tra console log xem có lỗi không
- Thử refresh trang
- Kiểm tra dữ liệu học viên có đầy đủ không

### Hiển thị Sai Thông Tin
- Kiểm tra dữ liệu trong Firestore
- Kiểm tra format của weeklySchedule
- Đảm bảo contract có đầy đủ thông tin

## 📊 Cấu Trúc Dữ Liệu

### Contract
```javascript
{
  packageId: { name: "Gói 1 tháng" },
  sessionsRemaining: 10,
  status: "active" | "expired" | "cancelled",
  startDate: Timestamp,
  endDate: Timestamp,
  weeklySchedule: {
    schedule: {
      1: { startTime: "06:00", endTime: "07:00" }, // Monday
      3: { startTime: "06:00", endTime: "07:00" }, // Wednesday
      // ...
    }
  },
  notes: "Ghi chú đặc biệt"
}
```

### User
```javascript
{
  fullName: "Nguyễn Văn A",
  email: "user@example.com",
  phone: "0123456789",
  photoURL: "https://...",
  avatar: "https://..."
}
```

## 🚀 Performance

### Tối Ưu
- ✅ Group members by time slot - O(n)
- ✅ Filter/search - debounce nếu cần
- ✅ Modal lazy render (chỉ render khi mở)
- ✅ CSS animation hardware accelerated

### Cải Tiến Tương Lai
- [ ] Virtualized list cho nhiều học viên (>100)
- [ ] Cache dữ liệu học viên
- [ ] Prefetch contract info
- [ ] Service worker cho offline

## 📝 Change Log

### Version 2.0 (Hiện tại)
- ✅ Thêm tìm kiếm & lọc học viên
- ✅ Phân nhóm theo khung giờ
- ✅ Thẻ học viên chi tiết với avatar
- ✅ Modal thông tin đầy đủ
- ✅ Thống kê trong ngày
- ✅ Badge trạng thái
- ✅ Responsive design
- ✅ Smooth animations

### Version 1.0 (Cũ)
- Basic accordion view
- Simple member list
- Basic time display

---

**Cập nhật**: 20/11/2025  
**Phiên bản**: 2.0  
**Tác giả**: GitHub Copilot
