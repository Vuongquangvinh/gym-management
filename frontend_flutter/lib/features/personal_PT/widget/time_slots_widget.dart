import 'package:flutter/material.dart';
import '../../model/contract.mode.dart';
import '../../../theme/colors.dart';

/// Widget hiển thị các khung giờ tập đã chọn
class TimeSlotsWidget extends StatelessWidget {
  final List<SelectedTimeSlot> timeSlots;
  final VoidCallback? onEdit;
  final bool canEdit;

  const TimeSlotsWidget({
    Key? key,
    required this.timeSlots,
    this.onEdit,
    this.canEdit = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Nhóm time slots theo ngày trong tuần
    final groupedSlots = <int, List<SelectedTimeSlot>>{};
    for (var slot in timeSlots) {
      if (!groupedSlots.containsKey(slot.dayOfWeek)) {
        groupedSlots[slot.dayOfWeek] = [];
      }
      groupedSlots[slot.dayOfWeek]!.add(slot);
    }

    // Sắp xếp theo ngày
    final sortedDays = groupedSlots.keys.toList()..sort();

    return Container(
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
          Row(
            children: [
              Icon(Icons.schedule, size: 24, color: AppColors.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Thời gian bạn đăng ký',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight,
                  ),
                ),
              ),
              if (canEdit && onEdit != null)
                IconButton(
                  onPressed: onEdit,
                  icon: Icon(Icons.edit, color: AppColors.primary),
                  tooltip: 'Chỉnh sửa lịch tập',
                ),
            ],
          ),
          const SizedBox(height: 16),
          ...sortedDays.map((dayOfWeek) {
            final slots = groupedSlots[dayOfWeek]!;
            return _buildDaySection(context, dayOfWeek, slots);
          }),
        ],
      ),
    );
  }

  Widget _buildDaySection(
    BuildContext context,
    int dayOfWeek,
    List<SelectedTimeSlot> slots,
  ) {
    final dayName = _getDayName(dayOfWeek);
    final dayColor = _getDayColor(dayOfWeek);

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Ngày trong tuần
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: dayColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: dayColor, width: 1),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.calendar_today, size: 14, color: dayColor),
                const SizedBox(width: 6),
                Text(
                  dayName,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: dayColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Các khung giờ trong ngày
          ...slots.map((slot) => _buildTimeSlotCard(context, slot, dayColor)),
        ],
      ),
    );
  }

  Widget _buildTimeSlotCard(
    BuildContext context,
    SelectedTimeSlot slot,
    Color dayColor,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark
            ? AppColors.borderDark.withOpacity(0.3)
            : dayColor.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isDark ? AppColors.borderDark : dayColor.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: dayColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.access_time, size: 20, color: dayColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${slot.startTime} - ${slot.endTime}',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _calculateDuration(slot.startTime, slot.endTime),
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (slot.note.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.note_outlined,
                  size: 14,
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    slot.note,
                    style: TextStyle(
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                      color: isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _getDayName(int dayOfWeek) {
    switch (dayOfWeek) {
      case 0:
        return 'Chủ nhật';
      case 1:
        return 'Thứ hai';
      case 2:
        return 'Thứ ba';
      case 3:
        return 'Thứ tư';
      case 4:
        return 'Thứ năm';
      case 5:
        return 'Thứ sáu';
      case 6:
        return 'Thứ bảy';
      default:
        return 'N/A';
    }
  }

  Color _getDayColor(int dayOfWeek) {
    switch (dayOfWeek) {
      case 0:
        return AppColors.error; // Chủ nhật - màu đỏ
      case 1:
        return AppColors.primary; // Thứ 2 - xanh dương
      case 2:
        return AppColors.success; // Thứ 3 - xanh lá
      case 3:
        return AppColors.warning; // Thứ 4 - vàng
      case 4:
        return AppColors.secondary; // Thứ 5 - hồng
      case 5:
        return AppColors.accent; // Thứ 6 - xanh lá nhạt
      case 6:
        return AppColors.info; // Thứ 7 - xanh nhạt
      default:
        return AppColors.textSecondaryLight;
    }
  }

  String _calculateDuration(String startTime, String endTime) {
    try {
      final start = _parseTime(startTime);
      final end = _parseTime(endTime);
      final duration = end.difference(start);
      final minutes = duration.inMinutes;
      if (minutes >= 60) {
        final hours = minutes ~/ 60;
        final mins = minutes % 60;
        return mins > 0 ? '$hours giờ $mins phút' : '$hours giờ';
      }
      return '$minutes phút';
    } catch (e) {
      return '';
    }
  }

  DateTime _parseTime(String time) {
    final parts = time.split(':');
    final hour = int.parse(parts[0]);
    final minute = int.parse(parts[1]);
    return DateTime(2000, 1, 1, hour, minute);
  }
}
