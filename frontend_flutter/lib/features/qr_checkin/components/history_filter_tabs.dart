import 'package:flutter/material.dart';
import '../../../theme/colors.dart';

class HistoryFilterTabs extends StatelessWidget {
  final String selectedFilter;
  final Function(String) onFilterChanged;

  const HistoryFilterTabs({
    super.key,
    required this.selectedFilter,
    required this.onFilterChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          _buildFilterChip(label: 'All', value: 'all', isDark: isDark),
          const SizedBox(width: 8),
          _buildFilterChip(label: 'Today', value: 'today', isDark: isDark),
          const SizedBox(width: 8),
          _buildFilterChip(label: 'This Week', value: 'week', isDark: isDark),
          const SizedBox(width: 8),
          _buildFilterChip(label: 'This Month', value: 'month', isDark: isDark),
        ],
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required String value,
    required bool isDark,
  }) {
    final isSelected = selectedFilter == value;

    return Expanded(
      child: GestureDetector(
        onTap: () => onFilterChanged(value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primary
                : (isDark ? AppColors.surfaceDark : AppColors.surfaceLight)
                      .withOpacity(0.5),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected
                  ? AppColors.primary
                  : AppColors.primary.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              color: isSelected
                  ? Colors.white
                  : (isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight),
            ),
          ),
        ),
      ),
    );
  }
}
