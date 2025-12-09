import 'package:frontend_flutter/features/model/nutrition_recommendation.dart';
import 'package:frontend_flutter/features/model/user.model.dart';

class NutritionCalculationService {
  /// Tính toán BMR (Basal Metabolic Rate) sử dụng công thức Mifflin-St Jeor
  /// BMR là lượng calories cơ thể cần để duy trì các chức năng cơ bản
  static double calculateBMR({
    required double weight, // kg
    required double height, // cm
    required int age, // years
    required String gender,
  }) {
    if (gender.toLowerCase() == 'male' || gender.toLowerCase() == 'nam') {
      // Nam: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) + 5
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else if (gender.toLowerCase() == 'female' ||
        gender.toLowerCase() == 'nữ') {
      // Nữ: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) - 161
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    } else {
      // Other/Unknown: Sử dụng trung bình của nam và nữ
      double maleBMR = (10 * weight) + (6.25 * height) - (5 * age) + 5;
      double femaleBMR = (10 * weight) + (6.25 * height) - (5 * age) - 161;
      return (maleBMR + femaleBMR) / 2;
    }
  }

  /// Tính toán TDEE (Total Daily Energy Expenditure)
  /// TDEE = BMR × Activity Level Factor
  static double calculateTDEE({
    required double bmr,
    required String fitnessGoal,
  }) {
    // Activity Level Multipliers
    // 1: Giảm mỡ - Lightly to moderately active = BMR × 1.375
    // 2: Tăng cơ - Moderately active = BMR × 1.55
    // 3: Duy trì - Moderately active = BMR × 1.55
    // 4: Tăng sức bền - Very active = BMR × 1.725
    // 5: Tăng sức mạnh - Very active = BMR × 1.725
    // 6: Tăng cơ giảm mỡ - Moderately active = BMR × 1.55

    double activityMultiplier;

    switch (fitnessGoal) {
      case '1': // Giảm mỡ / Fat Loss
        activityMultiplier = 1.375; // Lightly to moderately active
        break;
      case '2': // Tăng cơ / Muscle Gain
        activityMultiplier = 1.55; // Moderately active
        break;
      case '3': // Duy trì sức khỏe / Maintain Health
        activityMultiplier = 1.55; // Moderately active
        break;
      case '4': // Tăng sức bền / Endurance
        activityMultiplier = 1.725; // Very active
        break;
      case '5': // Tăng sức mạnh / Strength
        activityMultiplier = 1.725; // Very active
        break;
      case '6': // Tăng cơ giảm mỡ / Body Recomposition
        activityMultiplier = 1.55; // Moderately active
        break;
      default:
        activityMultiplier = 1.55; // Default: Moderately active
    }

    return bmr * activityMultiplier;
  }

  /// Tính toán lượng calories cần thiết dựa trên mục tiêu
  static double calculateDailyCalories({
    required double tdee,
    required String fitnessGoal,
  }) {
    switch (fitnessGoal) {
      case '1': // Giảm mỡ - giảm 500 kcal/ngày (giảm ~0.5kg/tuần)
        return tdee - 500;
      case '2': // Tăng cơ - tăng 300-500 kcal/ngày
        return tdee + 400;
      case '3': // Duy trì sức khỏe - giữ nguyên TDEE
        return tdee;
      case '4': // Tăng sức bền - tăng nhẹ calories
        return tdee + 200;
      case '5': // Tăng sức mạnh - tăng calories đáng kể
        return tdee + 500;
      case '6': // Tăng cơ giảm mỡ - giảm nhẹ 200 kcal
        return tdee - 200;
      default:
        return tdee;
    }
  }

  /// Tính toán phân bổ macro nutrients (Protein, Carbs, Fat)
  static Map<String, double> calculateMacros({
    required double dailyCalories,
    required double weight,
    required String fitnessGoal,
  }) {
    double protein, carbs, fat;

    switch (fitnessGoal) {
      case '1': // Giảm mỡ: High Protein, Moderate Carbs, Low Fat
        protein = weight * 2.2; // 2.2g protein per kg bodyweight
        fat = dailyCalories * 0.25 / 9; // 25% of calories from fat (9 cal/g)
        carbs =
            (dailyCalories - (protein * 4) - (fat * 9)) /
            4; // Remaining from carbs (4 cal/g)
        break;

      case '2': // Tăng cơ: Very High Protein, High Carbs, Moderate Fat
        protein = weight * 2.5; // 2.5g protein per kg bodyweight
        carbs = dailyCalories * 0.45 / 4; // 45% of calories from carbs
        fat = (dailyCalories - (protein * 4) - (carbs * 4)) / 9;
        break;

      case '3': // Duy trì: Balanced
        protein = weight * 1.8; // 1.8g protein per kg
        carbs = dailyCalories * 0.40 / 4; // 40% from carbs
        fat = dailyCalories * 0.30 / 9; // 30% from fat
        break;

      case '4': // Tăng sức bền: High Carbs, Moderate Protein
        protein = weight * 1.6; // 1.6g protein per kg
        carbs = dailyCalories * 0.55 / 4; // 55% from carbs
        fat = (dailyCalories - (protein * 4) - (carbs * 4)) / 9;
        break;

      case '5': // Tăng sức mạnh: Very High Protein, High Carbs
        protein = weight * 2.4; // 2.4g protein per kg
        carbs = dailyCalories * 0.45 / 4; // 45% from carbs
        fat = (dailyCalories - (protein * 4) - (carbs * 4)) / 9;
        break;

      case '6': // Tăng cơ giảm mỡ: Very High Protein, Moderate Carbs, Low Fat
        protein = weight * 2.6; // 2.6g protein per kg (cao nhất)
        fat = dailyCalories * 0.20 / 9; // 20% from fat (thấp)
        carbs = (dailyCalories - (protein * 4) - (fat * 9)) / 4;
        break;

      default: // Default: Balanced
        protein = weight * 1.8;
        carbs = dailyCalories * 0.40 / 4;
        fat = dailyCalories * 0.30 / 9;
    }

    return {'protein': protein, 'carbs': carbs, 'fat': fat};
  }

  /// Tính toán lượng nước cần uống (lít/ngày)
  static double calculateWaterIntake({
    required double weight,
    required String fitnessGoal,
  }) {
    // Base water intake: 30-35ml per kg bodyweight
    double baseWater = weight * 0.035; // liters

    // Thêm lượng nước cho người tập luyện tích cực
    switch (fitnessGoal) {
      case '1': // Giảm mỡ
        return baseWater + 0.5; // +500ml
      case '2': // Tăng cơ
        return baseWater + 1.0; // +1 liter
      case '3': // Duy trì
        return baseWater + 0.5; // +500ml
      case '4': // Tăng sức bền
        return baseWater + 1.5; // +1.5 liters (rất quan trọng)
      case '5': // Tăng sức mạnh
        return baseWater + 1.0; // +1 liter
      case '6': // Tăng cơ giảm mỡ
        return baseWater + 1.0; // +1 liter
      default:
        return baseWater + 0.5;
    }
  }

  /// Tính toán tất cả các chỉ số dinh dưỡng cho user
  static NutritionRecommendation calculateNutrition(UserModel user) {
    // Lấy thông tin cơ bản
    final weight = (user.initialMeasurements['weight'] ?? 70).toDouble();
    final height = (user.initialMeasurements['height'] ?? 170).toDouble();
    final age = user.dateOfBirth != null
        ? DateTime.now().year - user.dateOfBirth!.year
        : 25; // Default age if not provided
    final gender = user.gender;
    final fitnessGoal = user.fitnessGoal.isNotEmpty
        ? user.fitnessGoal.first
        : '3';

    // Tính toán các chỉ số
    final bmr = calculateBMR(
      weight: weight,
      height: height,
      age: age,
      gender: gender,
    );

    final tdee = calculateTDEE(bmr: bmr, fitnessGoal: fitnessGoal);

    final dailyCalories = calculateDailyCalories(
      tdee: tdee,
      fitnessGoal: fitnessGoal,
    );

    final macros = calculateMacros(
      dailyCalories: dailyCalories,
      weight: weight,
      fitnessGoal: fitnessGoal,
    );

    final waterIntake = calculateWaterIntake(
      weight: weight,
      fitnessGoal: fitnessGoal,
    );

    // Tạo breakdown chi tiết
    final breakdown = {
      'weight': weight,
      'height': height,
      'age': age,
      'gender': gender,
      'activityLevel': _getActivityLevelDescription(fitnessGoal),
      'goalDescription': _getFitnessGoalDescription(fitnessGoal),
      'proteinCalories': macros['protein']! * 4,
      'carbsCalories': macros['carbs']! * 4,
      'fatCalories': macros['fat']! * 9,
      'proteinPercentage': (macros['protein']! * 4 / dailyCalories * 100)
          .round(),
      'carbsPercentage': (macros['carbs']! * 4 / dailyCalories * 100).round(),
      'fatPercentage': (macros['fat']! * 9 / dailyCalories * 100).round(),
    };

    return NutritionRecommendation(
      dailyCalories: dailyCalories,
      protein: macros['protein']!,
      carbs: macros['carbs']!,
      fat: macros['fat']!,
      waterIntake: waterIntake,
      bmr: bmr,
      tdee: tdee,
      fitnessGoal: fitnessGoal,
      breakdown: breakdown,
    );
  }

  static String _getActivityLevelDescription(String fitnessGoal) {
    switch (fitnessGoal) {
      case '1':
        return 'Lightly to Moderately Active';
      case '2':
        return 'Moderately Active';
      case '3':
        return 'Moderately Active';
      case '4':
        return 'Very Active';
      case '5':
        return 'Very Active';
      case '6':
        return 'Moderately Active';
      default:
        return 'Moderately Active';
    }
  }

  static String _getFitnessGoalDescription(String fitnessGoal) {
    switch (fitnessGoal) {
      case '1':
        return 'Giảm mỡ / Fat Loss';
      case '2':
        return 'Tăng cơ / Muscle Gain';
      case '3':
        return 'Duy trì sức khỏe / Maintain Health';
      case '4':
        return 'Tăng sức bền / Endurance';
      case '5':
        return 'Tăng sức mạnh / Strength';
      case '6':
        return 'Tăng cơ giảm mỡ / Body Recomposition';
      default:
        return 'Duy trì sức khỏe / Maintain Health';
    }
  }
}
