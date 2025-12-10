import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../theme/colors.dart';
import '../widgets/member_card_widget.dart';
import '../widgets/quick_actions_widget.dart';
import '../widgets/stats_summary_widget.dart';
import "package:logger/logger.dart";
import '../../model/user.model.dart';
import '../../../services/notification_service.dart';

final logger = Logger();

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? _fullName;
  String? _avatarUrl;
  UserPackageInfo? _userPackageInfo;
  bool _isLoading = true;
  int _lastUnreadCount = 0;
  bool _showBanner = false;
  int _pendingNotificationCount = 0;
  int _selectedIndex = 0; // Current tab index

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
    _loadPendingNotifications();
  }

  Future<void> _loadPendingNotifications() async {
    try {
      final notificationService = NotificationService();
      final pending = await notificationService.getPendingNotifications();
      if (mounted) {
        setState(() {
          _pendingNotificationCount = pending.length;
        });
      }
      print('🔔 Pending notifications loaded: $_pendingNotificationCount');
    } catch (e) {
      print('❌ Error loading pending notifications: $e');
    }
  }

  Future<void> _refreshData() async {
    await _loadUserInfo();
    await _loadPendingNotifications();
  }

  Future<void> _loadUserInfo() async {
    try {
      if (mounted) {
        setState(() {
          _isLoading = true;
        });
      }

      // Sử dụng UserModel để lấy thông tin user kèm package
      final userPackageInfo = await UserModel.getCurrentUserWithPackage();

      if (mounted) {
        if (userPackageInfo != null) {
          setState(() {
            _fullName = userPackageInfo.user.fullName;
            _avatarUrl = userPackageInfo.user.avatarUrl;
            _userPackageInfo = userPackageInfo;
            _isLoading = false;
          });
        } else {
          setState(() {
            _isLoading = false;
          });
          logger.w('Không tìm thấy thông tin user');
        }
      }
    } catch (e) {
      logger.e('Lỗi khi lấy thông tin user: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showNotificationBanner(int firestoreUnreadCount) {
    // Tổng số thông báo = Firestore unread + Pending notifications
    final totalUnreadCount = firestoreUnreadCount + _pendingNotificationCount;

    // Hiển thị banner nếu có thông báo mới (số lượng tăng so với lần trước)
    if (totalUnreadCount > _lastUnreadCount && !_showBanner) {
      setState(() {
        _showBanner = true;
        _lastUnreadCount = totalUnreadCount;
      });
      Future.delayed(const Duration(seconds: 5), () {
        if (mounted) {
          setState(() => _showBanner = false);
        }
      });
    } else {
      // Chỉ cập nhật count, không hiển thị banner
      if (totalUnreadCount > _lastUnreadCount) {
        _lastUnreadCount = totalUnreadCount;
      }
    }
  }

  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Widget _buildLoadingCard() {
    return Container(
      width: double.infinity,
      height: 160,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.primaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: const Center(
        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
      ),
    );
  }

  Widget _buildNoCardWidget() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        // Lưu ý: Đảm bảo context.surface v.v... tồn tại trong extension của bạn
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.withOpacity(0.3), width: 1.5),
      ),
      child: Column(
        children: [
          Icon(Icons.card_membership_outlined, size: 56, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            'Chưa có thông tin thẻ tập',
            style: GoogleFonts.inter(
              fontSize: 17,
              fontWeight: FontWeight.w600,
              // color: context.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Hãy đăng ký gói tập để bắt đầu',
            style: GoogleFonts.inter(fontSize: 14, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dateString =
        '${now.day.toString().padLeft(2, '0')} Tháng ${now.month}, ${now.year}';

    // Giả sử bạn có extension kiểm tra dark mode, nếu không dùng Theme.of(context)
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Stack(
      children: [
        Scaffold(
          backgroundColor: isDarkMode ? AppColors.surfaceDark : Colors.grey[50],
          body: RefreshIndicator(
            onRefresh: _refreshData,
            color: AppColors.primary,
            backgroundColor: isDarkMode ? AppColors.surfaceDark : Colors.white,
            child: CustomScrollView(
              controller: _scrollController,
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                // Modern Sporty AppBar
                SliverAppBar(
                  automaticallyImplyLeading: false,
                  expandedHeight: 180,
                  floating: false,
                  pinned: true,
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: isDarkMode
                              ? [AppColors.surfaceDark, AppColors.cardDark]
                              : [AppColors.primary, AppColors.primaryLight],
                        ),
                      ),
                      padding: EdgeInsets.only(
                        top: MediaQuery.of(context).padding.top + 20,
                        left: 20,
                        right: 20,
                        bottom: 20,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header Row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              // Avatar & Info
                              Row(
                                children: [
                                  Container(
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: Colors.white.withOpacity(0.4),
                                        width: 3,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.2),
                                          blurRadius: 10,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: CircleAvatar(
                                      radius: 28,
                                      backgroundImage: NetworkImage(
                                        _avatarUrl ??
                                            'https://www.gravatar.com/avatar/placeholder',
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Xin chào 👋',
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          color: isDarkMode
                                              ? Colors.white70
                                              : Colors.white.withOpacity(0.9),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        _fullName ?? "...",
                                        style: GoogleFonts.inter(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              // Notification Bell
                              StreamBuilder<QuerySnapshot>(
                                stream: FirebaseFirestore.instance
                                    .collection('notifications')
                                    .where(
                                      'userId',
                                      isEqualTo:
                                          FirebaseAuth
                                              .instance
                                              .currentUser
                                              ?.uid ??
                                          '',
                                    )
                                    .where('isRead', isEqualTo: false)
                                    .snapshots(),
                                builder: (context, snapshot) {
                                  final firestoreUnreadCount =
                                      snapshot.data?.docs.length ?? 0;
                                  final totalUnreadCount =
                                      firestoreUnreadCount +
                                      _pendingNotificationCount;

                                  // Lưu ý: Gọi setState trong build có thể gây lỗi nếu không cẩn thận.
                                  // addPostFrameCallback giúp tránh lỗi "setState during build"
                                  WidgetsBinding.instance.addPostFrameCallback((
                                    _,
                                  ) {
                                    _showNotificationBanner(
                                      firestoreUnreadCount,
                                    );
                                  });

                                  return GestureDetector(
                                    onTap: () => Navigator.pushNamed(
                                      context,
                                      '/notifications',
                                    ),
                                    child: Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(14),
                                        border: Border.all(
                                          color: Colors.white.withOpacity(0.3),
                                          width: 1.5,
                                        ),
                                      ),
                                      child: Stack(
                                        children: [
                                          Icon(
                                            Icons.notifications_outlined,
                                            color: Colors.white,
                                            size: 24,
                                          ),
                                          if (totalUnreadCount > 0)
                                            Positioned(
                                              right: 0,
                                              top: 0,
                                              child: Container(
                                                padding: const EdgeInsets.all(
                                                  4,
                                                ),
                                                decoration: BoxDecoration(
                                                  color: AppColors.error,
                                                  shape: BoxShape.circle,
                                                ),
                                                constraints:
                                                    const BoxConstraints(
                                                      minWidth: 16,
                                                      minHeight: 16,
                                                    ),
                                                child: Text(
                                                  totalUnreadCount > 9
                                                      ? '9+'
                                                      : '$totalUnreadCount',
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 9,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                  textAlign: TextAlign.center,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                          const Spacer(),
                          // Date
                          Text(
                            dateString,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: isDarkMode
                                  ? Colors.white60
                                  : Colors.white.withOpacity(0.85),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Content Section
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),
                        // Member Card
                        _isLoading
                            ? _buildLoadingCard()
                            : _userPackageInfo != null
                            ? MemberCardWidget(
                                memberName: _userPackageInfo!.user.fullName,
                                cardType: _userPackageInfo!.getPackageName(),
                                expiryDate: _userPackageInfo!
                                    .getFormattedEndDate(),
                                isActive: _userPackageInfo!.hasActivePackage(),
                                onScanQR: () {},
                              )
                            : _buildNoCardWidget(),

                        const SizedBox(height: 16),

                        // Stats Summary - Thống kê động lực
                        if (_userPackageInfo != null &&
                            _userPackageInfo!.hasActivePackage())
                          StatsSummaryWidget(userId: _userPackageInfo!.user.id),

                        const SizedBox(height: 24),

                        // Section Title
                        Text(
                          'Hoạt động nhanh',
                          style: GoogleFonts.inter(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            // color: context.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Quick Actions
                        QuickActionsWidget(userPackageInfo: _userPackageInfo),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Bottom Navigation Bar nằm trong Scaffold
          bottomNavigationBar: Container(
            decoration: BoxDecoration(
              color: isDarkMode ? AppColors.surfaceDark : Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 16,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              child: Container(
                height: 55,
                padding: const EdgeInsets.symmetric(horizontal: 1, vertical: 1),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    // Bottom Nav Items
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildNavItem(
                          0,
                          Icons.home_rounded,
                          Icons.home_outlined,
                          'Trang chủ',
                          isDarkMode,
                        ),
                        _buildNavItem(
                          1,
                          Icons.fitness_center_rounded,
                          Icons.fitness_center_outlined,
                          'Gói tập',
                          isDarkMode,
                        ),
                        // Spacer cho QR button ở giữa
                        const SizedBox(width: 50),
                        _buildNavItem(
                          3,
                          Icons.notifications_rounded,
                          Icons.notifications_outlined,
                          'Thông báo',
                          isDarkMode,
                        ),
                        _buildNavItem(
                          4,
                          Icons.settings_rounded,
                          Icons.settings_outlined,
                          'Cài đặt',
                          isDarkMode,
                        ),
                      ],
                    ),
                    // Floating QR Button ở giữa
                    Positioned(
                      left: MediaQuery.of(context).size.width / 2 - 31,
                      top: -20, // Nổi lên trên một chút
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedIndex = 2;
                          });
                          final userId =
                              _userPackageInfo?.user.id ??
                              FirebaseAuth.instance.currentUser?.uid;
                          Navigator.pushNamed(
                            context,
                            '/qr',
                            arguments: {
                              'qrData': userId ?? 'default_qr_code',
                              'userId': userId,
                              'fullName':
                                  _userPackageInfo?.user.fullName ?? _fullName,
                              'email':
                                  _userPackageInfo?.user.email ??
                                  FirebaseAuth.instance.currentUser?.email,
                              'phoneNumber': _userPackageInfo?.user.phoneNumber,
                              'packageName': _userPackageInfo?.getPackageName(),
                              'hasActivePackage':
                                  _userPackageInfo?.hasActivePackage() ?? false,
                            },
                          );
                        },
                        child: Container(
                          width: 55,
                          height: 55,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                AppColors.primary,
                                AppColors.primaryLight,
                              ],
                            ),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withOpacity(0.4),
                                blurRadius: 20,
                                offset: const Offset(0, 8),
                              ),
                              BoxShadow(
                                color: AppColors.primary.withOpacity(0.2),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Container(
                            margin: const EdgeInsets.all(5),
                            decoration: BoxDecoration(
                              color: isDarkMode
                                  ? AppColors.surfaceDark
                                  : Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: Container(
                              margin: const EdgeInsets.all(2.5),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    AppColors.primary,
                                    AppColors.primaryLight,
                                  ],
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.qr_code_scanner_rounded,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),

        // Notification Banner
        if (_showBanner)
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            left: 16,
            right: 16,
            child: GestureDetector(
              onTap: () {
                setState(() => _showBanner = false);
                Navigator.pushNamed(context, '/notifications');
              },
              child: Material(
                elevation: 6,
                borderRadius: BorderRadius.circular(16),
                color: AppColors.primary,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 14,
                    horizontal: 20,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Icon(
                              Icons.notifications_active,
                              color: Colors.white,
                            ),
                            const SizedBox(width: 10),
                            Flexible(
                              child: Text(
                                _pendingNotificationCount > 0
                                    ? 'Bạn có $_lastUnreadCount thông báo ($_pendingNotificationCount sắp tới)'
                                    : 'Bạn có $_lastUnreadCount thông báo mới',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.chevron_right, color: Colors.white),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildNavItem(
    int index,
    IconData activeIcon,
    IconData inactiveIcon,
    String label,
    bool isDarkMode,
  ) {
    final isSelected = _selectedIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedIndex = index;
          });

          switch (index) {
            case 0:
              break;
            case 1:
              Navigator.pushNamed(
                context,
                '/packageMember',
                arguments: {
                  'userId':
                      _userPackageInfo?.user.id ??
                      FirebaseAuth.instance.currentUser?.uid ??
                      '',
                },
              );
              break;
            case 2:
              // QR logic handled by floating button
              break;
            case 3:
              Navigator.pushNamed(context, '/notifications');
              break;
            case 4:
              Navigator.pushNamed(context, '/settings');
              break;
          }
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 4),
          decoration: BoxDecoration(
            // Nền nổi bật hơn khi được chọn
            gradient: isSelected
                ? LinearGradient(
                    colors: [
                      AppColors.primary.withOpacity(0.1),
                      AppColors.primaryLight.withOpacity(0.06),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  )
                : null,
            borderRadius: BorderRadius.circular(12),
            // Border khi active
            border: isSelected
                ? Border.all(
                    color: AppColors.primary.withOpacity(0.25),
                    width: 1,
                  )
                : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon với container nổi bật khi active
              Container(
                // Sửa lỗi padding ở đây: all(0) giống zero, tăng lên để thấy background
                padding: isSelected ? const EdgeInsets.all(6) : EdgeInsets.zero,
                decoration: isSelected
                    ? BoxDecoration(
                        color: AppColors.primary.withOpacity(0.08),
                        shape: BoxShape.circle,
                      )
                    : null,
                child: Icon(
                  isSelected ? activeIcon : inactiveIcon,
                  color: isSelected
                      ? AppColors.primary
                      : (isDarkMode ? Colors.white70 : Colors.black54),
                  // Sửa lỗi size: 14 quá nhỏ
                  size: 22,
                ),
              ),
              const SizedBox(height: 2),
              // Label với font đậm hơn khi active
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 9.5,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected
                      ? AppColors.primary
                      : (isDarkMode ? Colors.white70 : Colors.black54),
                  letterSpacing: 0,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              // Dot indicator khi active - nhỏ hơn
              if (isSelected)
                Container(
                  margin: const EdgeInsets.only(top: 1.5),
                  width: 3,
                  height: 3,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
