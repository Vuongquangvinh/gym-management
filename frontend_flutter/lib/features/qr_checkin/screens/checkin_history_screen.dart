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
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [
                    AppColors.backgroundDark,
                    AppColors.surfaceDark,
                    AppColors.primary.withOpacity(0.1),
                  ]
                : [
                    AppColors.backgroundLight,
                    AppColors.primary.withOpacity(0.05),
                    AppColors.secondary.withOpacity(0.05),
                  ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // App Bar
              HistoryAppBar(onBack: () => Navigator.pop(context)),

              // Stats Card - Chỉ hiển thị tổng số sessions
              FadeTransition(
                opacity: _fadeAnimation,
                child: HistoryStatsCard(totalSessions: stats['totalSessions']),
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

              // History List
              Expanded(
                child: _isLoading
                    ? _buildLoadingState()
                    : _filteredHistory.isEmpty
                    ? _buildEmptyState(isDark)
                    : FadeTransition(
                        opacity: _fadeAnimation,
                        child: RefreshIndicator(
                          onRefresh: _loadCheckinHistory,
                          color: AppColors.primary,
                          child: ListView.builder(
                            physics: const AlwaysScrollableScrollPhysics(
                              parent: BouncingScrollPhysics(),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _filteredHistory.length,
                            itemBuilder: (context, index) {
                              return HistoryListItem(
                                checkin: _filteredHistory[index],
                                index: index,
                              );
                            },
                          ),
                        ),
                      ),
              ),
            ],
          ),
        ),
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
