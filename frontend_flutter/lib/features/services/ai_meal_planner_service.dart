import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:frontend_flutter/features/model/meal_plan.dart';
import 'package:frontend_flutter/features/model/nutrition_recommendation.dart';
import 'package:http/http.dart' as http;

class AIMealPlannerService {
  static final _firestore = FirebaseFirestore.instance;

  // Gemini API key - NÊN LƯU TRONG .env hoặc Firebase Remote Config
  // TODO: Lấy API key mới tại: https://aistudio.google.com/app/apikey
  static const String _geminiApiKey = 'AIzaSyBvQCIXucv3AeKfz4stHk4cSQceDVtBoik';
  static const String _geminiEndpoint =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  /// Tạo thực đơn 7 ngày với AI
  static Future<WeeklyMealPlan> generateWeeklyMealPlan({
    required String userId,
    required NutritionRecommendation nutrition,
    required String fitnessGoal,
    required MealPlanPreferences preferences,
  }) async {
    try {
      print('🤖 Generating meal plan with AI...');

      // Tạo prompt cho Gemini AI
      final prompt = _buildPrompt(nutrition, fitnessGoal, preferences);

      // Gọi Gemini API
      final aiResponse = await _callGeminiAPI(prompt);

      // Parse JSON response từ AI
      final mealPlanData = _parseMealPlanFromAI(aiResponse);

      // Tạo WeeklyMealPlan object
      final weeklyPlan = WeeklyMealPlan(
        id: '',
        userId: userId,
        createdAt: DateTime.now(),
        days: mealPlanData,
        fitnessGoal: fitnessGoal,
        targetCalories: nutrition.dailyCalories,
        targetProtein: nutrition.protein,
        targetCarbs: nutrition.carbs,
        targetFat: nutrition.fat,
        preferences: preferences.toPreferencesList(),
      );

      // Lưu vào Firestore và lấy ID
      final savedId = await _saveMealPlan(weeklyPlan);

      // Tạo lại với ID đã lưu
      final savedPlan = WeeklyMealPlan(
        id: savedId,
        userId: userId,
        createdAt: weeklyPlan.createdAt,
        days: mealPlanData,
        fitnessGoal: fitnessGoal,
        targetCalories: nutrition.dailyCalories,
        targetProtein: nutrition.protein,
        targetCarbs: nutrition.carbs,
        targetFat: nutrition.fat,
        preferences: preferences.toPreferencesList(),
      );

      print('✅ Meal plan generated and saved successfully');
      return savedPlan;
    } catch (e) {
      print('❌ Error generating meal plan: $e');
      // Fallback: Tạo thực đơn mẫu nếu AI fail
      final fallbackPlan = await _generateFallbackMealPlan(
        userId: userId,
        nutrition: nutrition,
        fitnessGoal: fitnessGoal,
        preferences: preferences,
      );
      return fallbackPlan;
    }
  }

  /// Xây dựng prompt cho Gemini AI
  static String _buildPrompt(
    NutritionRecommendation nutrition,
    String fitnessGoal,
    MealPlanPreferences preferences,
  ) {
    final goalName = _getGoalName(fitnessGoal);
    final cuisineName = preferences.getCuisineName();

    return '''
Bạn là chuyên gia dinh dưỡng thể thao Việt Nam. Hãy tạo thực đơn ĐA DẠNG 7 ngày cho người có mục tiêu: $goalName

**Yêu cầu dinh dưỡng mỗi ngày:**
- Calories: ${nutrition.dailyCalories.toStringAsFixed(0)} kcal
- Protein: ${nutrition.protein.toStringAsFixed(0)}g
- Carbs: ${nutrition.carbs.toStringAsFixed(0)}g
- Fat: ${nutrition.fat.toStringAsFixed(0)}g

**Sở thích:**
${preferences.isVegetarian ? '- Chế độ chay (không thịt, cá)' : ''}
${preferences.isEatClean ? '- Eat clean (ít dầu mỡ, tự nhiên)' : ''}
${preferences.isLowCarb ? '- Ít carbs (tăng protein/fat)' : ''}
- Món ăn: $cuisineName
- Số bữa/ngày: ${preferences.mealsPerDay} bữa
${preferences.avoidFoods.isNotEmpty ? '- Tránh: ${preferences.avoidFoods.join(", ")}' : ''}

**YÊU CẦU ĐẶC BIỆT VỀ ĐA DẠNG:**
1. MỖI NGÀY phải có món KHÁC NHAU, tránh lặp lại món trong tuần
2. Đa dạng nguồn protein: Gà, cá (hồi, thu, rô phi), bò, heo, trứng, đậu phụ, sữa chua
3. Đa dạng carbs: Cơm gạo lứt, yến mạch, khoai lang, khoai tây, bí đỏ, mì nguyên cám, bánh mì
4. Đa dạng rau: Bông cải xanh, cải bó xôi, cà rốt, cà chua, dưa chuột, rau muống, cải thảo
5. Mỗi bữa ăn nên có 2-3 món để cân bằng dinh dưỡng
6. Thay đổi phương pháp chế biến: Luộc, hấp, nướng, xào nhẹ, om

**GỢI Ý MÓN ĂN THEO TỪNG BỮA (Tham khảo, tạo biến thể):**

BỮA SÁNG (400-500 kcal):
- Thứ 2: Yến mạch + trứng luộc + chuối + sữa tươi
- Thứ 3: Bánh mì nguyên cám + ức gà nướng + bơ + cà chua
- Thứ 4: Cháo yến mạch + hạnh nhân + táo + mật ong
- Thứ 5: Trứng chiên + khoai lang luộc + bơ + cam
- Thứ 6: Phở gà (không dầu mỡ) + rau thơm
- Thứ 7: Bánh mì trứng + sữa chua Hy Lạp + dâu tây
- Chủ nhật: Bún bò + trứng + rau sống

BỮA TRƯA (600-700 kcal):
- Cơm gạo lứt + cá hồi nướng + rau luộc + canh
- Cơm + ức gà xào bông cải + đậu hũ sốt cà
- Mì nguyên cám + tôm + rau củ xào
- Cơm + bò bít tết + salad rau trộn
- Cơm + cá rô phi hấp + rau muống xào
- Khoai lang + ức gà luộc + dưa chuột
- Cơm + sườn heo nướng mật ong + canh bí

BỮA TỐI (500-600 kcal):
- Cá thu nướng + khoai tây nghiền + rau luộc
- Ức gà om cà chua + khoai lang + salad
- Bò xào rau củ + cơm gạo lứt ít
- Cá hồi áp chảo + bông cải xanh hấp + táo
- Tôm nướng + rau củ quay lò + cam
- Trứng chiên + bánh mì + bơ + sữa chua
- Gà nướng tiêu + bí đỏ hấp + dưa leo

BỮA PHỤ (200-300 kcal):
- Sữa chua Hy Lạp + granola + việt quất
- Chuối + bơ đậu phộng + hạnh nhân
- Khoai lang + protein shake
- Táo + pho mai ít béo
- Smoothie xanh (cải bó xôi + chuối + sữa)

**Định dạng JSON output (QUAN TRỌNG - CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT KHÁC):**
{
  "days": [
    {
      "day_number": 1,
      "meals": [
        {
          "type": "breakfast",
          "dishes": [
            {
              "name": "Tên món cụ thể",
              "calories": 400,
              "protein": 25,
              "carbs": 45,
              "fat": 10,
              "ingredients": "Liệt kê chi tiết: 100g ức gà, 150g cơm gạo lứt...",
              "cooking_method": "Hướng dẫn nấu từng bước ngắn gọn"
            }
          ],
          "notes": "Gợi ý thời gian ăn tối ưu"
        },
        {
          "type": "lunch",
          "dishes": [...]
        },
        {
          "type": "dinner",
          "dishes": [...]
        }
        ${preferences.mealsPerDay == 4 ? ', {"type": "snack", "dishes": [...]}' : ''}
      ]
    }
    // ... 6 ngày còn lại
  ]
}

Lưu ý:
- Mỗi ngày đủ 3-4 bữa
- Tổng calories/macros mỗi ngày gần với target
- Món ăn đa dạng, không lặp lại
- Thực tế, dễ làm tại Việt Nam
- CHỈ trả về JSON thuần, không markdown, không giải thích thêm
''';
  }

  /// Gọi Gemini API
  static Future<String> _callGeminiAPI(String prompt) async {
    try {
      final response = await http.post(
        Uri.parse('$_geminiEndpoint?key=$_geminiApiKey'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'contents': [
            {
              'parts': [
                {'text': prompt},
              ],
            },
          ],
          'generationConfig': {
            'temperature': 0.7,
            'topK': 40,
            'topP': 0.95,
            'maxOutputTokens': 8192,
          },
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final text = data['candidates'][0]['content']['parts'][0]['text'];

        // Clean JSON từ response (loại bỏ markdown code blocks nếu có)
        String cleanedJson = text.trim();
        if (cleanedJson.startsWith('```json')) {
          cleanedJson = cleanedJson.substring(7);
        }
        if (cleanedJson.startsWith('```')) {
          cleanedJson = cleanedJson.substring(3);
        }
        if (cleanedJson.endsWith('```')) {
          cleanedJson = cleanedJson.substring(0, cleanedJson.length - 3);
        }

        return cleanedJson.trim();
      } else {
        throw Exception('Gemini API error: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Gemini API call failed: $e');
      rethrow;
    }
  }

  /// Parse meal plan từ AI response
  static List<DayMealPlan> _parseMealPlanFromAI(String aiResponse) {
    try {
      final json = jsonDecode(aiResponse);
      final daysJson = json['days'] as List;

      final now = DateTime.now();
      final startOfWeek = now.subtract(Duration(days: now.weekday % 7));

      return daysJson.asMap().entries.map((entry) {
        final index = entry.key;
        final dayData = entry.value;

        return DayMealPlan(
          dayNumber: dayData['day_number'] ?? (index + 1),
          date: startOfWeek.add(Duration(days: index)),
          meals: (dayData['meals'] as List)
              .map((m) => Meal.fromJson(m))
              .toList(),
        );
      }).toList();
    } catch (e) {
      print('❌ Error parsing AI response: $e');
      rethrow;
    }
  }

  /// Lưu meal plan vào Firestore
  static Future<String> _saveMealPlan(WeeklyMealPlan plan) async {
    try {
      final docRef = await _firestore
          .collection('users')
          .doc(plan.userId)
          .collection('meal_plans')
          .add(plan.toFirestore());

      print('✅ Meal plan saved with ID: ${docRef.id}');
      return docRef.id;
    } catch (e) {
      print('❌ Error saving meal plan: $e');
      rethrow;
    }
  }

  /// Lấy meal plan mới nhất của user
  static Future<WeeklyMealPlan?> getLatestMealPlan(String userId) async {
    try {
      final snapshot = await _firestore
          .collection('users')
          .doc(userId)
          .collection('meal_plans')
          .orderBy('created_at', descending: true)
          .limit(1)
          .get();

      if (snapshot.docs.isEmpty) return null;

      return WeeklyMealPlan.fromFirestore(snapshot.docs.first);
    } catch (e) {
      print('❌ Error getting meal plan: $e');
      return null;
    }
  }

  /// Lấy tất cả meal plans của user
  static Future<List<WeeklyMealPlan>> getAllMealPlans(String userId) async {
    try {
      print('📥 Fetching meal plans for user: $userId');
      final snapshot = await _firestore
          .collection('users')
          .doc(userId)
          .collection('meal_plans')
          .orderBy('created_at', descending: true)
          .get();

      print('📊 Found ${snapshot.docs.length} documents in Firestore');

      final plans = snapshot.docs.map((doc) {
        print('   Document ID: ${doc.id}, has data: ${doc.data().isNotEmpty}');
        return WeeklyMealPlan.fromFirestore(doc);
      }).toList();

      print('✅ Parsed ${plans.length} meal plans successfully');
      return plans;
    } catch (e) {
      print('❌ Error getting all meal plans: $e');
      return [];
    }
  }

  /// Xóa meal plan
  static Future<void> deleteMealPlan(String userId, String planId) async {
    try {
      await _firestore
          .collection('users')
          .doc(userId)
          .collection('meal_plans')
          .doc(planId)
          .delete();
    } catch (e) {
      print('❌ Error deleting meal plan: $e');
      rethrow;
    }
  }

  /// Fallback: Tạo thực đơn mẫu khi AI fail
  static Future<WeeklyMealPlan> _generateFallbackMealPlan({
    required String userId,
    required NutritionRecommendation nutrition,
    required String fitnessGoal,
    required MealPlanPreferences preferences,
  }) async {
    print('⚠️ Using fallback meal plan (AI failed)');

    final now = DateTime.now();
    final startOfWeek = now.subtract(Duration(days: now.weekday % 7));

    // Thực đơn mẫu đơn giản
    final days = List.generate(7, (index) {
      return DayMealPlan(
        dayNumber: index + 1,
        date: startOfWeek.add(Duration(days: index)),
        meals: _getSampleMealsForDay(nutrition, preferences),
      );
    });

    final weeklyPlan = WeeklyMealPlan(
      id: '',
      userId: userId,
      createdAt: DateTime.now(),
      days: days,
      fitnessGoal: fitnessGoal,
      targetCalories: nutrition.dailyCalories,
      targetProtein: nutrition.protein,
      targetCarbs: nutrition.carbs,
      targetFat: nutrition.fat,
      preferences: preferences.toPreferencesList(),
    );

    // Lưu vào Firestore và lấy ID
    final savedId = await _saveMealPlan(weeklyPlan);
    print('✅ Fallback meal plan saved with ID: $savedId');

    // Tạo lại với ID đã lưu
    return WeeklyMealPlan(
      id: savedId,
      userId: userId,
      createdAt: weeklyPlan.createdAt,
      days: days,
      fitnessGoal: fitnessGoal,
      targetCalories: nutrition.dailyCalories,
      targetProtein: nutrition.protein,
      targetCarbs: nutrition.carbs,
      targetFat: nutrition.fat,
      preferences: preferences.toPreferencesList(),
    );
  }

  /// Tạo bữa ăn mẫu cho một ngày
  static List<Meal> _getSampleMealsForDay(
    NutritionRecommendation nutrition,
    MealPlanPreferences preferences,
  ) {
    final caloriesPerMeal = nutrition.dailyCalories / preferences.mealsPerDay;
    final proteinPerMeal = nutrition.protein / preferences.mealsPerDay;
    final carbsPerMeal = nutrition.carbs / preferences.mealsPerDay;
    final fatPerMeal = nutrition.fat / preferences.mealsPerDay;

    return [
      Meal(
        type: 'breakfast',
        dishes: [
          Dish(
            name: preferences.isVegetarian
                ? 'Yến mạch + trái cây + hạt'
                : 'Trứng + bánh mì nguyên cám + chuối',
            calories: caloriesPerMeal,
            protein: proteinPerMeal,
            carbs: carbsPerMeal,
            fat: fatPerMeal,
            ingredients: '3 quả trứng, 2 lát bánh mì nguyên cám, 1 quả chuối',
            cookingMethod: 'Trứng luộc hoặc chiên ít dầu',
          ),
        ],
        notes: 'Ăn trong vòng 1 giờ sau khi thức dậy',
      ),
      Meal(
        type: 'lunch',
        dishes: [
          Dish(
            name: preferences.isVegetarian
                ? 'Cơm gạo lứt + đậu hũ + rau xào'
                : 'Cơm gạo lứt + ức gà + rau luộc',
            calories: caloriesPerMeal,
            protein: proteinPerMeal,
            carbs: carbsPerMeal,
            fat: fatPerMeal,
            ingredients: '150g cơm gạo lứt, 150g ức gà, rau củ đa dạng',
            cookingMethod: 'Gà luộc hoặc nướng, rau luộc/xào nhẹ',
          ),
        ],
        notes: 'Ăn trước khi tập 2-3 tiếng',
      ),
      Meal(
        type: 'dinner',
        dishes: [
          Dish(
            name: preferences.isVegetarian
                ? 'Khoai lang + đậu + salad'
                : 'Cá hồi + khoai lang + salad',
            calories: caloriesPerMeal,
            protein: proteinPerMeal,
            carbs: carbsPerMeal,
            fat: fatPerMeal,
            ingredients: '150g cá hồi, 200g khoai lang, salad rau trộn',
            cookingMethod: 'Cá nướng/hấp, khoai luộc',
          ),
        ],
        notes: 'Ăn trong vòng 2 giờ sau khi tập',
      ),
      if (preferences.mealsPerDay == 4)
        Meal(
          type: 'snack',
          dishes: [
            Dish(
              name: 'Sữa chua Hy Lạp + hoa quả',
              calories: caloriesPerMeal,
              protein: proteinPerMeal,
              carbs: carbsPerMeal,
              fat: fatPerMeal,
              ingredients: '200ml sữa chua, 100g hoa quả tươi',
              cookingMethod: 'Trộn đều',
            ),
          ],
          notes: 'Bữa phụ giữa các bữa chính',
        ),
    ];
  }

  static String _getGoalName(String goal) {
    switch (goal) {
      case '1':
        return 'Giảm mỡ';
      case '2':
        return 'Tăng cơ';
      case '3':
        return 'Duy trì sức khỏe';
      case '4':
        return 'Tăng sức bền';
      case '5':
        return 'Tăng sức mạnh';
      default:
        return 'Duy trì sức khỏe';
    }
  }
}
