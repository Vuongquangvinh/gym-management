# 🔔 Hướng dẫn Push Notification - Tiếng Việt

## 🎯 Đã làm gì?

Tích hợp **Firebase Cloud Messaging (FCM)** để gửi thông báo đẩy. Người dùng nhận được thông báo **dù điện thoại tắt màn hình hoặc app đã đóng**.

---

## ⚡ Làm gì tiếp theo? (3 phút)

### **Bước 1: Cài package**

```bash
cd frontend_flutter
flutter pub get
```

### **Bước 2: Chạy app trên điện thoại thật**

```bash
flutter run --release
```

⚠️ **Quan trọng:** Phải dùng **điện thoại thật**, không dùng giả lập được!

### **Bước 3: Lấy mã token**

Khi app chạy, xem console có dòng:

```
📱 FCM Token: fAbC123XyZ456...
```

→ **Copy mã này** (dài khoảng 100-200 ký tự)

### **Bước 4: Test gửi thông báo**

**Cách 1: Gửi từ Firebase Console (dễ nhất)**

1. Mở https://console.firebase.google.com/
2. Chọn project của bạn
3. Vào **Cloud Messaging** (menu bên trái)
4. Nhấn **"Send your first message"**
5. Điền:
   - Tiêu đề: "Thử nghiệm"
   - Nội dung: "Đây là thử nghiệm"
6. Nhấn **Next** → **"Send test message"**
7. Dán **FCM Token** vừa copy
8. Nhấn **Test**

**Cách 2: Gửi từ backend**

```bash
cd backend
node send_fcm_notification.js
```

(Nhưng phải cấu hình Server Key trước)

---

## 🎉 Kết quả mong đợi

✅ Điện thoại nhận được thông báo  
✅ Dù app đang tắt vẫn nhận được  
✅ Nhấn vào thông báo → app mở lên  

---

## 🤔 Cách hoạt động

### **Trước đây (Local Notification):**
```
App → Tạo thông báo → Lên lịch
→ Chỉ hoạt động khi app đang chạy
→ Tắt app = mất thông báo
```

### **Bây giờ (Push Notification):**
```
Server → Firebase → Điện thoại
→ Hoạt động dù app tắt
→ Tắt điện thoại = vẫn nhận khi bật lại
```

---

## 💡 Dùng để làm gì?

### **1. Nhắc lịch tập**
Server gửi thông báo 30 phút trước buổi tập:
- "🏋️ Buổi tập sắp bắt đầu lúc 14:00!"

### **2. Thông báo thanh toán**
Khi user nạp tiền thành công:
- "💰 Thanh toán thành công! Gói tập đã kích hoạt"

### **3. Thông báo chung**
Admin gửi cho tất cả users:
- "📢 Phòng gym đóng cửa ngày mai"

---

## 🔑 Files quan trọng

### **Frontend (Flutter):**
- `lib/services/fcm_service.dart` ← Service chính xử lý FCM
- `lib/main.dart` ← Khởi tạo FCM

### **Backend (Node.js):**
- `backend/send_fcm_notification.js` ← Script gửi thông báo

### **Tài liệu:**
- `FCM_QUICK_START.md` ← Hướng dẫn nhanh
- `FCM_PUSH_NOTIFICATION_GUIDE.md` ← Hướng dẫn chi tiết

---

## 🐛 Không hoạt động?

### **Kiểm tra:**

❓ App đã xin quyền thông báo chưa?  
→ Vào Settings điện thoại, cho phép notifications

❓ Có thấy FCM Token trong console không?  
→ Nếu không, check lại code khởi tạo

❓ Test trên điện thoại thật chưa?  
→ Giả lập không hoạt động được!

❓ Gửi đến đúng token chưa?  
→ Mỗi lần cài lại app token sẽ thay đổi

---

## 💰 Tốn tiền không?

**KHÔNG!** FCM hoàn toàn miễn phí:
- ✅ Gửi không giới hạn
- ✅ Không giới hạn số người dùng
- ✅ Không giới hạn số thiết bị

---

## 📊 So sánh 2 loại thông báo

| Tính năng | Local Notification | Push Notification |
|-----------|-------------------|-------------------|
| **Cần server** | Không | Có |
| **App tắt** | ❌ Không hoạt động | ✅ Vẫn nhận được |
| **Tắt điện thoại** | ❌ Mất | ✅ Nhận khi bật lại |
| **Chi phí** | Miễn phí | Miễn phí |
| **Use case** | Nhắc lịch cục bộ | Thông báo từ xa |

---

## 🎓 Tips

1. **Kết hợp cả 2:**
   - Local: Nhắc lịch tập (đã lên lịch sẵn)
   - Push: Thông báo khẩn cấp, thanh toán, thay đổi lịch

2. **Lưu token vào database:**
   - Token tự động lưu vào Firestore
   - Collection: `users/{userId}/fcmToken`

3. **Gửi theo nhóm (Topic):**
   - Subscribe user vào topic "all_users"
   - Gửi 1 lần → tất cả nhận được

---

## ✅ Checklist hoàn thành

- [x] ✅ Code đã viết xong
- [x] ✅ Package đã cài
- [x] ✅ Backend script đã tạo
- [ ] 🔲 Chạy `flutter pub get`
- [ ] 🔲 Test trên điện thoại thật
- [ ] 🔲 Lấy FCM token
- [ ] 🔲 Gửi thử từ Firebase Console
- [ ] 🔲 Tích hợp vào backend thật

---

## 📞 Cần giúp?

1. Đọc file **FCM_QUICK_START.md** (tiếng Anh, chi tiết hơn)
2. Đọc file **FCM_PUSH_NOTIFICATION_GUIDE.md** (hướng dẫn đầy đủ)
3. Xem console logs để debug

---

**Chúc bạn thành công! 🎉**

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** 13/11/2025
