# Hướng dẫn sử dụng Payment History Screen

## ✅ Đã hoàn thành

### 1. **MembershipProvider.getPaymentHistory()**
- Lấy lịch sử thanh toán từ `payment_orders` collection
- Enrich data với thông tin chi tiết từ `packages` collection
- Trả về list đầy đủ thông tin giao dịch

### 2. **PaymentHistoryWidget**
- Widget hiển thị danh sách giao dịch dạng card
- Bottom sheet chi tiết khi tap vào card
- Empty state, loading state, error state
- Status chips với màu sắc tương ứng

### 3. **PaymentHistoryScreen**
- Screen wrapper với AppBar gradient
- Tự động load dữ liệu từ MembershipProvider
- Pull-to-refresh support
- Error handling với retry button

## 🚀 Cách sử dụng

### Từ bất kỳ đâu trong app:

```dart
// Cách 1: Dùng Navigator với userId
Navigator.pushNamed(
  context,
  '/payment-history',
  arguments: {
    'userId': 'user_id_here',
  },
);

// Cách 2: Không truyền userId (sẽ lấy từ currentUser trong MembershipProvider)
Navigator.pushNamed(context, '/payment-history');

// Cách 3: Direct navigation
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => PaymentHistoryScreen(
      userId: 'user_id_here', // optional
    ),
  ),
);
```

### Ví dụ trong Package Screen:

```dart
// Thêm vào ActionCardsSection hoặc nút riêng
ElevatedButton.icon(
  onPressed: () {
    Navigator.pushNamed(
      context,
      '/payment-history',
      arguments: {
        'userId': widget.userId,
      },
    );
  },
  icon: Icon(Icons.history),
  label: Text('Lịch sử thanh toán'),
  style: ElevatedButton.styleFrom(
    backgroundColor: Color(0xFF1976D2),
    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  ),
)
```

### Ví dụ trong Home Screen:

```dart
ListTile(
  leading: Icon(Icons.receipt_long, color: Color(0xFF1976D2)),
  title: Text('Lịch sử thanh toán'),
  trailing: Icon(Icons.arrow_forward_ios, size: 16),
  onTap: () {
    Navigator.pushNamed(context, '/payment-history');
  },
)
```

### Ví dụ trong Profile/Settings Screen:

```dart
Card(
  child: ListTile(
    leading: CircleAvatar(
      backgroundColor: Color(0xFF1976D2).withOpacity(0.1),
      child: Icon(Icons.payment, color: Color(0xFF1976D2)),
    ),
    title: Text('Lịch sử giao dịch'),
    subtitle: Text('Xem các giao dịch đã thực hiện'),
    trailing: Icon(Icons.chevron_right),
    onTap: () {
      Navigator.pushNamed(
        context,
        '/payment-history',
        arguments: {
          'userId': currentUser?.id,
        },
      );
    },
  ),
)
```

## 📊 Dữ liệu hiển thị

Mỗi payment order sẽ hiển thị:
- ✅ Mã đơn hàng (orderCode)
- ✅ Tên gói tập (packageName)
- ✅ Thời hạn gói (packageDuration)
- ✅ Số tiền (amount) - format VNĐ
- ✅ Trạng thái (status) - PAID, PENDING, CANCELLED, FAILED, EXPIRED
- ✅ Ngày tạo (createdAt)
- ✅ Ngày thanh toán (paidAt) - nếu có
- ✅ Mã giao dịch (transactionId)
- ✅ Chi tiết package từ packages collection (nếu có)

## 🎨 UI Features

- ✨ Gradient AppBar
- 🎯 Material Design 3
- 📱 Responsive layout
- 🔄 Pull-to-refresh
- 💫 Smooth animations
- 🎭 Status-based color coding
- 📋 Bottom sheet chi tiết
- 🚨 Error handling với retry
- 📭 Empty state
- ⏳ Loading state

## 🔧 Dependencies cần thiết

Đảm bảo đã có trong `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  provider: ^6.0.0
  cloud_firestore: ^4.0.0
  intl: ^0.18.0
  logger: ^2.0.0
```

## ✅ Hoàn tất

Tất cả đã được tích hợp sẵn trong `main.dart`. Chỉ cần:
1. Import MembershipProvider vào widget cần dùng
2. Gọi route `/payment-history` với hoặc không có userId
3. Enjoy! 🎉
