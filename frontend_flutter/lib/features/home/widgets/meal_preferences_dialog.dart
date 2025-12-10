import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:frontend_flutter/features/model/meal_plan.dart';

class MealPreferencesDialog extends StatefulWidget {
  const MealPreferencesDialog({Key? key}) : super(key: key);

  @override
  State<MealPreferencesDialog> createState() => _MealPreferencesDialogState();
}

class _MealPreferencesDialogState extends State<MealPreferencesDialog> {
  bool _isVegetarian = false;
  bool _isEatClean = false;
  bool _isLowCarb = false;
  String _cuisine = 'vietnamese';
  int _mealsPerDay = 3;
  final List<String> _avoidFoods = [];
  final TextEditingController _avoidController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxHeight: 600),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.orange[700]!, Colors.orange[500]!],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.tune, color: Colors.white, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Tùy chỉnh thực đơn',
                      style: GoogleFonts.inter(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            // Body
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Chế độ ăn
                    Text(
                      'Chế độ ăn',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    CheckboxListTile(
                      title: Text(
                        'Chay',
                        style: GoogleFonts.inter(fontSize: 14),
                      ),
                      subtitle: Text(
                        'Không có thịt, cá',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: Colors.grey[600],
                        ),
                      ),
                      value: _isVegetarian,
                      onChanged: (value) {
                        setState(() {
                          _isVegetarian = value ?? false;
                        });
                      },
                      activeColor: Colors.green,
                      contentPadding: EdgeInsets.zero,
                    ),
                    CheckboxListTile(
                      title: Text(
                        'Eat Clean',
                        style: GoogleFonts.inter(fontSize: 14),
                      ),
                      subtitle: Text(
                        'Ít dầu mỡ, thực phẩm tự nhiên',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: Colors.grey[600],
                        ),
                      ),
                      value: _isEatClean,
                      onChanged: (value) {
                        setState(() {
                          _isEatClean = value ?? false;
                        });
                      },
                      activeColor: Colors.blue,
                      contentPadding: EdgeInsets.zero,
                    ),
                    CheckboxListTile(
                      title: Text(
                        'Ít Carbs',
                        style: GoogleFonts.inter(fontSize: 14),
                      ),
                      subtitle: Text(
                        'Tăng protein & fat, giảm carbs',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: Colors.grey[600],
                        ),
                      ),
                      value: _isLowCarb,
                      onChanged: (value) {
                        setState(() {
                          _isLowCarb = value ?? false;
                        });
                      },
                      activeColor: Colors.orange,
                      contentPadding: EdgeInsets.zero,
                    ),

                    const Divider(height: 30),

                    // Loại món
                    Text(
                      'Loại món ăn',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _buildCuisineChip(
                          'vietnamese',
                          'Món Việt',
                          Icons.ramen_dining,
                        ),
                        _buildCuisineChip('asian', 'Món Á', Icons.restaurant),
                        _buildCuisineChip('western', 'Món Âu', Icons.fastfood),
                        _buildCuisineChip('mixed', 'Hỗn hợp', Icons.public),
                      ],
                    ),

                    const Divider(height: 30),

                    // Số bữa/ngày
                    Text(
                      'Số bữa mỗi ngày',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildMealsOption(
                            value: 3,
                            label: '3 bữa',
                            subtitle: 'Sáng - Trưa - Tối',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildMealsOption(
                            value: 4,
                            label: '4 bữa',
                            subtitle: '+ Bữa phụ',
                          ),
                        ),
                      ],
                    ),

                    const Divider(height: 30),

                    // Thực phẩm tránh
                    Text(
                      'Thực phẩm muốn tránh (tùy chọn)',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _avoidController,
                            decoration: InputDecoration(
                              hintText: 'VD: tôm, cua, sữa...',
                              hintStyle: GoogleFonts.inter(fontSize: 13),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 10,
                              ),
                            ),
                            style: GoogleFonts.inter(fontSize: 13),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(Icons.add_circle),
                          color: Colors.orange[700],
                          onPressed: () {
                            if (_avoidController.text.isNotEmpty) {
                              setState(() {
                                _avoidFoods.add(_avoidController.text);
                                _avoidController.clear();
                              });
                            }
                          },
                        ),
                      ],
                    ),
                    if (_avoidFoods.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: _avoidFoods.map((food) {
                          return Chip(
                            label: Text(
                              food,
                              style: GoogleFonts.inter(fontSize: 12),
                            ),
                            deleteIcon: const Icon(Icons.close, size: 16),
                            onDeleted: () {
                              setState(() {
                                _avoidFoods.remove(food);
                              });
                            },
                            backgroundColor: Colors.grey[200],
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Footer
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: BorderSide(color: Colors.grey[400]!),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: Text(
                        'Hủy',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey[700],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        final preferences = MealPlanPreferences(
                          isVegetarian: _isVegetarian,
                          isEatClean: _isEatClean,
                          isLowCarb: _isLowCarb,
                          cuisine: _cuisine,
                          avoidFoods: _avoidFoods,
                          mealsPerDay: _mealsPerDay,
                        );
                        Navigator.pop(context, preferences);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange[700],
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: Text(
                        'Xác nhận',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
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

  Widget _buildCuisineChip(String value, String label, IconData icon) {
    final isSelected = _cuisine == value;
    return FilterChip(
      selected: isSelected,
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: isSelected ? Colors.white : Colors.grey[700],
          ),
          const SizedBox(width: 4),
          Text(label),
        ],
      ),
      onSelected: (selected) {
        setState(() {
          _cuisine = value;
        });
      },
      selectedColor: Colors.orange[700],
      backgroundColor: Colors.grey[200],
      labelStyle: GoogleFonts.inter(
        fontSize: 13,
        color: isSelected ? Colors.white : Colors.grey[700],
      ),
    );
  }

  Widget _buildMealsOption({
    required int value,
    required String label,
    required String subtitle,
  }) {
    final isSelected = _mealsPerDay == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _mealsPerDay = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.orange[50] : Colors.grey[100],
          border: Border.all(
            color: isSelected ? Colors.orange[700]! : Colors.grey[300]!,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.orange[700] : Colors.black87,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _avoidController.dispose();
    super.dispose();
  }
}
