import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../widgets/network_avatar.dart';

/// Ví dụ thực tế: Hiển thị danh sách employees với avatar từ Firestore
class EmployeeListWithAvatars extends StatelessWidget {
  const EmployeeListWithAvatars({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Danh sách Nhân viên')),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('employees')
            .where('status', isEqualTo: 'active')
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Lỗi: ${snapshot.error}'));
          }

          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final employees = snapshot.data?.docs ?? [];

          if (employees.isEmpty) {
            return const Center(child: Text('Không có nhân viên nào'));
          }

          return ListView.builder(
            itemCount: employees.length,
            itemBuilder: (context, index) {
              final doc = employees[index];
              final data = doc.data() as Map<String, dynamic>;

              // Lấy dữ liệu từ Firestore
              final fullName = data['fullName'] ?? 'N/A';
              final position = data['position'] ?? 'N/A';
              final avatarUrl = data['avatarUrl'] as String?; // ← Đây là key
              final email = data['email'] ?? '';
              final phone = data['phone'] ?? '';

              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListTile(
                  // Sử dụng NetworkAvatar widget
                  leading: NetworkAvatar(
                    avatarUrl: avatarUrl, // Truyền trực tiếp từ Firestore
                    size: 50,
                  ),
                  title: Text(
                    fullName,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(position),
                      if (email.isNotEmpty)
                        Text(email, style: const TextStyle(fontSize: 12)),
                    ],
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // Navigate to detail screen
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            EmployeeDetailScreen(employeeId: doc.id),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}

/// Màn hình chi tiết employee với avatar lớn hơn
class EmployeeDetailScreen extends StatelessWidget {
  final String employeeId;

  const EmployeeDetailScreen({super.key, required this.employeeId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Chi tiết Nhân viên')),
      body: StreamBuilder<DocumentSnapshot>(
        stream: FirebaseFirestore.instance
            .collection('employees')
            .doc(employeeId)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Lỗi: ${snapshot.error}'));
          }

          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final data = snapshot.data?.data() as Map<String, dynamic>?;
          if (data == null) {
            return const Center(child: Text('Không tìm thấy thông tin'));
          }

          final fullName = data['fullName'] ?? 'N/A';
          final position = data['position'] ?? 'N/A';
          final avatarUrl = data['avatarUrl'] as String?;
          final email = data['email'] ?? '';
          final phone = data['phone'] ?? '';
          final address = data['address'] ?? '';
          final salary = data['salary'] ?? 0;

          return SingleChildScrollView(
            child: Column(
              children: [
                // Header với avatar lớn
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Theme.of(context).primaryColor,
                        Theme.of(context).primaryColor.withOpacity(0.7),
                      ],
                    ),
                  ),
                  child: Column(
                    children: [
                      // Avatar lớn
                      NetworkAvatar(avatarUrl: avatarUrl, size: 120),
                      const SizedBox(height: 16),
                      Text(
                        fullName,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        position,
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),

                // Thông tin chi tiết
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildInfoRow(Icons.email, 'Email', email),
                      _buildInfoRow(Icons.phone, 'Điện thoại', phone),
                      _buildInfoRow(Icons.location_on, 'Địa chỉ', address),
                      _buildInfoRow(
                        Icons.attach_money,
                        'Lương',
                        '${salary.toString()} VNĐ',
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: Colors.grey[600]),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
