import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:logger/logger.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../model/employee.model.dart';
import '../../../model/ptPackage.mode.dart';
import '../../../model/user.model.dart';
import '../../../model/contract.mode.dart';
import '../../../../services/pt_schedule_notification_service.dart';
import '../../../../theme/colors.dart';
import '../../data/services/payos_service.dart';
import '../payment/payment_qr_dialog.dart';
import 'start_date_selection_screen.dart';
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

  Future<void> _handleMonthlyBooking(PTPackageModel package) async {
    try {
      _logger.i('=== BẮT ĐẦU ĐĂNG KÝ GÓI PT THÁNG ===');
      _logger.i('Package: ${package.name}');
      _logger.i('Price: ${package.price}');
      _logger.i('PT: ${widget.pt.fullName}');

      // Lấy userId
      final userId = await UserModel.getMemberId();
      if (userId == null || userId.isEmpty) {
        throw Exception('Không tìm thấy thông tin người dùng');
      }

      // BƯỚC 1: Navigate to Start Date Selection Screen
      if (!context.mounted) return;
      final dateResult = await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const StartDateSelectionScreen(),
        ),
      );

      if (dateResult == null) {
        _logger.i('User cancelled date selection');
        return;
      }

      final selectedStartDate = dateResult['startDate'] as DateTime;
      final selectedEndDate = dateResult['endDate'] as DateTime;

      _logger.i(
        'Start date: ${DateFormat('dd/MM/yyyy').format(selectedStartDate)}',
      );
      _logger.i(
        'End date: ${DateFormat('dd/MM/yyyy').format(selectedEndDate)}',
      );

      // BƯỚC 2: Navigate to Weekly Schedule Selection Screen
      if (!context.mounted) return;
      final weeklySchedule = await Navigator.push<WeeklySchedule>(
        context,
        MaterialPageRoute(
          builder: (context) => WeeklyScheduleSelectionScreen(
            package: package,
            startDate: selectedStartDate,
            endDate: selectedEndDate,
          ),
        ),
      );

      if (weeklySchedule == null) {
        _logger.i('User cancelled weekly schedule selection');
        return;
      }

      // Kiểm tra đã chọn đủ 7 ngày chưa
      if (!weeklySchedule.isComplete()) {
        final missingDays = weeklySchedule.getMissingDays();
        throw Exception(
          'Vui lòng chọn đủ 7 ngày trong tuần!\nCòn thiếu: ${missingDays.join(", ")}',
        );
      }

      _logger.i(
        'Weekly schedule selected: ${weeklySchedule.schedule.length} days',
      );

      // Chuyển weeklySchedule sang selectedTimeSlots format
      final selectedTimeSlots = weeklySchedule.schedule.values
          .map(
            (slot) => {
              'timeSlotId': slot.timeSlotId,
              'dayOfWeek': slot.dayOfWeek,
              'startTime': slot.startTime,
              'endTime': slot.endTime,
              'note': slot.note,
            },
          )
          .toList();

      _logger.i('Selected time slots: $selectedTimeSlots');

      // Hiển thị loading dialog
      if (context.mounted) {
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
                    'Đang tạo hợp đồng và thanh toán...',
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
      }

      // BƯỚC 3: Tạo payment link cho gói PT
      final paymentResponse = await PayOSService.createPTPackagePayment(
        ptPackageId: package.id,
        ptPackageName: package.name,
        ptPackagePrice: package.price,
        userId: userId,
        userName: 'User $userId',
        ptId: widget.pt.id,
        ptName: widget.pt.fullName,
        selectedTimeSlots: selectedTimeSlots,
        startDate: Timestamp.fromDate(selectedStartDate),
        endDate: Timestamp.fromDate(selectedEndDate),
      );

      // Đóng loading dialog
      if (context.mounted) Navigator.pop(context);

      if (paymentResponse['success'] != true) {
        throw Exception(
          paymentResponse['message'] ?? 'Không thể tạo thanh toán',
        );
      }

      final paymentData = paymentResponse['data'];
      final orderCode = paymentData['orderCode'].toString();
      final qrCode = paymentData['qrCode'] ?? '';
      final checkoutUrl = paymentData['checkoutUrl'] ?? '';
      final amount = paymentData['amount'] as int;
      final contractId = paymentData['contractId'] ?? '';

      _logger.i('✅ Tạo payment link thành công!');
      _logger.i('Order Code: $orderCode');
      _logger.i('Contract ID: $contractId');

      // BƯỚC 4: Hiển thị dialog QR thanh toán
      if (context.mounted) {
        await PaymentQRDialog.show(
          context,
          qrCodeData: qrCode,
          checkoutUrl: checkoutUrl,
          amount: amount,
          description:
              '${package.name} - ${widget.pt.fullName}\n${DateFormat('dd/MM/yyyy').format(selectedStartDate)} - ${DateFormat('dd/MM/yyyy').format(selectedEndDate)}',
          orderCode: orderCode,
          onPaymentSuccess: () async {
            _logger.i('💰 Thanh toán thành công!');

            // Lên lịch thông báo cho các buổi tập
            await PTScheduleNotificationService()
                .scheduleAllWorkoutNotifications();

            // Reload packages
            await _loadPackages();

            // Hiển thị thông báo
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Đăng ký gói PT tháng thành công!'),
                  backgroundColor: AppColors.success,
                  duration: const Duration(seconds: 5),
                ),
              );
            }
          },
        );
      }
    } catch (e) {
      _logger.e('❌ Lỗi khi đăng ký gói PT tháng: $e');

      // Đóng loading dialog nếu còn mở
      if (context.mounted) Navigator.pop(context);

      // Hiển thị lỗi
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 5),
          ),
        );
      }
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
                    pt: widget.pt,
                    onSessionBooking: () {
                      // Session booking functionality will be handled in _PackageCard
                    },
                    onMonthlyBooking: () async {
                      // Monthly booking - Thanh toán gói tháng
                      await _handleMonthlyBooking(package);
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
  final EmployeeModel pt;
  final VoidCallback onSessionBooking;
  final VoidCallback onMonthlyBooking;

  const _PackageCard({
    required this.package,
    required this.pt,
    required this.onSessionBooking,
    required this.onMonthlyBooking,
  });

  @override
  State<_PackageCard> createState() => _PackageCardState();
}

class _PackageCardState extends State<_PackageCard> {
  String? selectedTimeSlotId;
  DateTime? selectedDate;
  int currentWeekIndex = 0;

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

  Future<void> _showWeeklyDatePicker(String timeSlotId) async {
    final package = widget.package;
    final slot = package.availableTimeSlots.firstWhere(
      (s) => s.id == timeSlotId,
    );
    final weekMap = package.getAvailableDatesByWeek(timeSlotId, weeksAhead: 8);

    if (weekMap.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Không có ngày khả dụng cho khung giờ này'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    currentWeekIndex = 0;

    await showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          final currentWeekDates = weekMap[currentWeekIndex] ?? [];
          final totalWeeks = weekMap.length;

          return Container(
            decoration: BoxDecoration(
              color: context.surface,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            padding: EdgeInsets.all(20),
            height: MediaQuery.of(context).size.height * 0.6,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Chọn ngày tập',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: context.textPrimary,
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                SizedBox(height: 8),

                // Time slot info
                Container(
                  padding: EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.schedule, color: AppColors.primary, size: 20),
                      SizedBox(width: 8),
                      Text(
                        '${_getDayName(slot.dayOfWeek)}, ${slot.startTime}-${slot.endTime}',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 16),

                // Week navigation
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: Icon(Icons.chevron_left),
                      onPressed: currentWeekIndex > 0
                          ? () {
                              setModalState(() {
                                currentWeekIndex--;
                              });
                            }
                          : null,
                      color: AppColors.primary,
                    ),
                    Text(
                      currentWeekIndex == 0
                          ? 'Tuần này'
                          : 'Tuần ${currentWeekIndex + 1}',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: context.textPrimary,
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.chevron_right),
                      onPressed: currentWeekIndex < totalWeeks - 1
                          ? () {
                              setModalState(() {
                                currentWeekIndex++;
                              });
                            }
                          : null,
                      color: AppColors.primary,
                    ),
                  ],
                ),
                SizedBox(height: 16),

                // Dates list
                Expanded(
                  child: currentWeekDates.isEmpty
                      ? Center(
                          child: Text(
                            'Không có ngày khả dụng trong tuần này',
                            style: GoogleFonts.inter(
                              color: context.textSecondary,
                            ),
                          ),
                        )
                      : ListView.builder(
                          itemCount: currentWeekDates.length,
                          itemBuilder: (context, index) {
                            final date = currentWeekDates[index];
                            final isAvailable = slot.isAvailableForDate(
                              date,
                              package.bookedSessions,
                              package.maxClientsPerSlot,
                            );
                            final bookedCount = slot.getBookedCountForDate(
                              date,
                              package.bookedSessions,
                            );
                            final bookedSessions = slot
                                .getBookedSessionsForDate(
                                  date,
                                  package.bookedSessions,
                                );
                            final isSelected =
                                selectedDate != null &&
                                selectedDate!.year == date.year &&
                                selectedDate!.month == date.month &&
                                selectedDate!.day == date.day;

                            return Padding(
                              padding: EdgeInsets.only(bottom: 8),
                              child: Opacity(
                                opacity: isAvailable ? 1.0 : 0.5,
                                child: Column(
                                  children: [
                                    ListTile(
                                      enabled: isAvailable,
                                      selected: isSelected,
                                      selectedTileColor: AppColors.primary
                                          .withOpacity(0.1),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        side: isSelected
                                            ? BorderSide(
                                                color: AppColors.primary,
                                                width: 2,
                                              )
                                            : BorderSide.none,
                                      ),
                                      leading: Container(
                                        padding: EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: isAvailable
                                              ? (isSelected
                                                    ? AppColors.primary
                                                    : AppColors.primary
                                                          .withOpacity(0.1))
                                              : Colors.grey.withOpacity(0.2),
                                          borderRadius: BorderRadius.circular(
                                            8,
                                          ),
                                        ),
                                        child: Icon(
                                          isAvailable
                                              ? (bookedCount > 0
                                                    ? Icons.people_alt_rounded
                                                    : Icons.calendar_today)
                                              : Icons.block,
                                          color: isAvailable
                                              ? (isSelected
                                                    ? Colors.white
                                                    : AppColors.primary)
                                              : Colors.grey,
                                          size: 20,
                                        ),
                                      ),
                                      title: Text(
                                        DateFormat(
                                          'EEEE, dd/MM/yyyy',
                                          'vi_VN',
                                        ).format(date),
                                        style: GoogleFonts.inter(
                                          fontWeight: isSelected
                                              ? FontWeight.w700
                                              : FontWeight.w500,
                                          color: isAvailable
                                              ? (isSelected
                                                    ? AppColors.primary
                                                    : context.textPrimary)
                                              : Colors.grey,
                                          decoration: !isAvailable
                                              ? TextDecoration.lineThrough
                                              : null,
                                        ),
                                      ),
                                      subtitle: !isAvailable
                                          ? Text(
                                              'Đã đầy ($bookedCount/${package.maxClientsPerSlot})',
                                              style: GoogleFonts.inter(
                                                fontSize: 12,
                                                color: AppColors.error,
                                              ),
                                            )
                                          : bookedCount > 0
                                          ? Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                SizedBox(height: 4),
                                                Text(
                                                  'Đã đặt: $bookedCount/${package.maxClientsPerSlot}',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w600,
                                                    color: AppColors.warning,
                                                  ),
                                                ),
                                              ],
                                            )
                                          : Text(
                                              'Còn trống',
                                              style: GoogleFonts.inter(
                                                fontSize: 12,
                                                color: AppColors.success,
                                              ),
                                            ),
                                      trailing: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          if (bookedCount > 0 && isAvailable)
                                            IconButton(
                                              icon: Icon(
                                                Icons.info_outline_rounded,
                                                size: 20,
                                                color: AppColors.primary,
                                              ),
                                              onPressed: () {
                                                _showBookedUsersDialog(
                                                  context,
                                                  date,
                                                  bookedSessions,
                                                  slot,
                                                );
                                              },
                                            ),
                                          Icon(
                                            isSelected
                                                ? Icons.check_circle
                                                : Icons.circle_outlined,
                                            color: isSelected
                                                ? AppColors.primary
                                                : context.textSecondary,
                                          ),
                                        ],
                                      ),
                                      onTap: isAvailable
                                          ? () {
                                              setState(() {
                                                selectedDate = date;
                                                selectedTimeSlotId = timeSlotId;
                                              });
                                              Navigator.pop(context);
                                            }
                                          : null,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showBookedUsersDialog(
    BuildContext context,
    DateTime date,
    List<BookedSession> bookedSessions,
    TimeSlot slot,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.people_alt_rounded, color: AppColors.primary),
            SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Đã có người đặt',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    DateFormat('dd/MM/yyyy', 'vi_VN').format(date),
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: context.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.schedule, color: AppColors.primary, size: 18),
                    SizedBox(width: 8),
                    Text(
                      '${_getDayName(slot.dayOfWeek)}, ${slot.startTime}-${slot.endTime}',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 16),
              Text(
                'Đã có ${bookedSessions.length} người đặt:',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: context.textPrimary,
                ),
              ),
              SizedBox(height: 12),
              ...bookedSessions.asMap().entries.map((entry) {
                final index = entry.key;
                final session = entry.value;
                return Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: Container(
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: context.card,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: context.border),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: AppColors.primary.withOpacity(0.2),
                          child: Text(
                            '${index + 1}',
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Người dùng #${session.userId.substring(0, 8)}...',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: context.textPrimary,
                                ),
                              ),
                              SizedBox(height: 2),
                              Row(
                                children: [
                                  Icon(
                                    Icons.access_time_rounded,
                                    size: 12,
                                    color: context.textSecondary,
                                  ),
                                  SizedBox(width: 4),
                                  Text(
                                    'Đặt lúc ${DateFormat('HH:mm, dd/MM/yyyy', 'vi_VN').format(session.bookedAt.toDate())}',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: context.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: session.status == 'confirmed'
                                ? AppColors.success.withOpacity(0.1)
                                : session.status == 'pending_payment'
                                ? AppColors.warning.withOpacity(0.1)
                                : AppColors.error.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            session.status == 'confirmed'
                                ? 'Đã thanh toán'
                                : session.status == 'pending_payment'
                                ? 'Chưa thanh toán'
                                : 'Đã hủy',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: session.status == 'confirmed'
                                  ? AppColors.success
                                  : session.status == 'pending_payment'
                                  ? AppColors.warning
                                  : AppColors.error,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
              SizedBox(height: 12),
              Container(
                padding: EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.info.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.info.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline_rounded,
                      size: 16,
                      color: AppColors.info,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Bạn vẫn có thể đặt lịch nếu còn chỗ trống',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppColors.info,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Đóng',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final package = widget.package;
    final hasDiscount = package.discount > 0;
    final finalPrice = hasDiscount
        ? package.originalPrice * (100 - package.discount) / 100
        : package.price;
    final formatter = NumberFormat('#,###', 'vi_VN');

    return Container(
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
                        label: '${package.duration} phút',
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
                        package.isSessionBilling
                            ? 'Chọn khung giờ tập:'
                            : 'Khung giờ khả dụng:',
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
                        .map((slot) {
                          final isSelected = selectedTimeSlotId == slot.id;
                          final canSelect = package.isSessionBilling;

                          return InkWell(
                            borderRadius: BorderRadius.circular(8),
                            onTap: canSelect
                                ? () => _showWeeklyDatePicker(slot.id)
                                : null,
                            child: Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: canSelect && isSelected
                                    ? AppColors.primary.withOpacity(0.25)
                                    : AppColors.primary.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(8),
                                border: canSelect && isSelected
                                    ? Border.all(
                                        color: AppColors.primary,
                                        width: 2,
                                      )
                                    : null,
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    '${_getDayName(slot.dayOfWeek)} ${slot.startTime}-${slot.endTime}',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      color: canSelect && isSelected
                                          ? AppColors.primary
                                          : context.textPrimary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        })
                        .toList(),
                  ),
                  const SizedBox(height: 16),
                ],

                // Selected date display
                if (selectedDate != null && selectedTimeSlotId != null) ...[
                  Container(
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.success.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.success.withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.check_circle,
                          color: AppColors.success,
                          size: 20,
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Đã chọn: ${DateFormat('EEEE, dd/MM/yyyy', 'vi_VN').format(selectedDate!)}',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.success,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.close, size: 18),
                          color: AppColors.success,
                          onPressed: () {
                            setState(() {
                              selectedDate = null;
                              selectedTimeSlotId = null;
                            });
                          },
                        ),
                      ],
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
                            onPressed: () async {
                              // Validate time slot selection
                              if (selectedTimeSlotId == null ||
                                  selectedDate == null) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Vui lòng chọn khung giờ và ngày tập!',
                                    ),
                                    backgroundColor: AppColors.error,
                                  ),
                                );
                                return;
                              }

                              _logger.i(
                                "Booking session - Slot id: $selectedTimeSlotId - Date: ${DateFormat('dd/MM/yyyy').format(selectedDate!)} - PT Package doc id: ${package.id}",
                              );

                              try {
                                // Lấy thông tin user
                                final userId = await UserModel.getMemberId();
                                if (userId == null || userId.isEmpty) {
                                  throw Exception(
                                    'Không tìm thấy thông tin người dùng',
                                  );
                                }

                                // Tạo payment link
                                _logger.i('📱 Đang tạo payment link...');
                                final paymentResponse =
                                    await PayOSService.createGymPayment(
                                      packageId: package.id,
                                      packageName: package.name,
                                      packagePrice: package.price,
                                      packageDuration: package.duration,
                                      userId: userId,
                                      userName: 'User $userId',
                                    );

                                if (paymentResponse['success'] != true) {
                                  throw Exception(
                                    paymentResponse['message'] ??
                                        'Không thể tạo thanh toán',
                                  );
                                }

                                final paymentData = paymentResponse['data'];
                                final orderCode = paymentData['orderCode']
                                    .toString();
                                final qrCode = paymentData['qrCode'] ?? '';
                                final checkoutUrl =
                                    paymentData['checkoutUrl'] ?? '';
                                final amount = paymentData['amount'] as int;

                                // Tạo booking tạm với trạng thái pending
                                _logger.i('💾 Tạo booking tạm...');
                                await PTPackageModel.createPendingBooking(
                                  ptPackageId: package.id,
                                  timeSlotId: selectedTimeSlotId!,
                                  specificDate: selectedDate!,
                                  orderCode: orderCode,
                                  amount: amount,
                                  userId: userId,
                                );

                                final slot = package.availableTimeSlots
                                    .firstWhere(
                                      (s) => s.id == selectedTimeSlotId,
                                    );

                                // Hiển thị dialog QR thanh toán
                                if (context.mounted) {
                                  await PaymentQRDialog.show(
                                    context,
                                    qrCodeData: qrCode,
                                    checkoutUrl: checkoutUrl,
                                    amount: amount,
                                    description:
                                        '${package.name} - ${_getDayName(slot.dayOfWeek)}, ${DateFormat('dd/MM/yyyy').format(selectedDate!)}',
                                    orderCode: orderCode,
                                    onPaymentSuccess: () async {
                                      // Xác nhận thanh toán
                                      await PTPackageModel.confirmPaymentForBooking(
                                        ptPackageId: package.id,
                                        orderCode: orderCode,
                                      );

                                      // Reset selection
                                      setState(() {
                                        selectedTimeSlotId = null;
                                        selectedDate = null;
                                      });

                                      // Reload packages
                                      widget.onSessionBooking();
                                    },
                                  );
                                }
                              } catch (e) {
                                _logger.e('Error booking session: $e');
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      e.toString().replaceAll(
                                        'Exception: ',
                                        '',
                                      ),
                                    ),
                                    backgroundColor: AppColors.error,
                                  ),
                                );
                              }
                            },
                            icon: Icon(Icons.payment_rounded, size: 18),
                            label: Text('Đặt lịch theo buổi'),
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
                            icon: Icon(Icons.calendar_month_rounded, size: 18),
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
