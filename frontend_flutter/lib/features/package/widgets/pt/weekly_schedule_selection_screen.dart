import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:logger/logger.dart';
import '../../../../theme/colors.dart';
import '../../../model/ptPackage.mode.dart';
import '../../../model/contract.mode.dart';
import '../../../model/user.model.dart';

final _logger = Logger();

// Model cho khung giờ tự nhập
class UserTimeSlot {
  final String id;
  final TimeOfDay startTime;
  final TimeOfDay endTime;

  UserTimeSlot({
    required this.id,
    required this.startTime,
    required this.endTime,
  });

  String get timeRange => '${_formatTime(startTime)} - ${_formatTime(endTime)}';

  static String _formatTime(TimeOfDay time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}

class WeeklyScheduleSelectionScreen extends StatefulWidget {
  final PTPackageModel package;
  final String ptId;
  final String ptName;
  final bool isEditMode; // Chế độ chỉnh sửa
  final ContractModel? existingContract; // Contract hiện tại (nếu edit)

  const WeeklyScheduleSelectionScreen({
    Key? key,
    required this.package,
    required this.ptId,
    required this.ptName,
    this.isEditMode = false,
    this.existingContract,
  }) : super(key: key);

  @override
  State<WeeklyScheduleSelectionScreen> createState() =>
      _WeeklyScheduleSelectionScreenState();
}

class _WeeklyScheduleSelectionScreenState
    extends State<WeeklyScheduleSelectionScreen> {
  // Map để lưu các khung giờ người dùng tự nhập cho mỗi ngày
  // Key: dayOfWeek (0-6), Value: List của UserTimeSlot
  Map<int, List<UserTimeSlot>> userTimeSlots = {};

  // Danh sách các ngày trong tuần
  final List<Map<String, dynamic>> daysOfWeek = [
    {'day': 1, 'name': 'Thứ 2', 'shortName': 'T2'},
    {'day': 2, 'name': 'Thứ 3', 'shortName': 'T3'},
    {'day': 3, 'name': 'Thứ 4', 'shortName': 'T4'},
    {'day': 4, 'name': 'Thứ 5', 'shortName': 'T5'},
    {'day': 5, 'name': 'Thứ 6', 'shortName': 'T6'},
    {'day': 6, 'name': 'Thứ 7', 'shortName': 'T7'},
    {'day': 0, 'name': 'Chủ nhật', 'shortName': 'CN'},
  ];

  int? expandedDay;

  @override
  void initState() {
    super.initState();
    // Khởi tạo map cho các ngày
    for (var day in daysOfWeek) {
      userTimeSlots[day['day']] = [];
    }

    // Nếu là edit mode, load dữ liệu từ contract hiện tại
    if (widget.isEditMode && widget.existingContract != null) {
      _loadExistingTimeSlots();
    }
  }

  /// Load các time slots từ contract hiện tại
  void _loadExistingTimeSlots() {
    for (var slot in widget.existingContract!.selectedTimeSlots) {
      final timeParts = slot.startTime.split(':');
      final endParts = slot.endTime.split(':');

      userTimeSlots[slot.dayOfWeek]!.add(
        UserTimeSlot(
          id: slot.timeSlotId,
          startTime: TimeOfDay(
            hour: int.parse(timeParts[0]),
            minute: int.parse(timeParts[1]),
          ),
          endTime: TimeOfDay(
            hour: int.parse(endParts[0]),
            minute: int.parse(endParts[1]),
          ),
        ),
      );
    }
  }

  int _getTotalSelectedSlots() {
    int total = 0;
    userTimeSlots.forEach((day, slots) {
      total += slots.length;
    });
    return total;
  }

  Future<void> _addTimeSlot(int dayOfWeek) async {
    String? selectedStartTime;
    String? selectedEndTime;

    final result = await showModalBottomSheet<Map<String, String>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
            width: double.infinity,
            height: MediaQuery.of(context).size.height * 0.62,
            decoration: BoxDecoration(
              color: context.surface,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(24),
                topRight: Radius.circular(24),
              ),
            ),
            child: Column(
              children: [
                // Header
                Container(
                  width: MediaQuery.of(context).size.width,
                  padding: EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primary, AppColors.secondary],
                    ),
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(24),
                      topRight: Radius.circular(24),
                    ),
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 100,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Chọn khung giờ',
                        style: GoogleFonts.inter(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Chọn giờ bắt đầu và kết thúc',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: Colors.white.withOpacity(0.9),
                        ),
                      ),
                    ],
                  ),
                ),

                // Content
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.all(28),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Giờ bắt đầu
                        InkWell(
                          onTap: () async {
                            final time = await showTimePicker(
                              context: context,
                              initialTime: TimeOfDay(hour: 6, minute: 0),
                              builder: (context, child) {
                                return Theme(
                                  data: Theme.of(context).copyWith(
                                    colorScheme: ColorScheme.light(
                                      primary: AppColors.primary,
                                    ),
                                  ),
                                  child: child!,
                                );
                              },
                            );
                            if (time != null) {
                              setModalState(() {
                                selectedStartTime =
                                    '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
                                // Reset endTime nếu không hợp lệ
                                if (selectedEndTime != null) {
                                  final startMinutes =
                                      time.hour * 60 + time.minute;
                                  final endParts = selectedEndTime!.split(':');
                                  final endMinutes =
                                      int.parse(endParts[0]) * 60 +
                                      int.parse(endParts[1]);
                                  if (endMinutes <= startMinutes) {
                                    selectedEndTime = null;
                                  }
                                }
                              });
                            }
                          },
                          child: Container(
                            padding: EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: selectedStartTime != null
                                    ? AppColors.primary
                                    : AppColors.primary.withOpacity(0.3),
                                width: selectedStartTime != null ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary,
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: Icon(
                                    Icons.access_time_rounded,
                                    color: Colors.white,
                                    size: 28,
                                  ),
                                ),
                                const SizedBox(width: 18),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Giờ bắt đầu',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          color: context.textSecondary,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        selectedStartTime ?? 'Chọn giờ',
                                        style: GoogleFonts.inter(
                                          fontSize: 24,
                                          fontWeight: FontWeight.w700,
                                          color: selectedStartTime != null
                                              ? AppColors.primary
                                              : context.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Icon(
                                  Icons.chevron_right_rounded,
                                  color: context.textSecondary,
                                  size: 28,
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 20),

                        // Giờ kết thúc
                        InkWell(
                          onTap: selectedStartTime == null
                              ? null
                              : () async {
                                  final startParts = selectedStartTime!.split(
                                    ':',
                                  );
                                  final startHour = int.parse(startParts[0]);
                                  final startMinute = int.parse(startParts[1]);

                                  final time = await showTimePicker(
                                    context: context,
                                    initialTime: TimeOfDay(
                                      hour: (startHour + 1) % 24,
                                      minute: startMinute,
                                    ),
                                    builder: (context, child) {
                                      return Theme(
                                        data: Theme.of(context).copyWith(
                                          colorScheme: ColorScheme.light(
                                            primary: AppColors.secondary,
                                          ),
                                        ),
                                        child: child!,
                                      );
                                    },
                                  );
                                  if (time != null) {
                                    final endMinutes =
                                        time.hour * 60 + time.minute;
                                    final startMinutes =
                                        startHour * 60 + startMinute;

                                    if (endMinutes <= startMinutes) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            'Giờ kết thúc phải sau giờ bắt đầu!',
                                          ),
                                          backgroundColor: AppColors.error,
                                          duration: Duration(seconds: 2),
                                        ),
                                      );
                                    } else {
                                      setModalState(() {
                                        selectedEndTime =
                                            '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
                                      });
                                    }
                                  }
                                },
                          child: Opacity(
                            opacity: selectedStartTime == null ? 0.5 : 1.0,
                            child: Container(
                              padding: EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: AppColors.secondary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: selectedEndTime != null
                                      ? AppColors.secondary
                                      : AppColors.secondary.withOpacity(0.3),
                                  width: selectedEndTime != null ? 2 : 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: selectedStartTime != null
                                          ? AppColors.secondary
                                          : Colors.grey,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(
                                      Icons.access_time_filled_rounded,
                                      color: Colors.white,
                                      size: 24,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Giờ kết thúc',
                                          style: GoogleFonts.inter(
                                            fontSize: 14,
                                            color: context.textSecondary,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          selectedEndTime ??
                                              (selectedStartTime == null
                                                  ? 'Chọn giờ bắt đầu trước'
                                                  : 'Chọn giờ'),
                                          style: GoogleFonts.inter(
                                            fontSize: selectedEndTime != null
                                                ? 24
                                                : 15,
                                            fontWeight: selectedEndTime != null
                                                ? FontWeight.w700
                                                : FontWeight.w500,
                                            color: selectedEndTime != null
                                                ? AppColors.secondary
                                                : context.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Icon(
                                    Icons.chevron_right_rounded,
                                    color: selectedStartTime != null
                                        ? context.textSecondary
                                        : context.textSecondary.withOpacity(
                                            0.3,
                                          ),
                                    size: 28,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Footer
                Container(
                  padding: EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: context.surface,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 10,
                        offset: Offset(0, -4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(context),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: context.textSecondary,
                            side: BorderSide(color: context.border),
                            padding: EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: Text(
                            'Hủy',
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed:
                              (selectedStartTime != null &&
                                  selectedEndTime != null)
                              ? () {
                                  Navigator.pop(context, {
                                    'startTime': selectedStartTime!,
                                    'endTime': selectedEndTime!,
                                  });
                                }
                              : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: context.textSecondary
                                .withOpacity(0.3),
                            padding: EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          child: Text(
                            'Xác nhận',
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );

    if (result != null) {
      final startTimeParts = result['startTime']!.split(':');
      final endTimeParts = result['endTime']!.split(':');

      setState(() {
        userTimeSlots[dayOfWeek]!.add(
          UserTimeSlot(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            startTime: TimeOfDay(
              hour: int.parse(startTimeParts[0]),
              minute: int.parse(startTimeParts[1]),
            ),
            endTime: TimeOfDay(
              hour: int.parse(endTimeParts[0]),
              minute: int.parse(endTimeParts[1]),
            ),
          ),
        );
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đã thêm khung giờ thành công!'),
          backgroundColor: AppColors.success,
          duration: Duration(seconds: 1),
        ),
      );
    }
  }

  void _removeTimeSlot(int dayOfWeek, String slotId) {
    setState(() {
      userTimeSlots[dayOfWeek]!.removeWhere((slot) => slot.id == slotId);
    });
  }

  Future<void> _confirmSelection() async {
    final totalSelected = _getTotalSelectedSlots();

    if (totalSelected == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Vui lòng chọn ít nhất một khung giờ'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    // Hiển thị dialog xác nhận
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: context.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Xác nhận lịch tập',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w700,
            color: context.textPrimary,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Bạn đã chọn $totalSelected khung giờ trong tuần.',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: context.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Lịch tập của bạn:',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: context.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            ...userTimeSlots.entries
                .where((entry) => entry.value.isNotEmpty)
                .map((entry) {
                  final dayName = daysOfWeek.firstWhere(
                    (d) => d['day'] == entry.key,
                  )['name'];
                  final slots = entry.value
                      .map((slot) {
                        return slot.timeRange;
                      })
                      .join(', ');

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      '• $dayName: $slots',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: context.textSecondary,
                      ),
                    ),
                  );
                })
                .toList(),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Hủy',
              style: GoogleFonts.inter(color: context.textSecondary),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              'Xác nhận',
              style: GoogleFonts.inter(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        // Hiển thị loading
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => Center(
            child: Container(
              padding: EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: context.card,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: AppColors.primary),
                  SizedBox(height: 16),
                  Text(
                    widget.isEditMode
                        ? 'Đang cập nhật lịch tập...'
                        : 'Đang tạo hợp đồng...',
                    style: GoogleFonts.inter(
                      color: context.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );

        // Lấy userId
        final userId = await UserModel.getMemberId();
        if (userId == null || userId.isEmpty) {
          throw Exception('Không tìm thấy thông tin người dùng');
        }

        // Chuyển đổi userTimeSlots thành SelectedTimeSlot
        List<SelectedTimeSlot> selectedTimeSlots = [];
        userTimeSlots.forEach((dayOfWeek, slots) {
          for (var slot in slots) {
            selectedTimeSlots.add(
              SelectedTimeSlot(
                timeSlotId: slot.id,
                dayOfWeek: dayOfWeek,
                startTime: UserTimeSlot._formatTime(slot.startTime),
                endTime: UserTimeSlot._formatTime(slot.endTime),
                note: '',
              ),
            );
          }
        });

        // Log dữ liệu trước khi thêm
        final actionText = widget.isEditMode ? 'CẬP NHẬT' : 'TẠO';
        _logger.i('=== BẮT ĐẦU $actionText CONTRACT ===');
        _logger.i('User ID: $userId');
        _logger.i('PT ID: ${widget.ptId}');
        _logger.i('PT Name: ${widget.ptName}');
        _logger.i('Package ID: ${widget.package.id}');
        _logger.i('Package Name: ${widget.package.name}');
        _logger.i('Total Sessions: ${widget.package.sessions}');
        _logger.i('Total Selected Slots: ${selectedTimeSlots.length}');
        _logger.i('Selected Time Slots Details:');
        for (var i = 0; i < selectedTimeSlots.length; i++) {
          final slot = selectedTimeSlots[i];
          final dayName = daysOfWeek.firstWhere(
            (d) => d['day'] == slot.dayOfWeek,
          )['name'];
          _logger.i(
            '  [$i] $dayName: ${slot.startTime} - ${slot.endTime} (ID: ${slot.timeSlotId})',
          );
        }
        _logger.i('================================');

        String contractId;
        if (widget.isEditMode && widget.existingContract != null) {
          // Cập nhật contract hiện tại
          await ContractModel.updateContractTimeSlots(
            contractId: widget.existingContract!.id,
            selectedTimeSlots: selectedTimeSlots,
          );
          contractId = widget.existingContract!.id;
          _logger.i('✅ CONTRACT UPDATED SUCCESSFULLY!');
        } else {
          // Tạo contract mới
          contractId = await ContractModel.createContract(
            userId: userId,
            ptId: widget.ptId,
            ptPackageId: widget.package.id,
            selectedTimeSlots: selectedTimeSlots,
            totalSessions: widget.package.sessions,
            note: 'Đăng ký gói ${widget.package.name} với PT ${widget.ptName}',
          );
          _logger.i('✅ CONTRACT CREATED SUCCESSFULLY!');
        }

        // Đóng loading dialog
        Navigator.pop(context);

        // Log kết quả
        _logger.i('Contract ID: $contractId');
        _logger.i('Status: ${widget.isEditMode ? "updated" : "pending"}');
        if (!widget.isEditMode) {
          _logger.i('Waiting for PT approval...');
        }
        _logger.i('================================');

        // Hiển thị thông báo thành công
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        widget.isEditMode
                            ? 'Cập nhật lịch tập thành công!'
                            : 'Tạo hợp đồng thành công!',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        widget.isEditMode
                            ? 'Lịch tập của bạn đã được cập nhật'
                            : 'PT sẽ xem xét và phản hồi sớm nhất',
                        style: GoogleFonts.inter(fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            backgroundColor: AppColors.success,
            duration: Duration(seconds: 3),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );

        // Quay lại màn hình trước
        await Future.delayed(Duration(milliseconds: 500));
        Navigator.pop(context, true);
      } catch (e) {
        // Đóng loading dialog nếu có
        if (Navigator.canPop(context)) {
          Navigator.pop(context);
        }

        _logger.e('❌ ERROR CREATING CONTRACT: $e');
        _logger.e('Stack trace:', error: e);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(Icons.error, color: Colors.white),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Có lỗi xảy ra: ${e.toString()}',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            backgroundColor: AppColors.error,
            duration: Duration(seconds: 4),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalSelected = _getTotalSelectedSlots();

    return Scaffold(
      backgroundColor: context.background,
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            expandedHeight: 180,
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
                          widget.isEditMode
                              ? 'Chỉnh sửa lịch tập'
                              : 'Chọn lịch tập trong tuần',
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
                          'PT: ${widget.ptName}',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.9),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.package.name,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Instructions
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline_rounded,
                    color: AppColors.primary,
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Chọn các khung giờ bạn có thể tập trong tuần. PT sẽ sắp xếp lịch phù hợp với bạn.',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: context.textPrimary,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Days List
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate((context, index) {
                final dayInfo = daysOfWeek[index];
                final dayOfWeek = dayInfo['day'] as int;
                final dayName = dayInfo['name'] as String;
                final userSlots = userTimeSlots[dayOfWeek] ?? [];
                final selectedCount = userSlots.length;
                final isExpanded = expandedDay == dayOfWeek;

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: selectedCount > 0
                          ? AppColors.primary.withOpacity(0.3)
                          : context.border,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      InkWell(
                        onTap: () {
                          setState(() {
                            expandedDay = isExpanded ? null : dayOfWeek;
                          });
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: selectedCount > 0
                                        ? [
                                            AppColors.primary,
                                            AppColors.secondary,
                                          ]
                                        : [
                                            context.textSecondary.withOpacity(
                                              0.2,
                                            ),
                                            context.textSecondary.withOpacity(
                                              0.1,
                                            ),
                                          ],
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Text(
                                    dayInfo['shortName'] as String,
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: selectedCount > 0
                                          ? Colors.white
                                          : context.textSecondary,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      dayName,
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                        color: context.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      selectedCount > 0
                                          ? '$selectedCount khung giờ đã thêm'
                                          : 'Nhấn để thêm khung giờ',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: context.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(
                                isExpanded
                                    ? Icons.expand_less_rounded
                                    : Icons.expand_more_rounded,
                                color: context.textSecondary,
                              ),
                            ],
                          ),
                        ),
                      ),
                      if (isExpanded) ...[
                        Divider(color: context.border, height: 1),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Danh sách khung giờ đã thêm
                              if (userSlots.isNotEmpty) ...[
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: userSlots.map((slot) {
                                    return Container(
                                      padding: EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 8,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.access_time_rounded,
                                            size: 16,
                                            color: Colors.white,
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            slot.timeRange,
                                            style: GoogleFonts.inter(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.white,
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          InkWell(
                                            onTap: () => _removeTimeSlot(
                                              dayOfWeek,
                                              slot.id,
                                            ),
                                            child: Icon(
                                              Icons.close_rounded,
                                              size: 18,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }).toList(),
                                ),
                                const SizedBox(height: 12),
                              ],
                              // Nút thêm khung giờ mới
                              OutlinedButton.icon(
                                onPressed: () => _addTimeSlot(dayOfWeek),
                                icon: Icon(Icons.add_rounded, size: 20),
                                label: Text('Thêm khung giờ'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.primary,
                                  side: BorderSide(
                                    color: AppColors.primary,
                                    width: 1.5,
                                  ),
                                  padding: EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              }, childCount: daysOfWeek.length),
            ),
          ),

          // Bottom Padding
          SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),

      // Bottom Button
      bottomNavigationBar: Container(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 16,
          bottom: MediaQuery.of(context).padding.bottom + 16,
        ),
        decoration: BoxDecoration(
          color: context.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (totalSelected > 0)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.success.withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.check_circle_rounded,
                      color: AppColors.success,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Đã chọn $totalSelected khung giờ',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
              ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: totalSelected > 0 ? _confirmSelection : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: context.textSecondary.withOpacity(
                    0.3,
                  ),
                  padding: EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.check_rounded, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Xác nhận lịch tập',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
