import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:intl/intl.dart';
import '../../../theme/colors.dart';
import 'pt_packages_screen.dart';

class PTDashboardScreen extends StatefulWidget {
  const PTDashboardScreen({super.key});

  @override
  State<PTDashboardScreen> createState() => _PTDashboardScreenState();
}

class _PTDashboardScreenState extends State<PTDashboardScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Map<String, dynamic>? employeeData;
  bool isLoading = true;
  int totalClients = 0;
  int activePackages = 0;
  double monthlyRevenue = 0;
  double rating = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return;

      // Lấy thông tin employee từ email
      final employeeQuery = await _firestore
          .collection('employees')
          .where('email', isEqualTo: user.email)
          .limit(1)
          .get();

      if (employeeQuery.docs.isEmpty) {
        setState(() {
          isLoading = false;
        });
        return;
      }

      final employeeDoc = employeeQuery.docs.first;
      final employeeId = employeeDoc.id;
      final employeeDataMap = employeeDoc.data();
      employeeData = {'id': employeeId, ...employeeDataMap};

      // Lấy tổng học viên từ field totalClients trong employee document
      int clientCount = employeeDataMap['totalClients'] ?? 0;

      // Đếm số gói tập active của PT này
      final packagesQuery = await _firestore
          .collection('ptPackages')
          .where('ptId', isEqualTo: employeeId)
          .where('isActive', isEqualTo: true)
          .get();

      // Tính tổng hoa hồng tháng này từ contracts
      double revenue = 0;
      final now = DateTime.now();
      final firstDayOfMonth = DateTime(now.year, now.month, 1);
      final nextMonth = DateTime(now.year, now.month + 1, 1);

      // Query tất cả contracts của PT (không cần index)
      try {
        final contractsQuery = await _firestore
            .collection('contracts')
            .where('ptId', isEqualTo: employeeId)
            .get();

        debugPrint(
          'Found ${contractsQuery.docs.length} contracts for PT: $employeeId',
        );

        for (var doc in contractsQuery.docs) {
          final data = doc.data();
          final createdAt = (data['createdAt'] as Timestamp?)?.toDate();

          // Lọc thủ công chỉ lấy contracts trong tháng hiện tại
          if (createdAt != null &&
              createdAt.isAfter(
                firstDayOfMonth.subtract(const Duration(seconds: 1)),
              ) &&
              createdAt.isBefore(nextMonth)) {
            final commissionAmount = data['commissionAmount'] ?? 0;
            final amount = (commissionAmount is int)
                ? commissionAmount.toDouble()
                : (commissionAmount as double);
            revenue += amount;
            debugPrint(
              'Contract ${doc.id}: createdAt=$createdAt, commission=$amount',
            );
          }
        }

        debugPrint('Total commission this month: $revenue');
      } catch (e) {
        debugPrint('Error loading commission: $e');
      }

      // Lấy rating từ employee document (đã được tính sẵn)
      final ratingValue = employeeDataMap['rating'] ?? 0;
      final avgRating = (ratingValue is int)
          ? ratingValue.toDouble()
          : (ratingValue as double);

      setState(() {
        activePackages = packagesQuery.docs.length;
        totalClients = clientCount;
        monthlyRevenue = revenue;
        rating = avgRating;
        isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading PT dashboard data: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _auth.currentUser;
    final displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'PT';
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ');

    return Scaffold(
      backgroundColor: context.background,
      appBar: AppBar(
        title: Text(
          'PT Dashboard',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: context.textPrimary,
          ),
        ),
        backgroundColor: context.surface,
        elevation: 0,
        centerTitle: false,
        foregroundColor: context.textPrimary,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            decoration: BoxDecoration(
              color: context.isDarkMode
                  ? Colors.grey.shade800
                  : Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: Icon(Icons.settings_outlined, color: context.textPrimary),
              onPressed: () {
                Navigator.pushNamed(context, '/pt/settings');
              },
            ),
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Welcome Section
                    _buildWelcomeCard(displayName),
                    const SizedBox(height: 24),

                    // Stats Section
                    Text(
                      'Tổng quan',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: context.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 1.2,
                      children: [
                        _buildStatCard(
                          label: 'Tổng học viên',
                          value: totalClients.toString(),
                          icon: Icons.people_outline,
                          color: const Color(0xFF4E73DF), // Blue
                          onTap: () =>
                              Navigator.pushNamed(context, '/pt/clients'),
                        ),
                        _buildStatCard(
                          label: 'Gói đang bán',
                          value: activePackages.toString(),
                          icon: Icons.inventory_2_outlined,
                          color: const Color(0xFF1CC88A), // Green
                          onTap: () {
                            if (employeeData != null) {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => PTPackagesScreen(
                                    ptId: employeeData!['id'],
                                  ),
                                ),
                              );
                            }
                          },
                        ),
                        _buildStatCard(
                          label: 'Hoa hồng tháng',
                          value: currencyFormat.format(monthlyRevenue),
                          icon: Icons.monetization_on_outlined,
                          color: const Color(0xFF36B9CC), // Cyan
                        ),
                        _buildStatCard(
                          label: 'Đánh giá',
                          value: rating > 0 ? rating.toStringAsFixed(1) : 'N/A',
                          icon: Icons.star_outline,
                          color: const Color(0xFFF6C23E), // Yellow
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Quick Actions Section
                    Text(
                      'Thao tác nhanh',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: context.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildQuickActions(context),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildWelcomeCard(String displayName) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primary.withOpacity(0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.waving_hand,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Xin chào,',
                style: TextStyle(
                  fontSize: 18,
                  color: Colors.white70,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            displayName,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Chúc bạn một ngày làm việc hiệu quả!',
            style: TextStyle(fontSize: 16, color: Colors.white70),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
    VoidCallback? onTap,
  }) {
    return Material(
      color: context.card,
      borderRadius: BorderRadius.circular(20),
      elevation: 0,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 20, color: color),
              ),
              const SizedBox(height: 8),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          value,
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: context.textPrimary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 14,
                        color: context.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _buildActionButton(
            context,
            icon: Icons.person_outline,
            label: 'Hồ sơ cá nhân',
            color: const Color(0xFF6C5CE7),
            onTap: () => Navigator.pushNamed(context, '/pt/profile'),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildActionButton(
            context,
            icon: Icons.group_outlined,
            label: 'Quản lý học viên',
            color: const Color(0xFF00CEC9),
            onTap: () => Navigator.pushNamed(context, '/pt/clients'),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: context.card,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 24, color: color),
              ),
              const SizedBox(height: 12),
              Text(
                label,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: context.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
