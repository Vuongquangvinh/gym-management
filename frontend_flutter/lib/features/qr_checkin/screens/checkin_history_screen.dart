import 'package:flutter/material.dart';
import '../../../theme/colors.dart';
import '../../model/checkin.model.dart';
import '../components/history_app_bar.dart';
import '../components/history_filter_tabs.dart';
import '../components/history_list_item.dart';
import '../components/history_stats_card.dart';
import 'package:logger/logger.dart';

final logger = Logger();

class CheckInHistoryScreen extends StatefulWidget {
  const CheckInHistoryScreen({super.key});

  @override
  State<CheckInHistoryScreen> createState() => _CheckInHistoryScreenState();
}

class _CheckInHistoryScreenState extends State<CheckInHistoryScreen>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  String _selectedFilter = 'all'; // all, today, week, month
  List<CheckinModel> _historyData = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
    );

    _animationController.forward();
    _loadCheckinHistory();
  }

  /// Load lịch sử checkin từ Firestore
  Future<void> _loadCheckinHistory() async {
    try {
      setState(() {
        _isLoading = true;
      });

      final checkins = await CheckinModel.getMyCheckinHistory(limit: 50);

      setState(() {
        _historyData = checkins;
        _isLoading = false;
      });

      logger.i('Đã load ${checkins.length} lịch sử checkin');
    } catch (e) {
      logger.e('Lỗi khi load lịch sử checkin: $e');

      setState(() {
        _isLoading = false;
      });

      // Hiển thị thông báo lỗi cho user
      if (mounted) {
        String errorMessage = 'Không thể tải lịch sử check-in';

        if (e.toString().contains('requires an index')) {
          errorMessage =
              'Đang khởi tạo database. Vui lòng thử lại sau 2-3 phút.';
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'Thử lại',
              textColor: Colors.white,
              onPressed: _loadCheckinHistory,
            ),
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  /// Filter lịch sử theo tab đã chọn
  List<CheckinModel> get _filteredHistory {
    final now = DateTime.now();
    switch (_selectedFilter) {
      case 'today':
        return _historyData.where((h) {
          return h.checkedAt.year == now.year &&
              h.checkedAt.month == now.month &&
              h.checkedAt.day == now.day;
        }).toList();
      case 'week':
        final weekAgo = now.subtract(const Duration(days: 7));
        return _historyData.where((h) => h.checkedAt.isAfter(weekAgo)).toList();
      case 'month':
        final monthAgo = now.subtract(const Duration(days: 30));
        return _historyData
            .where((h) => h.checkedAt.isAfter(monthAgo))
            .toList();
      default:
        return _historyData;
    }
  }

  /// Thống kê checkin theo filter đã chọn
  Map<String, dynamic> get _statistics {
    final filtered = _filteredHistory;
    final totalSessions = filtered.length;

    return {'totalSessions': totalSessions};
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final stats = _statistics;

    return Scaffold(
      backgroundColor: isDark
          ? AppColors.backgroundDark
          : AppColors.backgroundLight,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // Modern Gradient AppBar
          SliverAppBar(
            expandedHeight: 140,
            floating: false,
            pinned: true,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: isDark
                        ? [AppColors.surfaceDark, AppColors.cardDark]
                        : [AppColors.secondary, AppColors.accent],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 40, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                Icons.history_rounded,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Lịch sử check-in',
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                      height: 1.2,
                                    ),
                                  ),
                                  Text(
                                    'Theo dõi quá trình tập luyện',
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Colors.white.withOpacity(0.9),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.arrow_back_ios_new,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              onPressed: () => Navigator.pop(context),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Column(
              children: [
                const SizedBox(height: 16),

                // Stats Card
                FadeTransition(
                  opacity: _fadeAnimation,
                  child: HistoryStatsCard(
                    totalSessions: stats['totalSessions'],
                  ),
                ),

                const SizedBox(height: 16),

                // Filter Tabs
                HistoryFilterTabs(
                  selectedFilter: _selectedFilter,
                  onFilterChanged: (filter) {
                    setState(() {
                      _selectedFilter = filter;
                    });
                  },
                ),

                const SizedBox(height: 16),
              ],
            ),
          ),

          // History List
          _isLoading
              ? SliverFillRemaining(child: _buildLoadingState())
              : _filteredHistory.isEmpty
              ? SliverFillRemaining(child: _buildEmptyState(isDark))
              : SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverAnimatedOpacity(
                    opacity: _fadeAnimation.value,
                    duration: const Duration(milliseconds: 300),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate((context, index) {
                        return HistoryListItem(
                          checkin: _filteredHistory[index],
                          index: index,
                        );
                      }, childCount: _filteredHistory.length),
                    ),
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: AppColors.primary),
          const SizedBox(height: 16),
          Text(
            'Đang tải lịch sử...',
            style: TextStyle(
              fontSize: 14,
              color: Theme.of(context).brightness == Brightness.dark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    String message = 'Lịch sử check-in của bạn sẽ hiển thị ở đây';

    if (_selectedFilter == 'today') {
      message = 'Bạn chưa check-in hôm nay';
    } else if (_selectedFilter == 'week') {
      message = 'Bạn chưa có check-in nào trong tuần này';
    } else if (_selectedFilter == 'month') {
      message = 'Bạn chưa có check-in nào trong tháng này';
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.primary.withOpacity(0.1),
            ),
            child: Icon(
              Icons.history_rounded,
              size: 64,
              color: AppColors.primary.withOpacity(0.5),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Chưa có lịch sử',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: TextStyle(
              fontSize: 14,
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
