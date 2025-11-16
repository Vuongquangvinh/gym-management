import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../../model/contract.mode.dart';
import '../../model/ptPackage.mode.dart';
import '../services/contract_schedule_service.dart';
import 'edit_time_slot_dialog.dart';
import '../../../theme/colors.dart';

final _logger = Logger();

/// Widget hiển thị lịch tập hàng tuần với khả năng chỉnh sửa
class EditableWeeklyScheduleWidget extends StatefulWidget {
  final ContractModel contract;
  final PTPackageModel package;
  final Function() onScheduleUpdated;

  const EditableWeeklyScheduleWidget({
    Key? key,
    required this.contract,
    required this.package,
    required this.onScheduleUpdated,
  }) : super(key: key);

  @override
  State<EditableWeeklyScheduleWidget> createState() =>
      _EditableWeeklyScheduleWidgetState();
}

class _EditableWeeklyScheduleWidgetState
    extends State<EditableWeeklyScheduleWidget> {
  final _service = ContractScheduleService();
  bool _isLoading = true;
  Map<int, List<TimeSlotWithStatus>>? _slotsByDay;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAvailableSlots();
  }

  /// Load tất cả available slots và trạng thái của chúng
  Future<void> _loadAvailableSlots() async {
    _logger.i('🔄 Đang load available slots...');

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Lấy slots với status
      final slotsWithStatus = await _service.getAvailableTimeSlotsWithStatus(
        package: widget.package,
        ptId: widget.contract.ptId,
        currentContractId: widget.contract.id,
      );

      _logger.i('✅ Load slots thành công: ${slotsWithStatus.length} slots');

      // Nhóm theo ngày
      final slotsByDay = _service.groupSlotsByDay(slotsWithStatus);

      _logger.i('📊 Đã nhóm slots theo ${slotsByDay.length} ngày');

      setState(() {
        _slotsByDay = slotsByDay;
        _isLoading = false;
      });
    } catch (e, stackTrace) {
      _logger.e('❌ Lỗi khi load slots', error: e, stackTrace: stackTrace);

      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isLoading) {
      return _buildLoadingState();
    }

    if (_error != null) {
      return _buildErrorState(isDark);
    }

    if (_slotsByDay == null || _slotsByDay!.isEmpty) {
      return _buildEmptyState(isDark);
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Icon(Icons.calendar_month, color: AppColors.primary, size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Lịch tập hàng tuần',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                  ),
                ),
              ),
              IconButton(
                onPressed: _loadAvailableSlots,
                icon: const Icon(Icons.refresh),
                tooltip: 'Tải lại',
                color: AppColors.primary,
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Schedule list
          ...widget.contract.weeklySchedule.schedule.entries.map((entry) {
            final dayOfWeek = entry.key;
            final timeSlot = entry.value;
            final availableSlotsForDay = _slotsByDay![dayOfWeek] ?? [];

            return _buildDaySlot(
              dayOfWeek: dayOfWeek,
              timeSlot: timeSlot,
              availableSlots: availableSlotsForDay,
              isDark: isDark,
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(32),
      child: const Center(child: CircularProgressIndicator()),
    );
  }

  Widget _buildErrorState(bool isDark) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(Icons.error_outline, size: 48, color: AppColors.error),
          const SizedBox(height: 12),
          Text(
            'Không thể tải danh sách khung giờ',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _error ?? 'Lỗi không xác định',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _loadAvailableSlots,
            icon: const Icon(Icons.refresh),
            label: const Text('Thử lại'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(
            Icons.calendar_today_outlined,
            size: 64,
            color: isDark
                ? AppColors.textSecondaryDark.withOpacity(0.5)
                : AppColors.textSecondaryLight.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'Chưa có lịch tập',
            style: TextStyle(
              fontSize: 16,
              color: isDark
                  ? AppColors.textSecondaryDark
                  : AppColors.textSecondaryLight,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDaySlot({
    required int dayOfWeek,
    required SelectedTimeSlot timeSlot,
    required List<TimeSlotWithStatus> availableSlots,
    required bool isDark,
  }) {
    // Kiểm tra xem slot hiện tại có trong available slots không
    final currentSlotInList = availableSlots.any(
      (s) => s.slot.id == timeSlot.timeSlotId,
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        ),
      ),
      child: Row(
        children: [
          // Day name
          SizedBox(
            width: 80,
            child: Text(
              _getDayName(dayOfWeek),
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Time info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.access_time,
                      size: 16,
                      color: isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${timeSlot.startTime} - ${timeSlot.endTime}',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                      ),
                    ),
                  ],
                ),
                if (timeSlot.note.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    timeSlot.note,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight,
                    ),
                  ),
                ],
                if (!currentSlotInList) ...[
                  const SizedBox(height: 4),
                  Text(
                    '⚠️ Khung giờ này không còn khả dụng',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.warning,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),

          // Edit button
          IconButton(
            onPressed: availableSlots.isEmpty
                ? null
                : () => _showEditDialog(
                    context,
                    dayOfWeek: dayOfWeek,
                    currentTimeSlotId: timeSlot.timeSlotId,
                    availableSlots: availableSlots,
                  ),
            icon: const Icon(Icons.edit),
            color: AppColors.primary,
            tooltip: 'Chỉnh sửa',
          ),
        ],
      ),
    );
  }

  String _getDayName(int dayOfWeek) {
    switch (dayOfWeek) {
      case 0: // Sunday (JS/Dart convention)
      case 7: // Sunday (alternative convention)
        return 'Chủ nhật';
      case 1:
        return 'Thứ 2';
      case 2:
        return 'Thứ 3';
      case 3:
        return 'Thứ 4';
      case 4:
        return 'Thứ 5';
      case 5:
        return 'Thứ 6';
      case 6:
        return 'Thứ 7';
      default:
        return 'N/A';
    }
  }

  void _showEditDialog(
    BuildContext context, {
    required int dayOfWeek,
    required String currentTimeSlotId,
    required List<TimeSlotWithStatus> availableSlots,
  }) {
    _logger.i('📝 Mở dialog chỉnh sửa khung giờ');
    _logger.d('Day: $dayOfWeek, Current Slot: $currentTimeSlotId');

    showDialog(
      context: context,
      builder: (context) => EditTimeSlotDialog(
        contractId: widget.contract.id,
        dayOfWeek: dayOfWeek,
        currentTimeSlotId: currentTimeSlotId,
        availableSlots: availableSlots,
        onUpdated: () {
          // Reload slots sau khi update
          _loadAvailableSlots();

          // Gọi callback từ parent
          widget.onScheduleUpdated();
        },
      ),
    );
  }
}
