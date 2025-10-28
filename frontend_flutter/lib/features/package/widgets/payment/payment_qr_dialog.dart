import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'dart:ui' as ui;
import 'dart:typed_data';
import 'package:flutter/rendering.dart';
import 'package:gal/gal.dart';
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
  final VoidCallback? onPaymentSuccess;

  const PaymentQRDialog({
    super.key,
    required this.qrCodeData,
    required this.checkoutUrl,
    required this.amount,
    required this.description,
    required this.orderCode,
    this.onPaymentSuccess,
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
    VoidCallback? onPaymentSuccess,
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
        onPaymentSuccess: onPaymentSuccess,
      ),
    );
  }
}

class _PaymentQRDialogState extends State<PaymentQRDialog> {
  Timer? _pollingTimer;
  String _paymentStatus = 'PENDING';
  bool _isChecking = false;
  int _checkCount = 0;
  final int _maxChecks = 60;
  final GlobalKey _qrKey = GlobalKey();
  bool _isSavingImage = false;

  @override
  void initState() {
    super.initState();
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
    _checkPaymentStatus();

    _pollingTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      _checkPaymentStatus();

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

      if (status == 'PAID' || status == 'paid' || status == 'COMPLETED') {
        logger.i('✅ THANH TOÁN THÀNH CÔNG!');
        _pollingTimer?.cancel();

        logger.i('🔄 Tự động xác nhận với backend...');
        await _confirmPaymentAutomatic();
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

  Future<void> _confirmPaymentAutomatic() async {
    logger.i('🔔 Đang xác nhận thanh toán tự động...');

    try {
      final response = await PayOSService.confirmPayment(widget.orderCode);

      logger.d('📦 Confirm response: $response');

      if (response['success'] == true) {
        logger.i('✅ XÁC NHẬN THANH TOÁN THÀNH CÔNG!');
        _pollingTimer?.cancel();

        if (mounted) {
          widget.onPaymentSuccess?.call();

          Navigator.pop(context);

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Thanh toán thành công! Gói tập đã được kích hoạt 🎉',
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
      } else {
        throw Exception(response['message'] ?? 'Xác nhận thất bại');
      }
    } catch (e) {
      logger.e('❌ Lỗi khi xác nhận thanh toán: $e');
    }
  }

  Future<void> _saveQRImage() async {
    if (_isSavingImage) return;

    setState(() => _isSavingImage = true);

    try {
      // Tìm RenderRepaintBoundary
      RenderRepaintBoundary boundary =
          _qrKey.currentContext!.findRenderObject() as RenderRepaintBoundary;

      // Chuyển thành image
      ui.Image image = await boundary.toImage(pixelRatio: 3.0);

      // Chuyển sang bytes
      ByteData? byteData = await image.toByteData(
        format: ui.ImageByteFormat.png,
      );
      Uint8List pngBytes = byteData!.buffer.asUint8List();

      // Lưu vào thư viện ảnh bằng Gal
      await Gal.putImageBytes(pngBytes);

      if (mounted) {
        setState(() => _isSavingImage = false);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Đã lưu mã QR vào thư viện ảnh',
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
            duration: const Duration(seconds: 3),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        );
        logger.i('✅ Đã lưu QR code vào thư viện');
      }
    } catch (e) {
      logger.e('❌ Lỗi khi lưu QR code: $e');

      if (mounted) {
        setState(() => _isSavingImage = false);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Không thể lưu mã QR: $e',
              style: GoogleFonts.inter(color: Colors.white),
            ),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
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
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: context.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.qr_code_2_rounded,
                    color: context.primary,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Thanh Toán QR',
                    style: GoogleFonts.inter(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: context.textPrimary,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.close_rounded, color: context.textSecondary),
                  style: IconButton.styleFrom(
                    backgroundColor: context.surface,
                    padding: const EdgeInsets.all(8),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // QR Code với RepaintBoundary để capture
            RepaintBoundary(
              key: _qrKey,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: context.primary.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    QrImageView(
                      data: widget.qrCodeData,
                      version: QrVersions.auto,
                      size: 260.0,
                      backgroundColor: Colors.white,
                      errorStateBuilder: (context, error) {
                        logger.e('Lỗi khi tạo QR code: $error');
                        return Container(
                          width: 260,
                          height: 260,
                          color: Colors.grey[300],
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.error_outline_rounded,
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
                    const SizedBox(height: 16),
                    Text(
                      'Quét mã QR để thanh toán',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        color: Colors.grey[700],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Nút lưu ảnh QR
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isSavingImage ? null : _saveQRImage,
                icon: _isSavingImage
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : const Icon(Icons.download_rounded, size: 20),
                label: Text(
                  _isSavingImage ? 'Đang lưu...' : 'Lưu mã QR về máy',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: context.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Trạng thái kiểm tra
            if (_paymentStatus == 'PENDING')
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: context.primary.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: context.primary.withOpacity(0.2),
                    width: 1.5,
                  ),
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          context.primary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Đang chờ thanh toán',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: context.primary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Kiểm tra tự động ${_checkCount}/${_maxChecks}',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: context.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            if (_paymentStatus == 'PENDING') const SizedBox(height: 20),

            // Thông tin thanh toán
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: context.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: context.border.withOpacity(0.5),
                  width: 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Thông tin thanh toán',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: context.textSecondary,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildInfoRow(
                    context,
                    'Mã đơn hàng',
                    widget.orderCode,
                    icon: Icons.tag_rounded,
                  ),
                  const SizedBox(height: 14),
                  _buildInfoRow(
                    context,
                    'Nội dung',
                    widget.description,
                    icon: Icons.description_rounded,
                  ),
                  const SizedBox(height: 14),
                  _buildInfoRow(
                    context,
                    'Số tiền',
                    '${_formatMoney(widget.amount)} VNĐ',
                    icon: Icons.payments_rounded,
                    isHighlight: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Hướng dẫn
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.info.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.info.withOpacity(0.2),
                  width: 1.5,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline_rounded,
                    color: AppColors.info,
                    size: 22,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Sau khi thanh toán thành công, hệ thống sẽ tự động kích hoạt gói tập cho bạn',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.info,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
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
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: isHighlight
                  ? context.primary.withOpacity(0.1)
                  : context.textSecondary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              size: 16,
              color: isHighlight ? context.primary : context.textSecondary,
            ),
          ),
          const SizedBox(width: 10),
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
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: isHighlight ? FontWeight.w700 : FontWeight.w600,
              color: isHighlight ? context.primary : context.textPrimary,
            ),
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
}
