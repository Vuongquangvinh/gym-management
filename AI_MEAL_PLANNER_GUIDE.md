# 🤖 AI Meal Planner - Hướng Dẫn Sử Dụng

## 🎯 Tổng Quan
AI Meal Planner sử dụng **Gemini AI** để tạo thực đơn 7 ngày cá nhân hóa dựa trên:
- Mục tiêu fitness (giảm mỡ, tăng cơ, duy trì, tăng sức bền, tăng sức mạnh)
- Chỉ số dinh dưỡng cần thiết (calories, protein, carbs, fat)
- Sở thích ăn uống (chay, eat clean, ít carbs, món Việt/Á/Âu)

## 📋 Tính Năng

### 1. **Tạo Thực Đơn AI**
- Nhấn nút **"Tạo thực đơn 7 ngày với AI"** trong màn hình Nutrition
- Chọn sở thích:
  - ✅ **Chay**: Không thịt, cá
  - ✅ **Eat Clean**: Ít dầu mỡ, thực phẩm tự nhiên
  - ✅ **Ít Carbs**: Tăng protein & fat, giảm carbs
  - ✅ **Loại món**: Món Việt, Món Á, Món Âu, Hỗn hợp
  - ✅ **Số bữa**: 3 bữa (sáng-trưa-tối) hoặc 4 bữa (+bữa phụ)
  - ✅ **Tránh thực phẩm**: Thêm các món không muốn ăn (tôm, cua, sữa...)

### 2. **Xem Thực Đơn**
- **Tabs theo ngày**: Vuốt qua 7 ngày trong tuần
- **Tóm tắt dinh dưỡng**: Calories, Protein, Carbs, Fat của cả ngày
- **Chi tiết bữa ăn**:
  - Tên món ăn
  - Nguyên liệu
  - Cách làm
  - Chỉ số dinh dưỡng từng món

### 3. **Lưu & Quản Lý**
- Thực đơn tự động lưu vào Firestore: `users/{userId}/meal_plans`
- Xem lại thực đơn cũ bất cứ lúc nào
- Tạo thực đơn mới khi muốn thay đổi

## 🔧 Cấu Hình (Quan Trọng!)

### **Bước 1: Lấy Gemini API Key**
1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập Google Account
3. Nhấn **"Create API Key"**
4. Copy API key

### **Bước 2: Cập Nhật Code**
Mở file: `lib/features/services/ai_meal_planner_service.dart`

Tìm dòng:
```dart
static const String _geminiApiKey = 'YOUR_GEMINI_API_KEY_HERE';
```

Thay bằng key của bạn:
```dart
static const String _geminiApiKey = 'AIzaSyD...your-actual-key...';
```

### **Bước 3: Hot Reload**
```bash
# Trong terminal Flutter
r  # hoặc R để hot restart
```

## 📊 Firestore Structure

```
users/
  {userId}/
    meal_plans/
      {planId}/
        - user_id: string
        - created_at: timestamp
        - fitness_goal: string ("1" | "2" | "3" | "4" | "5")
        - target_calories: number
        - target_protein: number
        - target_carbs: number
        - target_fat: number
        - preferences: array<string>
        - days: array<object>
          [
            {
              day_number: 1,
              date: timestamp,
              meals: [
                {
                  type: "breakfast" | "lunch" | "dinner" | "snack",
                  dishes: [
                    {
                      name: "Tên món",
                      calories: 400,
                      protein: 25,
                      carbs: 45,
                      fat: 10,
                      ingredients: "Nguyên liệu...",
                      cooking_method: "Cách làm..."
                    }
                  ],
                  notes: "Gợi ý..."
                }
              ]
            }
          ]
```

## 🎨 UI Components

### 1. **MealPreferencesDialog**
- Dialog chọn sở thích trước khi tạo thực đơn
- Checkboxes cho chế độ ăn
- Chips cho loại món
- Radio buttons cho số bữa

### 2. **MealPlanScreen**
- TabBar 7 ngày
- ExpansionTile cho từng bữa ăn
- Summary card dinh dưỡng mỗi ngày
- Info dialog hiển thị thông tin thực đơn

### 3. **AI Service**
- `generateWeeklyMealPlan()`: Tạo thực đơn mới
- `getLatestMealPlan()`: Lấy thực đơn gần nhất
- `deleteMealPlan()`: Xóa thực đơn
- Fallback mechanism: Nếu AI fail → Tạo thực đơn mẫu

## ⚡ Performance

### **Gemini API Limits (Free Tier)**
- **Requests**: 60 requests/phút
- **Tokens**: ~32K tokens/request
- **Response time**: 10-20 giây

### **Caching Strategy**
- Lưu meal plan vào Firestore sau khi tạo
- Load from cache nếu có sẵn
- Chỉ gọi AI khi user muốn tạo mới

## 🐛 Troubleshooting

### **Lỗi: "Gemini API error: 400"**
- ✅ Kiểm tra API key đã cập nhật chưa
- ✅ Đảm bảo đã enable Gemini API trong Google Cloud Console

### **Lỗi: "Failed to parse AI response"**
- ✅ AI trả về format không đúng → Sử dụng fallback meal plan
- ✅ Check console logs để xem raw response

### **Thực đơn không phù hợp**
- ✅ Điều chỉnh preferences cụ thể hơn
- ✅ Thêm nhiều món vào "Tránh thực phẩm"
- ✅ Tạo lại thực đơn mới

## 🔐 Security Best Practices

**⚠️ KHÔNG commit API key lên Git!**

Sử dụng một trong các cách:
1. **Environment Variables** (.env file)
2. **Firebase Remote Config**
3. **Backend proxy** (khuyên dùng cho production)

### Ví dụ với .env:
```env
GEMINI_API_KEY=AIzaSyD...your-key...
```

```dart
// Load từ .env
static final String _geminiApiKey = 
  const String.fromEnvironment('GEMINI_API_KEY');
```

## 📈 Future Enhancements

- [ ] Lưu meal plan yêu thích
- [ ] Chia sẻ thực đơn với bạn bè
- [ ] Tích hợp shopping list tự động
- [ ] Thống kê dinh dưỡng theo tuần/tháng
- [ ] Scan ảnh món ăn để log calories
- [ ] Chatbot tư vấn dinh dưỡng 24/7

## 🎉 Kết Luận

AI Meal Planner giúp user:
- ✅ Tiết kiệm thời gian suy nghĩ ăn gì
- ✅ Đạt đúng chỉ số dinh dưỡng mục tiêu
- ✅ Đa dạng món ăn, không nhàm chán
- ✅ Cá nhân hóa theo sở thích
- ✅ Học cách nấu ăn healthy

**Happy meal planning! 🍽️🤖**
