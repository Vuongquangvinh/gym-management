import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/pt_schedule_service.dart';

/// Weekly Date Picker for PT Schedule
/// Simplified version - no need to pass all week calculation functions
class PTWeeklyDatePicker extends StatelessWidget {
  final DateTime selectedDate;
  final Function(DateTime) onDateChange;

  const PTWeeklyDatePicker({
    super.key,
    required this.selectedDate,
    required this.onDateChange,
  });

  void _goToPreviousWeek() {
    final newDate = DateTime(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day - 7,
    );
    onDateChange(newDate);
  }

  void _goToNextWeek() {
    final newDate = DateTime(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day + 7,
    );
    onDateChange(newDate);
  }

  void _goToCurrentWeek() {
    onDateChange(DateTime.now());
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  bool _isSelected(DateTime date) {
    return date.year == selectedDate.year &&
        date.month == selectedDate.month &&
        date.day == selectedDate.day;
  }

  String _formatDayName(DateTime date) {
    final weekday = date.weekday;
    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    return dayNames[weekday - 1];
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Calculate week days
    final startOfWeek = PTScheduleService.getStartOfWeek(selectedDate);
    final weekDays = PTScheduleService.getWeekDays(startOfWeek);

    final endOfWeek = weekDays.last;

    return Card(
      margin: const EdgeInsets.all(16),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Navigation header
            Row(
              children: [
                // Previous week button
                IconButton(
                  onPressed: _goToPreviousWeek,
                  icon: const Icon(Icons.chevron_left),
                  tooltip: 'Tuần trước',
                ),

                // Week info
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        'Tuần ${startOfWeek.day}/${startOfWeek.month} - ${endOfWeek.day}/${endOfWeek.month}/${endOfWeek.year}',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 4),
                      TextButton.icon(
                        onPressed: _goToCurrentWeek,
                        icon: const Icon(Icons.calendar_today, size: 16),
                        label: const Text('Hôm nay'),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Next week button
                IconButton(
                  onPressed: _goToNextWeek,
                  icon: const Icon(Icons.chevron_right),
                  tooltip: 'Tuần sau',
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Week days
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: weekDays.map((day) {
                final isToday = _isToday(day);
                final isSelected = _isSelected(day);

                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: InkWell(
                      onTap: () => onDateChange(day),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? theme.colorScheme.primary
                              : isToday
                              ? theme.colorScheme.primary.withOpacity(0.1)
                              : null,
                          borderRadius: BorderRadius.circular(12),
                          border: isToday && !isSelected
                              ? Border.all(
                                  color: theme.colorScheme.primary,
                                  width: 2,
                                )
                              : null,
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              _formatDayName(day),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: isSelected
                                    ? Colors.white
                                    : isToday
                                    ? theme.colorScheme.primary
                                    : theme.textTheme.bodySmall?.color,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              DateFormat('dd/MM').format(day),
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: isSelected
                                    ? Colors.white
                                    : isToday
                                    ? theme.colorScheme.primary
                                    : theme.textTheme.bodyLarge?.color,
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
      ),
    );
  }
}
