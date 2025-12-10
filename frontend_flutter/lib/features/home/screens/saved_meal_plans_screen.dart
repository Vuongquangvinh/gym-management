import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:frontend_flutter/features/model/meal_plan.dart';
import 'package:frontend_flutter/features/services/ai_meal_planner_service.dart';
import 'package:frontend_flutter/features/home/screens/meal_plan_screen.dart';
import 'package:intl/intl.dart';

class SavedMealPlansScreen extends StatefulWidget {
  final String userId;

  const SavedMealPlansScreen({Key? key, required this.userId})
    : super(key: key);

  @override
  State<SavedMealPlansScreen> createState() => _SavedMealPlansScreenState();
}

class _SavedMealPlansScreenState extends State<SavedMealPlansScreen> {
  List<WeeklyMealPlan> _mealPlans = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMealPlans();
  }

  Future<void> _loadMealPlans() async {
    setState(() {
      _isLoading = true;
    });

    try {
      print('🔍 Loading meal plans for user: ${widget.userId}');
      final plans = await AIMealPlannerService.getAllMealPlans(widget.userId);
      print('📊 Loaded ${plans.length} meal plans');
      if (plans.isNotEmpty) {
        print('   First plan ID: ${plans.first.id}');
        print('   First plan goal: ${plans.first.fitnessGoal}');
      }
      setState(() {
        _mealPlans = plans;
        _isLoading = false;
      });
    } catch (e) {
      print('❌ Error loading meal plans: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Thực đơn đã lưu',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.orange[700],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _mealPlans.isEmpty
          ? _buildEmptyState()
          : RefreshIndicator(
              onRefresh: _loadMealPlans,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _mealPlans.length,
                itemBuilder: (context, index) {
                  return _buildMealPlanCard(_mealPlans[index]);
                },
              ),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.restaurant_menu, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'Chưa có thực đơn nào',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tạo thực đơn đầu tiên với AI!',
            style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildMealPlanCard(WeeklyMealPlan plan) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => MealPlanScreen(mealPlan: plan),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.orange[100],
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      Icons.calendar_month,
                      color: Colors.orange[700],
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Thực đơn ${_getGoalName(plan.fitnessGoal)}',
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Tạo: ${DateFormat('dd/MM/yyyy HH:mm').format(plan.createdAt)}',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                    onPressed: () => _confirmDelete(plan),
                  ),
                ],
              ),
              const Divider(height: 20),

              // Stats
              Row(
                children: [
                  Expanded(
                    child: _buildStatItem(
                      icon: Icons.local_fire_department,
                      label: 'Calories',
                      value: '${plan.targetCalories.toStringAsFixed(0)}',
                      color: Colors.red,
                    ),
                  ),
                  Expanded(
                    child: _buildStatItem(
                      icon: Icons.fitness_center,
                      label: 'Protein',
                      value: '${plan.targetProtein.toStringAsFixed(0)}g',
                      color: Colors.blue,
                    ),
                  ),
                  Expanded(
                    child: _buildStatItem(
                      icon: Icons.restaurant,
                      label: 'Bữa ăn',
                      value:
                          '${plan.days.length * plan.days.first.meals.length}',
                      color: Colors.green,
                    ),
                  ),
                ],
              ),

              // Preferences tags
              if (plan.preferences.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: plan.preferences.map((pref) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.orange[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.orange[200]!),
                      ),
                      child: Text(
                        _formatPreference(pref),
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          color: Colors.orange[900],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],

              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.touch_app, size: 14, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    'Nhấn để xem chi tiết',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: Colors.grey[600],
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[600]),
        ),
      ],
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

  String _formatPreference(String pref) {
    switch (pref) {
      case 'chay':
        return '🌱 Chay';
      case 'eat_clean':
        return '✨ Eat Clean';
      case 'low_carb':
        return '🥗 Ít Carbs';
      case 'vietnamese':
        return '🇻🇳 Món Việt';
      case 'asian':
        return '🍜 Món Á';
      case 'western':
        return '🍔 Món Âu';
      case 'mixed':
        return '🌍 Hỗn hợp';
      case 'with_snack':
        return '🍎 4 bữa';
      default:
        return pref;
    }
  }

  Future<void> _confirmDelete(WeeklyMealPlan plan) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.warning_amber, color: Colors.orange),
            const SizedBox(width: 8),
            Text(
              'Xác nhận xóa',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Text(
          'Bạn có chắc muốn xóa thực đơn này?\nHành động này không thể hoàn tác.',
          style: GoogleFonts.inter(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Hủy',
              style: GoogleFonts.inter(color: Colors.grey[700]),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: Text(
              'Xóa',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await AIMealPlannerService.deleteMealPlan(widget.userId, plan.id);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 12),
                Text(
                  'Đã xóa thực đơn',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                ),
              ],
            ),
            backgroundColor: Colors.green[600],
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );

        // Reload list
        _loadMealPlans();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi khi xóa: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
