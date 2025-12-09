class NutritionRecommendation {
  final double dailyCalories;
  final double protein; // grams
  final double carbs; // grams
  final double fat; // grams
  final double waterIntake; // liters
  final double bmr; // Basal Metabolic Rate
  final double tdee; // Total Daily Energy Expenditure
  final String fitnessGoal;
  final Map<String, dynamic> breakdown;

  NutritionRecommendation({
    required this.dailyCalories,
    required this.protein,
    required this.carbs,
    required this.fat,
    required this.waterIntake,
    required this.bmr,
    required this.tdee,
    required this.fitnessGoal,
    required this.breakdown,
  });

  Map<String, dynamic> toMap() {
    return {
      'dailyCalories': dailyCalories,
      'protein': protein,
      'carbs': carbs,
      'fat': fat,
      'waterIntake': waterIntake,
      'bmr': bmr,
      'tdee': tdee,
      'fitnessGoal': fitnessGoal,
      'breakdown': breakdown,
    };
  }

  factory NutritionRecommendation.fromMap(Map<String, dynamic> map) {
    return NutritionRecommendation(
      dailyCalories: map['dailyCalories']?.toDouble() ?? 0.0,
      protein: map['protein']?.toDouble() ?? 0.0,
      carbs: map['carbs']?.toDouble() ?? 0.0,
      fat: map['fat']?.toDouble() ?? 0.0,
      waterIntake: map['waterIntake']?.toDouble() ?? 0.0,
      bmr: map['bmr']?.toDouble() ?? 0.0,
      tdee: map['tdee']?.toDouble() ?? 0.0,
      fitnessGoal: map['fitnessGoal'] ?? '',
      breakdown: Map<String, dynamic>.from(map['breakdown'] ?? {}),
    );
  }
}
