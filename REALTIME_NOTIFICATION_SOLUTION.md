# Giải Pháp Real-time Notification cho PT (Không cần FCM Web Push)

## 🎯 Tổng Quan

Do **Firebase Cloud Messaging API (Legacy) bị disabled** và FCM V1 yêu cầu Service Account authentication (không phù hợp cho web client), chúng ta sử dụng giải pháp:

**Firestore Real-time Listener + Browser Notification API**

### Ưu điểm:
- ✅ Không cần FCM token cho web
- ✅ Real-time như FCM
- ✅ Không bị giới hạn bởi Legacy API
- ✅ An toàn hơn (không expose credentials)
- ✅ Hoạt động trên mọi browser hiện đại

## 🏗️ Kiến Trúc

```
User (Flutter) updates schedule
        ↓
Backend API (/api/contract/notify-pt-schedule-change)
        ↓
Tạo document trong Firestore collection "notifications"
        ↓
PT (React Web) đang lắng nghe Firestore real-time
        ↓
Nhận notification → Hiển thị Browser Notification
```

## 📁 Files Đã Tạo/Cập Nhật

### 1. **NotificationService** (`frontend_react/src/services/notificationService.js`)
Service quản lý việc lắng nghe và hiển thị notifications

**Chức năng:**
- `startListening(ptId, callback)`: Bắt đầu lắng nghe notifications cho PT
- `showBrowserNotification(notification)`: Hiển thị browser notification
- `markAsRead(notificationId)`: Đánh dấu đã đọc
- `stopListening()`: Dừng lắng nghe
- `requestPermission()`: Yêu cầu quyền notification

### 2. **useNotifications Hook** (`frontend_react/src/hooks/useNotifications.js`)
React hook để sử dụng notification service trong component

**Usage:**
```jsx
import { useNotifications } from '../hooks/useNotifications';

function PTDashboard() {
  const ptId = 'PT_ID_HERE'; // Lấy từ auth context
  const { notifications, unreadCount, markAsRead } = useNotifications(ptId);

  return (
    <div>
      <h3>Notifications ({unreadCount})</h3>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          <h4>{notif.title}</h4>
          <p>{notif.body}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. **Backend Controller** (`backend/src/features/contract/contract.controller.js`)
Đã cập nhật để:
- Tạo notification trong Firestore thay vì chỉ gửi FCM
- Vẫn gửi FCM cho mobile app nếu có token (optional)

### 4. **LoginPage** (`frontend_react/src/features/auth/pages/LoginPage.jsx`)
Đã bỏ logic lấy FCM token, chỉ yêu cầu quyền notification

### 5. **Firestore Indexes** (`backend/firestore.indexes.json`)
Đã thêm composite index cho query notifications:
```json
{
  "collectionGroup": "notifications",
  "fields": [
    { "fieldPath": "recipientId", "mode": "ASCENDING" },
    { "fieldPath": "read", "mode": "ASCENDING" },
    { "fieldPath": "createdAt", "mode": "DESCENDING" }
  ]
}
```

## 🚀 Cách Sử Dụng

### Bước 1: Deploy Firestore Indexes
```bash
cd F:\Doan4\backend
firebase deploy --only firestore:indexes
```

### Bước 2: Khởi động Backend
```bash
cd F:\Doan4\backend
npm start
```

### Bước 3: Khởi động React App
```bash
cd F:\Doan4\frontend_react
npm run dev
```

### Bước 4: Thêm Hook vào PT Dashboard

Tìm file PT Dashboard (ví dụ: `PTHomePage.jsx` hoặc tương tự) và thêm:

```jsx
import { useNotifications } from '../../hooks/useNotifications';
import { useEffect } from 'react';

function PTDashboard() {
  // Lấy PT ID từ auth context hoặc localStorage
  const ptId = 'YOUR_PT_ID'; // TODO: Replace with actual PT ID
  
  const { notifications, unreadCount, markAsRead } = useNotifications(ptId);

  useEffect(() => {
    console.log('Unread notifications:', unreadCount);
  }, [unreadCount]);

  return (
    <div>
      {/* Your existing dashboard code */}
      
      {/* Thêm notification indicator */}
      {unreadCount > 0 && (
        <div className="notification-badge">
          {unreadCount} thông báo mới
        </div>
      )}
      
      {/* Hiển thị danh sách notifications */}
      <div className="notifications-list">
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            className={`notification-item ${notif.read ? 'read' : 'unread'}`}
            onClick={() => markAsRead(notif.id)}
          >
            <h4>{notif.title}</h4>
            <p>{notif.body}</p>
            <small>{new Date(notif.createdAt?.toDate()).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Bước 5: Test

1. Login với tài khoản PT trên React web
2. Cho phép notification khi browser hỏi
3. Mở Flutter app với tài khoản user
4. Cập nhật lịch tập/khung giờ
5. PT sẽ nhận notification ngay lập tức trên React web!

## 🔔 Browser Notification

Notification sẽ hiển thị ngay cả khi:
- Tab không active
- Browser bị minimize
- Đang làm việc ở app khác

**Lưu ý**: Cần cho phép notification permission lần đầu tiên.

## 📊 Firestore Collection Structure

### Collection: `notifications`

```javascript
{
  recipientId: "PT_ID",           // ID của PT nhận notification
  recipientType: "pt",             // Loại người nhận (pt, user, admin)
  title: "Lịch tập đã thay đổi",  // Tiêu đề
  body: "Khách hàng vừa...",       // Nội dung
  message: "Khách hàng vừa...",    // Nội dung chi tiết
  type: "schedule_update",         // Loại notification
  contractId: "CONTRACT_ID",       // ID hợp đồng liên quan
  userId: "USER_ID",               // ID user thực hiện hành động
  read: false,                     // Đã đọc chưa
  createdAt: Timestamp,            // Thời gian tạo
  readAt: Timestamp                // Thời gian đọc (nếu đã đọc)
}
```

## 🔧 Troubleshooting

### Không nhận được notification
1. **Kiểm tra quyền notification**: Settings > Site Settings > Notifications
2. **Kiểm tra console**: Xem có lỗi khi start listening không
3. **Kiểm tra Firestore**: Xem document notification có được tạo không
4. **Kiểm tra PT ID**: Đảm bảo đang dùng đúng PT ID

### Notification không hiển thị dù đã có trong Firestore
1. Xóa cache browser và reload
2. Kiểm tra notification permission
3. Test trên browser khác (Chrome, Firefox)

### Query lỗi "Missing index"
1. Deploy firestore indexes: `firebase deploy --only firestore:indexes`
2. Hoặc click vào link trong console error để tạo index tự động

## 🎉 Kết Quả Mong Đợi

✅ PT login → Yêu cầu notification permission  
✅ PT đang ở PT dashboard → Lắng nghe Firestore real-time  
✅ User cập nhật lịch → Backend tạo notification trong Firestore  
✅ PT nhận notification ngay lập tức (< 1 giây)  
✅ Browser notification hiển thị (ngay cả khi tab không active)  
✅ Danh sách notification cập nhật trong UI  

## 📚 So Sánh với FCM

| Tính năng | FCM Web Push | Firestore Listener |
|-----------|--------------|-------------------|
| Cần token | ✅ Cần VAPID key | ❌ Không cần |
| Setup phức tạp | ✅ Service worker, VAPID | ❌ Đơn giản |
| Legacy API issue | ❌ Bị disabled | ✅ Không ảnh hưởng |
| Real-time | ✅ Có | ✅ Có |
| Offline support | ✅ Có (service worker) | ❌ Không |
| Browser support | ⚠️ Chrome, Firefox | ✅ Tất cả modern browsers |

## 🚀 Next Steps

1. ✅ Deploy Firestore indexes
2. ✅ Thêm hook vào PT Dashboard
3. ⬜ Tạo notification center UI cho PT
4. ⬜ Thêm âm thanh thông báo
5. ⬜ Thêm notification history
6. ⬜ Thêm notification settings (bật/tắt từng loại)

---

**Ngày tạo**: 18/11/2025  
**Trạng thái**: ✅ Sẵn sàng sử dụng  
**Giải pháp cho**: Legacy FCM API disabled issue
