import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../theme/colors.dart';
import '../widgets/membershipCard/membership_card.dart';
import '../widgets/card/action_cards_section.dart';
import '../widgets/package/packages_bottom_sheet.dart';
import '../widgets/historyWorkout/workout_history_bottom_sheet.dart';
import '../widgets/pt/pt_list_bottom_sheet.dart';
import '../widgets/pt/detail_PT_screen.dart';
import '../widgets/support_dialog.dart';
import '../widgets/payment/payment_qr_dialog.dart';
import '../data/providers/membership_provider.dart';
import '../data/providers/package_provider.dart';
import '../data/services/payos_service.dart';
import 'package:logger/logger.dart';

final logger = Logger();

class PackageScreen extends StatefulWidget {
  final String userId;

  const PackageScreen({super.key, required this.userId});

  @override
  _PackageScreenState createState() => _PackageScreenState();
}

class _PackageScreenState extends State<PackageScreen> {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => MembershipProvider()),
        ChangeNotifierProvider(
          create: (_) => PackageProvider()..loadAllPackage(),
        ),
      ],
      child: _PackageScreenContent(userId: widget.userId),
    );
  }
}

class _PackageScreenContent extends StatefulWidget {
  final String userId;

  const _PackageScreenContent({required this.userId});

  @override
  _PackageScreenContentState createState() => _PackageScreenContentState();
}

class _PackageScreenContentState extends State<_PackageScreenContent> {
  @override
  void initState() {
    super.initState();
    // Khởi tạo intl cho ngôn ngữ tiếng Việt
    Intl.defaultLocale = 'vi_VN';
  }

  void _renewPackage(String packageId) async {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    // Lấy thông tin gói tập từ provider
    final packageProvider = context.read<PackageProvider>();

    // 🔥 Tìm package theo packageId (field "PackageId") thay vì document ID
    final selectedPackage = packageProvider.packages.firstWhere(
      (p) => p.packageId == packageId, // Đổi từ p.id thành p.packageId
      orElse: () =>
          throw Exception('Không tìm thấy package với PackageId: $packageId'),
    );

    logger.i('=== GIA HẠN GÓI TẬP ===');
    logger.i('Package ID (PackageId field): $packageId');
    logger.i('Package Name: ${selectedPackage.packageName}');
    logger.i('Price: ${selectedPackage.price}');
    logger.i('Duration: ${selectedPackage.duration} ngày');
    logger.i('User ID (widget.userId): ${widget.userId}');
    logger.i('User ID type: ${widget.userId.runtimeType}');
    logger.i('User ID length: ${widget.userId.length}');

    // Hiển thị loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 40),
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isDarkMode
                  ? [AppColors.surfaceDark, AppColors.cardDark]
                  : [Colors.white, AppColors.primaryLight.withOpacity(0.05)],
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryLight],
                  ),
                  shape: BoxShape.circle,
                ),
                child: const CircularProgressIndicator(
                  strokeWidth: 3,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Đang tạo mã thanh toán...',
                style: GoogleFonts.inter(
                  color: context.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Vui lòng chờ trong giây lát',
                style: GoogleFonts.inter(
                  color: context.textSecondary,
                  fontSize: 13,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );

    try {
      // Gọi API tạo payment link
      final response = await PayOSService.createGymPayment(
        packageId: packageId,
        packageName: selectedPackage.packageName,
        packagePrice: selectedPackage.price.toInt(),
        packageDuration: selectedPackage.duration,
        userId: widget.userId,
        userName: 'User ${widget.userId}', // TODO: Lấy tên thật từ user profile
        // userEmail: 'user@example.com', // Optional
        // userPhone: '0123456789', // Optional
      );

      // Đóng loading dialog
      if (mounted) Navigator.pop(context);

      // Kiểm tra response
      if (response['success'] == true && response['data'] != null) {
        final data = response['data'];
        logger.i('Tạo payment link thành công!');
        logger.i('📦 Response data structure:');
        logger.i('  - Keys: ${data.keys.toList()}');
        logger.i('  - Order Code: ${data['orderCode']}');
        logger.i('  - Checkout URL: ${data['checkoutUrl']}');
        logger.i('  - QR Code: ${data['qrCode']}');
        logger.i('  - QR Code type: ${data['qrCode'].runtimeType}');
        logger.i(
          '  - QR Code length: ${data['qrCode']?.toString().length ?? 0}',
        );
        logger.i(
          '  - Amount: ${data['amount']} (type: ${data['amount'].runtimeType})',
        );
        logger.i('  - Description: ${data['description']}');

        // Validate dữ liệu trước khi hiển thị
        final qrCode = data['qrCode']?.toString() ?? '';
        final checkoutUrl = data['checkoutUrl']?.toString() ?? '';

        if (qrCode.isEmpty || checkoutUrl.isEmpty) {
          logger.e('❌ QR Code hoặc Checkout URL bị rỗng!');
          logger.e('  - qrCode isEmpty: ${qrCode.isEmpty}');
          logger.e('  - checkoutUrl isEmpty: ${checkoutUrl.isEmpty}');
          throw Exception('Thiếu thông tin QR code hoặc checkout URL');
        }

        logger.i('✅ Validation passed. Showing payment dialog...');

        // Hiển thị dialog QR thanh toán
        if (mounted) {
          await PaymentQRDialog.show(
            context,
            qrCodeData: qrCode,
            checkoutUrl: checkoutUrl,
            amount: (data['amount'] ?? selectedPackage.price).toInt(),
            description: data['description'] ?? 'Thanh toán gói tập',
            orderCode: data['orderCode']?.toString() ?? '',
            onPaymentSuccess: () {
              // Reload thông tin gói tập sau khi thanh toán thành công
              logger.i('🔄 Reloading package info after successful payment...');

              // Reload membership provider để cập nhật UI
              final membershipProvider = context.read<MembershipProvider>();
              membershipProvider.loadMembershipData(widget.userId);

              // Reload package provider
              final packageProvider = context.read<PackageProvider>();
              packageProvider.loadAllPackage();

              logger.i('✅ Package info reloaded successfully');
            },
          );
        }
      } else {
        throw Exception('Response không hợp lệ');
      }
    } catch (e) {
      logger.e('Lỗi khi tạo payment link: $e');

      // Đóng loading dialog nếu còn mở
      if (mounted) Navigator.pop(context);

      // Hiển thị lỗi
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.error_outline_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Không thể tạo mã thanh toán. Vui lòng thử lại.',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.all(16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 6,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    }
  }

  void _handleSelectPT(String ptId) async {
    final provider = Provider.of<MembershipProvider>(context, listen: false);
    final pt = await provider.selectedPT(ptId);
    if (pt != null) {
      // Mở trang chi tiết PT
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => DetailPTScreen(pt: pt)),
      );
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.warning_amber_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Không thể lấy thông tin PT. Vui lòng thử lại.',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.all(16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 6,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  void _showPackagesDialog() async {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;
    final packageProvider = context.read<PackageProvider>();

    // Nếu đang loading hoặc chưa có data, load và hiển thị dialog
    if (packageProvider.isLoading || packageProvider.packages.isEmpty) {
      // Hiển thị loading dialog với thiết kế đẹp
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => Center(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 40),
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDarkMode
                    ? [AppColors.surfaceDark, AppColors.cardDark]
                    : [Colors.white, AppColors.accent.withOpacity(0.05)],
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.secondary, AppColors.accent],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: const CircularProgressIndicator(
                    strokeWidth: 3,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Đang tải dữ liệu gói tập...',
                  style: GoogleFonts.inter(
                    color: context.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Vui lòng chờ trong giây lát',
                  style: GoogleFonts.inter(
                    color: context.textSecondary,
                    fontSize: 13,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );

      // Nếu đang loading, đợi cho đến khi xong
      if (packageProvider.isLoading) {
        // Lắng nghe thay đổi và đợi loading xong
        await Future.doWhile(() async {
          await Future.delayed(const Duration(milliseconds: 100));
          return packageProvider.isLoading;
        });
      } else {
        // Nếu không đang loading, load dữ liệu
        await packageProvider.loadAllPackage();
      }

      // Đóng loading dialog
      if (mounted) Navigator.pop(context);

      // Kiểm tra lỗi
      if (packageProvider.error != null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.error_outline_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      packageProvider.error!,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
              margin: const EdgeInsets.all(16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 6,
              duration: const Duration(seconds: 4),
            ),
          );
        }
        return;
      }

      // Nếu vẫn không có data sau khi load
      if (packageProvider.packages.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.info_outline_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Không có gói tập nào',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              backgroundColor: AppColors.warning,
              behavior: SnackBarBehavior.floating,
              margin: const EdgeInsets.all(16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 6,
              duration: const Duration(seconds: 3),
            ),
          );
        }
        return;
      }
    }

    // Có dữ liệu rồi, hiển thị bottom sheet
    final packages = packageProvider.packages
        .map(
          (p) => {
            'id': p
                .packageId, // 🔥 Sử dụng packageId (field "PackageId") thay vì document ID
            'name': p.packageName,
            'price': p.price,
            'duration': p.duration,
            'description': p.description ?? '',
            'benefits': p.description != null && p.description!.isNotEmpty
                ? [p.description!]
                : <String>[],
            'icon': Icons.card_membership,
          },
        )
        .toList();

    print('Số gói tập sẽ hiển thị: ${packages.length}');
    print('Gói tập: $packages');

    if (mounted) {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => PackagesBottomSheet(
          availablePackages: packages,
          onRenewPackage: _renewPackage,
        ),
      );
    }
  }

  void _showHistoryDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => WorkoutHistoryBottomSheet(
        workoutHistory: [], // TODO: Load workout history từ database
      ),
    );
  }

  void _showPaymentHistoryDialog() {
    Navigator.pushNamed(
      context,
      '/payment-history',
      arguments: {'userId': widget.userId},
    );
  }

  void _showPTDialog() {
    PTListBottomSheet.show(context, onSelectPT: _handleSelectPT);
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: context.background,
      body: CustomScrollView(
        slivers: [
          // Modern AppBar with Gradient
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
                    colors: isDarkMode
                        ? [AppColors.surfaceDark, AppColors.cardDark]
                        : [AppColors.primary, AppColors.primaryLight],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 40, 20, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Gói tập',
                          style: GoogleFonts.inter(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Quản lý gói tập của bạn',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.9),
                            fontWeight: FontWeight.w500,
                          ),
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
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Membership Card
                MembershipCard(userId: widget.userId),

                const SizedBox(height: 32),

                // Title
                Text(
                  'Hoạt động',
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: isDarkMode
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                  ),
                ),

                const SizedBox(height: 16),

                // Action Cards Section
                Consumer<MembershipProvider>(
                  builder: (context, membershipProvider, _) {
                    final disablePTCard =
                        membershipProvider.currentPackage == null ||
                        !membershipProvider.isActive;
                    return ActionCardsSection(
                      onPackagesTap: () => _showPackagesDialog(),
                      onPTTap: () => _showPTDialog(),
                      disablePTCard: disablePTCard,
                      onPaymentTap: () => _showPaymentHistoryDialog(),
                      onSupportTap: () => SupportDialog.show(context),
                    );
                  },
                ),

                const SizedBox(height: 40),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
