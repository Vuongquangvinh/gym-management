import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import '../services/contract_schedule_service.dart';
import '../../../theme/colors.dart';
import '../../../services/pt_schedule_notification_service.dart';

final _logger = Logger();

/// Dialog để chỉnh sửa time slot cho 1 ngày cụ thể
class EditTimeSlotDialog extends StatefulWidget {
  final String contractId;
  final int dayOfWeek;
  final String currentTimeSlotId;
  final List<TimeSlotWithStatus> availableSlots;
  final Function() onUpdated;

  const EditTimeSlotDialog({
    Key? key,
    required this.contractId,
    required this.dayOfWeek,
    required this.currentTimeSlotId,
    required this.availableSlots,
    required this.onUpdated,
  }) : super(key: key);

  @override
  State<EditTimeSlotDialog> createState() => _EditTimeSlotDialogState();
}

class _EditTimeSlotDialogState extends State<EditTimeSlotDialog> {
  final _service = ContractScheduleService();
  String? _selectedSlotId;
  bool _isUpdating = false;

  @override
  void initState() {
    super.initState();
    _selectedSlotId = widget.currentTimeSlotId;
    _logger.i('📝 Mở dialog edit time slot');
    _logger.d('Day of Week: ${widget.dayOfWeek}');
    _logger.d('Current Time Slot: ${widget.currentTimeSlotId}');
    _logger.d('Available Slots: ${widget.availableSlots.length}');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Dialog(
      backgroundColor: isDark ? AppColors.cardDark : AppColors.cardLight,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title
            Row(
              children: [
                Icon(Icons.edit_calendar, color: AppColors.primary, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Chỉnh sửa khung giờ tập',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              _getDayName(widget.dayOfWeek),
              style: TextStyle(
                fontSize: 16,
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight,
              ),
            ),
            const Divider(height: 24),

            // List of available slots
            if (widget.availableSlots.isEmpty)
              _buildEmptyState(isDark)
            else
              ..._buildSlotsList(isDark),

            const SizedBox(height: 20),

            // Action buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: _isUpdating ? null : () => Navigator.pop(context),
                  child: Text(
                    'Hủy',
                    style: TextStyle(
                      color: isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed:
                      _isUpdating || _selectedSlotId == widget.currentTimeSlotId
                      ? null
                      : _handleUpdate,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isUpdating
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
                      : const Text('Cập nhật'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
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
              'Không có khung giờ khả dụng',
              style: TextStyle(
                fontSize: 16,
                color: isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight,
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildSlotsList(bool isDark) {
    return widget.availableSlots.map((slotWithStatus) {
      final slot = slotWithStatus.slot;
      final isBooked = slotWithStatus.isBooked;
      final isSelected = _selectedSlotId == slot.id;
      final isCurrent = widget.currentTimeSlotId == slot.id;

      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: InkWell(
          onTap: isBooked
              ? null
              : () {
                  setState(() {
                    _selectedSlotId = slot.id;
                  });
                  _logger.d('Chọn slot: ${slot.id}');
                },
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primary.withOpacity(0.1)
                  : (isDark ? AppColors.surfaceDark : AppColors.surfaceLight),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected
                    ? AppColors.primary
                    : (isDark ? AppColors.surfaceDark : AppColors.surfaceLight),
                width: 2,
              ),
            ),
            child: Row(
              children: [
                // Radio button
                Radio<String>(
                  value: slot.id,
                  groupValue: _selectedSlotId,
                  onChanged: isBooked
                      ? null
                      : (value) {
                          setState(() {
                            _selectedSlotId = value;
                          });
                          _logger.d('Chọn slot: $value');
                        },
                  activeColor: AppColors.primary,
                ),
                const SizedBox(width: 8),

                // Time info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 18,
                            color: isBooked
                                ? (isDark
                                      ? AppColors.textSecondaryDark
                                      : AppColors.textSecondaryLight)
                                : AppColors.primary,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '${slot.startTime} - ${slot.endTime}',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: isBooked
                                  ? (isDark
                                        ? AppColors.textSecondaryDark
                                        : AppColors.textSecondaryLight)
                                  : (isDark
                                        ? AppColors.textPrimaryDark
                                        : AppColors.textPrimaryLight),
                              decoration: isBooked
                                  ? TextDecoration.lineThrough
                                  : null,
                            ),
                          ),
                        ],
                      ),
                      if (slot.note.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          slot.note,
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark
                                ? AppColors.textSecondaryDark
                                : AppColors.textSecondaryLight,
                          ),
                        ),
                      ],
                      if (isCurrent) ...[
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.info.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'Đang tập',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppColors.info,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                // Status badge
                if (isBooked)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.block, size: 14, color: AppColors.error),
                        const SizedBox(width: 4),
                        Text(
                          'Đã đầy',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.error,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
    }).toList();
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

  Future<void> _handleUpdate() async {
    if (_selectedSlotId == null ||
        _selectedSlotId == widget.currentTimeSlotId) {
      return;
    }

    setState(() {
      _isUpdating = true;
    });

    _logger.i('🔄 Bắt đầu update time slot...');
    _logger.d('Contract ID: ${widget.contractId}');
    _logger.d('Day of Week: ${widget.dayOfWeek}');
    _logger.d('New Slot ID: $_selectedSlotId');

    try {
      // Tìm slot được chọn
      final selectedSlotWithStatus = widget.availableSlots.firstWhere(
        (s) => s.slot.id == _selectedSlotId,
      );

      // Gọi service để update
      final success = await _service.updateTimeSlotForDay(
        contractId: widget.contractId,
        dayOfWeek: widget.dayOfWeek,
        newTimeSlot: selectedSlotWithStatus.slot,
      );

      if (!mounted) return;

      if (success) {
        _logger.i('✅ Update thành công!');

        // Lên lịch lại thông báo sau khi cập nhật
        await PTScheduleNotificationService().scheduleAllWorkoutNotifications();

        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 12),
                Text('Cập nhật lịch tập thành công!'),
              ],
            ),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );

        // Gọi callback
        widget.onUpdated();

        // Đóng dialog
        Navigator.pop(context);
      } else {
        _logger.e('❌ Update thất bại');

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.error, color: Colors.white),
                SizedBox(width: 12),
                Text('Cập nhật thất bại! Vui lòng thử lại.'),
              ],
            ),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e, stackTrace) {
      _logger.e('❌ Lỗi khi update', error: e, stackTrace: stackTrace);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(child: Text('Lỗi: $e')),
            ],
          ),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isUpdating = false;
        });
      }
    }
  }
}
