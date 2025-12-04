# FCM Web Push - Đã Sửa Lỗi

## Các Lỗi Đã Sửa

### 1. **API Key sai trong Service Worker**
- **Lỗi cũ**: `AIzaSyDxt-f5FU9Ezs0cI2R7YAhkbbuDv7sEyLM` (thiếu Z)
- **Đã sửa**: `AIzaSyDxt-f5FU9Ezs0cIZR7YAhkbbuDv7sEyLM` (đúng)

### 2. **Storage Bucket và App ID sai**
- **Đã cập nhật** để khớp với cấu hình trong `firebase.js`
- Storage: `gym-managment-aa0a1.firebasestorage.app`
- App ID: `1:570047516781:web:37d2940218d19f60ba6f64`

### 3. **VAPID Key sai trong LoginPage**
- **Lỗi cũ**: `BAjQHpSd1vi...` (sai ký tự đầu)
- **Đã sửa**: `BAJqHPsD1vi...` (đúng, khớp với Firebase Console)

### 4. **Thiếu đăng ký Service Worker**
- **Đã thêm** vào `main.jsx` để đăng ký service worker khi app khởi động

### 5. **Thiếu yêu cầu quyền Notification**
- **Đã thêm** `Notification.requestPermission()` trước khi lấy FCM token

## Cấu Trúc Code Đã Sửa

### File đã cập nhật:

1. **`frontend_react/public/firebase-messaging-sw.js`**
   - Sửa lại Firebase config đúng (apiKey, storageBucket, appId)

2. **`frontend_react/src/main.jsx`**
   - Thêm đăng ký service worker khi app khởi động

3. **`frontend_react/src/features/auth/pages/LoginPage.jsx`**
   - Sửa VAPID key đúng
   - Thêm yêu cầu quyền notification trước khi lấy FCM token

## Cách Test

### Bước 1: Mở Browser và truy cập
```
http://localhost:5173/
```

### Bước 2: Login với tài khoản PT
- Email: `<email_pt>`
- Password: `<password_pt>`

### Bước 3: Kiểm tra Console
Sau khi login, bạn sẽ thấy:
1. **Service Worker registered**: Xác nhận service worker đã được đăng ký
2. **FCM token for PT saved**: Xác nhận FCM token đã được lưu vào Firestore

### Bước 4: Kiểm tra Firestore
- Mở Firebase Console > Firestore Database
- Vào collection `employees`
- Tìm document của PT vừa login
- Kiểm tra xem có field `fcmToken` và `fcmTokenUpdatedAt` không

### Bước 5: Test thông báo
1. Mở Flutter app (user)
2. Chọn PT và cập nhật lại khung giờ tập
3. PT sẽ nhận được thông báo trên React web

## Lưu Ý Quan Trọng

### 1. **Chạy trên localhost hoặc HTTPS**
- FCM web push chỉ hoạt động trên:
  - `http://localhost` hoặc `http://127.0.0.1`
  - `https://` (domain thật)

### 2. **Cho phép quyền Notification**
- Khi browser hiện popup yêu cầu quyền notification, nhấn **Allow**
- Nếu đã block, vào Settings > Site Settings > Notifications để bật lại

### 3. **Xóa cache nếu cần**
- Nếu vẫn lỗi, thử:
  1. Mở DevTools (F12)
  2. Application > Service Workers > Unregister
  3. Application > Storage > Clear site data
  4. Reload lại trang

### 4. **Kiểm tra VAPID Key**
- VAPID key trong code phải khớp với key trong Firebase Console
- Key pair hiện tại: `BAJqHPsD1viLHON4iVZuU_JxKsSAiUR4KkMA9zYrPZ-5hQtNzbfpQXoRmV4vV6TuK7Mgsm85Se6i6HQf-VNMUBE`

## Troubleshooting

### Lỗi: "Registration failed - push service error"
- **Nguyên nhân**: VAPID key sai, service worker không load được, hoặc quyền notification bị block
- **Giải pháp**: 
  - Kiểm tra lại VAPID key
  - Xóa cache và reload
  - Bật quyền notification trong browser settings

### Lỗi: "Service Worker registration failed"
- **Nguyên nhân**: File `firebase-messaging-sw.js` không tìm thấy hoặc có lỗi syntax
- **Giải pháp**:
  - Đảm bảo file nằm trong `public/` folder
  - Kiểm tra console để xem lỗi cụ thể

### Không nhận được notification
- **Kiểm tra**:
  1. FCM token đã được lưu vào Firestore chưa?
  2. Backend API đã gửi notification chưa? (check logs)
  3. Service worker có đang active không? (DevTools > Application > Service Workers)

## Kết Quả Mong Đợi

✅ Service worker đăng ký thành công  
✅ FCM token được lấy và lưu vào Firestore  
✅ PT nhận được notification khi user cập nhật lịch tập  
✅ Notification hiển thị trên browser (ngay cả khi tab không active)  

## Next Steps

Nếu mọi thứ hoạt động:
1. Test với nhiều PT khác nhau
2. Test notification khi tab đang active và không active
3. Test trên các browser khác (Chrome, Firefox, Edge)
4. Deploy lên production với HTTPS

---

**Ngày sửa**: 18/11/2025  
**Trạng thái**: ✅ Đã sửa xong, sẵn sàng test
