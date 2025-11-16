import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../theme/colors.dart';

/// Widget hiển thị lịch sử thanh toán gói tập
class PaymentHistoryWidget extends StatelessWidget {
  final List<Map<String, dynamic>> paymentHistory;
  final VoidCallback? onRefresh;

  const PaymentHistoryWidget({
    Key? key,
    required this.paymentHistory,
    this.onRefresh,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final scale = size.width / 400; // Base scale factor

    if (paymentHistory.isEmpty) {
      return _buildEmptyState(context, scale);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // _buildHeader(context),
        SizedBox(height: 8 * scale),
        _buildPaymentList(context, scale),
      ],
    );
  }

  Widget _buildEmptyState(BuildContext context, double scale) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 80),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.primary.withOpacity(0.1),
                    AppColors.primaryLight.withOpacity(0.05),
                  ],
                ),
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.primary.withOpacity(0.2),
                  width: 2,
                ),
              ),
              child: Icon(
                Icons.receipt_long_rounded,
                size: 64,
                color: AppColors.primary.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Chưa có lịch sử thanh toán',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: context.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Các giao dịch thanh toán sẽ hiển thị ở đây',
              style: TextStyle(fontSize: 14, color: context.textSecondary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentList(BuildContext context, double scale) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: paymentHistory.length,
      itemBuilder: (context, index) {
        final payment = paymentHistory[index];
        return _buildPaymentCard(context, payment, index);
      },
    );
  }

  Widget _buildPaymentCard(
    BuildContext context,
    Map<String, dynamic> payment,
    int index,
  ) {
    final isDark = context.isDarkMode;
    final status = payment['status']?.toString() ?? 'UNKNOWN';
    final statusConfig = _getStatusConfig(status);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [AppColors.surfaceDark, AppColors.cardDark]
              : [Colors.white, AppColors.primaryLight.withOpacity(0.02)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark
              ? Colors.white.withOpacity(0.08)
              : AppColors.primary.withOpacity(0.12),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withOpacity(0.2)
                : AppColors.primary.withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 3),
            spreadRadius: -2,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _showPaymentDetails(context, payment),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: Package name + Status
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      AppColors.primary,
                                      AppColors.primaryLight,
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(
                                  Icons.card_membership_rounded,
                                  color: Colors.white,
                                  size: 16,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  payment['packageName']?.toString() ??
                                      'Gói tập',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: context.textPrimary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(
                                Icons.schedule_rounded,
                                size: 14,
                                color: context.textSecondary,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${payment['packageDuration'] ?? 'N/A'} ngày',
                                style: TextStyle(
                                  fontSize: 13,
                                  color: context.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    _buildModernStatusChip(statusConfig),
                  ],
                ),

                const SizedBox(height: 16),

                // Divider
                Container(
                  height: 1,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        context.border.withOpacity(0),
                        context.border.withOpacity(0.3),
                        context.border.withOpacity(0),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Footer: Amount + Date
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Amount with gradient background
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppColors.success.withOpacity(0.15),
                            AppColors.success.withOpacity(0.08),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: AppColors.success.withOpacity(0.25),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.account_balance_wallet_rounded,
                            size: 16,
                            color: AppColors.success,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            _formatCurrency(payment['amount']),
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: AppColors.success,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Date
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_today_rounded,
                          size: 14,
                          color: context.textSecondary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _formatDate(payment['createdAt']),
                          style: TextStyle(
                            fontSize: 12,
                            color: context.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildModernStatusChip(Map<String, dynamic> config) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            config['color'].withOpacity(0.15),
            config['color'].withOpacity(0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: config['color'].withOpacity(0.3), width: 1.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(config['icon'], size: 14, color: config['color']),
          const SizedBox(width: 6),
          Text(
            config['label'],
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: config['color'],
            ),
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _getStatusConfig(String status) {
    switch (status.toUpperCase()) {
      case 'PAID':
        return {
          'label': 'Đã thanh toán',
          'color': Colors.green,
          'icon': Icons.check_circle,
        };
      case 'PENDING':
        return {
          'label': 'Đang chờ',
          'color': Colors.orange,
          'icon': Icons.schedule,
        };
      case 'CANCELLED':
        return {'label': 'Đã hủy', 'color': Colors.red, 'icon': Icons.cancel};
      case 'FAILED':
        return {'label': 'Thất bại', 'color': Colors.red, 'icon': Icons.error};
      case 'EXPIRED':
        return {
          'label': 'Hết hạn',
          'color': Colors.grey,
          'icon': Icons.access_time,
        };
      default:
        return {
          'label': 'Không xác định',
          'color': Colors.grey,
          'icon': Icons.help_outline,
        };
    }
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

  String _formatDate(dynamic timestamp) {
    if (timestamp == null) return 'N/A';

    try {
      DateTime date;
      if (timestamp is Timestamp) {
        date = timestamp.toDate();
      } else if (timestamp is String) {
        date = DateTime.parse(timestamp);
      } else {
        return 'N/A';
      }

      return DateFormat('dd/MM/yyyy HH:mm').format(date);
    } catch (e) {
      return 'N/A';
    }
  }

  void _showPaymentDetails(BuildContext context, Map<String, dynamic> payment) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _PaymentDetailsSheet(payment: payment),
    );
  }
}

/// Bottom sheet hiển thị chi tiết thanh toán
class _PaymentDetailsSheet extends StatelessWidget {
  final Map<String, dynamic> payment;

  const _PaymentDetailsSheet({required this.payment});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final scale = size.width / 400;

    final statusConfig = _getStatusConfig(
      payment['status']?.toString() ?? 'UNKNOWN',
    );

    return Container(
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28 * scale)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 20 * scale,
            offset: Offset(0, -4 * scale),
          ),
        ],
      ),
      padding: EdgeInsets.fromLTRB(
        24 * scale,
        16 * scale,
        24 * scale,
        32 * scale,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40 * scale,
              height: 4 * scale,
              margin: EdgeInsets.only(bottom: 20 * scale),
              decoration: BoxDecoration(
                color: context.border,
                borderRadius: BorderRadius.circular(2 * scale),
              ),
            ),
          ),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: EdgeInsets.all(14 * scale),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.primary, AppColors.primaryLight],
                      ),
                      borderRadius: BorderRadius.circular(16 * scale),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.4),
                          blurRadius: 12 * scale,
                          offset: Offset(0, 4 * scale),
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.receipt_long,
                      color: Colors.white,
                      size: 26 * scale,
                    ),
                  ),
                  SizedBox(width: 16 * scale),
                  Text(
                    'Chi tiết giao dịch',
                    style: TextStyle(
                      fontSize: 15 * scale,
                      fontWeight: FontWeight.bold,
                      color: context.textPrimary,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
              _buildStatusChip(statusConfig, scale),
            ],
          ),
          SizedBox(height: 28 * scale),

          // Details
          _buildDetailRow(
            context,
            'Gói tập',
            payment['packageName']?.toString() ?? 'N/A',
            Icons.card_membership,
            scale,
          ),
          _buildDetailRow(
            context,
            'Thời hạn',
            '${payment['packageDuration'] ?? 'N/A'} ngày',
            Icons.calendar_today,
            scale,
          ),
          _buildDetailRow(
            context,
            'Số tiền',
            _formatCurrency(payment['amount']),
            Icons.attach_money,
            scale,
          ),
          _buildDetailRow(
            context,
            'Mã giao dịch',
            payment['transactionId']?.toString() ?? 'N/A',
            Icons.receipt,
            scale,
          ),
          _buildDetailRow(
            context,
            'Ngày tạo',
            _formatDate(payment['createdAt']),
            Icons.access_time,
            scale,
          ),
          if (payment['paidAt'] != null)
            _buildDetailRow(
              context,
              'Thanh toán lúc',
              _formatDate(payment['paidAt']),
              Icons.check_circle,
              scale,
            ),

          SizedBox(height: 28 * scale),

          // Close button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: 18 * scale),
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 2,
                shadowColor: AppColors.primary.withOpacity(0.4),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16 * scale),
                ),
              ),
              child: Text(
                'Đóng',
                style: TextStyle(
                  fontSize: 17 * scale,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(
    BuildContext context,
    String label,
    String value,
    IconData icon,
    double scale,
  ) {
    return Container(
      margin: EdgeInsets.only(bottom: 14 * scale),
      padding: EdgeInsets.all(16 * scale),
      decoration: BoxDecoration(
        color: context.isDarkMode
            ? Colors.white.withOpacity(0.05)
            : AppColors.primary.withOpacity(0.03),
        borderRadius: BorderRadius.circular(14 * scale),
        border: Border.all(
          color: context.border.withOpacity(0.5),
          width: 1 * scale,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: EdgeInsets.all(8 * scale),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10 * scale),
            ),
            child: Icon(icon, size: 20 * scale, color: AppColors.primary),
          ),
          SizedBox(width: 14 * scale),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13 * scale,
                    color: context.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 6 * scale),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 16 * scale,
                    fontWeight: FontWeight.bold,
                    color: context.textPrimary,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(Map<String, dynamic> config, double scale) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 7 * scale, vertical: 3 * scale),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            config['color'].withOpacity(0.15),
            config['color'].withOpacity(0.08),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20 * scale),
        border: Border.all(
          color: config['color'].withOpacity(0.4),
          width: 1.5 * scale,
        ),
        boxShadow: [
          BoxShadow(
            color: config['color'].withOpacity(0.2),
            blurRadius: 4 * scale,
            offset: Offset(0, 2 * scale),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(config['icon'], size: 16 * scale, color: config['color']),
          SizedBox(width: 6 * scale),
          Text(
            config['label'],
            style: TextStyle(
              fontSize: 12 * scale,
              fontWeight: FontWeight.bold,
              color: config['color'],
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _getStatusConfig(String status) {
    switch (status.toUpperCase()) {
      case 'PAID':
        return {
          'label': 'Đã thanh toán',
          'color': Colors.green,
          'icon': Icons.check_circle,
        };
      case 'PENDING':
        return {
          'label': 'Đang chờ',
          'color': Colors.orange,
          'icon': Icons.schedule,
        };
      case 'CANCELLED':
        return {'label': 'Đã hủy', 'color': Colors.red, 'icon': Icons.cancel};
      case 'FAILED':
        return {'label': 'Thất bại', 'color': Colors.red, 'icon': Icons.error};
      case 'EXPIRED':
        return {
          'label': 'Hết hạn',
          'color': Colors.grey,
          'icon': Icons.access_time,
        };
      default:
        return {
          'label': 'Không xác định',
          'color': Colors.grey,
          'icon': Icons.help_outline,
        };
    }
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

  String _formatDate(dynamic timestamp) {
    if (timestamp == null) return 'N/A';

    try {
      DateTime date;
      if (timestamp is Timestamp) {
        date = timestamp.toDate();
      } else if (timestamp is String) {
        date = DateTime.parse(timestamp);
      } else {
        return 'N/A';
      }

      return DateFormat('dd/MM/yyyy HH:mm').format(date);
    } catch (e) {
      return 'N/A';
    }
  }
}
