# PT Review System Implementation Guide

## 📋 Tổng quan
Hệ thống đánh giá PT cho phép học viên đánh giá huấn luyện viên (1-5 sao + nhận xét) sau khi hoàn thành contract.

## ✅ Các tính năng đã triển khai

### 1. Data Model
**File:** `frontend_flutter/lib/features/model/pt_review.model.dart`
- Fields: `id`, `contractId`, `userId`, `ptId`, `rating` (1-5), `comment`, `createdAt`, `updatedAt`, `userName`, `userAvatar`
- Methods: `toFirestore()`, `fromFirestore()`, `fromMap()`, `isValidRating()`, `copyWith()`
- Validation: Rating phải từ 1-5 sao

### 2. Contract Model Updates
**File:** `frontend_flutter/lib/features/model/contract.mode.dart`
- Thêm fields:
  - `isReviewed` (bool): Đã đánh giá chưa
  - `reviewId` (String?): ID của review
- Updated: Constructor, `fromMap()`, `toMap()` methods

### 3. Review Service
**File:** `frontend_flutter/lib/features/services/review_service.dart`

**Methods:**
- `createReview()`: Tạo review mới
  - Validate rating + contract status
  - Tạo document trong `pt_reviews` collection
  - Update contract: `isReviewed = true`
  - Tự động tính lại rating trung bình của PT
  
- `getReviewsByPtId()`: Lấy tất cả reviews của PT (sorted desc)

- `getReviewByContractId()`: Lấy review của contract cụ thể

- `getPTReviewStats()`: Thống kê reviews
  - `totalReviews`: Tổng số reviews
  - `averageRating`: Điểm trung bình
  - `ratingDistribution`: Phân bố theo sao {1: count, 2: count, ...}

- `_calculateAndUpdatePTRating()`: Cập nhật rating của PT trong `employees` collection
  - Update fields: `rating` (double), `totalReviews` (int)

- `deleteReview()`: Xóa review (admin only)

- `updateReview()`: Chỉnh sửa review

### 4. UI Components

#### RatingStars Widget
**File:** `frontend_flutter/lib/features/widgets/rating_stars.dart`

**Features:**
- Display mode: Hiển thị rating với nửa sao
- Interactive mode: Cho phép chọn 1-5 sao
- Customizable: size, colors, spacing
- `showRatingValue`: Hiển thị số rating (4.5)

**Bonus:** `RatingDistributionWidget` - Hiển thị progress bar phân bố rating

**Usage:**
```dart
// Display only
RatingStars(rating: 4.5, size: 20, showRatingValue: true)

// Interactive
RatingStars(
  rating: 3, 
  size: 30, 
  onRatingChanged: (rating) { print(rating); }
)
```

#### ReviewDialog
**File:** `frontend_flutter/lib/features/widgets/review_dialog.dart`

**Features:**
- Interactive star selection
- Comment input (10-500 ký tự)
- Validation: rating required, minimum comment length
- Rating descriptions: "Rất hài lòng", "Hài lòng", etc.
- Loading state khi submit

**Helper function:**
```dart
final result = await showReviewDialog(
  context: context,
  contractId: contract.id,
  userId: currentUser.uid,
  ptId: contract.ptId,
  ptName: 'Tên PT',
);
// Returns true nếu review thành công
```

### 5. Contract Detail Screen Integration
**File:** `frontend_flutter/lib/features/personal_PT/screen/contract_detail_screen.dart`

**Changes:**
- Added import: `FirebaseAuth`, `ReviewDialog`
- Review button section:
  - Hiển thị khi: `status == 'completed' && !isReviewed`
  - Gọi `ReviewDialog` khi click
  - Auto-reload contract sau khi review thành công
- Success indicator:
  - Hiển thị "Bạn đã đánh giá huấn luyện viên này" khi `isReviewed == true`

### 6. PT Profile Screen Updates
**File:** `frontend_flutter/lib/features/package/widgets/pt/detail_PT_screen.dart`

**Changes:**
- Converted từ `StatelessWidget` → `StatefulWidget`
- Added fields:
  - `_reviewService`: ReviewService instance
  - `_reviews`: List<PTReviewModel>
  - `_isLoadingReviews`: Loading state
  - `_reviewStats`: Thống kê reviews

**New Sections:**
1. **Rating Overview Section:**
   - Average rating lớn (48px)
   - Rating stars
   - Total reviews count
   - Rating distribution progress bars (1-5 sao)

2. **Recent Reviews Section:**
   - Hiển thị 5 reviews gần nhất
   - ReviewCard với avatar, name, rating, comment, date
   - Button "Xem tất cả X đánh giá" nếu > 5 reviews

**New Widgets:**
- `_ReviewCard`: Card hiển thị 1 review
  - Avatar + name + rating stars
  - Comment text
  - Relative date ("Hôm nay", "3 ngày trước")
  
- `_AllReviewsDialog`: Dialog full-screen hiển thị tất cả reviews

## 🗄️ Database Structure

### Firestore Collection: `pt_reviews`
```javascript
{
  id: "review_id",
  contractId: "contract_id",
  userId: "user_uid",
  ptId: "pt_employee_id",
  rating: 5, // 1-5
  comment: "Huấn luyện viên rất tận tâm...",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  userName: "Nguyễn Văn A", // Cached
  userAvatar: "url" // Cached
}
```

### Updated Collection: `contracts`
```javascript
{
  // ... existing fields ...
  isReviewed: false,
  reviewId: "review_id" // nullable
}
```

### Updated Collection: `employees` (PT only)
```javascript
{
  // ... existing fields ...
  rating: 4.5, // Được tính tự động từ reviews
  totalReviews: 23 // Được tính tự động
}
```

## 🔄 Flow hoàn chỉnh

1. **Contract hoàn thành:**
   - `status` = 'completed'
   - `isReviewed` = false
   
2. **Nút "Đánh giá PT" xuất hiện** trong ContractDetailScreen

3. **User click → ReviewDialog hiển thị:**
   - Chọn 1-5 sao
   - Nhập comment (min 10 ký tự)
   - Click "Gửi đánh giá"

4. **ReviewService.createReview() xử lý:**
   - Validate input
   - Tạo document trong `pt_reviews`
   - Update contract: `isReviewed = true`, `reviewId = <id>`
   - Tính lại PT rating:
     - Query tất cả reviews của PT
     - Calculate average
     - Update `employees` collection

5. **UI updates:**
   - ContractDetailScreen reload → hiển thị "Đã đánh giá"
   - PT Profile Screen tự động load reviews mới khi mở

## 🎨 UI/UX Highlights

- ⭐ Rating stars với màu vàng (#FFB800)
- 📊 Progress bars cho rating distribution
- 💬 Review cards với avatar và relative dates
- ✅ Success indicators
- 🔒 Prevent duplicate reviews (1 review/contract)
- 📱 Responsive dialog và cards
- 🌙 Dark mode support (via AppColors theme)

## 🧪 Testing Checklist

### Unit Tests
- [ ] PTReviewModel serialization/deserialization
- [ ] isValidRating() method
- [ ] ReviewService methods with mocked Firestore

### Integration Tests
- [ ] Create review flow
- [ ] PT rating calculation accuracy
- [ ] Duplicate review prevention

### UI Tests
- [ ] Review button visibility based on contract status
- [ ] ReviewDialog star selection
- [ ] Comment validation
- [ ] Rating distribution display

### End-to-End Tests
1. [ ] Complete a contract
2. [ ] Verify review button appears
3. [ ] Submit review with 4 stars + comment
4. [ ] Verify contract shows "Đã đánh giá"
5. [ ] Open PT profile → verify review appears
6. [ ] Verify PT rating updated correctly
7. [ ] Try to review again → should be blocked

### Edge Cases
- [ ] Rating = 1 (minimum)
- [ ] Rating = 5 (maximum)
- [ ] Comment exactly 10 characters
- [ ] Comment = 500 characters (max)
- [ ] Multiple users review same PT
- [ ] PT with 0 reviews
- [ ] Network errors during submit
- [ ] User logout during review process

## 📝 Notes

### Cached User Info
Reviews cache `userName` và `userAvatar` từ FirebaseAuth để tránh lookup user collection mỗi lần hiển thị review.

### Async Rating Update
`_calculateAndUpdatePTRating()` chạy async sau khi tạo review để không block UI. Errors được log nhưng không throw.

### Security Considerations
⚠️ **TODO:** Cần thêm Firestore Security Rules:
```javascript
match /pt_reviews/{reviewId} {
  // Chỉ user đã tạo mới được edit/delete
  allow create: if request.auth != null;
  allow read: if true; // Public read
  allow update, delete: if request.auth.uid == resource.data.userId;
}

match /contracts/{contractId} {
  // Chỉ update isReviewed khi tạo review
  allow update: if request.auth != null 
    && request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['isReviewed', 'reviewId', 'updatedAt']);
}
```

### Performance Considerations
- Reviews được load async khi mở PT profile
- Chỉ hiển thị 5 reviews đầu tiên (lazy load)
- Rating stats được cache trong `employees` collection

## 🚀 Deployment

Không cần thêm dependencies mới - tất cả đã có sẵn:
- `cloud_firestore`
- `firebase_auth`
- `provider`
- `google_fonts`

**Next steps:**
1. Run `flutter pub get` (nếu cần)
2. Test trên emulator/device
3. Deploy Firestore security rules
4. Monitor Firestore usage (reads/writes)

## 📚 Related Files

### Models
- `pt_review.model.dart` - Review data model
- `contract.mode.dart` - Updated with review fields

### Services
- `review_service.dart` - Business logic

### Widgets
- `rating_stars.dart` - Reusable rating widget
- `review_dialog.dart` - Review submission dialog

### Screens
- `contract_detail_screen.dart` - Contract với review button
- `detail_PT_screen.dart` - PT profile với reviews section

---

**Created:** 2024
**Status:** ✅ Implementation Complete - Ready for Testing
**Version:** 1.0.0
