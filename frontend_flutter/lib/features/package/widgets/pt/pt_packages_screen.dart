import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:logger/logger.dart';

import '../../../model/employee.model.dart';
import '../../../model/ptPackage.mode.dart';
import '../../../../theme/colors.dart';
import 'weekly_schedule_selection_screen.dart';

final _logger = Logger();

class PTPackagesScreen extends StatefulWidget {
  final EmployeeModel pt;

  const PTPackagesScreen({Key? key, required this.pt}) : super(key: key);

  @override
  State<PTPackagesScreen> createState() => _PTPackagesScreenState();
}

class _PTPackagesScreenState extends State<PTPackagesScreen> {
  List<PTPackageModel> packages = [];
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadPackages();
  }

  Future<void> _loadPackages() async {
    try {
      setState(() {
        isLoading = true;
        error = null;
      });

      final fetchedPackages = await PTPackageModel.getPackagesByPtId(
        widget.pt.id,
      );

      setState(() {
        packages = fetchedPackages.where((pkg) => pkg.isActive).toList();
        isLoading = false;
      });
    } catch (e) {
      _logger.e('Error loading packages: $e');
      setState(() {
        error = 'Không thể tải danh sách gói tập';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.background,
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: context.surface,
            iconTheme: IconThemeData(color: Colors.white),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // Gradient Background
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          AppColors.primary,
                          AppColors.primaryVariant,
                          AppColors.secondary,
                        ],
                      ),
                    ),
                  ),
                  // Content
                  Positioned(
                    bottom: 20,
                    left: 20,
                    right: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Gói tập của ${widget.pt.fullName}',
                          style: GoogleFonts.inter(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            shadows: [
                              Shadow(
                                color: Colors.black.withOpacity(0.3),
                                offset: Offset(0, 2),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Chọn gói phù hợp với bạn',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.9),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          if (isLoading)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Đang tải gói tập...',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: context.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else if (error != null)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline_rounded,
                      size: 64,
                      color: AppColors.error.withOpacity(0.5),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      error!,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        color: context.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _loadPackages,
                      icon: Icon(Icons.refresh_rounded),
                      label: Text('Thử lại'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            )
          else if (packages.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.inventory_2_outlined,
                      size: 64,
                      color: context.textSecondary.withOpacity(0.5),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Chưa có gói tập nào',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        color: context.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate((context, index) {
                  final package = packages[index];
                  return _PackageCard(
                    package: package,
                    onTap: () {
                      // TODO: Navigate to booking screen
                      _logger.i('Selected package: ${package.name}');
                    },
                    onMonthlyBooking: () {
                      // Navigate to weekly schedule selection
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => WeeklyScheduleSelectionScreen(
                            package: package,
                            ptId: widget.pt.id,
                            ptName: widget.pt.fullName,
                          ),
                        ),
                      );
                    },
                  );
                }, childCount: packages.length),
              ),
            ),
        ],
      ),
    );
  }
}

class _PackageCard extends StatefulWidget {
  final PTPackageModel package;
  final VoidCallback onTap;
  final VoidCallback onMonthlyBooking;

  const _PackageCard({
    required this.package,
    required this.onTap,
    required this.onMonthlyBooking,
  });

  @override
  State<_PackageCard> createState() => _PackageCardState();
}

class _PackageCardState extends State<_PackageCard> {
  String? selectedTimeSlotId;

  String _getDayName(int dayOfWeek) {
    const days = [
      'Chủ nhật',
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7',
    ];
    return days[dayOfWeek % 7];
  }

  @override
  Widget build(BuildContext context) {
    final package = widget.package;
    final hasDiscount = package.discount > 0;
    final finalPrice = hasDiscount
        ? package.originalPrice * (100 - package.discount) / 100
        : package.price;
    final formatter = NumberFormat('#,###', 'vi_VN');

    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: context.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: package.isPopular
                ? AppColors.primary.withOpacity(0.3)
                : context.border,
            width: package.isPopular ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: package.isPopular
                  ? AppColors.primary.withOpacity(0.1)
                  : Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              package.name,
                              style: GoogleFonts.inter(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: context.textPrimary,
                              ),
                            ),
                            if (package.description.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  package.description,
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    color: context.textSecondary,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                      if (package.isPopular)
                        Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [AppColors.primary, AppColors.secondary],
                            ),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.star_rounded,
                                size: 14,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Phổ biến',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Info Grid
                  Row(
                    children: [
                      Expanded(
                        child: _InfoChip(
                          icon: Icons.fitness_center_rounded,
                          label: '${package.sessions} buổi',
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: 2),
                      Expanded(
                        child: _InfoChip(
                          icon: Icons.access_time_rounded,
                          label: '${package.sessionDuration} phút',
                          color: AppColors.secondary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _InfoChip(
                          icon: Icons.groups_rounded,
                          label: '${package.maxClientsPerSlot} người',
                          color: AppColors.accent,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Features
                  if (package.features.isNotEmpty) ...[
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: package.features.take(3).map((feature) {
                        return Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.success.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: AppColors.success.withOpacity(0.2),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.check_circle_rounded,
                                size: 14,
                                color: AppColors.success,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                feature,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: context.textPrimary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Available Time Slots
                  if (package.availableTimeSlots.isNotEmpty) ...[
                    Row(
                      children: [
                        Icon(
                          Icons.calendar_today_rounded,
                          size: 16,
                          color: context.textSecondary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Khung giờ khả dụng:',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: context.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: package.availableTimeSlots
                          .where((slot) => slot.isActive)
                          .take(4)
                          .map((slot) {
                            final isSelected = selectedTimeSlotId == slot.id;
                            final isChosen = slot.isChosen;
                            final isDisabled = isChosen;

                            return InkWell(
                              borderRadius: BorderRadius.circular(8),
                              onTap: isDisabled
                                  ? null
                                  : () async {
                                      setState(() {
                                        selectedTimeSlotId = slot.id;
                                      });
                                      _logger.i(
                                        "Slot id: ${slot.id} - PT Package doc id: ${package.id}",
                                      );
                                      try {
                                        await PTPackageModel.updateTimeSlotSelection(
                                          ptPackageId: package.id,
                                          timeSlotId: slot.id,
                                        );
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              'Đã chọn khung giờ thành công!',
                                            ),
                                            backgroundColor: AppColors.success,
                                          ),
                                        );
                                      } catch (e) {
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              'Có lỗi khi chọn khung giờ!',
                                            ),
                                            backgroundColor: AppColors.error,
                                          ),
                                        );
                                      }
                                    },
                              child: Opacity(
                                opacity: isDisabled ? 0.5 : 1.0,
                                child: Container(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isDisabled
                                        ? Colors.grey.withOpacity(0.2)
                                        : isSelected
                                        ? AppColors.primary.withOpacity(0.25)
                                        : AppColors.primary.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(8),
                                    border: isDisabled
                                        ? Border.all(
                                            color: Colors.grey.withOpacity(0.3),
                                            width: 1,
                                          )
                                        : isSelected
                                        ? Border.all(
                                            color: AppColors.primary,
                                            width: 2,
                                          )
                                        : null,
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      if (isChosen)
                                        Padding(
                                          padding: const EdgeInsets.only(
                                            right: 4,
                                          ),
                                          child: Icon(
                                            Icons.lock_rounded,
                                            size: 12,
                                            color: Colors.grey,
                                          ),
                                        ),
                                      Text(
                                        '${_getDayName(slot.dayOfWeek)} ${slot.startTime}-${slot.endTime}',
                                        style: GoogleFonts.inter(
                                          fontSize: 11,
                                          color: isDisabled
                                              ? Colors.grey
                                              : isSelected
                                              ? AppColors.primary
                                              : context.textPrimary,
                                          fontWeight: FontWeight.w600,
                                          decoration: isChosen
                                              ? TextDecoration.lineThrough
                                              : null,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          })
                          .toList(),
                    ),
                    if (package.availableTimeSlots
                            .where((s) => s.isActive)
                            .length >
                        4)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          '+${package.availableTimeSlots.where((s) => s.isActive).length - 4} khung giờ khác',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: context.textSecondary,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                    const SizedBox(height: 16),
                  ],

                  // Divider
                  Divider(color: context.border),
                  const SizedBox(height: 12),

                  // Price & Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (hasDiscount) ...[
                            Text(
                              '${formatter.format(package.originalPrice)}đ',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                color: context.textSecondary,
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                            const SizedBox(height: 2),
                          ],
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${formatter.format(finalPrice.toInt())}đ',
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.primary,
                                ),
                              ),
                              if (hasDiscount)
                                Padding(
                                  padding: const EdgeInsets.only(
                                    left: 8,
                                    bottom: 2,
                                  ),
                                  child: Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 2,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.error,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      '-${package.discount}%',
                                      style: GoogleFonts.inter(
                                        fontSize: 6,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                      // Hiển thị nút dựa trên billingType
                      package.isSessionBilling
                          ? ElevatedButton.icon(
                              onPressed: widget.onTap,
                              icon: Icon(Icons.shopping_cart_rounded, size: 18),
                              label: Text('Đặt theo buổi'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 0,
                              ),
                            )
                          : OutlinedButton.icon(
                              onPressed: widget.onMonthlyBooking,
                              icon: Icon(
                                Icons.calendar_month_rounded,
                                size: 18,
                              ),
                              label: Text('Đặt theo tháng'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.secondary,
                                side: BorderSide(
                                  color: AppColors.secondary,
                                  width: 1,
                                ),
                                padding: EdgeInsets.symmetric(
                                  horizontal: 5,
                                  vertical: 2,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _InfoChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: color,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
