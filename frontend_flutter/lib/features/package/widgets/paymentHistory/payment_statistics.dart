import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../theme/colors.dart';

enum StatisticsPeriod { month, year, all }

class PaymentStatisticsWidget extends StatefulWidget {
  final List<Map<String, dynamic>> paymentHistory;

  const PaymentStatisticsWidget({Key? key, required this.paymentHistory})
    : super(key: key);

  @override
  State<PaymentStatisticsWidget> createState() =>
      _PaymentStatisticsWidgetState();
}

class _PaymentStatisticsWidgetState extends State<PaymentStatisticsWidget> {
  StatisticsPeriod _selectedPeriod = StatisticsPeriod.month;

  @override
  Widget build(BuildContext context) {
    final stats = _calculateStatistics();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [AppColors.surfaceDark, AppColors.cardDark]
              : [Colors.white, AppColors.primaryLight.withOpacity(0.05)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withOpacity(0.2)
                : AppColors.primary.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
            spreadRadius: -2,
          ),
        ],
        border: Border.all(
          color: isDark
              ? Colors.white.withOpacity(0.08)
              : AppColors.primary.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with icon
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryLight],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.analytics_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Thống kê chi tiêu',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: context.textPrimary,
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Period selector with modern chips
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.white.withOpacity(0.05)
                  : Colors.grey.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                _buildPeriodTab('Tất cả', StatisticsPeriod.all),
                const SizedBox(width: 4),
                _buildPeriodTab('Tháng này', StatisticsPeriod.month),
                const SizedBox(width: 4),
                _buildPeriodTab('Năm nay', StatisticsPeriod.year),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Statistics grid - Modern cards
          Row(
            children: [
              Expanded(
                child: _buildModernStatCard(
                  'Tổng chi',
                  _formatCurrency(stats['totalAmount']),
                  Icons.account_balance_wallet_rounded,
                  [AppColors.primary, AppColors.primaryLight],
                  isDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildModernStatCard(
                  'Giao dịch',
                  '${stats['count']}',
                  Icons.receipt_long_rounded,
                  [AppColors.secondary, AppColors.accent],
                  isDark,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Average - Full width modern card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.info.withOpacity(0.15),
                  AppColors.info.withOpacity(0.08),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppColors.info.withOpacity(0.25),
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.info.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.trending_up_rounded,
                    color: AppColors.info,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Trung bình / giao dịch',
                        style: TextStyle(
                          fontSize: 13,
                          color: context.textSecondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _formatCurrency(stats['averageAmount']),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.info,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodTab(String label, StatisticsPeriod period) {
    final isSelected = _selectedPeriod == period;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedPeriod = period;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            gradient: isSelected
                ? LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryLight],
                  )
                : null,
            color: isSelected ? null : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              color: isSelected
                  ? Colors.white
                  : (isDark ? Colors.white70 : Colors.black54),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildModernStatCard(
    String label,
    String value,
    IconData icon,
    List<Color> gradientColors,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors.map((c) => c.withOpacity(0.12)).toList(),
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: gradientColors.first.withOpacity(0.25),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: gradientColors),
              borderRadius: BorderRadius.circular(10),
              boxShadow: [
                BoxShadow(
                  color: gradientColors.first.withOpacity(0.3),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: context.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: gradientColors.first,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _calculateStatistics() {
    List<Map<String, dynamic>> filteredPayments = [];
    final now = DateTime.now();

    switch (_selectedPeriod) {
      case StatisticsPeriod.month:
        filteredPayments = widget.paymentHistory.where((payment) {
          final date = _parseDate(payment['createdAt']);
          if (date == null) return false;
          return date.year == now.year && date.month == now.month;
        }).toList();
        break;

      case StatisticsPeriod.year:
        filteredPayments = widget.paymentHistory.where((payment) {
          final date = _parseDate(payment['createdAt']);
          if (date == null) return false;
          return date.year == now.year;
        }).toList();
        break;

      case StatisticsPeriod.all:
        filteredPayments = widget.paymentHistory;
        break;
    }

    // Only count PAID transactions
    final paidPayments = filteredPayments
        .where((p) => p['status']?.toString().toUpperCase() == 'PAID')
        .toList();

    int totalAmount = 0;
    for (var payment in paidPayments) {
      final amount = payment['amount'];
      if (amount != null) {
        try {
          totalAmount += amount is int ? amount : int.parse(amount.toString());
        } catch (e) {
          // Skip invalid amounts
        }
      }
    }

    final count = paidPayments.length;
    final averageAmount = count > 0 ? totalAmount ~/ count : 0;

    return {
      'totalAmount': totalAmount,
      'count': count,
      'averageAmount': averageAmount,
    };
  }

  DateTime? _parseDate(dynamic timestamp) {
    if (timestamp == null) return null;

    try {
      if (timestamp is Timestamp) {
        return timestamp.toDate();
      } else if (timestamp is String) {
        return DateTime.parse(timestamp);
      } else if (timestamp is DateTime) {
        return timestamp;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  String _formatCurrency(dynamic amount) {
    if (amount == null) return '0 ₫';

    try {
      final number = amount is int ? amount : int.parse(amount.toString());
      final formatter = NumberFormat.currency(
        locale: 'vi_VN',
        symbol: '₫',
        decimalDigits: 0,
      );
      return formatter.format(number);
    } catch (e) {
      return '0 ₫';
    }
  }
}
