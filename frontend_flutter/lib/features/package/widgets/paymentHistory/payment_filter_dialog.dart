import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../theme/colors.dart';

enum FilterPeriod {
  all,
  today,
  week,
  month,
  threeMonths,
  sixMonths,
  year,
  custom,
}

class PaymentFilterDialog extends StatefulWidget {
  final DateTime? startDate;
  final DateTime? endDate;
  final FilterPeriod selectedPeriod;
  final String? selectedPackageType;
  final List<String> availablePackageTypes;

  const PaymentFilterDialog({
    Key? key,
    this.startDate,
    this.endDate,
    this.selectedPeriod = FilterPeriod.all,
    this.selectedPackageType,
    this.availablePackageTypes = const [],
  }) : super(key: key);

  @override
  State<PaymentFilterDialog> createState() => _PaymentFilterDialogState();
}

class _PaymentFilterDialogState extends State<PaymentFilterDialog> {
  late FilterPeriod _selectedPeriod;
  DateTime? _startDate;
  DateTime? _endDate;
  String? _selectedPackageType;

  @override
  void initState() {
    super.initState();
    _selectedPeriod = widget.selectedPeriod;
    _startDate = widget.startDate;
    _endDate = widget.endDate;
    _selectedPackageType = widget.selectedPackageType;
  }

  void _applyPeriodFilter(FilterPeriod period) {
    setState(() {
      _selectedPeriod = period;
      final now = DateTime.now();

      switch (period) {
        case FilterPeriod.all:
          _startDate = null;
          _endDate = null;
          break;
        case FilterPeriod.today:
          _startDate = DateTime(now.year, now.month, now.day);
          _endDate = DateTime(now.year, now.month, now.day, 23, 59, 59);
          break;
        case FilterPeriod.week:
          _startDate = now.subtract(const Duration(days: 7));
          _endDate = now;
          break;
        case FilterPeriod.month:
          _startDate = DateTime(now.year, now.month, 1);
          _endDate = now;
          break;
        case FilterPeriod.threeMonths:
          _startDate = DateTime(now.year, now.month - 3, now.day);
          _endDate = now;
          break;
        case FilterPeriod.sixMonths:
          _startDate = DateTime(now.year, now.month - 6, now.day);
          _endDate = now;
          break;
        case FilterPeriod.year:
          _startDate = DateTime(now.year, 1, 1);
          _endDate = now;
          break;
        case FilterPeriod.custom:
          // Keep current dates or clear them
          break;
      }
    });
  }

  Future<void> _selectDate(bool isStartDate) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isStartDate
          ? (_startDate ?? DateTime.now())
          : (_endDate ?? DateTime.now()),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isStartDate) {
          _startDate = DateTime(picked.year, picked.month, picked.day);
          _selectedPeriod = FilterPeriod.custom;
        } else {
          _endDate = DateTime(
            picked.year,
            picked.month,
            picked.day,
            23,
            59,
            59,
          );
          _selectedPeriod = FilterPeriod.custom;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final screenHeight = MediaQuery.of(context).size.height;

    return Dialog(
      backgroundColor: isDark ? AppColors.cardDark : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Container(
        constraints: BoxConstraints(
          maxWidth: 400,
          maxHeight: screenHeight * 0.85, // Giới hạn chiều cao
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header - Fixed
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryLight],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.filter_list,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Bộ lọc',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Content - Scrollable
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Quick filters
                    Text(
                      'Khoảng thời gian',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _buildFilterChip('Tất cả', FilterPeriod.all),
                        _buildFilterChip('Hôm nay', FilterPeriod.today),
                        _buildFilterChip('7 ngày', FilterPeriod.week),
                        _buildFilterChip('Tháng này', FilterPeriod.month),
                        _buildFilterChip('3 tháng', FilterPeriod.threeMonths),
                        _buildFilterChip('6 tháng', FilterPeriod.sixMonths),
                        _buildFilterChip('Năm nay', FilterPeriod.year),
                      ],
                    ),

                    const SizedBox(height: 20),
                    const Divider(height: 1),
                    const SizedBox(height: 20),

                    // Package Type Filter
                    if (widget.availablePackageTypes.isNotEmpty) ...[
                      Text(
                        'Loại gói tập',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _buildPackageTypeChip('Tất cả', null, isDark),
                          ...widget.availablePackageTypes.map(
                            (type) => _buildPackageTypeChip(type, type, isDark),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      const Divider(height: 1),
                      const SizedBox(height: 20),
                    ],

                    // Custom date range
                    Text(
                      'Tùy chỉnh',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildDateSelector(
                            'Từ ngày',
                            _startDate,
                            () => _selectDate(true),
                            isDark,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildDateSelector(
                            'Đến ngày',
                            _endDate,
                            () => _selectDate(false),
                            isDark,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Actions - Fixed
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.white.withOpacity(0.05)
                    : Colors.grey.withOpacity(0.05),
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(24),
                  bottomRight: Radius.circular(24),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: BorderSide(color: AppColors.primary, width: 2),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Hủy',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context, {
                          'period': _selectedPeriod,
                          'startDate': _startDate,
                          'endDate': _endDate,
                          'packageType': _selectedPackageType,
                        });
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 2,
                        shadowColor: AppColors.primary.withOpacity(0.4),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Áp dụng',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, FilterPeriod period) {
    final isSelected = _selectedPeriod == period;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : AppColors.primary,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          fontSize: 13,
        ),
      ),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          _applyPeriodFilter(period);
        }
      },
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.primary.withOpacity(0.1),
      side: BorderSide(
        color: isSelected
            ? AppColors.primary
            : AppColors.primary.withOpacity(0.3),
        width: isSelected ? 2 : 1,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    );
  }

  Widget _buildDateSelector(
    String label,
    DateTime? date,
    VoidCallback onTap,
    bool isDark,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDark
              ? Colors.white.withOpacity(0.05)
              : AppColors.primary.withOpacity(0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.primary.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: isDark ? Colors.white70 : Colors.black54,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(Icons.calendar_today, size: 14, color: AppColors.primary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    date != null
                        ? DateFormat('dd/MM/yyyy').format(date)
                        : 'Chọn ngày',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black87,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPackageTypeChip(String label, String? value, bool isDark) {
    final isSelected = _selectedPackageType == value;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : AppColors.primary,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          fontSize: 13,
        ),
        overflow: TextOverflow.ellipsis,
        maxLines: 1,
      ),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedPackageType = value;
          });
        }
      },
      selectedColor: AppColors.primary,
      backgroundColor: AppColors.primary.withOpacity(0.1),
      side: BorderSide(
        color: isSelected
            ? AppColors.primary
            : AppColors.primary.withOpacity(0.3),
        width: isSelected ? 2 : 1,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    );
  }
}
