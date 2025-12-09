import 'package:flutter/material.dart';
import 'package:frontend_flutter/features/model/nutrition_recommendation.dart';
import 'package:frontend_flutter/features/model/user.model.dart';
import 'package:frontend_flutter/features/services/nutrition_calculation_service.dart';
import 'package:frontend_flutter/features/services/water_tracking_service.dart';
import 'package:frontend_flutter/features/home/screens/measurement_history_screen.dart';
import 'package:frontend_flutter/features/home/widgets/add_measurement_dialog.dart';
import 'package:google_fonts/google_fonts.dart';

class NutritionScreen extends StatefulWidget {
  final UserModel user;

  const NutritionScreen({Key? key, required this.user}) : super(key: key);

  @override
  State<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends State<NutritionScreen> {
  late NutritionRecommendation nutritionRecommendation;
  String selectedGoal = '3'; // Mục tiêu hiện tại
  int waterGlassesCompleted = 0; // Số ly nước đã uống
  static const int mlPerGlass = 250; // 250ml mỗi ly
  bool _isLoadingWater = true;

  @override
  void initState() {
    super.initState();
    // Lấy mục tiêu hiện tại của user
    selectedGoal = widget.user.fitnessGoal.isNotEmpty
        ? widget.user.fitnessGoal.first
        : '3';
    // Tính toán chỉ số dinh dưỡng cho user
    _recalculateNutrition();
    // Load dữ liệu uống nước đã lưu
    _loadWaterIntake();
  }

  Future<void> _loadWaterIntake() async {
    setState(() {
      _isLoadingWater = true;
    });

    try {
      // Kiểm tra xem có phải ngày mới không
      final isNewDay = await WaterTrackingService.isNewDay(widget.user.id);

      if (isNewDay) {
        // Nếu là ngày mới, reset về 0
        setState(() {
          waterGlassesCompleted = 0;
          _isLoadingWater = false;
        });
      } else {
        // Nếu cùng ngày, load dữ liệu đã lưu
        final savedGlasses = await WaterTrackingService.getWaterIntake(
          widget.user.id,
        );
        setState(() {
          waterGlassesCompleted = savedGlasses;
          _isLoadingWater = false;
        });
      }
    } catch (e) {
      print('❌ Error loading water intake: $e');
      setState(() {
        _isLoadingWater = false;
      });
    }
  }

  Future<void> _saveWaterIntake(int glasses) async {
    try {
      // Lưu vào SharedPreferences
      await WaterTrackingService.saveWaterIntake(widget.user.id, glasses);

      // Lưu vào Firestore
      final totalLiters = glasses * mlPerGlass / 1000;
      await WaterTrackingService.saveWaterHistoryToFirestore(
        widget.user.id,
        glasses,
        totalLiters,
        nutritionRecommendation.waterIntake,
      );

      print('✅ Water intake saved: $glasses glasses');
    } catch (e) {
      print('❌ Error saving water intake: $e');
    }
  }

  void _recalculateNutrition() {
    // Tạo user tạm với mục tiêu mới
    final tempUser = widget.user.copyWith(fitnessGoal: [selectedGoal]);
    setState(() {
      nutritionRecommendation = NutritionCalculationService.calculateNutrition(
        tempUser,
      );
      // Không reset water khi đổi mục tiêu nữa
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dinh dưỡng & Chế độ ăn'),
        backgroundColor: Theme.of(context).primaryColor,
        actions: [
          // Nút xem lịch sử
          IconButton(
            icon: const Icon(Icons.history),
            tooltip: 'Lịch sử uống nước',
            onPressed: () => _showWaterHistory(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // User Info Card (với mục tiêu nhỏ gọn)
            _buildUserInfoCard(),

            // Nutrition Stats Card
            _buildNutritionStatsCard(),

            // Water Tracker Card
            _buildWaterTrackerCard(),

            // Water Weekly Stats (mini card)
            _buildWaterWeeklyStats(),

            // Macros Card
            _buildMacrosCard(),

            // Tips Card
            _buildNutritionTips(),

            const SizedBox(height: 20),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showGoalSelector(context),
        icon: const Icon(Icons.flag),
        label: const Text('Đổi mục tiêu'),
        backgroundColor: Colors.blue[700],
      ),
    );
  }

  Widget _buildUserInfoCard() {
    final weight = widget.user.initialMeasurements['weight'] ?? 0;
    final height = widget.user.initialMeasurements['height'] ?? 0;
    final age = widget.user.dateOfBirth != null
        ? DateTime.now().year - widget.user.dateOfBirth!.year
        : 0;

    return Card(
      margin: const EdgeInsets.all(16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundImage: widget.user.avatarUrl.isNotEmpty
                      ? NetworkImage(widget.user.avatarUrl)
                      : null,
                  child: widget.user.avatarUrl.isEmpty
                      ? const Icon(Icons.person, size: 30)
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.user.fullName,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$age tuổi • ${_getGenderText(widget.user.gender)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Hiển thị mục tiêu hiện tại
                      _buildCurrentGoalBadge(),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildInfoItem(
                  icon: Icons.height,
                  label: 'Chiều cao',
                  value: '$height cm',
                ),
                _buildInfoItem(
                  icon: Icons.monitor_weight,
                  label: 'Cân nặng',
                  value: '$weight kg',
                ),
                _buildInfoItem(
                  icon: Icons.calculate,
                  label: 'BMI',
                  value: _calculateBMI(height.toDouble(), weight.toDouble()),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Nút quản lý chỉ số
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showAddMeasurementDialog(),
                    icon: const Icon(Icons.add, size: 18),
                    label: Text(
                      'Cập nhật',
                      style: GoogleFonts.inter(fontSize: 13),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.blue[700],
                      side: BorderSide(color: Colors.blue[300]!),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _navigateToHistory(),
                    icon: const Icon(Icons.history, size: 18),
                    label: Text(
                      'Lịch sử',
                      style: GoogleFonts.inter(fontSize: 13),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.purple[700],
                      side: BorderSide(color: Colors.purple[300]!),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, color: Theme.of(context).primaryColor),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildNutritionTips() {
    final tips = _getTipsForGoal(selectedGoal);

    return Card(
      margin: const EdgeInsets.all(16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.lightbulb_outline, color: Colors.amber[700]),
                const SizedBox(width: 8),
                Text(
                  'Gợi ý dinh dưỡng',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const Divider(height: 20),
            ...tips.map(
              (tip) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.check_circle,
                      size: 20,
                      color: Colors.green,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        tip,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getGenderText(String gender) {
    switch (gender.toLowerCase()) {
      case 'male':
      case 'nam':
        return 'Nam';
      case 'female':
      case 'nữ':
        return 'Nữ';
      default:
        return 'Khác';
    }
  }

  String _calculateBMI(double height, double weight) {
    if (height == 0 || weight == 0) return 'N/A';
    final bmi = weight / ((height / 100) * (height / 100));
    return bmi.toStringAsFixed(1);
  }

  // Widget hiển thị mục tiêu hiện tại dưới dạng badge
  Widget _buildCurrentGoalBadge() {
    final goalData = _getGoalData(selectedGoal);

    return InkWell(
      onTap: () => _showGoalSelector(context),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: (goalData['color'] as Color).withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: goalData['color'] as Color, width: 1.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              goalData['icon'] as IconData,
              size: 16,
              color: goalData['color'] as Color,
            ),
            const SizedBox(width: 6),
            Text(
              'Mục tiêu: ${goalData['label']}',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: goalData['color'] as Color,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.edit, size: 14, color: goalData['color'] as Color),
          ],
        ),
      ),
    );
  }

  // Lấy thông tin mục tiêu (icon, label, color)
  Map<String, dynamic> _getGoalData(String goalId) {
    switch (goalId) {
      case '1':
        return {
          'label': 'Giảm mỡ',
          'icon': Icons.trending_down,
          'color': Colors.red,
        };
      case '2':
        return {
          'label': 'Tăng cơ',
          'icon': Icons.fitness_center,
          'color': Colors.green,
        };
      case '3':
        return {
          'label': 'Duy trì',
          'icon': Icons.favorite,
          'color': Colors.orange,
        };
      case '4':
        return {
          'label': 'Tăng sức bền',
          'icon': Icons.directions_run,
          'color': Colors.purple,
        };
      case '5':
        return {
          'label': 'Tăng sức mạnh',
          'icon': Icons.sports_martial_arts,
          'color': Colors.indigo,
        };
      default:
        return {
          'label': 'Duy trì',
          'icon': Icons.favorite,
          'color': Colors.orange,
        };
    }
  }

  // Modal chọn mục tiêu
  void _showGoalSelector(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return DraggableScrollableSheet(
              initialChildSize: 0.75,
              minChildSize: 0.5,
              maxChildSize: 0.9,
              expand: false,
              builder: (context, scrollController) {
                return Container(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Drag handle
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          margin: const EdgeInsets.only(bottom: 20),
                          decoration: BoxDecoration(
                            color: Colors.grey[300],
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      // Header
                      Row(
                        children: [
                          Icon(
                            Icons.flag_rounded,
                            color: Colors.blue[700],
                            size: 28,
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Chọn mục tiêu',
                            style: GoogleFonts.inter(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Chọn mục tiêu phù hợp để nhận chế độ dinh dưỡng tối ưu',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: Colors.grey[600],
                        ),
                      ),
                      const Divider(height: 24),
                      // Scrollable list
                      Expanded(
                        child: ListView(
                          controller: scrollController,
                          children:
                              [
                                {
                                  'id': '1',
                                  'label': 'Giảm mỡ',
                                  'icon': Icons.trending_down,
                                  'color': Colors.red,
                                  'desc': 'Giảm 0.5kg/tuần an toàn',
                                },
                                {
                                  'id': '2',
                                  'label': 'Tăng cơ',
                                  'icon': Icons.fitness_center,
                                  'color': Colors.green,
                                  'desc': 'Xây dựng cơ bắp hiệu quả',
                                },
                                {
                                  'id': '3',
                                  'label': 'Duy trì',
                                  'icon': Icons.favorite,
                                  'color': Colors.orange,
                                  'desc': 'Giữ cân nặng ổn định',
                                },
                                {
                                  'id': '4',
                                  'label': 'Tăng sức bền',
                                  'icon': Icons.directions_run,
                                  'color': Colors.purple,
                                  'desc': 'Chạy, bơi, xe đạp',
                                },
                                {
                                  'id': '5',
                                  'label': 'Tăng sức mạnh',
                                  'icon': Icons.sports_martial_arts,
                                  'color': Colors.indigo,
                                  'desc': 'Nâng tạ, powerlifting',
                                },
                              ].map((goal) {
                                final isSelected = selectedGoal == goal['id'];
                                return InkWell(
                                  onTap: () {
                                    setModalState(() {
                                      selectedGoal = goal['id'] as String;
                                    });
                                    setState(() {
                                      selectedGoal = goal['id'] as String;
                                    });
                                    _recalculateNutrition();
                                    Navigator.pop(context);

                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          'Đã chuyển sang mục tiêu: ${goal['label']}',
                                        ),
                                        backgroundColor: goal['color'] as Color,
                                        duration: const Duration(seconds: 2),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    margin: const EdgeInsets.only(bottom: 12),
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? (goal['color'] as Color)
                                                .withOpacity(0.1)
                                          : Colors.grey[50],
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isSelected
                                            ? (goal['color'] as Color)
                                            : Colors.grey[300]!,
                                        width: isSelected ? 2 : 1,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(12),
                                          decoration: BoxDecoration(
                                            color: (goal['color'] as Color)
                                                .withOpacity(0.2),
                                            borderRadius: BorderRadius.circular(
                                              10,
                                            ),
                                          ),
                                          child: Icon(
                                            goal['icon'] as IconData,
                                            color: goal['color'] as Color,
                                            size: 24,
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                goal['label'] as String,
                                                style: GoogleFonts.inter(
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.bold,
                                                  color: isSelected
                                                      ? goal['color'] as Color
                                                      : Colors.black87,
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                goal['desc'] as String,
                                                style: GoogleFonts.inter(
                                                  fontSize: 12,
                                                  color: Colors.grey[600],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (isSelected)
                                          Icon(
                                            Icons.check_circle,
                                            color: goal['color'] as Color,
                                            size: 24,
                                          ),
                                      ],
                                    ),
                                  ),
                                );
                              }).toList(),
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  // Widget thống kê dinh dưỡng
  Widget _buildNutritionStatsCard() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Chỉ số dinh dưỡng hàng ngày',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            // Calories
            _buildStatRow(
              icon: Icons.local_fire_department,
              label: 'Calories',
              value: '${nutritionRecommendation.dailyCalories.round()}',
              unit: 'kcal',
              color: Colors.orange,
            ),
            const Divider(height: 24),
            // BMR & TDEE
            Row(
              children: [
                Expanded(
                  child: _buildSmallStat(
                    'BMR',
                    nutritionRecommendation.bmr.round().toString(),
                    'kcal',
                    Colors.blue,
                  ),
                ),
                Container(width: 1, height: 40, color: Colors.grey[300]),
                Expanded(
                  child: _buildSmallStat(
                    'TDEE',
                    nutritionRecommendation.tdee.round().toString(),
                    'kcal',
                    Colors.purple,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow({
    required IconData icon,
    required String label,
    required String value,
    required String unit,
    required Color color,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600]),
              ),
              const SizedBox(height: 4),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    value,
                    style: GoogleFonts.inter(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      unit,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSmallStat(String label, String value, String unit, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            color: Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          unit,
          style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500]),
        ),
      ],
    );
  }

  // Widget tracker uống nước
  Widget _buildWaterTrackerCard() {
    final totalGlasses =
        (nutritionRecommendation.waterIntake * 1000 / mlPerGlass).ceil();
    final percentComplete = waterGlassesCompleted / totalGlasses;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.blue[50]!, Colors.cyan[50]!],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.water_drop, color: Colors.blue[700], size: 24),
                    const SizedBox(width: 12),
                    Text(
                      'Theo dõi uống nước',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.blue[700],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '$waterGlassesCompleted/$totalGlasses ly',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: percentComplete.clamp(0.0, 1.0),
                minHeight: 12,
                backgroundColor: Colors.grey[200],
                valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[600]!),
              ),
            ),
            const SizedBox(height: 16),
            // Water info
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Mục tiêu: ${nutritionRecommendation.waterIntake.toStringAsFixed(1)}L',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: Colors.grey[700],
                  ),
                ),
                Text(
                  'Đã uống: ${(waterGlassesCompleted * mlPerGlass / 1000).toStringAsFixed(2)}L',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.blue[700],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Water glasses visualization
            _isLoadingWater
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Colors.blue[600]!,
                        ),
                      ),
                    ),
                  )
                : Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: List.generate(totalGlasses, (index) {
                      final isFilled = index < waterGlassesCompleted;
                      return InkWell(
                        onTap: () async {
                          int newValue;
                          if (isFilled) {
                            // Nếu đã fill, tap để unfill
                            newValue = index;
                          } else {
                            // Nếu chưa fill, tap để fill
                            newValue = index + 1;
                          }

                          setState(() {
                            waterGlassesCompleted = newValue;
                          });

                          // Lưu ngay khi thay đổi
                          await _saveWaterIntake(newValue);
                        },
                        child: Container(
                          width: 50,
                          height: 60,
                          decoration: BoxDecoration(
                            color: isFilled ? Colors.blue[400] : Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isFilled
                                  ? Colors.blue[700]!
                                  : Colors.grey[300]!,
                              width: 2,
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                isFilled
                                    ? Icons.water_drop
                                    : Icons.water_drop_outlined,
                                color: isFilled
                                    ? Colors.white
                                    : Colors.grey[400],
                                size: 24,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${index + 1}',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: isFilled
                                      ? Colors.white
                                      : Colors.grey[400],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  ),
            const SizedBox(height: 12),
            // Reset button
            if (waterGlassesCompleted > 0)
              Center(
                child: TextButton.icon(
                  onPressed: () async {
                    setState(() {
                      waterGlassesCompleted = 0;
                    });
                    // Lưu ngay khi reset
                    await _saveWaterIntake(0);
                  },
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Đặt lại'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.blue[700],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // Widget macros
  Widget _buildMacrosCard() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Phân bổ Macronutrients',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildMacroRow(
              'Protein',
              nutritionRecommendation.protein,
              nutritionRecommendation.breakdown['proteinPercentage'],
              Colors.red,
            ),
            const SizedBox(height: 12),
            _buildMacroRow(
              'Carbs',
              nutritionRecommendation.carbs,
              nutritionRecommendation.breakdown['carbsPercentage'],
              Colors.green,
            ),
            const SizedBox(height: 12),
            _buildMacroRow(
              'Fat',
              nutritionRecommendation.fat,
              nutritionRecommendation.breakdown['fatPercentage'],
              Colors.amber,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMacroRow(
    String label,
    double grams,
    int percentage,
    Color color,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              '${grams.round()}g ($percentage%)',
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: percentage / 100,
            minHeight: 10,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }

  // Widget thống kê tuần
  Widget _buildWaterWeeklyStats() {
    return FutureBuilder<Map<String, int>>(
      future: _getWeeklyStats(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const SizedBox.shrink();
        }

        final weeklyTotal = snapshot.data!['total'] ?? 0;
        final daysCompleted = snapshot.data!['daysCompleted'] ?? 0;

        if (weeklyTotal == 0) {
          return const SizedBox.shrink();
        }

        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.cyan[50]!, Colors.blue[50]!],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildWeeklyStatItem(
                  icon: Icons.water_drop,
                  label: 'Tuần này',
                  value: '$weeklyTotal ly',
                  color: Colors.blue[700]!,
                ),
                Container(width: 1, height: 40, color: Colors.grey[300]),
                _buildWeeklyStatItem(
                  icon: Icons.emoji_events,
                  label: 'Ngày đạt',
                  value: '$daysCompleted/7',
                  color: Colors.green[700]!,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildWeeklyStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 6),
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Future<Map<String, int>> _getWeeklyStats() async {
    final total = await WaterTrackingService.getWeeklyTotal(widget.user.id);
    final daysCompleted = await WaterTrackingService.getDaysCompletedThisWeek(
      widget.user.id,
    );
    return {'total': total, 'daysCompleted': daysCompleted};
  }

  // Hiển thị lịch sử uống nước
  void _showWaterHistory(BuildContext context) async {
    final history = await WaterTrackingService.getWaterHistory(
      widget.user.id,
      days: 7,
    );

    if (!context.mounted) return;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.history, color: Colors.blue[700]),
                  const SizedBox(width: 12),
                  Text(
                    'Lịch sử 7 ngày',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              if (history.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Text(
                      'Chưa có dữ liệu',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
                )
              else
                ...history.map((item) {
                  final date = item['date'] as DateTime;
                  final glasses = item['glasses_completed'] as int;
                  final totalLiters = item['total_liters'] as double;
                  final targetLiters = item['target_liters'] as double;
                  final percentage = item['completion_percentage'] as int;
                  final isToday = _isToday(date);

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isToday ? Colors.blue[50] : Colors.grey[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isToday ? Colors.blue[200]! : Colors.grey[200]!,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.calendar_today,
                          size: 16,
                          color: isToday ? Colors.blue[700] : Colors.grey[600],
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _formatDate(date),
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: isToday
                                      ? FontWeight.bold
                                      : FontWeight.w500,
                                  color: isToday
                                      ? Colors.blue[700]
                                      : Colors.grey[700],
                                ),
                              ),
                              Text(
                                '$glasses ly (${totalLiters.toStringAsFixed(1)}L / ${targetLiters.toStringAsFixed(1)}L)',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: percentage >= 100
                                ? Colors.green[100]
                                : Colors.orange[100],
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '$percentage%',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: percentage >= 100
                                  ? Colors.green[700]
                                  : Colors.orange[700],
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue[700],
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Đóng',
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
        );
      },
    );
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    if (_isToday(date)) {
      return 'Hôm nay';
    } else if (date.year == now.year &&
        date.month == now.month &&
        date.day == now.day - 1) {
      return 'Hôm qua';
    } else {
      final weekdays = [
        'Chủ nhật',
        'Thứ 2',
        'Thứ 3',
        'Thứ 4',
        'Thứ 5',
        'Thứ 6',
        'Thứ 7',
      ];
      return '${weekdays[date.weekday % 7]} - ${date.day}/${date.month}';
    }
  }

  List<String> _getTipsForGoal(String goal) {
    switch (goal) {
      case '1': // Giảm mỡ
        return [
          'Tạo defic calories 300-500 kcal/ngày để giảm mỡ an toàn',
          'Ưu tiên protein để duy trì cơ bắp khi giảm cân',
          'Uống đủ nước trước bữa ăn để tăng cảm giác no',
          'Tập cardio 3-4 lần/tuần kết hợp tập tạ',
          'Ngủ đủ 7-8 tiếng để tối ưu hormone giảm mỡ',
        ];
      case '2': // Tăng cơ
        return [
          'Ăn protein trong vòng 30 phút sau tập để tăng cơ tối đa',
          'Kết hợp carbs với protein sau tập để phục hồi',
          'Duy trì thặng dư calories 300-500 kcal/ngày',
          'Tập tạ nặng với volume cao (8-12 reps)',
          'Uống đủ nước để vận chuyển dinh dưỡng đến cơ',
        ];
      case '3': // Duy trì
        return [
          'Cân bằng giữa protein, carbs và fat trong bữa ăn',
          'Ăn nhiều rau xanh và trái cây tươi',
          'Hạn chế thực phẩm chế biến sẵn và đồ chiên rán',
          'Duy trì lịch ăn đều đặn mỗi ngày',
          'Kiểm tra cân nặng hàng tuần để điều chỉnh kịp thời',
        ];
      case '4': // Tăng sức bền
        return [
          'Tăng carbs phức hợp (yến mạch, gạo lứt, khoai lang)',
          'Uống nước điện giải khi tập luyện kéo dài',
          'Bổ sung BCAA trước và trong khi tập',
          'Ăn carbs trước tập 1-2 tiếng để có năng lượng',
          'Phục hồi glycogen sau tập với carbs + protein',
        ];
      case '5': // Tăng sức mạnh
        return [
          'Tăng protein lên 2.2-2.5g/kg cân nặng',
          'Bổ sung creatine monohydrate 5g/ngày',
          'Ăn carbs trước tập để có năng lượng nâng tạ',
          'Tập heavy compound lifts (squat, deadlift, bench)',
          'Nghỉ đủ 48-72h giữa các nhóm cơ để phục hồi',
        ];
      default:
        return [
          'Duy trì chế độ ăn cân bằng và đa dạng',
          'Uống đủ nước mỗi ngày',
          'Ăn nhiều rau xanh và trái cây',
          'Hạn chế đường và thực phẩm chế biến',
          'Tập luyện đều đặn kết hợp với dinh dưỡng',
        ];
    }
  }

  void _showAddMeasurementDialog() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AddMeasurementDialog(userId: widget.user.id),
    );

    if (result == true && mounted) {
      // Reload screen để hiển thị dữ liệu mới
      setState(() {
        _recalculateNutrition();
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 12),
              Text(
                'Đã cập nhật chỉ số thành công',
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
    }
  }

  void _navigateToHistory() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MeasurementHistoryScreen(userId: widget.user.id),
      ),
    );
  }
}
