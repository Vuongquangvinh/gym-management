# Face Check-in System - Luồng Hoạt Động

## Kiến Trúc
```
React (5173) → Node.js (3000) → Python FastAPI (8000) → Firestore
```

**Tech Stack:**
- Frontend: React + Vite, react-webcam
- Backend Proxy: Node.js Express
- Face Recognition: Python + face_recognition library + OpenCV
- Database: Firestore

**Tech Stack:**
- Frontend: React + Vite, react-webcam
- Backend Proxy: Node.js Express
- Face Recognition: Python + face_recognition library + OpenCV
- Database: Firestore

---

## 🎯 Luồng Chính

### 1. Đăng Ký Face ID
```
Admin chọn nhân viên → Camera ON → Chụp ảnh → base64
→ POST /api/face/register → Python nhận diện
→ face_recognition.face_encodings() tạo vector 128 chiều
→ Lưu encoding vào Firestore employees/{id}/faceEncoding
→ Frontend reload danh sách
```

### 2. Nhận Diện Khuôn Mặt
```
Mở modal → Camera ON → setInterval mỗi 2s quét
→ Capture frame → Convert base64
→ POST /api/face/recognize
→ Python so sánh: face_distance < 0.5 = Match
→ Return employee info + confidence %
→ Hiển thị modal với nút Check-in/Checkout
```

### 3. Check-in/Checkout
```
Click nút → POST /api/face/checkin
→ Python validate:
  • Có lịch làm việc? (PT)
  • Đã check-in/checkout hôm nay chưa?
  • Checkout phải check-in trước
→ Lưu vào employee_checkins collection
→ Tạo notification cho admin + PT
→ Hiển thị "Thành công!" → Auto close 3s
```

---

## 🔑 Key Mechanisms

**Prevent Overlapping Requests:**
```javascript
isProcessingRef.current = true;  // Chặn request mới
await fetch(...);
isProcessingRef.current = false; // Mở lại
```

**Cancel Requests khi đóng modal:**
```javascript
abortController.abort();  // Cancel fetch đang chờ
```

**Face Recognition:**
```python
distance = face_recognition.face_distance(known, current)
if distance < 0.5:  # Cùng người
    confidence = (1 - distance) * 100  # 83%
```

---

## 📊 Database

**employees:** `faceEncoding` (array 128 số)  
**employee_checkins:** `employeeId, checkinType, timestamp, date`  
**schedule:** `employeeId, date, status`  
**notifications:** `recipientId, type, message`

---

## ⚡ Performance

- Quét mỗi 2s (balance speed/load)
- JPEG quality 0.8 (giảm payload)
- CNN model (chính xác)
- Threshold 0.5 (optimal)
- AbortController (cancel requests)

---

## 🐛 Common Issues

| Issue | Fix |
|-------|-----|
| Modal không hiện | Check `setDetectedEmployee()` được gọi |
| Quét liên tục | Reset `isProcessingRef = false` |
| Nút bị disable | Reset trong `finally` block |
| Network error | Dùng `AbortController` |
| Unicode error | Dùng timestamp filename |

---

**Tóm tắt:** React capture ảnh mỗi 2s → gửi base64 cho Python → so sánh vector 128 chiều → tìm match → hiển thị modal → click check-in → validate → lưu DB → tạo notification → done!

**Ngày tạo**: 10/12/2025
