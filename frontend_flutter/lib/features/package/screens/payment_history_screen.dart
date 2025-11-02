import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../theme/colors.dart';
import '../data/providers/membership_provider.dart';
import '../widgets/paymentHistory/payment_history.dart';
import '../widgets/paymentHistory/payment_filter_dialog.dart';
import '../widgets/paymentHistory/payment_statistics.dart';

/// Screen hiển thị lịch sử thanh toán gói tập
class PaymentHistoryScreen extends StatefulWidget {
  final String? userId;

  const PaymentHistoryScreen({Key? key, this.userId}) : super(key: key);

  @override
  State<PaymentHistoryScreen> createState() => _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState extends State<PaymentHistoryScreen> {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => MembershipProvider(),
      child: _PaymentHistoryContent(userId: widget.userId),
    );
  }
}

class _PaymentHistoryContent extends StatefulWidget {
  final String? userId;

  const _PaymentHistoryContent({this.userId});

  @override
  State<_PaymentHistoryContent> createState() => _PaymentHistoryContentState();
}

class _PaymentHistoryContentState extends State<_PaymentHistoryContent> {
  List<Map<String, dynamic>> _paymentHistory = [];
  List<Map<String, dynamic>> _filteredPaymentHistory = [];
  bool _isLoading = true;
  String? _error;
  DateTime? _filterStartDate;
  DateTime? _filterEndDate;
  FilterPeriod _selectedPeriod = FilterPeriod.all;
  String? _selectedPackageType;
  List<String> _availablePackageTypes = [];

  @override
  void initState() {
    super.initState();
    _loadPaymentHistory();
  }

  Future<void> _loadPaymentHistory() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final membershipProvider = Provider.of<MembershipProvider>(
        context,
        listen: false,
      );

      // Lấy userId
      final userId = widget.userId;

      if (userId == null || userId.isEmpty) {
        throw Exception('Không tìm thấy thông tin người dùng');
      }

      // Sử dụng method từ MembershipProvider
      final history = await membershipProvider.getPaymentHistory(userId);

      // Extract unique package types
      final packageTypes = <String>{};
      for (var payment in history) {
        final packageName = payment['packageName'] as String?;
        if (packageName != null && packageName.isNotEmpty) {
          packageTypes.add(packageName);
        }
      }

      setState(() {
        _paymentHistory = history;
        _availablePackageTypes = packageTypes.toList()..sort();
        _applyFilter();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Không thể tải lịch sử thanh toán: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  void _applyFilter() {
    _filteredPaymentHistory = _paymentHistory.where((payment) {
      try {
        // Filter by date
        if (_filterStartDate != null || _filterEndDate != null) {
          final paymentDate = payment['createdAt'];
          DateTime date;

          // Xử lý Firestore Timestamp
          if (paymentDate is DateTime) {
            date = paymentDate;
          } else if (paymentDate is String) {
            date = DateTime.parse(paymentDate);
          } else if (paymentDate != null &&
              paymentDate.toString().contains('Timestamp')) {
            // Firestore Timestamp có method toDate()
            date = (paymentDate as dynamic).toDate();
          } else {
            return false;
          }

          // So sánh chỉ theo ngày, bỏ qua giờ
          final dateOnly = DateTime(date.year, date.month, date.day);

          if (_filterStartDate != null) {
            final startDateOnly = DateTime(
              _filterStartDate!.year,
              _filterStartDate!.month,
              _filterStartDate!.day,
            );
            if (dateOnly.isBefore(startDateOnly)) {
              return false;
            }
          }

          if (_filterEndDate != null) {
            final endDateOnly = DateTime(
              _filterEndDate!.year,
              _filterEndDate!.month,
              _filterEndDate!.day,
            );
            if (dateOnly.isAfter(endDateOnly)) {
              return false;
            }
          }
        }

        // Filter by package type
        if (_selectedPackageType != null) {
          final packageName = payment['packageName'] as String?;
          if (packageName != _selectedPackageType) {
            return false;
          }
        }

        return true;
      } catch (e) {
        print('Error filtering payment: $e, payment: $payment');
        return false;
      }
    }).toList();
  }

  Future<void> _showFilterDialog() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => PaymentFilterDialog(
        startDate: _filterStartDate,
        endDate: _filterEndDate,
        selectedPeriod: _selectedPeriod,
        selectedPackageType: _selectedPackageType,
        availablePackageTypes: _availablePackageTypes,
      ),
    );

    if (result != null) {
      setState(() {
        _selectedPeriod = result['period'] as FilterPeriod;
        _filterStartDate = result['startDate'] as DateTime?;
        _filterEndDate = result['endDate'] as DateTime?;
        _selectedPackageType = result['packageType'] as String?;
        _applyFilter();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      extendBodyBehindAppBar: false,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(65),
        child: AppBar(
          systemOverlayStyle: SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.light,
          ),
          elevation: 0,
          backgroundColor: Colors.transparent,
          flexibleSpace: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark
                    ? [AppColors.primaryLight, AppColors.primary]
                    : [AppColors.primary, AppColors.primaryVariant],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
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
                size: 18,
                color: Colors.white,
              ),
            ),
            onPressed: () => Navigator.pop(context),
          ),
          title: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.receipt_long,
                  size: 22,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Lịch sử thanh toán',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: Colors.white,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          centerTitle: true,
          actions: [
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.filter_list,
                  size: 20,
                  color: Colors.white,
                ),
              ),
              onPressed: () {
                // TODO: Implement filter
                _showFilterDialog();
              },
            ),
            const SizedBox(width: 8),
          ],
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              strokeWidth: 3,
            ),
            const SizedBox(height: 16),
            Text(
              'Đang tải lịch sử thanh toán...',
              style: TextStyle(
                fontSize: 16,
                color: context.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 100),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.error_outline,
                  size: 64,
                  color: AppColors.error,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Đã có lỗi xảy ra',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: context.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  color: context.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: _loadPaymentHistory,
                icon: const Icon(Icons.refresh),
                label: const Text(
                  'Thử lại',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 16,
                  ),
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  elevation: 2,
                  shadowColor: AppColors.primary.withOpacity(0.4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadPaymentHistory,
      color: AppColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Statistics widget
            PaymentStatisticsWidget(paymentHistory: _paymentHistory),

            // Filter status indicator
            if (_filterStartDate != null ||
                _filterEndDate != null ||
                _selectedPackageType != null)
              _buildFilterStatusBar(),
            PaymentHistoryWidget(
              paymentHistory: _filteredPaymentHistory,
              onRefresh: _loadPaymentHistory,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterStatusBar() {
    List<String> filterTexts = [];

    // Date filter
    if (_filterStartDate != null && _filterEndDate != null) {
      filterTexts.add(
        'Từ ${_formatDate(_filterStartDate!)} đến ${_formatDate(_filterEndDate!)}',
      );
    } else if (_filterStartDate != null) {
      filterTexts.add('Từ ${_formatDate(_filterStartDate!)}');
    } else if (_filterEndDate != null) {
      filterTexts.add('Đến ${_formatDate(_filterEndDate!)}');
    }

    // Package type filter
    if (_selectedPackageType != null) {
      filterTexts.add('Gói: $_selectedPackageType');
    }

    final filterText = filterTexts.join(' • ');

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withOpacity(0.1),
            AppColors.primaryLight.withOpacity(0.05),
          ],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.filter_alt, size: 20, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Đang lọc',
                  style: TextStyle(
                    fontSize: 12,
                    color: context.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  filterText,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: context.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '${_filteredPaymentHistory.length} kết quả',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            onTap: () {
              setState(() {
                _filterStartDate = null;
                _filterEndDate = null;
                _selectedPeriod = FilterPeriod.all;
                _selectedPackageType = null;
                _applyFilter();
              });
            },
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(Icons.close, size: 18, color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
}
