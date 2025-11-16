import 'package:flutter/material.dart';
import 'package:frontend_flutter/shared/widgets/network_avatar.dart';

/// Demo nhanh để test hiển thị avatar
/// Chạy: flutter run và navigate đến màn hình này
class QuickAvatarTest extends StatelessWidget {
  const QuickAvatarTest({super.key});

  @override
  Widget build(BuildContext context) {
    // Thay đổi avatarUrl này thành URL thực từ Firestore của bạn
    const testAvatarUrl =
        '/uploads/employees/avatars/emp_1762356223481_owffkb.jpg';

    return Scaffold(
      appBar: AppBar(title: const Text('Test Avatar Display')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Test 1: Avatar size 100
            const NetworkAvatar(avatarUrl: testAvatarUrl, size: 100),
            const SizedBox(height: 20),
            const Text(
              'Hồ Phúc Thịnh',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text('Kế toán', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 40),

            // Test 2: Danh sách avatar nhỏ
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const NetworkAvatar(avatarUrl: testAvatarUrl, size: 60),
                const SizedBox(width: 16),
                const NetworkAvatar(avatarUrl: testAvatarUrl, size: 60),
                const SizedBox(width: 16),
                const NetworkAvatar(avatarUrl: testAvatarUrl, size: 60),
              ],
            ),
            const SizedBox(height: 40),

            // Test 3: Avatar null (sẽ hiện placeholder)
            const Text('Test placeholder (không có avatar):'),
            const SizedBox(height: 16),
            const NetworkAvatar(avatarUrl: null, size: 80),
            const SizedBox(height: 40),

            // Hướng dẫn
            Container(
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '💡 Lưu ý:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  SizedBox(height: 8),
                  Text('1. Backend phải đang chạy (npm start)'),
                  Text('2. Kiểm tra api_config.dart có đúng IP'),
                  Text('3. Thay testAvatarUrl bằng URL thực'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
