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
    final size = MediaQuery.of(context).size;
    final scale = size.width / 400;

    return Container(
      margin: EdgeInsets.only(bottom: 16 * scale),
      padding: EdgeInsets.all(16 * scale),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(12 * scale),
        border: Border.all(
          color: isDark
              ? Colors.white.withOpacity(0.1)
              : Colors.grey.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Icon(
                Icons.bar_chart_rounded,
                color: AppColors.primary,
                size: 20 * scale,
              ),
              SizedBox(width: 8 * scale),
              Text(
                'Thống kê chi tiêu',
                style: TextStyle(
                  fontSize: 16 * scale,
                  fontWeight: FontWeight.bold,
                  color: context.textPrimary,
                ),
              ),
            ],
          ),

          SizedBox(height: 16 * scale),

          // Period selector - Horizontal tabs
          Container(
            padding: EdgeInsets.all(4 * scale),
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.white.withOpacity(0.05)
                  : Colors.grey.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8 * scale),
            ),
            child: Row(
              children: [
                _buildPeriodTab('Tất cả', StatisticsPeriod.all, scale),
                SizedBox(width: 4 * scale),
                _buildPeriodTab('Tháng này', StatisticsPeriod.month, scale),
                SizedBox(width: 4 * scale),
                _buildPeriodTab('Năm nay', StatisticsPeriod.year, scale),
              ],
            ),
          ),

          SizedBox(height: 16 * scale),

          // Statistics grid - 2x2
          Row(
            children: [
              Expanded(
                child: _buildSimpleStatCard(
                  'Tổng chi',
                  _formatCurrency(stats['totalAmount']),
                  Icons.attach_money,
                  AppColors.primary,
                  isDark,
                  scale,
                ),
              ),
              SizedBox(width: 12 * scale),
              Expanded(
                child: _buildSimpleStatCard(
                  'Giao dịch',
                  '${stats['count']}',
                  Icons.receipt,
                  AppColors.secondary,
                  isDark,
                  scale,
                ),
              ),
            ],
          ),

          SizedBox(height: 12 * scale),

          // Average
          Container(
            padding: EdgeInsets.all(12 * scale),
            decoration: BoxDecoration(
              color: AppColors.info.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8 * scale),
              border: Border.all(
                color: AppColors.info.withOpacity(0.2),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.trending_up,
                  color: AppColors.info,
                  size: 18 * scale,
                ),
                SizedBox(width: 8 * scale),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Trung bình',
                        style: TextStyle(
                          fontSize: 12 * scale,
                          color: context.textSecondary,
                        ),
                      ),
                      SizedBox(height: 2 * scale),
                      Text(
                        _formatCurrency(stats['averageAmount']),
                        style: TextStyle(
                          fontSize: 15 * scale,
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

  Widget _buildPeriodTab(String label, StatisticsPeriod period, double scale) {
    final isSelected = _selectedPeriod == period;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedPeriod = period;
          });
        },
        child: Container(
          padding: EdgeInsets.symmetric(vertical: 8 * scale),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(6 * scale),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13 * scale,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected
                  ? Colors.white
                  : (isDark ? Colors.white70 : Colors.black87),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSimpleStatCard(
    String label,
    String value,
    IconData icon,
    Color color,
    bool isDark,
    double scale,
  ) {
    return Container(
      padding: EdgeInsets.all(12 * scale),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8 * scale),
        border: Border.all(color: color.withOpacity(0.2), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 18 * scale),
          SizedBox(height: 8 * scale),
          Text(
            label,
            style: TextStyle(
              fontSize: 12 * scale,
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.white70
                  : Colors.black54,
            ),
          ),
          SizedBox(height: 4 * scale),
          Text(
            value,
            style: TextStyle(
              fontSize: 16 * scale,
              fontWeight: FontWeight.bold,
              color: color,
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
