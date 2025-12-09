import 'package:cloud_firestore/cloud_firestore.dart';

/// Một món ăn trong bữa ăn
class Dish {
  final String name;
  final double calories;
  final double protein; // gram
  final double carbs; // gram
  final double fat; // gram
  final String? ingredients;
  final String? cookingMethod;

  Dish({
    required this.name,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    this.ingredients,
    this.cookingMethod,
  });

  factory Dish.fromJson(Map<String, dynamic> json) {
    return Dish(
      name: json['name'] ?? '',
      calories: (json['calories'] ?? 0).toDouble(),
      protein: (json['protein'] ?? 0).toDouble(),
      carbs: (json['carbs'] ?? 0).toDouble(),
      fat: (json['fat'] ?? 0).toDouble(),
      ingredients: json['ingredients'],
      cookingMethod: json['cooking_method'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'calories': calories,
      'protein': protein,
      'carbs': carbs,
      'fat': fat,
      'ingredients': ingredients,
      'cooking_method': cookingMethod,
    };
  }

  double get totalMacros => protein + carbs + fat;
}

/// Một bữa ăn (sáng/trưa/tối/phụ)
class Meal {
  final String type; // breakfast, lunch, dinner, snack
  final List<Dish> dishes;
  final String? notes;

  Meal({required this.type, required this.dishes, this.notes});

  String get typeName {
    switch (type) {
      case 'breakfast':
        return 'Bữa sáng';
      case 'lunch':
        return 'Bữa trưa';
      case 'dinner':
        return 'Bữa tối';
      case 'snack':
        return 'Bữa phụ';
      default:
        return type;
    }
  }

  double get totalCalories =>
      dishes.fold(0, (sum, dish) => sum + dish.calories);
  double get totalProtein => dishes.fold(0, (sum, dish) => sum + dish.protein);
  double get totalCarbs => dishes.fold(0, (sum, dish) => sum + dish.carbs);
  double get totalFat => dishes.fold(0, (sum, dish) => sum + dish.fat);

  factory Meal.fromJson(Map<String, dynamic> json) {
    return Meal(
      type: json['type'] ?? '',
      dishes:
          (json['dishes'] as List?)?.map((d) => Dish.fromJson(d)).toList() ??
          [],
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'dishes': dishes.map((d) => d.toJson()).toList(),
      'notes': notes,
    };
  }
}

/// Thực đơn cho một ngày
class DayMealPlan {
  final int dayNumber; // 1-7 (Thứ 2 - Chủ nhật)
  final DateTime date;
  final List<Meal> meals;

  DayMealPlan({
    required this.dayNumber,
    required this.date,
    required this.meals,
  });

  String get dayName {
    final weekdays = [
      'Chủ nhật',
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7',
    ];
    return weekdays[date.weekday % 7];
  }

  double get totalCalories =>
      meals.fold(0, (sum, meal) => sum + meal.totalCalories);
  double get totalProtein =>
      meals.fold(0, (sum, meal) => sum + meal.totalProtein);
  double get totalCarbs => meals.fold(0, (sum, meal) => sum + meal.totalCarbs);
  double get totalFat => meals.fold(0, (sum, meal) => sum + meal.totalFat);

  factory DayMealPlan.fromJson(Map<String, dynamic> json) {
    return DayMealPlan(
      dayNumber: json['day_number'] ?? 1,
      date: (json['date'] as Timestamp).toDate(),
      meals:
          (json['meals'] as List?)?.map((m) => Meal.fromJson(m)).toList() ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'day_number': dayNumber,
      'date': Timestamp.fromDate(date),
      'meals': meals.map((m) => m.toJson()).toList(),
    };
  }
}

/// Thực đơn 7 ngày hoàn chỉnh
class WeeklyMealPlan {
  final String id;
  final String userId;
  final DateTime createdAt;
  final List<DayMealPlan> days;
  final String fitnessGoal;
  final double targetCalories;
  final double targetProtein;
  final double targetCarbs;
  final double targetFat;
  final List<String> preferences; // chay, eat_clean, low_carb, vietnamese...

  WeeklyMealPlan({
    required this.id,
    required this.userId,
    required this.createdAt,
    required this.days,
    required this.fitnessGoal,
    required this.targetCalories,
    required this.targetProtein,
    required this.targetCarbs,
    required this.targetFat,
    this.preferences = const [],
  });

  factory WeeklyMealPlan.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return WeeklyMealPlan(
      id: doc.id,
      userId: data['user_id'] ?? '',
      createdAt: (data['created_at'] as Timestamp).toDate(),
      days:
          (data['days'] as List?)
              ?.map((d) => DayMealPlan.fromJson(d))
              .toList() ??
          [],
      fitnessGoal: data['fitness_goal'] ?? '',
      targetCalories: (data['target_calories'] ?? 0).toDouble(),
      targetProtein: (data['target_protein'] ?? 0).toDouble(),
      targetCarbs: (data['target_carbs'] ?? 0).toDouble(),
      targetFat: (data['target_fat'] ?? 0).toDouble(),
      preferences: List<String>.from(data['preferences'] ?? []),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'user_id': userId,
      'created_at': Timestamp.fromDate(createdAt),
      'days': days.map((d) => d.toJson()).toList(),
      'fitness_goal': fitnessGoal,
      'target_calories': targetCalories,
      'target_protein': targetProtein,
      'target_carbs': targetCarbs,
      'target_fat': targetFat,
      'preferences': preferences,
    };
  }
}

/// Tùy chọn cho meal planner
class MealPlanPreferences {
  final bool isVegetarian; // Chay
  final bool isEatClean; // Eat clean
  final bool isLowCarb; // Ít carbs
  final String cuisine; // vietnamese, asian, western, mixed
  final List<String> avoidFoods; // Thực phẩm tránh
  final int mealsPerDay; // 3 or 4 (có bữa phụ không)

  MealPlanPreferences({
    this.isVegetarian = false,
    this.isEatClean = false,
    this.isLowCarb = false,
    this.cuisine = 'vietnamese',
    this.avoidFoods = const [],
    this.mealsPerDay = 3,
  });

  List<String> toPreferencesList() {
    List<String> prefs = [];
    if (isVegetarian) prefs.add('chay');
    if (isEatClean) prefs.add('eat_clean');
    if (isLowCarb) prefs.add('low_carb');
    prefs.add(cuisine);
    if (mealsPerDay == 4) prefs.add('with_snack');
    return prefs;
  }

  String getCuisineName() {
    switch (cuisine) {
      case 'vietnamese':
        return 'Món Việt';
      case 'asian':
        return 'Món Á';
      case 'western':
        return 'Món Âu';
      case 'mixed':
        return 'Hỗn hợp';
      default:
        return cuisine;
    }
  }
}
