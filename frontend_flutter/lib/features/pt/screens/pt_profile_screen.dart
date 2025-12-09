import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../theme/colors.dart';
import '../services/pt_profile_service.dart';
import '../models/pt_edit_request_model.dart';
import 'pt_edit_profile_screen.dart';

class PTProfileScreen extends StatefulWidget {
  const PTProfileScreen({super.key});

  @override
  State<PTProfileScreen> createState() => _PTProfileScreenState();
}

class _PTProfileScreenState extends State<PTProfileScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Map<String, dynamic>? employeeData;
  bool isLoading = true;
  List<PTEditRequestModel> pendingRequests = [];

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      setState(() => isLoading = true);

      final user = _auth.currentUser;
      if (user == null) {
        setState(() => isLoading = false);
        return;
      }

      final employeeQuery = await _firestore
          .collection('employees')
          .where('email', isEqualTo: user.email)
          .limit(1)
          .get();

      if (employeeQuery.docs.isEmpty) {
        setState(() => isLoading = false);
        return;
      }

      final employeeDoc = employeeQuery.docs.first;
      final data = employeeDoc.data();

      // Load pending requests using requestedBy (uid)
      final requests = await PTProfileService.getPendingRequests(data['uid']);

      setState(() {
        employeeData = {'id': employeeDoc.id, 'uid': data['uid'], ...data};
        pendingRequests = requests;
        isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading PT profile: $e');
      setState(() => isLoading = false);
    }
  }

  /// Navigate to edit profile screen
  Future<void> _navigateToEditProfile() async {
    if (employeeData == null) return;

    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PTEditProfileScreen(employeeData: employeeData!),
      ),
    );

    // Reload if edit request was submitted
    if (result == true) {
      _loadProfile();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.background,
      appBar: AppBar(
        title: Text(
          'Hồ sơ PT',
          style: TextStyle(
            color: context.textPrimary,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        backgroundColor: context.surface,
        elevation: 0,
        foregroundColor: context.textPrimary,
        actions: [
          IconButton(
            icon: Icon(Icons.edit_outlined, color: context.textPrimary),
            onPressed: _navigateToEditProfile,
            tooltip: 'Chỉnh sửa hồ sơ',
          ),
        ],
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              color: AppColors.primary,
              backgroundColor: context.surface,
              onRefresh: _loadProfile,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Pending requests banner
                    if (pendingRequests.isNotEmpty)
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.orange.shade300,
                            width: 2,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.schedule,
                                  color: Colors.orange.shade700,
                                  size: 24,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    'Bạn có ${pendingRequests.length} yêu cầu chỉnh sửa đang chờ duyệt',
                                    style: TextStyle(
                                      color: Colors.orange.shade900,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 15,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            ...pendingRequests.map((request) {
                              return Container(
                                margin: const EdgeInsets.only(top: 8),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: context.surface,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.access_time,
                                          size: 16,
                                          color: context.textSecondary,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Gửi lúc: ${request.formattedCreatedAt}',
                                          style: TextStyle(
                                            fontSize: 13,
                                            color: context.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (request
                                        .certificateImages
                                        .isNotEmpty) ...[
                                      const SizedBox(height: 8),
                                      Text(
                                        '📸 Có ${request.certificateImages.length} ảnh chứng chỉ mới',
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: context.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              );
                            }).toList(),
                          ],
                        ),
                      ),

                    // Edit profile button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _navigateToEditProfile,
                        icon: const Icon(Icons.edit),
                        label: const Text('Chỉnh sửa hồ sơ'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Basic info card
                    _buildCard(
                      title: 'Thông tin cơ bản',
                      child: Column(
                        children: [
                          _buildInfoRow(
                            'Họ tên',
                            employeeData?['fullName'] ?? 'N/A',
                          ),
                          _buildInfoRow(
                            'Email',
                            employeeData?['email'] ?? 'N/A',
                          ),
                          _buildInfoRow(
                            'Điện thoại',
                            employeeData?['phone'] ?? 'N/A',
                          ),
                          _buildInfoRow(
                            'Giới tính',
                            _getGenderText(employeeData?['gender']),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Professional info card
                    _buildCard(
                      title: 'Thông tin chuyên môn',
                      child: _buildPTInfo(),
                    ),
                    const SizedBox(height: 16),

                    // Specialties
                    _buildCard(
                      title: 'Chuyên môn',
                      child: _buildListDisplay(
                        items: _getSpecialties(),
                        emptyText: 'Chưa có chuyên môn',
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Certificates
                    _buildCard(
                      title: 'Chứng chỉ',
                      child: _buildCertificatesDisplay(),
                    ),
                    const SizedBox(height: 16),

                    // Achievements
                    _buildCard(
                      title: 'Thành tích',
                      child: _buildListDisplay(
                        items: _getAchievements(),
                        emptyText: 'Chưa có thành tích',
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  /// Get specialties list
  List<String> _getSpecialties() {
    final ptInfo = employeeData?['ptInfo'] as Map<String, dynamic>?;
    return List<String>.from(ptInfo?['specialties'] ?? []);
  }

  /// Get achievements list
  List<String> _getAchievements() {
    final ptInfo = employeeData?['ptInfo'] as Map<String, dynamic>?;
    return List<String>.from(ptInfo?['achievements'] ?? []);
  }

  /// Get certificates list
  List<String> _getCertificates() {
    final ptInfo = employeeData?['ptInfo'] as Map<String, dynamic>?;
    return List<String>.from(ptInfo?['certificates'] ?? []);
  }

  /// Build PT info section
  Widget _buildPTInfo() {
    final ptInfo = employeeData?['ptInfo'] as Map<String, dynamic>?;
    final bio = ptInfo?['bio'] ?? 'Chưa có giới thiệu';
    final experience = ptInfo?['experience'] ?? 0;
    final maxClients = ptInfo?['maxClientsPerDay'] ?? 8;
    final isAccepting = ptInfo?['isAcceptingNewClients'] ?? true;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildInfoRow('Giới thiệu', bio),
        _buildInfoRow('Kinh nghiệm', '$experience năm'),
        _buildInfoRow('Số học viên tối đa/ngày', '$maxClients học viên'),
        _buildInfoRow('Nhận học viên mới', isAccepting ? '✅ Có' : '❌ Không'),
      ],
    );
  }

  /// Build certificates display with images
  Widget _buildCertificatesDisplay() {
    final certificates = _getCertificates();

    if (certificates.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Chưa có chứng chỉ',
            style: TextStyle(color: context.textSecondary),
          ),
        ),
      );
    }

    // Check if certificates are URLs (images) or text
    final hasImages = certificates.any((cert) => cert.startsWith('http'));

    if (hasImages) {
      // Display as image grid
      return Wrap(
        spacing: 8,
        runSpacing: 8,
        children: certificates.map((cert) {
          if (cert.startsWith('http')) {
            return GestureDetector(
              onTap: () => _showImageDialog(cert),
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: context.border),
                  image: DecorationImage(
                    image: NetworkImage(cert),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            );
          } else {
            return Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.surface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(cert, style: TextStyle(color: context.textPrimary)),
            );
          }
        }).toList(),
      );
    } else {
      // Display as text list
      return _buildListDisplay(
        items: certificates,
        emptyText: 'Chưa có chứng chỉ',
      );
    }
  }

  /// Show image in full screen dialog
  void _showImageDialog(String imageUrl) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Expanded(
              child: InteractiveViewer(
                child: Image.network(imageUrl, fit: BoxFit.contain),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Đóng'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCard({required String title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: context.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(color: context.textSecondary, fontSize: 14),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: context.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  /// Build list display (read-only)
  Widget _buildListDisplay({
    required List<String> items,
    required String emptyText,
  }) {
    if (items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            emptyText,
            style: TextStyle(color: context.textSecondary),
          ),
        ),
      );
    }

    return Column(
      children: items.map((item) {
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: context.surface,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(Icons.check_circle, size: 16, color: Colors.green.shade600),
              const SizedBox(width: 8),
              Expanded(
                child: Text(item, style: TextStyle(color: context.textPrimary)),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  String _getGenderText(String? gender) {
    switch (gender) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      default:
        return 'Khác';
    }
  }
}
