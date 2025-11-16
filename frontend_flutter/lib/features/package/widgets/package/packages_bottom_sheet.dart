import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../theme/colors.dart';
import 'package_card.dart';
import 'renew_button.dart';
import "package:logger/logger.dart";

final logger = Logger();

class PackagesBottomSheet extends StatefulWidget {
  final List<Map<String, dynamic>> availablePackages;
  final Function(String) onRenewPackage;

  const PackagesBottomSheet({
    super.key,
    required this.availablePackages,
    required this.onRenewPackage,
  });

  @override
  State<PackagesBottomSheet> createState() => _PackagesBottomSheetState();
}

class _PackagesBottomSheetState extends State<PackagesBottomSheet> {
  String? selectedPackageId;

  @override
  void initState() {
    super.initState();
    print(
      'PackagesBottomSheet nhận được ${widget.availablePackages.length} packages',
    );
    print('Packages data: ${widget.availablePackages}');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [AppColors.surfaceDark, AppColors.backgroundDark]
                : [const Color(0xFFF5F5F5), const Color(0xFFFBEFE8)],
          ),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: Column(
          children: [
            // Drag Handle
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.white.withOpacity(0.3)
                    : Colors.black.withOpacity(0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Header with gradient
            Container(
              padding: const EdgeInsets.fromLTRB(24, 20, 16, 20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: isDark
                      ? [AppColors.surfaceDark, AppColors.cardDark]
                      : [
                          AppColors.primary.withOpacity(0.05),
                          AppColors.primaryLight.withOpacity(0.02),
                        ],
                ),
                border: Border(
                  bottom: BorderSide(
                    color: isDark
                        ? Colors.white.withOpacity(0.08)
                        : AppColors.primary.withOpacity(0.1),
                    width: 1,
                  ),
                ),
              ),
              child: Row(
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
                      Icons.card_membership_rounded,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Chọn Gói Tập',
                          style: GoogleFonts.inter(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: context.textPrimary,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${widget.availablePackages.length} gói có sẵn',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: context.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: isDark
                          ? Colors.white.withOpacity(0.1)
                          : Colors.black.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(
                        Icons.close_rounded,
                        color: context.textSecondary,
                        size: 22,
                      ),
                      padding: const EdgeInsets.all(8),
                      constraints: const BoxConstraints(),
                    ),
                  ),
                ],
              ),
            ),

            // Content
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.all(20),
                children: [
                  ...widget.availablePackages.map(
                    (package) => Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: PackageCard(
                        package: package,
                        isSelected: selectedPackageId == package['id'],
                        onTap: () =>
                            setState(() => selectedPackageId = package['id']),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),

            // Bottom Button Area with gradient
            if (selectedPackageId != null)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: isDark
                        ? [
                            AppColors.backgroundDark.withOpacity(0),
                            AppColors.backgroundDark,
                          ]
                        : [Colors.white.withOpacity(0), Colors.white],
                  ),
                  border: Border(
                    top: BorderSide(
                      color: isDark
                          ? Colors.white.withOpacity(0.08)
                          : Colors.black.withOpacity(0.08),
                      width: 1,
                    ),
                  ),
                ),
                child: SafeArea(
                  top: false,
                  child: RenewButton(
                    onPressed: () {
                      logger.i('=== GIA HẠN GÓI TẬP ===');
                      logger.i('ID gói tập được chọn: $selectedPackageId');
                      final selectedPackage = widget.availablePackages
                          .firstWhere((p) => p['id'] == selectedPackageId);
                      logger.i('Tên gói: ${selectedPackage['name']}');
                      logger.i('ID: ${selectedPackage['id']}');
                      logger.i('Giá: ${selectedPackage['price']}');
                      logger.i('Thời hạn: ${selectedPackage['duration']} ngày');
                      logger.i('======================');

                      widget.onRenewPackage(selectedPackageId!);
                      Navigator.pop(context);
                    },
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  static void show(
    BuildContext context, {
    required List<Map<String, dynamic>> availablePackages,
    required Function(String) onRenewPackage,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => PackagesBottomSheet(
        availablePackages: availablePackages,
        onRenewPackage: onRenewPackage,
      ),
    );
  }
}
