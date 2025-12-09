import 'package:flutter/material.dart';
import '../../../theme/colors.dart';

class TimeSlotManagerWidget extends StatefulWidget {
  final List<Map<String, dynamic>> availableTimeSlots;
  final Function(List<Map<String, dynamic>>) onTimeSlotsChange;
  final int sessionDuration;

  const TimeSlotManagerWidget({
    Key? key,
    required this.availableTimeSlots,
    required this.onTimeSlotsChange,
    this.sessionDuration = 60,
  }) : super(key: key);

  @override
  State<TimeSlotManagerWidget> createState() => _TimeSlotManagerWidgetState();
}

class _TimeSlotManagerWidgetState extends State<TimeSlotManagerWidget> {
  late List<DaySlot> _regularSlots;

  static const List<Map<String, String>> DAYS_OF_WEEK = [
    {'value': 'monday', 'label': 'Thứ 2', 'abbr': '2'},
    {'value': 'tuesday', 'label': 'Thứ 3', 'abbr': '3'},
    {'value': 'wednesday', 'label': 'Thứ 4', 'abbr': '4'},
    {'value': 'thursday', 'label': 'Thứ 5', 'abbr': '5'},
    {'value': 'friday', 'label': 'Thứ 6', 'abbr': '6'},
    {'value': 'saturday', 'label': 'Thứ 7', 'abbr': '7'},
    {'value': 'sunday', 'label': 'Chủ nhật', 'abbr': 'CN'},
  ];

  static const List<Map<String, dynamic>> FIXED_TIME_SLOTS = [
    {
      'id': 'slot1',
      'startTime': '06:00',
      'endTime': '08:00',
      'duration': 120,
      'label': '6:00 - 8:00 (2h)',
    },
    {
      'id': 'slot2',
      'startTime': '08:00',
      'endTime': '10:00',
      'duration': 120,
      'label': '8:00 - 10:00 (2h)',
    },
    {
      'id': 'slot3',
      'startTime': '10:00',
      'endTime': '12:00',
      'duration': 120,
      'label': '10:00 - 12:00 (2h)',
    },
    {
      'id': 'slot4',
      'startTime': '12:00',
      'endTime': '14:00',
      'duration': 120,
      'label': '12:00 - 14:00 (2h)',
    },
    {
      'id': 'slot5',
      'startTime': '14:00',
      'endTime': '16:00',
      'duration': 120,
      'label': '14:00 - 16:00 (2h)',
    },
    {
      'id': 'slot6',
      'startTime': '16:00',
      'endTime': '18:00',
      'duration': 120,
      'label': '16:00 - 18:00 (2h)',
    },
    {
      'id': 'slot7',
      'startTime': '18:00',
      'endTime': '20:00',
      'duration': 120,
      'label': '18:00 - 20:00 (2h)',
    },
    {
      'id': 'slot8',
      'startTime': '20:00',
      'endTime': '22:00',
      'duration': 120,
      'label': '20:00 - 22:00 (2h)',
    },
  ];

  @override
  void initState() {
    super.initState();
    _initializeFromProps();
  }

  void _initializeFromProps() {
    // Convert availableTimeSlots to DaySlot format
    final Map<String, List<FixedSlot>> groupedByDay = {};

    for (var slot in widget.availableTimeSlots) {
      final dayOfWeek = slot['dayOfWeek'] as int;
      final dayName = _getDayNameFromNumber(dayOfWeek);

      final fixedSlot = FixedSlot(
        id: _getSlotIdFromTime(slot['startTime']),
        startTime: slot['startTime'],
        endTime: slot['endTime'],
        duration: 120,
      );

      if (!groupedByDay.containsKey(dayName)) {
        groupedByDay[dayName] = [];
      }
      groupedByDay[dayName]!.add(fixedSlot);
    }

    _regularSlots = groupedByDay.entries
        .map((e) => DaySlot(day: e.key, fixedSlots: e.value))
        .toList();
  }

  String _getDayNameFromNumber(int dayOfWeek) {
    const dayMap = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    return dayMap[dayOfWeek] ?? 'monday';
  }

  String _getSlotIdFromTime(String startTime) {
    final slotMap = {
      '06:00': 'slot1',
      '08:00': 'slot2',
      '10:00': 'slot3',
      '12:00': 'slot4',
      '14:00': 'slot5',
      '16:00': 'slot6',
      '18:00': 'slot7',
      '20:00': 'slot8',
    };
    return slotMap[startTime] ?? 'slot1';
  }

  void _handleFixedSlotToggle(String day, Map<String, dynamic> fixedSlotData) {
    setState(() {
      final daySlotIndex = _regularSlots.indexWhere((s) => s.day == day);

      if (daySlotIndex != -1) {
        final daySlot = _regularSlots[daySlotIndex];
        final slotExists = daySlot.fixedSlots.any(
          (s) => s.id == fixedSlotData['id'],
        );

        if (slotExists) {
          // Remove slot
          final newFixedSlots = daySlot.fixedSlots
              .where((s) => s.id != fixedSlotData['id'])
              .toList();

          if (newFixedSlots.isEmpty) {
            _regularSlots.removeAt(daySlotIndex);
          } else {
            _regularSlots[daySlotIndex] = DaySlot(
              day: day,
              fixedSlots: newFixedSlots,
            );
          }
        } else {
          // Add slot
          _regularSlots[daySlotIndex] = DaySlot(
            day: day,
            fixedSlots: [
              ...daySlot.fixedSlots,
              FixedSlot(
                id: fixedSlotData['id'],
                startTime: fixedSlotData['startTime'],
                endTime: fixedSlotData['endTime'],
                duration: fixedSlotData['duration'],
              ),
            ],
          );
        }
      } else {
        // Create new day slot
        _regularSlots.add(
          DaySlot(
            day: day,
            fixedSlots: [
              FixedSlot(
                id: fixedSlotData['id'],
                startTime: fixedSlotData['startTime'],
                endTime: fixedSlotData['endTime'],
                duration: fixedSlotData['duration'],
              ),
            ],
          ),
        );
      }
    });

    _notifyParent();
  }

  bool _isFixedSlotSelected(String day, String fixedSlotId) {
    final daySlot = _regularSlots.firstWhere(
      (s) => s.day == day,
      orElse: () => DaySlot(day: '', fixedSlots: []),
    );
    return daySlot.fixedSlots.any((s) => s.id == fixedSlotId);
  }

  void _notifyParent() {
    final convertedSlots = _convertToModelFormat();
    widget.onTimeSlotsChange(convertedSlots);
  }

  List<Map<String, dynamic>> _convertToModelFormat() {
    final modelSlots = <Map<String, dynamic>>[];

    const dayMap = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
    };

    for (var daySlot in _regularSlots) {
      for (var fixedSlot in daySlot.fixedSlots) {
        modelSlots.add({
          'id': '${daySlot.day}_${fixedSlot.id}',
          'dayOfWeek': dayMap[daySlot.day] ?? 1,
          'startTime': fixedSlot.startTime,
          'endTime': fixedSlot.endTime,
          'isActive': true,
          'isChoosen': false,
          'note': 'Khung cố định ${fixedSlot.duration} phút',
        });
      }
    }

    return modelSlots;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final totalSlots = _regularSlots.fold<int>(
      0,
      (sum, day) => sum + day.fixedSlots.length,
    );

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : AppColors.cardLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark
              ? AppColors.textSecondaryDark.withOpacity(0.2)
              : AppColors.textSecondaryLight.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Icon(Icons.access_time, color: AppColors.primary, size: 24),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Khung giờ hàng tuần cố định',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? AppColors.textPrimaryDark
                            : AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Chọn các khung giờ mà bạn có thể dạy hàng tuần',
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
          const SizedBox(height: 16),

          // Fixed slots grid
          ...FIXED_TIME_SLOTS.map((fixedSlot) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Slot info
                  Text(
                    fixedSlot['label'],
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Days row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: DAYS_OF_WEEK.map((day) {
                      final isSelected = _isFixedSlotSelected(
                        day['value']!,
                        fixedSlot['id'],
                      );
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2),
                          child: InkWell(
                            onTap: () => _handleFixedSlotToggle(
                              day['value']!,
                              fixedSlot,
                            ),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              height: 44,
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.primary
                                    : (isDark
                                          ? AppColors.backgroundDark
                                          : AppColors.backgroundLight),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isSelected
                                      ? AppColors.primary
                                      : (isDark
                                            ? AppColors.textSecondaryDark
                                                  .withOpacity(0.3)
                                            : AppColors.textSecondaryLight
                                                  .withOpacity(0.3)),
                                  width: 1,
                                ),
                              ),
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  Text(
                                    day['abbr']!,
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: isSelected
                                          ? Colors.white
                                          : (isDark
                                                ? AppColors.textPrimaryDark
                                                : AppColors.textPrimaryLight),
                                    ),
                                  ),
                                  if (isSelected)
                                    Positioned(
                                      top: 4,
                                      right: 4,
                                      child: Icon(
                                        Icons.check_circle,
                                        size: 14,
                                        color: Colors.white,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            );
          }),

          const SizedBox(height: 16),

          // Summary
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    Text(
                      '$totalSlots',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                    Text(
                      'Khung giờ cố định',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
                Container(
                  width: 1,
                  height: 40,
                  color: isDark
                      ? AppColors.textSecondaryDark.withOpacity(0.2)
                      : AppColors.textSecondaryLight.withOpacity(0.2),
                ),
                Column(
                  children: [
                    Text(
                      '${widget.sessionDuration}',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                    Text(
                      'Phút/buổi',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark
                            ? AppColors.textSecondaryDark
                            : AppColors.textSecondaryLight,
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

class DaySlot {
  final String day;
  final List<FixedSlot> fixedSlots;

  DaySlot({required this.day, required this.fixedSlots});
}

class FixedSlot {
  final String id;
  final String startTime;
  final String endTime;
  final int duration;

  FixedSlot({
    required this.id,
    required this.startTime,
    required this.endTime,
    required this.duration,
  });
}
