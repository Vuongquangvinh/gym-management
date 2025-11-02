import 'package:flutter/material.dart';
import '../../../theme/colors.dart';
import '../components/qr_app_bar.dart';
import '../components/qr_title_section.dart';
import '../components/qr_code_card.dart';
import '../components/qr_zoom_hint.dart';
import '../components/qr_fullscreen_dialog.dart';
import 'package:logger/logger.dart';

final logger = Logger();

class QRScreen extends StatefulWidget {
  final String qrData;
  final String? userId;
  final String? fullName;
  final String? email;
  final String? phoneNumber;
  final String? packageName;
  final bool? hasActivePackage;

  const QRScreen({
    super.key,
    required this.qrData,
    this.userId,
    this.fullName,
    this.email,
    this.phoneNumber,
    this.packageName,
    this.hasActivePackage,
  });

  @override
  State<QRScreen> createState() => _QRScreenState();
}

class _QRScreenState extends State<QRScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    // In thông tin người dùng ra logger
    logger.i('======== THÔNG TIN NGƯỜI DÙNG ========');
    logger.i('User ID: ${widget.userId ?? "Không có"}');
    logger.i('Họ tên: ${widget.fullName ?? "Không có"}');
    logger.i('Email: ${widget.email ?? "Không có"}');
    logger.i('Số điện thoại: ${widget.phoneNumber ?? "Không có"}');
    logger.i('Gói tập: ${widget.packageName ?? "Không có"}');
    logger.i(
      'Trạng thái: ${widget.hasActivePackage == true ? "Đang hoạt động" : "Không hoạt động"}',
    );
    logger.i('QR Data: ${widget.qrData}');
    logger.i('======================================');

    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutBack),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeIn),
    );

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _showFullScreenQR(BuildContext context) {
    QRFullScreenDialog.show(context, widget.qrData);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
              // Custom App Bar
              QRAppBar(
                onBack: () => Navigator.pop(context),
                onShare: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: const Text('Share QR Code'),
                      backgroundColor: AppColors.info,
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  );
                },
              ),

              // Main Content
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    children: [
                      const SizedBox(height: 20),

                      // Title Section
                      QRTitleSection(fadeAnimation: _fadeAnimation),

                      const SizedBox(height: 40),

                      // QR Code Card
                      QRCodeCard(
                        qrData: widget.qrData,
                        scaleAnimation: _scaleAnimation,
                        onTap: () => _showFullScreenQR(context),
                      ),

                      const SizedBox(height: 20),

                      // Zoom hint
                      // QRZoomHint(fadeAnimation: _fadeAnimation),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
