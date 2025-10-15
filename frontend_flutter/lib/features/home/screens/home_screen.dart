import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/colors.dart';
import '../widgets/health_summary_widget.dart';
import '../widgets/goals_progress_widget.dart';
import '../widgets/recent_workouts_widget.dart';
import '../widgets/member_card_widget.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
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

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            floating: false,
            pinned: true,
            backgroundColor: AppColors.primary.withOpacity(0.1),
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
                        colors: [
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
                                      color: AppColors.textSecondary,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Xin chào, Eren',
                                    style: GoogleFonts.montserrat(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Text(
                                        '251kcal',
                                        style: GoogleFonts.montserrat(
                                          fontSize: 13,
                                          color: AppColors.accent,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Text(
                                        'Năng lượng',
                                        style: GoogleFonts.montserrat(
                                          fontSize: 13,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
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
                              color: AppColors.surface.withOpacity(0.8),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: AppColors.border.withOpacity(0.5),
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'Tìm kiếm bài tập, dinh dưỡng...',
                                    style: GoogleFonts.montserrat(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ),
                                Icon(
                                  Icons.search,
                                  color: AppColors.textSecondary,
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
                                color: AppColors.surface,
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
                  MemberCardWidget(
                    memberName: 'Eren Yeager',
                    cardType: 'Thẻ tập Gym Premium',
                    expiryDate: '31/12/2025',
                    isActive: true,
                    onScanQR: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Quét mã QR thẻ tập!')),
                      );
                    },
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
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textSecondary,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Trang chủ'),
          BottomNavigationBarItem(icon: Icon(Icons.qr_code), label: 'Quét QR'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Cá nhân'),
        ],
        currentIndex: 0,
        onTap: (index) {
          // TODO: Chuyển tab
        },
      ),
    );
  }
}
