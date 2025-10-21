# 🎯 HƯỚNG DẪN DEMO PAYMENT API

## 🚀 Có 3 cách để demo:

---

## ✅ CÁCH 1: HTML Demo (Nhanh nhất - Không cần React)

### Bước 1: Start Backend
```bash
cd F:\Doan4\backend
npm start
```

### Bước 2: Mở file HTML
- Mở file: `F:\Doan4\demo-payment.html` bằng trình duyệt
- Hoặc double-click vào file

### Bước 3: Test Payment
1. Chọn một gói tập (Basic/Standard/Premium)
2. Click "Thanh toán"
3. Link PayOS sẽ được tạo
4. Click vào link để thanh toán

### ✅ Kết quả:
- Bạn sẽ thấy form đẹp với 3 gói tập
- Click thanh toán → Nhận được link PayOS
- Auto redirect đến trang thanh toán

---

## ✅ CÁCH 2: React Component Demo (Đầy đủ nhất)

### Bước 1: Start Backend
```bash
cd F:\Doan4\backend
npm start
```

### Bước 2: Setup Frontend

#### 2.1 Cài đặt dependencies (nếu chưa có)
```bash
cd F:\Doan4\frontend_react
npm install react-toastify axios react-router-dom
```

#### 2.2 Thêm route vào `src/App.jsx`:
```jsx
import DemoPaymentPage from './pages/DemoPaymentPage';

// Trong <Routes>:
<Route path="/demo-payment" element={<DemoPaymentPage />} />
```

#### 2.3 Thêm Toast CSS vào `src/main.jsx`:
```jsx
import 'react-toastify/dist/ReactToastify.css';
```

#### 2.4 Tạo file `.env`:
```env
VITE_API_URL=http://localhost:3000
```

### Bước 3: Start Frontend
```bash
npm run dev
```

### Bước 4: Truy cập
Mở browser: `http://localhost:5173/demo-payment`

### ✅ Kết quả:
- Trang đẹp với 3 gói tập được render
- Click "Thanh toán ngay" → Modal xác nhận
- Confirm → Redirect đến PayOS
- Toast notifications đầy đủ

---

## ✅ CÁCH 3: Test API trực tiếp với Postman/Thunder Client

### Endpoint: Create Payment
```
POST http://localhost:3000/api/payos/create-gym-payment
```

### Headers:
```
Content-Type: application/json
```

### Body (JSON):
```json
{
  "packageId": "PKG001",
  "packageName": "Gói Basic",
  "packagePrice": 500000,
  "packageDuration": 30,
  "userId": "USER_TEST_001",
  "userName": "Nguyễn Văn A",
  "userEmail": "test@gym.com",
  "userPhone": "0912345678",
  "returnUrl": "http://localhost:5173/payment/success",
  "cancelUrl": "http://localhost:5173/payment/cancel"
}
```

### Expected Response:
```json
{
  "success": true,
  "message": "Tạo link thanh toán thành công",
  "data": {
    "success": true,
    "checkoutUrl": "https://pay.payos.vn/web/...",
    "paymentLinkId": "abc123...",
    "orderCode": 1234567890,
    "qrCode": "data:image/png;base64,...",
    "metadata": {
      "packageId": "PKG001",
      "packageName": "Gói Basic",
      "packageDuration": 30,
      "userId": "USER_TEST_001",
      "paymentType": "gym_package",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

### ✅ Kết quả:
- Copy `checkoutUrl` và mở trong browser
- Thấy trang thanh toán PayOS
- Test với thẻ test của PayOS

---

## 🎨 Screenshots Flow

### Cách 1 - HTML Demo:
```
1. Mở demo-payment.html
   ↓
2. Chọn gói tập → Button "Thanh toán"
   ↓
3. Click → Hiển thị loading
   ↓
4. Success → Link PayOS xuất hiện
   ↓
5. Click link → Trang PayOS
```

### Cách 2 - React Component:
```
1. http://localhost:5173/demo-payment
   ↓
2. Xem 3 cards gói tập đẹp mắt
   ↓
3. Click "Thanh toán ngay" → Modal confirm
   ↓
4. Confirm → Loading + Toast notification
   ↓
5. Auto redirect → PayOS
   ↓
6. Sau thanh toán → /payment/success
```

---

## 🔧 Troubleshooting

### 1. Backend không chạy
```bash
# Kiểm tra port 3000 có bị chiếm không
netstat -ano | findstr :3000

# Kill process nếu cần
taskkill /PID <process_id> /F

# Start lại
cd F:\Doan4\backend
npm start
```

### 2. CORS Error
Đảm bảo trong `backend/src/app.js` có:
```javascript
import cors from 'cors';
app.use(cors());
```

### 3. PayOS Error
Kiểm tra credentials trong `.env`:
```env
PAYOS_CLIENT_ID=your_actual_client_id
PAYOS_API_KEY=your_actual_api_key
PAYOS_CHECKSUM_KEY=your_actual_checksum_key
```

### 4. Frontend không connect được backend
Kiểm tra `.env`:
```env
VITE_API_URL=http://localhost:3000
```

---

## 📋 Quick Start Checklist

### Backend Ready? ✅
- [ ] Backend đang chạy ở port 3000
- [ ] Console log "Server is running on port 3000"
- [ ] Không có error messages
- [ ] PayOS credentials đã config

### Frontend Ready? ✅
- [ ] Dependencies đã cài (axios, react-toastify)
- [ ] File .env đã tạo với VITE_API_URL
- [ ] Routes đã setup
- [ ] Dev server đang chạy

### Test Ready? ✅
- [ ] Browser đã mở
- [ ] DevTools console đã mở (F12)
- [ ] Network tab ready để xem requests

---

## 🎯 Recommended Demo Flow

**Cho người mới (5 phút):**
1. ✅ Dùng CÁCH 1 - HTML Demo
2. Mở `demo-payment.html`
3. Test ngay không cần setup gì thêm

**Cho developer (10 phút):**
1. ✅ Dùng CÁCH 2 - React Component
2. Setup đầy đủ như production
3. Test full workflow

**Cho testing/QA (2 phút):**
1. ✅ Dùng CÁCH 3 - API Testing
2. Test API trực tiếp
3. Verify response data

---

## 📱 Test với PayOS

### Test Cards (PayOS Sandbox):
```
Thẻ nội địa:
- Số thẻ: 9704 0000 0000 0018
- Tên: NGUYEN VAN A
- Ngày hết hạn: 03/07
- OTP: 123456

Ví điện tử test: Xem docs PayOS
```

---

## 🎉 Success Criteria

### Bạn thành công nếu:
1. ✅ Backend API trả về `checkoutUrl`
2. ✅ Click vào link mở được trang PayOS
3. ✅ Trang PayOS hiển thị đúng:
   - Số tiền
   - Tên gói tập
   - Thông tin người mua
4. ✅ Sau thanh toán redirect về success page
5. ✅ Console không có errors

---

## 📞 Need Help?

### Nếu gặp vấn đề:
1. Check backend logs (terminal running npm start)
2. Check browser console (F12 → Console)
3. Check Network tab (F12 → Network)
4. Đọc error message carefully
5. Tham khảo PAYMENT_API_SUMMARY.md

---

## 🚀 Next Steps

Sau khi demo thành công:
1. ✅ Integrate vào real pages
2. ✅ Connect với package database
3. ✅ Setup webhook handler
4. ✅ Add authentication
5. ✅ Deploy to production

---

**Happy Testing! 🎉**
