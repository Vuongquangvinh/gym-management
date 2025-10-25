import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../../theme/colors.dart';
import '../../data/services/payos_service.dart';
import 'package:logger/logger.dart';
import 'dart:async';

// Extension để truy cập theme colors
extension ThemeExtension on BuildContext {
  Color get primary => AppColors.primary;
}

final logger = Logger();

class PaymentQRDialog extends StatefulWidget {
  final String qrCodeData;
  final String checkoutUrl;
  final int amount;
  final String description;
  final String orderCode;

  const PaymentQRDialog({
    super.key,
    required this.qrCodeData,
    required this.checkoutUrl,
    required this.amount,
    required this.description,
    required this.orderCode,
  });

  @override
  State<PaymentQRDialog> createState() => _PaymentQRDialogState();

  /// Hiển thị dialog thanh toán QR
  static Future<void> show(
    BuildContext context, {
    required String qrCodeData,
    required String checkoutUrl,
    required int amount,
    required String description,
    required String orderCode,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => PaymentQRDialog(
        qrCodeData: qrCodeData,
        checkoutUrl: checkoutUrl,
        amount: amount,
        description: description,
        orderCode: orderCode,
      ),
    );
  }
}

class _PaymentQRDialogState extends State<PaymentQRDialog> {
  Timer? _pollingTimer;
  String _paymentStatus = 'PENDING';
  bool _isChecking = false;
  int _checkCount = 0;
  final int _maxChecks = 60; // Tối đa check 60 lần (60 * 2s = 2 phút)

  @override
  void initState() {
    super.initState();
    // Bắt đầu polling ngay lập tức
    logger.i('🔄 Bắt đầu kiểm tra trạng thái thanh toán...');
    _startPolling();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    logger.i('❌ Dừng polling thanh toán');
    super.dispose();
  }

  void _startPolling() {
    // Kiểm tra lần đầu ngay lập tức
    _checkPaymentStatus();

    // Kiểm tra trạng thái mỗi 2 giây (nhanh hơn)
    _pollingTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      _checkPaymentStatus();

      // Dừng sau khi check quá nhiều lần để tránh lãng phí
      if (_checkCount >= _maxChecks) {
        logger.w('⚠️ Đã vượt quá số lần check tối đa. Dừng polling.');
        _pollingTimer?.cancel();
      }
    });
  }

  Future<void> _checkPaymentStatus() async {
    if (_isChecking) return;

    _checkCount++;
    setState(() => _isChecking = true);

    logger.i('🔍 Kiểm tra trạng thái lần ${_checkCount}/${_maxChecks}...');

    try {
      final response = await PayOSService.getPaymentStatus(widget.orderCode);

      // Log toàn bộ response để debug
      logger.d('📦 Full response: $response');

      if (response['success'] != true) {
        logger.e('❌ Response không thành công: ${response['message']}');
        if (mounted) {
          setState(() => _isChecking = false);
        }
        return;
      }

      final data = response['data'];
      if (data == null) {
        logger.e('❌ Không có data trong response');
        if (mounted) {
          setState(() => _isChecking = false);
        }
        return;
      }

      final status = data['status'] ?? 'PENDING';

      logger.i('📊 Payment status: $status (${data['status'].runtimeType})');

      if (mounted) {
        setState(() {
          _paymentStatus = status;
          _isChecking = false;
        });
      }

      // Kiểm tra các trạng thái có thể có
      // PayOS có thể trả về: PAID, CANCELLED, PENDING, PROCESSING
      if (status == 'PAID' || status == 'paid' || status == 'COMPLETED') {
        logger.i('✅ THANH TOÁN THÀNH CÔNG!');
        _pollingTimer?.cancel();

        if (mounted) {
          // Đóng dialog
          Navigator.pop(context);

          // Hiển thị thông báo thành công
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Thanh toán thành công! 🎉',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              backgroundColor: AppColors.success,
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          );
        }
      } else if (status == 'CANCELLED' || status == 'cancelled') {
        logger.w('⚠️ Thanh toán đã bị hủy');
        _pollingTimer?.cancel();

        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Thanh toán đã bị hủy',
                style: GoogleFonts.inter(color: Colors.white),
              ),
              backgroundColor: AppColors.warning,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else {
        logger.d('⏳ Đang chờ thanh toán... (status: $status)');
      }
    } catch (e) {
      logger.e('❌ Lỗi khi kiểm tra trạng thái thanh toán: $e');
      if (mounted) {
        setState(() => _isChecking = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: context.background,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Row(
              children: [
                Icon(Icons.qr_code_2, color: context.primary, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Thanh Toán QR',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: context.textPrimary,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.close, color: context.textSecondary),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // QR Code
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Render QR code từ data string
                  QrImageView(
                    data: widget.qrCodeData,
                    version: QrVersions.auto,
                    size: 250.0,
                    backgroundColor: Colors.white,
                    errorStateBuilder: (context, error) {
                      logger.e('Lỗi khi tạo QR code: $error');
                      return Container(
                        width: 250,
                        height: 250,
                        color: Colors.grey[300],
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.error_outline,
                              size: 48,
                              color: Colors.grey[600],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Không thể tạo QR code',
                              style: TextStyle(color: Colors.grey[600]),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Quét mã QR để thanh toán',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: Colors.grey[700],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Trạng thái kiểm tra
            if (_paymentStatus == 'PENDING')
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: context.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: context.primary.withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          context.primary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Đang kiểm tra trạng thái thanh toán...',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: context.primary,
                            ),
                          ),
                          Text(
                            'Lần ${_checkCount}/${_maxChecks}',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: context.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            if (_paymentStatus == 'PENDING') const SizedBox(height: 16),

            // Thông tin thanh toán
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.surface,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _buildInfoRow(
                    context,
                    'Mã đơn hàng',
                    widget.orderCode,
                    icon: Icons.tag,
                  ),
                  const SizedBox(height: 12),
                  _buildInfoRow(
                    context,
                    'Nội dung',
                    widget.description,
                    icon: Icons.description,
                  ),
                  const SizedBox(height: 12),
                  _buildInfoRow(
                    context,
                    'Số tiền',
                    '${_formatMoney(widget.amount)} VNĐ',
                    icon: Icons.payments,
                    isHighlight: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Nút thanh toán trực tiếp
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _openCheckoutUrl(context),
                icon: const Icon(Icons.open_in_new),
                label: Text(
                  'Thanh toán trên trình duyệt',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Nút sao chép link
            TextButton.icon(
              onPressed: () => _copyCheckoutUrl(context),
              icon: Icon(Icons.copy, color: context.textSecondary),
              label: Text(
                'Sao chép link thanh toán',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: context.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: 8),

            // Nút kiểm tra thủ công
            TextButton.icon(
              onPressed: _isChecking ? null : () => _checkPaymentStatus(),
              icon: Icon(
                Icons.refresh,
                color: _isChecking ? Colors.grey : context.primary,
              ),
              label: Text(
                _isChecking ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái ngay',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: _isChecking ? Colors.grey : context.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(
    BuildContext context,
    String label,
    String value, {
    IconData? icon,
    bool isHighlight = false,
  }) {
    return Row(
      children: [
        if (icon != null) ...[
          Icon(
            icon,
            size: 18,
            color: isHighlight ? context.primary : context.textSecondary,
          ),
          const SizedBox(width: 8),
        ],
        Expanded(
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: context.textSecondary,
            ),
          ),
        ),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: isHighlight ? FontWeight.w700 : FontWeight.w600,
            color: isHighlight ? context.primary : context.textPrimary,
          ),
        ),
      ],
    );
  }

  String _formatMoney(int amount) {
    return amount.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }

  void _openCheckoutUrl(BuildContext context) async {
    try {
      final uri = Uri.parse(widget.checkoutUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        logger.i('Đã mở link thanh toán: ${widget.checkoutUrl}');
      } else {
        throw Exception('Không thể mở link thanh toán');
      }
    } catch (e) {
      logger.e('Lỗi khi mở link thanh toán: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Không thể mở link thanh toán. Vui lòng thử lại.',
              style: GoogleFonts.inter(color: Colors.white),
            ),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _copyCheckoutUrl(BuildContext context) async {
    try {
      await Clipboard.setData(ClipboardData(text: widget.checkoutUrl));
      logger.i('Đã sao chép link thanh toán');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Đã sao chép link thanh toán',
              style: GoogleFonts.inter(color: Colors.white),
            ),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      logger.e('Lỗi khi sao chép link: $e');
    }
  }
}
