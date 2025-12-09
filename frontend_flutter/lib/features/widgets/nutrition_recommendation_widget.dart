import 'package:flutter/material.dart';
import 'package:frontend_flutter/features/model/nutrition_recommendation.dart';

class NutritionRecommendationWidget extends StatelessWidget {
  final NutritionRecommendation nutrition;

  const NutritionRecommendationWidget({Key? key, required this.nutrition})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      margin: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(
                  Icons.restaurant_menu,
                  color: Theme.of(context).primaryColor,
                  size: 28,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Chế độ dinh dưỡng đề xuất',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        nutrition.breakdown['goalDescription'] ?? '',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 24),

            // Daily Calories
            _buildMainMetric(
              context,
              icon: Icons.local_fire_department,
              label: 'Calories mỗi ngày',
              value: '${nutrition.dailyCalories.round()}',
              unit: 'kcal',
              color: Colors.orange,
            ),
            const SizedBox(height: 16),

            // Water Intake
            _buildMainMetric(
              context,
              icon: Icons.water_drop,
              label: 'Lượng nước cần uống',
              value: nutrition.waterIntake.toStringAsFixed(1),
              unit: 'lít/ngày',
              color: Colors.blue,
            ),
            const Divider(height: 24),

            // Macros Title
            Text(
              'Phân bổ Macronutrients',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            // Protein
            _buildMacroRow(
              context,
              label: 'Protein',
              grams: nutrition.protein,
              percentage: nutrition.breakdown['proteinPercentage'],
              color: Colors.red,
            ),
            const SizedBox(height: 8),

            // Carbs
            _buildMacroRow(
              context,
              label: 'Carbs',
              grams: nutrition.carbs,
              percentage: nutrition.breakdown['carbsPercentage'],
              color: Colors.green,
            ),
            const SizedBox(height: 8),

            // Fat
            _buildMacroRow(
              context,
              label: 'Fat',
              grams: nutrition.fat,
              percentage: nutrition.breakdown['fatPercentage'],
              color: Colors.amber,
            ),
            const Divider(height: 24),

            // Metabolic Info
            _buildMetabolicInfo(context),

            const SizedBox(height: 16),

            // Info Note
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.info_outline,
                    color: Colors.blue.shade700,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Các chỉ số trên được tính toán dựa trên tuổi, chiều cao, cân nặng và mục tiêu tập luyện của bạn.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.blue.shade700,
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

  Widget _buildMainMetric(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    required String unit,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withOpacity(0.1), color.withOpacity(0.05)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
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
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.grey[700]),
                ),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      value,
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(fontWeight: FontWeight.bold, color: color),
                    ),
                    const SizedBox(width: 4),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        unit,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
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
      ),
    );
  }

  Widget _buildMacroRow(
    BuildContext context, {
    required String label,
    required double grams,
    required int percentage,
    required Color color,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
            ),
            Text(
              '${grams.round()}g ($percentage%)',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percentage / 100,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 8,
          ),
        ),
      ],
    );
  }

  Widget _buildMetabolicInfo(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildMetabolicItem(
                context,
                label: 'BMR',
                value: nutrition.bmr.round().toString(),
                tooltip: 'Basal Metabolic Rate - Năng lượng cơ bản cơ thể cần',
              ),
              Container(width: 1, height: 40, color: Colors.grey[300]),
              _buildMetabolicItem(
                context,
                label: 'TDEE',
                value: nutrition.tdee.round().toString(),
                tooltip:
                    'Total Daily Energy Expenditure - Tổng năng lượng tiêu hao',
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Mức độ hoạt động: ${nutrition.breakdown['activityLevel']}',
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildMetabolicItem(
    BuildContext context, {
    required String label,
    required String value,
    required String tooltip,
  }) {
    return Expanded(
      child: Tooltip(
        message: tooltip,
        child: Column(
          children: [
            Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
            ),
            const SizedBox(height: 4),
            Text(
              '$value kcal',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
