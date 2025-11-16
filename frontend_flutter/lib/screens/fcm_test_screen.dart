import 'package:flutter/material.dart';
import '../widgets/fcm_debug_widget.dart';

/// Screen để test FCM token
///
/// Cách sử dụng:
/// 1. Thêm route này vào app
/// 2. Navigate đến FCMTestScreen
/// 3. Xem token hiện tại
/// 4. Nhấn "Lưu FCM Token" để lưu vào Firestore
class FCMTestScreen extends StatelessWidget {
  const FCMTestScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('FCM Token Test'),
        backgroundColor: Colors.orange,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Instructions
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              color: Colors.blue.shade50,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.info, color: Colors.blue.shade700),
                      const SizedBox(width: 8),
                      Text(
                        'Hướng dẫn',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue.shade700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    '1. Kiểm tra "FCM Token hiện tại" đã có chưa\n'
                    '2. Kiểm tra "Token đã lưu trong Firestore" có khớp không\n'
                    '3. Nếu chưa khớp, nhấn nút "Lưu FCM Token"\n'
                    '4. Sau khi lưu thành công, thử thanh toán để nhận notification',
                    style: TextStyle(fontSize: 14),
                  ),
                ],
              ),
            ),

            // FCM Debug Widget
            const FCMDebugWidget(),

            // Additional info
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Sau khi lưu token thành công:',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  _buildCheckItem('✅ Token được lưu vào Firestore'),
                  _buildCheckItem('✅ Backend có thể gửi notification'),
                  _buildCheckItem('✅ Bạn sẽ nhận thông báo khi thanh toán'),
                  _buildCheckItem('✅ Bạn sẽ nhận thông báo khác (nếu có)'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCheckItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          const SizedBox(width: 8),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
