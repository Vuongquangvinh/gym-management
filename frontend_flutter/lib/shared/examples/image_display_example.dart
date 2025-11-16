import 'package:flutter/material.dart';
import '../widgets/network_avatar.dart';
import '../widgets/network_image_card.dart';

/// Ví dụ sử dụng các widget để hiển thị ảnh từ backend
class ImageDisplayExample extends StatelessWidget {
  const ImageDisplayExample({super.key});

  @override
  Widget build(BuildContext context) {
    // Giả sử bạn có data từ Firestore như này:
    final employeeData = {
      'fullName': 'Hồ Phúc Thịnh',
      'avatarUrl': '/uploads/employees/avatars/emp_1762356223481_owffkb.jpg',
      'position': 'Kế toán',
    };

    final ptData = {
      'certificateUrl': '/uploads/pt/certificates/cert_123456_abcdef.jpg',
      'achievementUrl': '/uploads/pt/achievements/achieve_789012_ghijkl.jpg',
    };

    return Scaffold(
      appBar: AppBar(title: const Text('Ví dụ hiển thị ảnh')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ===== 1. HIỂN THỊ AVATAR EMPLOYEE =====
            Text(
              '1. Avatar Employee',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),

            // Cách 1: Dùng NetworkAvatar widget (đơn giản nhất)
            Row(
              children: [
                NetworkAvatar(
                  avatarUrl: employeeData['avatarUrl'] as String?,
                  size: 80,
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      employeeData['fullName'] as String,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      employeeData['position'] as String,
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ],
            ),

            const Divider(height: 48),

            // ===== 2. HIỂN THỊ CERTIFICATES =====
            Text(
              '2. PT Certificates',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),

            NetworkImageCard(
              imageUrl: ptData['certificateUrl'] as String?,
              width: double.infinity,
              height: 200,
              label: 'Chứng chỉ PT',
              borderRadius: BorderRadius.circular(12),
            ),

            const SizedBox(height: 24),

            // ===== 3. HIỂN THỊ ACHIEVEMENTS =====
            Text(
              '3. PT Achievements',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),

            NetworkImageCard(
              imageUrl: ptData['achievementUrl'] as String?,
              width: double.infinity,
              height: 200,
              label: 'Thành tích',
              borderRadius: BorderRadius.circular(12),
            ),

            const SizedBox(height: 24),

            // ===== 4. HIỂN THỊ DANH SÁCH AVATAR NHỎ =====
            Text(
              '4. Danh sách Avatar',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),

            SizedBox(
              height: 60,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: 5,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: NetworkAvatar(
                      avatarUrl: employeeData['avatarUrl'] as String?,
                      size: 60,
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 24),

            // ===== 5. THÊM VÀO LISTVIEW =====
            Text(
              '5. Trong ListView',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),

            ...List.generate(3, (index) {
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: NetworkAvatar(
                    avatarUrl: employeeData['avatarUrl'] as String?,
                    size: 50,
                  ),
                  title: Text(employeeData['fullName'] as String),
                  subtitle: Text(employeeData['position'] as String),
                  trailing: const Icon(Icons.chevron_right),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
