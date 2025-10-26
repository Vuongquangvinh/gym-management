# 🎯 DEMO NHANH - 3 BƯỚC

## ✅ BACKEND ĐÃ CHẠY RỒI!
Server đang chạy ở `http://localhost:3000` ✓

---

## 🚀 CÁCH DEMO NHANH NHẤT (1 phút):

### 1️⃣ Mở file HTML
- Double-click file: **`F:\Doan4\demo-payment.html`**
- Hoặc kéo thả vào browser

### 2️⃣ Chọn gói tập
- Click vào một trong 3 gói: Basic, Standard, Premium
- Nút "Thanh toán" sẽ sáng lên

### 3️⃣ Thanh toán
- Click nút "💳 Thanh toán"
- Đợi 2 giây → Link PayOS xuất hiện
- Click link → Trang thanh toán mở ra

---

## 🎨 Giao diện bạn sẽ thấy:

```
┌─────────────────────────────────────┐
│  🏋️ Demo Thanh Toán Gói Tập Gym   │
├─────────────────────────────────────┤
│                                     │
│  [🥉 Gói Basic]  [🥈 Standard]     │
│   500,000 VNĐ    1,200,000 VNĐ     │
│                                     │
│      [🥇 Gói Premium]               │
│       2,000,000 VNĐ                 │
│                                     │
│  👤 User: Nguyễn Văn A              │
│                                     │
│  [💳 Thanh toán ngay]               │
└─────────────────────────────────────┘
```

---

## ✨ Kết quả mong đợi:

### ✅ Thành công:
```
✓ Link thanh toán xuất hiện
✓ Có QR code (có thể quét)
✓ Có button "Mở trang thanh toán PayOS"
✓ Click vào → Trang PayOS mở ra
```

### ⚠️ Nếu lỗi:
```
Kiểm tra:
1. Backend có chạy không? (Terminal có "Server is running"?)
2. Port 3000 có bị chiếm không?
3. File demo-payment.html có mở được không?
```

---

## 🔥 DEMO REACT (Nếu muốn test full UI):

### Quick Setup:
```bash
cd F:\Doan4\frontend_react
npm install react-toastify
npm run dev
```

### Mở browser:
```
http://localhost:5173/demo-payment
```

Sẽ thấy giao diện đẹp hơn với animations!

---

## 📱 Test Thanh Toán PayOS:

Khi vào trang PayOS, dùng thông tin test:

### Thẻ test:
```
Số thẻ: 9704 0000 0000 0018
Tên: NGUYEN VAN A
Ngày: 03/07
OTP: 123456
```

---

## 🎉 XEM KẾT QUẢ:

### Trong Console (F12):
```javascript
✅ Payment link created successfully: {
  checkoutUrl: "https://pay.payos.vn/web/...",
  orderCode: 1234567890,
  ...
}
```

### Trên UI:
- ✅ Success message màu xanh
- 🔗 Link clickable
- 📱 QR code hiển thị

---

## 💡 TIP:

**Cách nhanh nhất:**
1. Mở `demo-payment.html` 
2. Click gói Basic
3. Click Thanh toán
4. Done! ✨

**Mất không quá 30 giây!**

---

Need help? Đọc file `DEMO_GUIDE.md` để biết chi tiết! 📖
