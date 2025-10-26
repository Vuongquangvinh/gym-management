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
    return DraggableScrollableSheet(
      initialChildSize: 0.8,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: context.background,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: context.surface,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(20),
                ),
              ),
              child: Row(
                children: [
                  Text(
                    'Chọn Gói Tập',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: context.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close, color: context.textSecondary),
                  ),
                ],
              ),
            ),
            // Content
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.all(16),
                children: [
                  ...widget.availablePackages.map(
                    (package) => PackageCard(
                      package: package,
                      isSelected: selectedPackageId == package['id'],
                      onTap: () =>
                          setState(() => selectedPackageId = package['id']),
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (selectedPackageId != null)
                    RenewButton(
                      onPressed: () {
                        logger.i('=== GIA HẠN GÓI TẬP ===');
                        logger.i('ID gói tập được chọn: $selectedPackageId');
                        final selectedPackage = widget.availablePackages
                            .firstWhere((p) => p['id'] == selectedPackageId);
                        logger.i('Tên gói: ${selectedPackage['name']}');
                        logger.i('ID: ${selectedPackage['id']}');
                        logger.i('Giá: ${selectedPackage['price']}');
                        logger.i(
                          'Thời hạn: ${selectedPackage['duration']} ngày',
                        );
                        logger.i('======================');

                        widget.onRenewPackage(selectedPackageId!);
                        Navigator.pop(context);
                      },
                    ),
                ],
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
