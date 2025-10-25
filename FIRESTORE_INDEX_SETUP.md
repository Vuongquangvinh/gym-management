# Hướng dẫn Fix Lỗi Firestore Index

## 🔴 Lỗi gặp phải:
```
[cloud_firestore/failed-precondition] The query requires an index.
```

## ✅ Đã thực hiện:

### 1. Thêm Composite Index vào `backend/firestore.indexes.json`:
```json
{
  "collectionGroup": "checkins",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "memberId", "mode": "ASCENDING" },
    { "fieldPath": "checkedAt", "mode": "DESCENDING" }
  ]
}
```

### 2. Deploy Index lên Firebase:
```bash
cd backend
firebase deploy --only firestore:indexes --project gym-managment-aa0a1
```

✅ **Kết quả:** Index đã được deploy thành công!

### 3. Cập nhật Error Handling:
- Thêm SnackBar hiển thị lỗi cho user
- Có nút "Thử lại" để reload dữ liệu
- Hiển thị message đặc biệt khi index đang được build

## ⏱️ Thời gian chờ:

**Index cần 2-5 phút để Firestore build xong.**

Trong lúc đó:
1. ✅ App vẫn chạy bình thường
2. ✅ Hiển thị message: "Đang khởi tạo database. Vui lòng thử lại sau 2-3 phút."
3. ✅ User có thể nhấn "Thử lại" để reload

## 🔍 Kiểm tra Index Status:

Truy cập Firebase Console:
https://console.firebase.google.com/project/gym-managment-aa0a1/firestore/indexes

Kiểm tra index `checkins` với fields:
- `memberId` (Ascending)
- `checkedAt` (Descending)

Status sẽ chuyển từ **"Building"** → **"Enabled"** khi hoàn thành.

## 🎯 Sau khi Index hoàn thành:

1. Mở lại app Flutter
2. Vào màn hình "Check-In History"
3. Dữ liệu sẽ load thành công! ✅

## 📝 Lưu ý:

- Index chỉ cần tạo **1 lần duy nhất**
- Sau khi enabled, query sẽ chạy rất nhanh
- Nếu sau 10 phút vẫn lỗi, check lại Firebase Console

## 🚀 Các Query được hỗ trợ:

Sau khi index hoàn thành, các query này sẽ hoạt động:

```dart
// Query 1: Lấy tất cả checkin của user
CheckinModel.getMyCheckinHistory(limit: 50)

// Query 2: Lấy checkin theo khoảng thời gian
CheckinModel.getMyCheckinHistory(
  startDate: DateTime.now().subtract(Duration(days: 7)),
  endDate: DateTime.now(),
)

// Query 3: Lấy checkin trong tháng
CheckinModel.getMonthlyCheckinCount()

// Query 4: Lấy checkin trong tuần  
CheckinModel.getWeeklyCheckinCount()

// Query 5: Kiểm tra đã checkin hôm nay
CheckinModel.hasCheckedInToday()
```

Tất cả đều cần index `memberId` + `checkedAt`! 🎉
