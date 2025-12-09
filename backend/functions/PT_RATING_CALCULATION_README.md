# PT Rating Calculation System

## 📋 Tổng quan

Hệ thống tính rating trung bình cho PT với **3 layers đảm bảo data luôn chính xác**:

### Layer 1: Flutter Client (ReviewService)
- Tự động tính rating sau khi create/update/delete review
- Sử dụng Firestore Transaction để đảm bảo atomic update
- Public method `calculateAndUpdatePTRating(ptId)` có thể gọi bất cứ lúc nào

### Layer 2: Cloud Functions (Backend)
- **Firestore Trigger**: Tự động chạy khi có thay đổi trong `pt_reviews` collection
- **Backup layer**: Đảm bảo rating được update ngay cả khi Flutter client lỗi
- **Always correct**: Tính từ Firestore data, không phụ thuộc client

### Layer 3: Manual Recalculate (Admin)
- HTTP Callable Function cho admin
- Recalculate tất cả PT ratings cùng lúc
- Use case: Data migration, fix inconsistency

## 🔧 Setup Cloud Functions

### 1. Cài đặt dependencies

```bash
cd backend/functions
npm install firebase-functions firebase-admin
```

### 2. Deploy functions

```bash
# Deploy tất cả functions
firebase deploy --only functions

# Hoặc deploy từng function cụ thể
firebase deploy --only functions:calculatePTRatingOnReviewChange
firebase deploy --only functions:recalculateAllPTRatings
```

### 3. Verify deployment

Kiểm tra trên Firebase Console:
- Functions → Logs → Xem có trigger chạy không
- Test bằng cách tạo 1 review mới trong app

## 📊 Algorithm

### Tính Average Rating

```
averageRating = SUM(all reviews.rating) / COUNT(all reviews)
totalReviews = COUNT(all reviews)
```

**Example:**
```
PT có 3 reviews: [5, 4, 5]
averageRating = (5 + 4 + 5) / 3 = 4.67
totalReviews = 3
```

### Update Employee Document

```javascript
employees/{ptId}.update({
  rating: 4.67,        // double
  totalReviews: 3,     // int
  updatedAt: Timestamp
})
```

## 🧪 Testing

### Test Firestore Trigger (Auto)

1. Mở app Flutter → Tạo review mới
2. Check Firebase Console → Functions → Logs
3. Verify log: `✅ PT {ptId} rating updated successfully`
4. Check Firestore → employees → ptId → rating & totalReviews updated

### Test Manual Recalculate (Admin)

**Option 1: Flutter (Recommended)**

```dart
import 'package:cloud_functions/cloud_functions.dart';

Future<void> recalculateAllRatings() async {
  try {
    final callable = FirebaseFunctions.instanceFor(region: 'asia-southeast1')
        .httpsCallable('recalculateAllPTRatings');
    
    final result = await callable.call();
    
    print('Success: ${result.data['successCount']} PTs updated');
    print('Errors: ${result.data['errorCount']}');
  } catch (e) {
    print('Error: $e');
  }
}
```

**Option 2: Firebase Console**

1. Functions → recalculateAllPTRatings → Test
2. Click "Run function"
3. Xem result trong Response tab

**Option 3: curl**

```bash
curl -X POST \
  https://asia-southeast1-{PROJECT_ID}.cloudfunctions.net/recalculateAllPTRatings \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 🔍 Monitoring

### Check Function Logs

```bash
firebase functions:log --only calculatePTRatingOnReviewChange
```

### Check Specific PT Rating

```dart
final reviewService = ReviewService();
final stats = await reviewService.getPTReviewStats(ptId);

print('Average: ${stats['averageRating']}');
print('Total Reviews: ${stats['totalReviews']}');
print('Distribution: ${stats['ratingDistribution']}');
```

## 🚨 Troubleshooting

### Rating không update sau khi review

**Possible causes:**
1. Cloud Function chưa deploy
2. Firestore trigger permission issue
3. Review không có field `ptId`

**Debug:**
```bash
# Check function logs
firebase functions:log

# Manual recalculate
# Gọi recalculateAllPTRatings() từ Flutter
```

### Rating sai số

**Solution:** Chạy manual recalculate
```dart
await reviewService.recalculateAllPTRatings();
```

## 📈 Performance

### Firestore Costs

**Per review action:**
- 1 write: Create review trong pt_reviews
- 1 write: Update contract.isReviewed
- N reads: Query all reviews của PT (N = số reviews của PT)
- 1 write: Update employees.rating

**Optimization tips:**
- Cloud Function chạy server-side → không tốn mobile data
- Transaction đảm bảo không duplicate writes
- Chỉ recalculate khi có thay đổi rating

### Latency

- Flutter client: ~500ms (sequential operations)
- Cloud Function: ~1-2s (trigger delay + execution)
- Manual recalculate all: ~5-10s (depends on số lượng PT)

## 🔐 Security

### Firestore Rules

```javascript
match /employees/{employeeId} {
  // Allow Cloud Function to update rating
  allow read: if true;
  allow update: if request.resource.data.diff(resource.data)
                   .affectedKeys()
                   .hasOnly(['rating', 'totalReviews', 'updatedAt']);
}
```

### Function Auth

Production nên enable auth check:

```javascript
exports.recalculateAllPTRatings = async (data, context) => {
  // Check admin role
  if (!context.auth) {
    throw new Error('Unauthorized');
  }
  
  const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  // ... rest of code
}
```

## 📝 Maintenance

### Data Migration

Khi migrate dữ liệu cũ (chưa có rating):

```bash
# 1. Deploy Cloud Functions
firebase deploy --only functions

# 2. Chạy manual recalculate từ Flutter admin panel
# Hoặc gọi trực tiếp:
curl -X POST https://asia-southeast1-{PROJECT_ID}.cloudfunctions.net/recalculateAllPTRatings
```

### Backup Strategy

Cloud Function logs được giữ 30 ngày. Export logs nếu cần:

```bash
firebase functions:log > backup_$(date +%Y%m%d).log
```

## ✅ Best Practices

1. **Always use Cloud Function cho production** - Đảm bảo rating chính xác không phụ thuộc client
2. **Flutter client call là optimization** - Faster UX, không cần đợi trigger
3. **Manual recalculate cho emergency** - Fix data nhanh khi có issue
4. **Monitor function logs** - Catch errors sớm
5. **Test trên staging trước** - Đảm bảo không ảnh hưởng production data

---

**Status:** ✅ Ready for Production
**Version:** 1.0.0
**Last Updated:** 2024-12-08
