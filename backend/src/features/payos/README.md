# 💳 PayOS Gym Package Payment API

API thanh toán gói tập gym sử dụng PayOS Payment Gateway.

## 📋 Mục lục
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Ví dụ sử dụng](#ví-dụ-sử-dụng)
- [Webhook](#webhook)
- [Error Handling](#error-handling)

## 🚀 Setup

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
Tạo file `.env` và cấu hình:
```env
PORT=3000
FRONTEND_URL=http://localhost:5173
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
```

### 3. Khởi động server
```bash
npm start
```

## 📡 API Endpoints

### 1. Tạo Payment Link cho Gói Tập

**Endpoint:** `POST /api/payos/create-gym-payment`

**Request Body:**
```json
{
  "packageId": "PKG001",
  "packageName": "Gói Premium 3 Tháng",
  "packagePrice": 1500000,
  "packageDuration": 90,
  "userId": "USER123",
  "userName": "Nguyễn Văn A",
  "userEmail": "user@example.com",
  "userPhone": "0912345678",
  "returnUrl": "http://localhost:5173/payment/success",
  "cancelUrl": "http://localhost:5173/payment/cancel"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Tạo link thanh toán thành công",
  "data": {
    "success": true,
    "checkoutUrl": "https://pay.payos.vn/web/...",
    "paymentLinkId": "abc123",
    "orderCode": 1234567890,
    "qrCode": "data:image/png;base64,...",
    "metadata": {
      "packageId": "PKG001",
      "packageName": "Gói Premium 3 Tháng",
      "packageDuration": 90,
      "userId": "USER123",
      "paymentType": "gym_package",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Thiếu thông tin gói tập (packageId, packageName, packagePrice)",
  "error": {}
}
```

---

### 2. Lấy Thông Tin Thanh Toán

**Endpoint:** `GET /api/payos/payment/:orderCode`

**Example:** `GET /api/payos/payment/1234567890`

**Response:**
```json
{
  "success": true,
  "data": {
    "orderCode": 1234567890,
    "amount": 1500000,
    "description": "Thanh toan goi tap Premium",
    "status": "PAID",
    "transactions": [...]
  }
}
```

---

### 3. Hủy Thanh Toán

**Endpoint:** `POST /api/payos/cancel/:orderCode`

**Request Body:**
```json
{
  "reason": "Khách hàng yêu cầu hủy"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã hủy thanh toán thành công",
  "data": {}
}
```

---

### 4. Webhook (PayOS Callback)

**Endpoint:** `POST /api/payos/webhook`

**Note:** Endpoint này chỉ được gọi bởi PayOS server khi thanh toán thành công.

**Webhook Data:**
```json
{
  "code": "00",
  "desc": "success",
  "success": true,
  "data": {
    "orderCode": 1234567890,
    "amount": 1500000,
    "description": "Thanh toan goi tap Premium",
    "accountNumber": "12345678",
    "reference": "TF230204212323",
    "transactionDateTime": "2023-02-04 18:25:00",
    "paymentLinkId": "124c33293c43417ab7879e14c8d9eb18"
  },
  "signature": "..."
}
```

## 💻 Ví dụ sử dụng từ React

### Tạo Payment Link

```javascript
// src/services/paymentService.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/payos';

export const createGymPayment = async (paymentData) => {
  try {
    const response = await axios.post(`${API_URL}/create-gym-payment`, {
      packageId: paymentData.packageId,
      packageName: paymentData.packageName,
      packagePrice: paymentData.packagePrice,
      packageDuration: paymentData.packageDuration,
      userId: paymentData.userId,
      userName: paymentData.userName,
      userEmail: paymentData.userEmail,
      userPhone: paymentData.userPhone,
      returnUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`,
    });

    if (response.data.success) {
      // Chuyển hướng đến trang thanh toán
      window.location.href = response.data.data.checkoutUrl;
    }

    return response.data;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const getPaymentStatus = async (orderCode) => {
  try {
    const response = await axios.get(`${API_URL}/payment/${orderCode}`);
    return response.data;
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
};
```

### Component React

```jsx
// src/components/PackagePayment.jsx
import React, { useState } from 'react';
import { createGymPayment } from '../services/paymentService';

function PackagePayment({ packageInfo, userInfo }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      await createGymPayment({
        packageId: packageInfo.id,
        packageName: packageInfo.name,
        packagePrice: packageInfo.price,
        packageDuration: packageInfo.duration,
        userId: userInfo.id,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userPhone: userInfo.phone,
      });
    } catch (error) {
      alert('Có lỗi xảy ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="package-payment">
      <h3>{packageInfo.name}</h3>
      <p>Giá: {packageInfo.price.toLocaleString('vi-VN')} VNĐ</p>
      <p>Thời hạn: {packageInfo.duration} ngày</p>
      
      <button 
        onClick={handlePayment}
        disabled={loading}
        className="btn-payment"
      >
        {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
      </button>
    </div>
  );
}

export default PackagePayment;
```

### Success Page

```jsx
// src/pages/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPaymentStatus } from '../services/paymentService';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const orderCode = searchParams.get('orderCode');

  useEffect(() => {
    if (orderCode) {
      getPaymentStatus(orderCode).then((data) => {
        setPaymentInfo(data.data);
      });
    }
  }, [orderCode]);

  return (
    <div className="payment-success">
      <h1>✅ Thanh toán thành công!</h1>
      {paymentInfo && (
        <div>
          <p>Mã đơn hàng: {paymentInfo.orderCode}</p>
          <p>Số tiền: {paymentInfo.amount.toLocaleString('vi-VN')} VNĐ</p>
          <p>Trạng thái: {paymentInfo.status}</p>
        </div>
      )}
    </div>
  );
}

export default PaymentSuccess;
```

## 🔒 Error Handling

API trả về các mã lỗi sau:

| Status Code | Message | Description |
|-------------|---------|-------------|
| 400 | Missing required fields | Thiếu thông tin bắt buộc |
| 400 | Số tiền phải lớn hơn 1,000 VNĐ | Số tiền không hợp lệ |
| 500 | Lỗi khi tạo link thanh toán | Lỗi từ PayOS |

## 📝 Notes

1. **orderCode** phải là số nguyên duy nhất cho mỗi giao dịch
2. **amount** phải >= 1,000 VNĐ
3. **returnUrl** và **cancelUrl** là optional, sẽ dùng mặc định nếu không có
4. Webhook cần được cấu hình trên PayOS Dashboard

## 🔗 Links

- [PayOS Documentation](https://payos.vn/docs)
- [PayOS Dashboard](https://my.payos.vn)

## 📞 Support

Nếu có vấn đề, liên hệ team dev.
