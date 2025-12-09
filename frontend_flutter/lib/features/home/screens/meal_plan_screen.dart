import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:frontend_flutter/features/model/meal_plan.dart';
import 'package:intl/intl.dart';

class MealPlanScreen extends StatefulWidget {
  final WeeklyMealPlan mealPlan;

  const MealPlanScreen({Key? key, required this.mealPlan}) : super(key: key);

  @override
  State<MealPlanScreen> createState() => _MealPlanScreenState();
}

class _MealPlanScreenState extends State<MealPlanScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _selectedDayIndex = 0;

  @override
  void initState() {
    super.initState();
    // Tìm ngày hiện tại trong tuần
    final today = DateTime.now();
    _selectedDayIndex = widget.mealPlan.days.indexWhere(
      (day) =>
          day.date.year == today.year &&
          day.date.month == today.month &&
          day.date.day == today.day,
    );
    if (_selectedDayIndex == -1) _selectedDayIndex = 0;

    _tabController = TabController(
      length: widget.mealPlan.days.length,
      vsync: this,
      initialIndex: _selectedDayIndex,
    );

    _tabController.addListener(() {
      setState(() {
        _selectedDayIndex = _tabController.index;
      });
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isSaved = widget.mealPlan.id.isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Expanded(
              child: Text(
                'Thực đơn 7 ngày',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold),
              ),
            ),
            if (isSaved)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.bookmark, size: 14, color: Colors.orange[700]),
                    const SizedBox(width: 4),
                    Text(
                      'Đã lưu',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Colors.orange[700],
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        backgroundColor: Colors.orange[700],
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: _showPlanInfo,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          tabs: widget.mealPlan.days.map((day) {
            final isToday = _isToday(day.date);
            return Tab(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    day.dayName,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: isToday ? FontWeight.bold : FontWeight.w600,
                    ),
                  ),
                  Text(
                    DateFormat('dd/MM').format(day.date),
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  if (isToday)
                    Container(
                      margin: const EdgeInsets.only(top: 2),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 1,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Hôm nay',
                        style: GoogleFonts.inter(
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                          color: Colors.orange[700],
                        ),
                      ),
                    ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: widget.mealPlan.days.map((day) {
          return _buildDayView(day);
        }).toList(),
      ),
    );
  }

  Widget _buildDayView(DayMealPlan day) {
    return SingleChildScrollView(
      child: Column(
        children: [
          // Summary card
          _buildDaySummaryCard(day),

          // Meals list
          ...day.meals.map((meal) => _buildMealCard(meal)),

          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildDaySummaryCard(DayMealPlan day) {
    return Card(
      margin: const EdgeInsets.all(16),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.orange[50]!, Colors.orange[100]!],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.calendar_today, color: Colors.orange[700], size: 20),
                const SizedBox(width: 8),
                Text(
                  '${day.dayName} - ${DateFormat('dd/MM/yyyy').format(day.date)}',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange[900],
                  ),
                ),
              ],
            ),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNutrientSummary(
                  icon: Icons.local_fire_department,
                  label: 'Calories',
                  value: '${day.totalCalories.toStringAsFixed(0)}',
                  unit: 'kcal',
                  color: Colors.red,
                ),
                _buildNutrientSummary(
                  icon: Icons.fitness_center,
                  label: 'Protein',
                  value: '${day.totalProtein.toStringAsFixed(0)}',
                  unit: 'g',
                  color: Colors.blue,
                ),
                _buildNutrientSummary(
                  icon: Icons.grain,
                  label: 'Carbs',
                  value: '${day.totalCarbs.toStringAsFixed(0)}',
                  unit: 'g',
                  color: Colors.orange,
                ),
                _buildNutrientSummary(
                  icon: Icons.water_drop,
                  label: 'Fat',
                  value: '${day.totalFat.toStringAsFixed(0)}',
                  unit: 'g',
                  color: Colors.amber,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNutrientSummary({
    required IconData icon,
    required String label,
    required String value,
    required String unit,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: value,
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              TextSpan(
                text: unit,
                style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[600]),
              ),
            ],
          ),
        ),
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[700]),
        ),
      ],
    );
  }

  Widget _buildMealCard(Meal meal) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        leading: _getMealIcon(meal.type),
        title: Text(
          meal.typeName,
          style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          '${meal.totalCalories.toStringAsFixed(0)} kcal • ${meal.dishes.length} món',
          style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Macros summary
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMacro('P', meal.totalProtein, Colors.blue),
                      _buildMacro('C', meal.totalCarbs, Colors.orange),
                      _buildMacro('F', meal.totalFat, Colors.amber),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Dishes
                ...meal.dishes.map((dish) => _buildDishItem(dish)),

                // Notes
                if (meal.notes != null && meal.notes!.isNotEmpty) ...[
                  const Divider(),
                  Row(
                    children: [
                      Icon(
                        Icons.lightbulb_outline,
                        size: 16,
                        color: Colors.amber[700],
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          meal.notes!,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontStyle: FontStyle.italic,
                            color: Colors.grey[700],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMacro(String label, double value, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          '${value.toStringAsFixed(0)}g',
          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildDishItem(Dish dish) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.orange[100],
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(
                  Icons.restaurant,
                  size: 16,
                  color: Colors.orange[700],
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  dish.name,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildDishMacro(
                Icons.local_fire_department,
                '${dish.calories.toStringAsFixed(0)} kcal',
                Colors.red,
              ),
              const SizedBox(width: 12),
              _buildDishMacro(
                Icons.fitness_center,
                'P: ${dish.protein.toStringAsFixed(0)}g',
                Colors.blue,
              ),
              const SizedBox(width: 12),
              _buildDishMacro(
                Icons.grain,
                'C: ${dish.carbs.toStringAsFixed(0)}g',
                Colors.orange,
              ),
            ],
          ),
          if (dish.ingredients != null) ...[
            const SizedBox(height: 8),
            Text(
              dish.ingredients!,
              style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600]),
            ),
          ],
          if (dish.cookingMethod != null) ...[
            const SizedBox(height: 4),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.book, size: 12, color: Colors.grey[500]),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    dish.cookingMethod!,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                      color: Colors.grey[600],
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

  Widget _buildDishMacro(IconData icon, String text, Color color) {
    return Row(
      children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 2),
        Text(
          text,
          style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[700]),
        ),
      ],
    );
  }

  Widget _getMealIcon(String type) {
    switch (type) {
      case 'breakfast':
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.orange[100],
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.free_breakfast, color: Colors.orange[700]),
        );
      case 'lunch':
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.green[100],
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.lunch_dining, color: Colors.green[700]),
        );
      case 'dinner':
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.blue[100],
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.dinner_dining, color: Colors.blue[700]),
        );
      case 'snack':
        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.purple[100],
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.cookie, color: Colors.purple[700]),
        );
      default:
        return const Icon(Icons.restaurant);
    }
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  void _showPlanInfo() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.info, color: Colors.orange[700]),
            const SizedBox(width: 8),
            Text(
              'Thông tin thực đơn',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoRow(
              'Mục tiêu',
              _getGoalName(widget.mealPlan.fitnessGoal),
            ),
            _buildInfoRow(
              'Calories/ngày',
              '${widget.mealPlan.targetCalories.toStringAsFixed(0)} kcal',
            ),
            _buildInfoRow(
              'Protein/ngày',
              '${widget.mealPlan.targetProtein.toStringAsFixed(0)}g',
            ),
            _buildInfoRow(
              'Carbs/ngày',
              '${widget.mealPlan.targetCarbs.toStringAsFixed(0)}g',
            ),
            _buildInfoRow(
              'Fat/ngày',
              '${widget.mealPlan.targetFat.toStringAsFixed(0)}g',
            ),
            if (widget.mealPlan.preferences.isNotEmpty)
              _buildInfoRow('Sở thích', widget.mealPlan.preferences.join(', ')),
            _buildInfoRow(
              'Tạo lúc',
              DateFormat('dd/MM/yyyy HH:mm').format(widget.mealPlan.createdAt),
            ),
            if (widget.mealPlan.id.isNotEmpty) ...[
              const Divider(height: 20),
              Row(
                children: [
                  Icon(Icons.bookmark, size: 16, color: Colors.green[700]),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Thực đơn này đã được lưu vào Firestore',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.green[700],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Đóng',
              style: GoogleFonts.inter(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(
            '$label: ',
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[700]),
            ),
          ),
        ],
      ),
    );
  }

  String _getGoalName(String goal) {
    switch (goal) {
      case '1':
        return 'Giảm mỡ';
      case '2':
        return 'Tăng cơ';
      case '3':
        return 'Duy trì';
      case '4':
        return 'Tăng sức bền';
      case '5':
        return 'Tăng sức mạnh';
      default:
        return 'Không xác định';
    }
  }
}
