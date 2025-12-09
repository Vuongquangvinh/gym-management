# Tính năng Dinh dưỡng & Chế độ ăn

## 🎯 Các mục tiêu có sẵn

### 1️⃣ Giảm mỡ (Fat Loss)
- **Calories**: TDEE - 500 kcal
- **Protein**: 2.2g/kg (High)
- **Carbs**: Moderate
- **Fat**: 25% (Low)
- **Nước**: Base + 0.5L

### 2️⃣ Tăng cơ (Muscle Gain)
- **Calories**: TDEE + 400 kcal
- **Protein**: 2.5g/kg (Very High)
- **Carbs**: 45% (High)
- **Fat**: Remaining
- **Nước**: Base + 1.0L

### 3️⃣ Duy trì (Maintain)
- **Calories**: TDEE (không thay đổi)
- **Protein**: 1.8g/kg (Balanced)
- **Carbs**: 40% (Balanced)
- **Fat**: 30% (Balanced)
- **Nước**: Base + 0.5L

### 4️⃣ Tăng sức bền (Endurance)
- **Calories**: TDEE + 200 kcal
- **Protein**: 1.6g/kg (Moderate)
- **Carbs**: 55% (Very High)
- **Fat**: Remaining
- **Nước**: Base + 1.5L ⚡

### 5️⃣ Tăng sức mạnh (Strength)
- **Calories**: TDEE + 500 kcal
- **Protein**: 2.4g/kg (Very High)
- **Carbs**: 45% (High)
- **Fat**: Remaining
- **Nước**: Base + 1.0L

### 6️⃣ Tăng cơ giảm mỡ (Body Recomposition) - MỚI!
- **Calories**: TDEE - 200 kcal (slight deficit)
- **Protein**: 2.6g/kg (Highest!)
- **Carbs**: Moderate
- **Fat**: 20% (Lowest)
- **Nước**: Base + 1.0L

## 💧 Water Tracker - Theo dõi uống nước

### Quy định
- **1 ly = 250ml**
- Tự động tính số ly dựa trên mục tiêu lượng nước

### Cách sử dụng
1. Xem số ly cần uống trong ngày (ví dụ: 12 ly = 3L)
2. **Tap vào ly** để đánh dấu đã uống
3. **Tap lại** để bỏ đánh dấu
4. Progress bar hiển thị tiến độ
5. Nút "Đặt lại" để reset về 0

### Lưu trữ dữ liệu ✨ MỚI!
- **Tự động lưu** mỗi khi bạn tap vào ly
- Lưu vào **SharedPreferences** (nhanh, offline)
- Lưu vào **Firestore** (đồng bộ, lịch sử dài hạn)
- **Tự động reset** khi sang ngày mới
- **Giữ nguyên** khi đóng/mở lại app (trong cùng ngày)

### Hiển thị
- ✅ **Ly đã uống**: Màu xanh dương, icon đầy
- ⬜ **Ly chưa uống**: Màu trắng, icon rỗng
- Số thứ tự hiển thị ở mỗi ly (1, 2, 3,...)

### Thống kê tuần 📊
- **Tổng số ly**: Tổng cộng 7 ngày
- **Ngày đạt mục tiêu**: X/7 ngày đạt 100%
- Hiển thị ở card mini dưới water tracker

### Lịch sử 7 ngày 📅
- Tap icon **History** ở AppBar
- Xem chi tiết 7 ngày gần nhất:
  - Số ly đã uống
  - Tổng lít / Mục tiêu
  - % hoàn thành (xanh nếu ≥100%, cam nếu <100%)
- **Hôm nay** được highlight màu xanh

## 🔄 Thay đổi mục tiêu linh động

### Cách thực hiện ✨ CẢI TIẾN!
1. **Xem mục tiêu hiện tại**: Hiển thị ngay dưới tên user (badge nhỏ gọn)
2. **Tap vào badge** hoặc tap nút **"Đổi mục tiêu"** (Floating Action Button)
3. **Modal bottom sheet** hiện ra với:
   - 5 mục tiêu đầy đủ mô tả
   - Icon và màu sắc riêng
   - Mô tả ngắn gọn từng mục tiêu
   - Đánh dấu mục tiêu đang chọn
4. **Tap vào mục tiêu** → Tự động:
   - Cập nhật tất cả chỉ số
   - Đóng modal
   - Hiển thị SnackBar xác nhận
   - Badge cập nhật màu sắc

### Giao diện
- **Badge mục tiêu**: Hiển thị ở User Info Card
  - Icon + Text + Icon Edit
  - Màu sắc theo mục tiêu
  - Tap để mở modal
- **Floating Action Button**: Góc dưới bên phải
  - Icon cờ + Text "Đổi mục tiêu"
  - Màu xanh dương
- **Modal Bottom Sheet**: 
  - Header với icon và tiêu đề
  - Mô tả ngắn
  - Danh sách 5 mục tiêu
  - Mục tiêu đang chọn được highlight
  - Animation mượt mà

## 📊 Giao diện mới ✨ CẢI TIẾN!

### Cấu trúc
1. **User Info Card**: 
   - Avatar, tên, tuổi
   - **Badge mục tiêu** (nhỏ gọn, có thể tap)
   - Chiều cao, cân nặng, BMI
2. **Nutrition Stats**: Calories, BMR, TDEE
3. **Water Tracker**: Progress bar + Grid các ly nước
4. **Water Weekly Stats**: Tổng ly tuần + Ngày đạt mục tiêu
5. **Macros Card**: Protein, Carbs, Fat với progress bars
6. **Tips Card**: Gợi ý dinh dưỡng theo mục tiêu
7. **Floating Action Button**: Nút "Đổi mục tiêu" (góc dưới phải)

### Điểm khác biệt
- ✅ **Gọn gàng hơn**: Không còn card lớn chọn mục tiêu
- ✅ **UX tốt hơn**: Mục tiêu hiếm khi đổi, nên chỉ hiện badge
- ✅ **Dễ truy cập**: 2 cách để đổi (badge + FAB)
- ✅ **Modal đẹp**: Bottom sheet với mô tả chi tiết

## 🎨 Màu sắc

- **Giảm mỡ**: 🔴 Đỏ
- **Tăng cơ**: 🟢 Xanh lá
- **Duy trì**: 🟠 Cam
- **Tăng sức bền**: 🟣 Tím
- **Tăng sức mạnh**: 🔵 Xanh đậm

## 💡 Lưu ý

- Thay đổi mục tiêu **chỉ tạm thời** trong session hiện tại
- Water tracker **KHÔNG reset** khi đổi mục tiêu (vẫn giữ nguyên)
- Water tracker **TỰ ĐỘNG RESET** khi sang ngày mới
- Dữ liệu uống nước được lưu:
  - **Local**: SharedPreferences (nhanh, offline)
  - **Cloud**: Firestore (lịch sử, đồng bộ)
- Tất cả tính toán dựa trên công thức khoa học (Mifflin-St Jeor)
- Dữ liệu cũ (>30 ngày) sẽ tự động xóa để tối ưu storage

## 📁 Files liên quan

```
lib/features/
├── services/
│   ├── nutrition_calculation_service.dart
│   └── water_tracking_service.dart          # MỚI - Service lưu trữ
├── home/screens/
│   └── nutrition_screen.dart                # Đã cập nhật
└── home/
    └── NUTRITION_FEATURES.md                # File này
```

## 🔥 Firestore Structure

```
users/{userId}/water_tracking/{YYYY-MM-DD}
  ├── date: Timestamp
  ├── glasses_completed: int
  ├── total_liters: double
  ├── target_liters: double
  ├── completion_percentage: int
  └── updated_at: Timestamp
```
