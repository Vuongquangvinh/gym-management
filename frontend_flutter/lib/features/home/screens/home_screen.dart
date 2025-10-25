import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../theme/colors.dart';
import '../../../providers/theme_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../widgets/health_summary_widget.dart';
import '../widgets/goals_progress_widget.dart';
import '../widgets/recent_workouts_widget.dart';
import '../widgets/member_card_widget.dart';
import "package:logger/logger.dart";
import '../../model/user.model.dart';

final logger = Logger();

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? _fullName;
  UserPackageInfo? _userPackageInfo;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
  }

  Future<void> _loadUserInfo() async {
    try {
      setState(() {
        _isLoading = true;
      });

      // Sử dụng UserModel để lấy thông tin user kèm package
      final userPackageInfo = await UserModel.getCurrentUserWithPackage();

      if (userPackageInfo != null) {
        setState(() {
          _fullName = userPackageInfo.user.fullName;
          _userPackageInfo = userPackageInfo;
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
        logger.w('Không tìm thấy thông tin user');
      }
    } catch (e) {
      logger.e('Lỗi khi lấy thông tin user: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToTop() {
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeInOut,
    );
  }

  

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dateString =
        '${now.day.toString().padLeft(2, '0')} Tháng ${now.month}, ${now.year}';
    final isDarkMode = context.isDarkMode;
    final themeProvider = Provider.of<ThemeProvider>(context);

    return Scaffold(
      backgroundColor: context.background,
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            floating: false,
            pinned: true,
            backgroundColor: isDarkMode
                ? AppColors.surfaceDark
                : AppColors.primary.withOpacity(0.1),
            flexibleSpace: LayoutBuilder(
              builder: (context, constraints) {
                // Tính toán mức độ thu nhỏ (0.0 = expanded, 1.0 = collapsed)
                final double expandRatio =
                    (constraints.maxHeight - kToolbarHeight) /
                    (200 - kToolbarHeight);
                final bool isCollapsed = expandRatio < 0.5;

                return FlexibleSpaceBar(
                  background: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: isDarkMode
                            ? [AppColors.surfaceDark, AppColors.cardDark]
                            : [
                                AppColors.primary.withOpacity(0.1),
                                AppColors.secondary.withOpacity(0.05),
                              ],
                      ),
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(32),
                        bottomRight: Radius.circular(32),
                      ),
                    ),
                    padding: EdgeInsets.only(
                      top: MediaQuery.of(context).padding.top + 16,
                      left: 20,
                      right: 20,
                      bottom: 24,
                    ),
                    child: Column(
                      children: [
                        // Header với avatar và thông tin
                        Row(
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppColors.primary.withOpacity(0.3),
                                  width: 2,
                                ),
                              ),
                              child: CircleAvatar(
                                radius: 25,
                                backgroundImage: NetworkImage(
                                  'https://i.pravatar.cc/150?img=3',
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    dateString,
                                    style: GoogleFonts.montserrat(
                                      fontSize: 13,
                                      color: context.textSecondary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Xin chào, ${_fullName ?? "..."}',
                                    style: GoogleFonts.montserrat(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: context.textPrimary,
                                    ),
                                  ),
                                  // const SizedBox(height: 2),
                                  // Row(
                                  //   children: [
                                  //     Text(
                                  //       '251kcal',
                                  //       style: GoogleFonts.montserrat(
                                  //         fontSize: 13,
                                  //         color: AppColors.calories,
                                  //         fontWeight: FontWeight.w600,
                                  //       ),
                                  //     ),
                                  //     const SizedBox(width: 12),
                                  //     Text(
                                  //       'Năng lượng',
                                  //       style: GoogleFonts.montserrat(
                                  //         fontSize: 10,
                                  //         color: context.textSecondary,
                                  //       ),
                                  //     ),
                                  //   ],
                                  // ),
                                ],
                              ),
                            ),

                            // Theme Toggle Button
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: AppColors.primary.withOpacity(0.2),
                                ),
                              ),
                              child: Stack(
                                children: [
                                  Icon(
                                    Icons.notifications_none,
                                    color: AppColors.primary,
                                    size: 24,
                                  ),
                                  Positioned(
                                    right: 0,
                                    top: 0,
                                    child: Container(
                                      width: 8,
                                      height: 8,
                                      decoration: BoxDecoration(
                                        color: AppColors.error,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Nút đăng xuất
                            // GestureDetector(
                            //   onTap: () => _showLogoutDialog(context),
                            //   child: Container(
                            //     padding: const EdgeInsets.all(12),
                            //     decoration: BoxDecoration(
                            //       color: AppColors.error.withOpacity(0.1),
                            //       borderRadius: BorderRadius.circular(16),
                            //       border: Border.all(
                            //         color: AppColors.error.withOpacity(0.2),
                            //       ),
                            //     ),
                            //     child: Icon(
                            //       Icons.logout,
                            //       color: AppColors.error,
                            //       size: 24,
                            //     ),
                            //   ),
                            // ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        // Search bar với animation
                        AnimatedOpacity(
                          opacity: expandRatio.clamp(0.0, 1.0),
                          duration: const Duration(milliseconds: 100),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                            decoration: BoxDecoration(
                              color: context.surface.withOpacity(0.8),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: context.border.withOpacity(0.5),
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'Tìm kiếm bài tập, dinh dưỡng...',
                                    style: GoogleFonts.montserrat(
                                      fontSize: 12,
                                      color: context.textSecondary,
                                    ),
                                  ),
                                ),
                                Icon(
                                  Icons.search,
                                  color: context.textSecondary,
                                  size: 22,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  titlePadding: EdgeInsets.zero,
                  centerTitle: false,
                  title: AnimatedOpacity(
                    opacity: isCollapsed ? 1.0 : 0.0,
                    duration: const Duration(milliseconds: 200),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          GestureDetector(
                            onTap: _scrollToTop,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: context.surface,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                Icons.search,
                                color: AppColors.primary,
                                size: 22,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 18),
                  // Hiển thị loading hoặc dữ liệu thực
                  _isLoading
                      ? Container(
                          width: double.infinity,
                          margin: const EdgeInsets.symmetric(vertical: 8),
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.primary,
                                AppColors.primaryLight,
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Center(
                            child: CircularProgressIndicator(
                              color: Colors.white,
                            ),
                          ),
                        )
                      : _userPackageInfo != null
                      ? MemberCardWidget(
                          memberName: _userPackageInfo!.user.fullName,
                          cardType: _userPackageInfo!.getPackageName(),
                          expiryDate: _userPackageInfo!.getFormattedEndDate(),
                          isActive: _userPackageInfo!.hasActivePackage(),
                          onScanQR: () {},
                        )
                      : Container(
                          width: double.infinity,
                          margin: const EdgeInsets.symmetric(vertical: 8),
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.grey.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Không tìm thấy thông tin thẻ tập',
                            style: GoogleFonts.montserrat(
                              fontSize: 14,
                              color: context.textSecondary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                  const SizedBox(height: 18),
                  HealthSummaryWidget(),
                  const SizedBox(height: 18),
                  GoalsProgressWidget(),
                  const SizedBox(height: 18),
                  RecentWorkoutsWidget(),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: context.surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: context.textSecondary,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Trang chủ'),
          BottomNavigationBarItem(icon: Icon(Icons.qr_code), label: 'Quét QR'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Cá nhân'),
        ],
        currentIndex: 0,
        onTap: (index) {
          if (index == 1) {
            // Truyền userId và thông tin user khi navigate đến màn hình QR
            if (_userPackageInfo != null) {
              Navigator.pushNamed(
                context,
                '/qr',
                arguments: {
                  'qrData': _userPackageInfo!.user.id,
                  'userId': _userPackageInfo!.user.id,
                  'fullName': _userPackageInfo!.user.fullName,
                  'email': _userPackageInfo!.user.email,
                  'phoneNumber': _userPackageInfo!.user.phoneNumber,
                  'packageName': _userPackageInfo!.getPackageName(),
                  'hasActivePackage': _userPackageInfo!.hasActivePackage(),
                },
              );
            } else {
              // Nếu chưa có thông tin user, hiển thị thông báo
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Vui lòng đợi tải thông tin người dùng'),
                  backgroundColor: AppColors.error,
                ),
              );
            }
          } else if (index == 2) {
            Navigator.pushNamed(context, '/settings');
          }
        },
      ),
    );
  }
}
