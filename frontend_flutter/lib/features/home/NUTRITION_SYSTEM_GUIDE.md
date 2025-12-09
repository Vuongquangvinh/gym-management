# Nutrition Calculation System

## Tổng quan

Hệ thống tính toán dinh dưỡng tự động dựa trên thông tin cá nhân của user và mục tiêu tập luyện. Hệ thống tính toán:

- **Calories cần nạp hàng ngày** (Daily Caloric Intake)
- **Phân bổ Macronutrients** (Protein, Carbs, Fat)
- **Lượng nước cần uống** (Water Intake)
- **BMR & TDEE** (Metabolic rates)

## Công thức tính toán

### 1. BMR (Basal Metabolic Rate)

Sử dụng **công thức Mifflin-St Jeor** - chính xác nhất hiện nay:

**Nam:**
```
BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
```

**Nữ:**
```
BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
```

Trong đó:
- weight: cân nặng (kg)
- height: chiều cao (cm)
- age: tuổi (năm)

### 2. TDEE (Total Daily Energy Expenditure)

```
TDEE = BMR × Activity Level Factor
```

**Activity Level theo Fitness Goal:**

| Fitness Goal | Activity Level | Multiplier |
|--------------|----------------|------------|
| 1 - Giảm cân | Lightly to Moderately Active | 1.375 |
| 2 - Tăng cơ | Moderately Active | 1.55 |
| 3 - Duy trì sức khỏe | Moderately Active | 1.55 |
| 4 - Tăng sức bền | Very Active | 1.725 |
| 5 - Tăng sức mạnh | Very Active | 1.725 |

### 3. Daily Calories

```
Daily Calories = TDEE ± Caloric Adjustment
```

**Caloric Adjustment theo Fitness Goal:**

| Goal | Adjustment | Lý do |
|------|-----------|-------|
| 1 - Giảm cân | -500 kcal | Giảm ~0.5kg/tuần an toàn |
| 2 - Tăng cơ | +400 kcal | Thặng dư để tăng cơ |
| 3 - Duy trì | 0 kcal | Giữ nguyên TDEE |
| 4 - Tăng sức bền | +200 kcal | Tăng nhẹ cho năng lượng |
| 5 - Tăng sức mạnh | +500 kcal | Thặng dư cao cho sức mạnh |

### 4. Macronutrients Distribution

#### Goal 1: Giảm cân (High Protein, Moderate Carbs, Low Fat)
- **Protein:** 2.2g/kg cân nặng
- **Fat:** 25% tổng calories
- **Carbs:** Phần còn lại

#### Goal 2: Tăng cơ (Very High Protein, High Carbs)
- **Protein:** 2.5g/kg cân nặng
- **Carbs:** 45% tổng calories
- **Fat:** Phần còn lại

#### Goal 3: Duy trì (Balanced)
- **Protein:** 1.8g/kg cân nặng
- **Carbs:** 40% tổng calories
- **Fat:** 30% tổng calories

#### Goal 4: Tăng sức bền (High Carbs, Moderate Protein)
- **Protein:** 1.6g/kg cân nặng
- **Carbs:** 55% tổng calories
- **Fat:** Phần còn lại

#### Goal 5: Tăng sức mạnh (Very High Protein, High Carbs)
- **Protein:** 2.4g/kg cân nặng
- **Carbs:** 45% tổng calories
- **Fat:** Phần còn lại

**Lưu ý Calories từ Macros:**
- 1g Protein = 4 calories
- 1g Carbs = 4 calories
- 1g Fat = 9 calories

### 5. Water Intake

```
Water Intake = (Weight × 0.035L) + Activity Bonus
```

**Activity Bonus theo Fitness Goal:**

| Goal | Bonus | Tổng |
|------|-------|------|
| 1 - Giảm cân | +0.5L | Base + 0.5L |
| 2 - Tăng cơ | +1.0L | Base + 1.0L |
| 3 - Duy trì | +0.5L | Base + 0.5L |
| 4 - Tăng sức bền | +1.5L | Base + 1.5L |
| 5 - Tăng sức mạnh | +1.0L | Base + 1.0L |

## Cách sử dụng

### 1. Tính toán cho một user

```dart
import 'package:frontend_flutter/features/model/user.model.dart';
import 'package:frontend_flutter/features/services/nutrition_calculation_service.dart';

// Giả sử bạn đã có UserModel từ Firestore
UserModel user = UserModel.fromFirestore(doc);

// Tính toán dinh dưỡng
NutritionRecommendation nutrition = 
    NutritionCalculationService.calculateNutrition(user);

// Sử dụng kết quả
print('Daily Calories: ${nutrition.dailyCalories}');
print('Protein: ${nutrition.protein}g');
print('Carbs: ${nutrition.carbs}g');
print('Fat: ${nutrition.fat}g');
print('Water: ${nutrition.waterIntake}L');
```

### 2. Hiển thị trong UI

```dart
import 'package:frontend_flutter/features/widgets/nutrition_recommendation_widget.dart';

// Trong widget build method
NutritionRecommendationWidget(
  nutrition: nutrition,
)
```

### 3. Sử dụng màn hình đầy đủ

```dart
import 'package:frontend_flutter/features/home/screens/nutrition_screen.dart';

// Navigate đến màn hình
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => NutritionScreen(user: currentUser),
  ),
);
```

## Ví dụ tính toán

### Ví dụ 1: User giảm cân

**Thông tin:**
- Tuổi: 21 (sinh năm 2004)
- Giới tính: Other
- Cân nặng: 70kg
- Chiều cao: 150cm
- Fitness Goal: "3" (Duy trì sức khỏe) - trong data mẫu

**Tính toán:**

1. **BMR** (trung bình nam/nữ):
   - Nam: (10 × 70) + (6.25 × 150) - (5 × 21) + 5 = 1,533.5 kcal
   - Nữ: (10 × 70) + (6.25 × 150) - (5 × 21) - 161 = 1,367.5 kcal
   - Trung bình: ~1,450 kcal

2. **TDEE** (Moderately Active - 1.55):
   - TDEE = 1,450 × 1.55 = ~2,248 kcal

3. **Daily Calories** (Duy trì - 0):
   - Daily = 2,248 kcal

4. **Macros** (Balanced):
   - Protein: 70 × 1.8 = 126g (504 kcal)
   - Carbs: 2,248 × 0.40 / 4 = 225g (900 kcal)
   - Fat: 2,248 × 0.30 / 9 = 75g (675 kcal)

5. **Water**:
   - Water = (70 × 0.035) + 0.5 = 2.95L

### Ví dụ 2: User tăng cơ

**Thông tin:**
- Tuổi: 25
- Giới tính: Nam
- Cân nặng: 75kg
- Chiều cao: 175cm
- Fitness Goal: "2" (Tăng cơ)

**Tính toán:**

1. **BMR**:
   - BMR = (10 × 75) + (6.25 × 175) - (5 × 25) + 5 = 1,723.75 kcal

2. **TDEE** (Moderately Active):
   - TDEE = 1,723.75 × 1.55 = 2,672 kcal

3. **Daily Calories** (+400 cho tăng cơ):
   - Daily = 2,672 + 400 = 3,072 kcal

4. **Macros**:
   - Protein: 75 × 2.5 = 187.5g (750 kcal)
   - Carbs: 3,072 × 0.45 / 4 = 346g (1,382 kcal)
   - Fat: (3,072 - 750 - 1,382) / 9 = 104g (940 kcal)

5. **Water**:
   - Water = (75 × 0.035) + 1.0 = 3.625L

## Files trong hệ thống

```
lib/features/
├── model/
│   └── nutrition_recommendation.dart    # Model lưu trữ kết quả tính toán
├── services/
│   └── nutrition_calculation_service.dart   # Service tính toán các chỉ số
├── widgets/
│   └── nutrition_recommendation_widget.dart # Widget hiển thị kết quả
└── home/screens/
    └── nutrition_screen.dart            # Màn hình đầy đủ với tips
```

## Tích hợp vào Home Screen

Có thể thêm một quick action trong `home_screen.dart`:

```dart
// Trong quick_actions_widget.dart hoặc home_screen.dart
InkWell(
  onTap: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => NutritionScreen(user: currentUser),
      ),
    );
  },
  child: Column(
    children: [
      Icon(Icons.restaurant_menu, size: 32),
      SizedBox(height: 8),
      Text('Dinh dưỡng'),
    ],
  ),
)
```

## Tùy chỉnh và mở rộng

### 1. Thêm mục tiêu mới

Cập nhật trong `nutrition_calculation_service.dart`:

```dart
case '6': // Mục tiêu mới
  activityMultiplier = 1.x;
  // ... các thiết lập khác
  break;
```

### 2. Thay đổi công thức tính

Có thể sửa các method trong `NutritionCalculationService`:
- `calculateBMR()` - Công thức tính BMR
- `calculateTDEE()` - Công thức tính TDEE
- `calculateMacros()` - Phân bổ macros
- `calculateWaterIntake()` - Lượng nước

### 3. Lưu vào Firestore

Có thể lưu kết quả vào Firestore để tracking:

```dart
// Trong user document hoặc subcollection
await FirebaseFirestore.instance
    .collection('users')
    .doc(user.id)
    .collection('nutrition_history')
    .add({
      ...nutrition.toMap(),
      'calculatedAt': FieldValue.serverTimestamp(),
    });
```

## Lưu ý quan trọng

1. **Dữ liệu đầu vào:**
   - Đảm bảo user có đầy đủ: weight, height, date_of_birth, gender, fitness_goal
   - Nếu thiếu, sử dụng giá trị mặc định

2. **Độ chính xác:**
   - Công thức chỉ là ước tính, cần điều chỉnh theo thực tế
   - Khuyến khích user theo dõi và feedback

3. **Cập nhật:**
   - Nên tính lại khi user thay đổi cân nặng, mục tiêu
   - Có thể set up listener để tự động tính lại

4. **Hiển thị:**
   - Làm tròn số để dễ đọc
   - Thêm tooltips giải thích các thuật ngữ
   - Cung cấp gợi ý thực tế cho từng mục tiêu

## Support & Contact

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ đội ngũ phát triển.
