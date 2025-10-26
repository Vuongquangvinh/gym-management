import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../theme/colors.dart';
import '../widgets/membershipCard/membership_card.dart';
import '../widgets/package/package_header.dart';
import '../widgets/section_title.dart';
import '../widgets/card/action_cards_section.dart';
import '../widgets/package/packages_bottom_sheet.dart';
import '../widgets/historyWorkout/workout_history_bottom_sheet.dart';
import '../widgets/pt/pt_list_bottom_sheet.dart';
import '../widgets/pt/detail_PT_screen.dart';
import '../widgets/payment_dialog.dart';
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
    // Lấy thông tin gói tập từ provider
    final packageProvider = context.read<PackageProvider>();
    final selectedPackage = packageProvider.packages.firstWhere(
      (p) => p.id == packageId,
    );

    logger.i('=== GIA HẠN GÓI TẬP ===');
    logger.i('Package ID: $packageId');
    logger.i('Package Name: ${selectedPackage.packageName}');
    logger.i('Price: ${selectedPackage.price}');
    logger.i('Duration: ${selectedPackage.duration} ngày');

    // Hiển thị loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: context.surface,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text(
                'Đang tạo mã thanh toán...',
                style: GoogleFonts.inter(
                  color: context.textPrimary,
                  fontSize: 14,
                ),
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
        logger.i('Response data: $data');
        logger.i('Order Code: ${data['orderCode']}');
        logger.i('Checkout URL: ${data['checkoutUrl']}');
        logger.i(
          'Amount: ${data['amount']} (type: ${data['amount'].runtimeType})',
        );
        logger.i('QR Code: ${data['qrCode']}');

        // Validate dữ liệu trước khi hiển thị
        if (data['qrCode'] == null || data['checkoutUrl'] == null) {
          throw Exception('Thiếu thông tin QR code hoặc checkout URL');
        }

        // Hiển thị dialog QR thanh toán
        if (mounted) {
          PaymentQRDialog.show(
            context,
            qrCodeData:
                data['qrCode'] ?? '', // Đổi từ qrCodeUrl thành qrCodeData
            checkoutUrl: data['checkoutUrl'] ?? '',
            amount: (data['amount'] ?? selectedPackage.price).toInt(),
            description: data['description'] ?? 'Thanh toán gói tập',
            orderCode: data['orderCode']?.toString() ?? '',
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
            content: Text(
              'Không thể tạo mã thanh toán. Vui lòng thử lại.',
              style: GoogleFonts.inter(color: Colors.white),
            ),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
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
          content: Text(
            'Không thể lấy thông tin PT. Vui lòng thử lại.',
            style: GoogleFonts.inter(color: Colors.white),
          ),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
    }
  }

  void _showPackagesDialog() async {
    final packageProvider = context.read<PackageProvider>();

    // Nếu đang loading hoặc chưa có data, load và hiển thị dialog
    if (packageProvider.isLoading || packageProvider.packages.isEmpty) {
      // Hiển thị loading dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => Center(
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text(
                  'Đang tải dữ liệu gói tập...',
                  style: GoogleFonts.inter(
                    color: context.textPrimary,
                    fontSize: 14,
                  ),
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
              content: Text(
                packageProvider.error!,
                style: GoogleFonts.inter(color: Colors.white),
              ),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
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
              content: Text(
                'Không có gói tập nào',
                style: GoogleFonts.inter(color: Colors.white),
              ),
              backgroundColor: AppColors.warning,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
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
            'id': p.id,
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

  void _showPTDialog() {
    PTListBottomSheet.show(context, onSelectPT: _handleSelectPT);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Back button
              PackageHeader(onBack: () => Navigator.pop(context)),

              // Membership Card
              MembershipCard(userId: widget.userId),

              const SizedBox(height: 24),

              // Title
              const SectionTitle(title: 'Quản Lý Gói Tập'),

              const SizedBox(height: 20),

              // Action Cards Section
              ActionCardsSection(
                onPackagesTap: () => _showPackagesDialog(),
                onPTTap: () => _showPTDialog(),
                onHistoryTap: () => _showHistoryDialog(),
                onPaymentTap: () => PaymentDialog.show(context),
                onSupportTap: () => SupportDialog.show(context),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
