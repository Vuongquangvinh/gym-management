# ✅ Checklist - Hiển thị ảnh từ Backend

## 🔧 Backend Setup

- [x] Backend lưu ảnh vào `frontend_react/public/uploads/`
- [x] Backend serve static files qua `/uploads` endpoint
- [x] CORS đã được enable trong `app.js`
- [ ] Backend đang chạy (`cd backend && npm start`)
- [ ] Test URL ảnh trực tiếp: `http://localhost:3000/uploads/employees/avatars/emp_xxx.jpg`

## 📱 Flutter Setup

- [x] Tạo `lib/config/image_config.dart`
- [x] Tạo `lib/shared/widgets/network_avatar.dart`
- [x] Tạo `lib/shared/widgets/network_image_card.dart`
- [ ] Cập nhật `baseUrl` trong `lib/config/api_config.dart` phù hợp với môi trường:
  - [ ] Android Emulator: `http://10.0.2.2:3000`
  - [ ] iOS Simulator: `http://localhost:3000`
  - [ ] Thiết bị thật: `http://<YOUR_IP>:3000`

## 🔍 Kiểm tra kết nối

### 1. Kiểm tra backend
```bash
cd backend
npm start
# → Server is running on port 3000
```

### 2. Test URL trực tiếp
Mở browser hoặc Postman:
```
http://localhost:3000/uploads/employees/avatars/emp_1762356223481_owffkb.jpg
```
→ Phải thấy ảnh hiển thị

### 3. Kiểm tra IP máy (nếu dùng thiết bị thật)
**Windows:**
```powershell
ipconfig
# Tìm IPv4 Address (ví dụ: 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig
# Tìm inet (ví dụ: 192.168.1.100)
```

### 4. Test trên thiết bị thật
```
http://192.168.1.100:3000/uploads/employees/avatars/emp_xxx.jpg
```

## 🎯 Tích hợp vào ứng dụng

### Bước 1: Import widget
```dart
import 'package:frontend_flutter/shared/widgets/network_avatar.dart';
```

### Bước 2: Sử dụng với data từ Firestore
```dart
StreamBuilder<DocumentSnapshot>(
  stream: FirebaseFirestore.instance
      .collection('employees')
      .doc(employeeId)
      .snapshots(),
  builder: (context, snapshot) {
    final data = snapshot.data?.data() as Map<String, dynamic>?;
    final avatarUrl = data?['avatarUrl'] as String?;
    
    return NetworkAvatar(
      avatarUrl: avatarUrl,
      size: 80,
    );
  },
)
```

### Bước 3: Kiểm tra trong app
- [ ] Avatar hiển thị đúng
- [ ] Loading indicator xuất hiện khi đang tải
- [ ] Placeholder hiển thị khi không có ảnh hoặc lỗi

## 🧪 Test Cases

| Trường hợp | Kết quả mong đợi |
|------------|------------------|
| avatarUrl hợp lệ | Hiển thị ảnh từ backend |
| avatarUrl = null | Hiển thị placeholder (icon person) |
| avatarUrl = "" | Hiển thị placeholder |
| Backend không chạy | Hiển thị placeholder + log error |
| URL sai | Hiển thị placeholder + log error |
| Đang tải | Hiển thị CircularProgressIndicator |

## 🐛 Troubleshooting

### Ảnh không hiển thị - Checklist debug

1. **Backend có đang chạy không?**
   ```bash
   curl http://localhost:3000/uploads/employees/avatars/emp_xxx.jpg
   ```

2. **CORS có lỗi không?**
   - Xem console Flutter/Chrome DevTools
   - Backend đã có `app.use(cors())`

3. **URL có đúng không?**
   - Print ra console: `print(ImageConfig.getImageUrl(avatarUrl))`
   - Kết quả phải là: `http://10.0.2.2:3000/uploads/...`

4. **File có tồn tại không?**
   ```bash
   ls frontend_react/public/uploads/employees/avatars/
   ```

5. **IP có đúng không? (thiết bị thật)**
   - Máy tính và điện thoại cùng WiFi
   - Ping từ điện thoại đến máy tính

### Common Errors

**Error: Connection refused**
- Backend chưa chạy → `npm start`

**Error: 404 Not Found**
- File không tồn tại → Kiểm tra path

**Error: Network image failed to load**
- Kiểm tra CORS
- Kiểm tra URL
- Kiểm tra backend logs

**Android Emulator: Connection timeout**
- Dùng `10.0.2.2` thay vì `localhost`

## ✨ Hoàn thành!

Khi tất cả checkboxes được đánh dấu, ứng dụng sẽ hiển thị ảnh từ backend thành công!

---

**Cần trợ giúp?** Xem:
- `NETWORK_IMAGE_GUIDE.md` - Hướng dẫn đầy đủ
- `QUICK_START_IMAGES.md` - Quick start
- `lib/shared/examples/` - Code examples
