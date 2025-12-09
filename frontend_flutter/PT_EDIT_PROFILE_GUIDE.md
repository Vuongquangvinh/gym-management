# PT Edit Profile Feature Guide

## 📋 Tổng quan

Hệ thống cho phép PT (Personal Trainer) chỉnh sửa thông tin cá nhân và upload chứng chỉ. **Tất cả thay đổi phải được Admin duyệt trước khi áp dụng vào database**.

**🔄 Sử dụng collection `pendingRequests` - tương thích hoàn toàn với web admin panel!**

## 🎯 Tính năng chính

### 1. PT Edit Profile Screen
- ✅ Form chỉnh sửa đầy đủ thông tin PT
- ✅ Upload nhiều ảnh chứng chỉ cùng lúc (multi-image picker)
- ✅ Preview ảnh trước khi submit
- ✅ Validation form đầy vào
- ✅ Gửi request đến admin để duyệt

### 2. PT Profile Screen (đã refactor)
- ✅ Hiển thị thông tin PT (read-only)
- ✅ Button "Chỉnh sửa hồ sơ" dẫn đến edit screen
- ✅ Banner hiển thị pending requests
- ✅ Xem ảnh chứng chỉ (fullscreen dialog)
- ✅ Pull-to-refresh

### 3. Admin Review (sẽ làm phía React Admin)
- ⏳ Xem danh sách pending requests
- ⏳ Xem chi tiết request (old data vs new data)
- ⏳ Approve: Apply changes vào employees collection
- ⏳ Reject: Từ chối và ghi lý do

---

## 🗂️ Cấu trúc Firestore

### Collection: `pendingRequests` (Shared with Web Admin)

```json
{
  "id": "auto-generated-doc-id",
  "type": "employee_update",
  "employeeId": "djk0CItf5dyN8gPm7M28",
  "employeeEmail": "thinhho171@gmail.com",
  "employeeName": "Hồ Phúc Thịnh",
  "requestedBy": "EpzCCD3RCdaPsocYAXwlrhkawCD3",
  "requestedByName": "Hồ Phúc Thịnh",
  "employeeAvatar": "/uploads/employees/avatars/emp_xxx.jpg",
  "data": {
    "fullName": "Hồ Phúc Thịnh",
    "phone": "0707319207",
    "address": "cantho qdqwd",
    "dateOfBirth": "2004-12-11T00:00:00.000Z",
    "gender": "male",
    "idCard": "094204005930",
    "ptInfo": {
      "bio": "Chuyên gia giảm cân và tăng cơ...",
      "experience": 5,
      "maxClientsPerDay": 10,
      "specialties": ["Giảm cân", "Tăng cơ", "Yoga"],
      "achievements": ["Huấn luyện 100+ học viên"],
      "languages": ["vi", "en"],
      "certificates": [
        "https://storage.googleapis.com/.../cert_old1.jpg",
        "https://storage.googleapis.com/.../cert_new1.jpg"
      ],
      "isAcceptingNewClients": true
    }
  },
  "previousData": {
    "fullName": "Hồ Phúc Thịnh",
    "phone": "0707319207",
    "ptInfo": {...}
  },
  "status": "pending",
  "createdAt": "2025-12-09T10:30:00.000Z",
  "updatedAt": null,
  "approvedAt": null,
  "rejectedAt": null,
  "cancelledAt": null,
  "approvedBy": null,
  "rejectedBy": null,
  "rejectionReason": null
}
```

### Status values:
- `pending`: Chờ admin duyệt
- `approved`: Admin đã duyệt và áp dụng
- `rejected`: Admin từ chối
- `cancelled`: PT tự hủy request

---

## 📁 File Structure

```
lib/features/pt/
├── models/
│   ├── pt_client_model.dart
│   └── pt_edit_request_model.dart        ✅ NEW
├── services/
│   ├── pt_client_service.dart
│   └── pt_profile_service.dart           ✅ NEW
└── screens/
    ├── pt_clients_screen.dart
    ├── pt_client_detail_screen.dart
    ├── pt_profile_screen.dart            ✅ REFACTORED
    └── pt_edit_profile_screen.dart       ✅ NEW
```

---

## 🔥 Firestore Rules

Thêm rules sau vào `firestore.rules`:

```javascript
// PT Edit Requests - PT có thể tạo và xem request của mình
match /ptEditRequests/{requestId} {
  allow read: if request.auth != null && 
    (resource.data.ptId == request.auth.uid || 
     get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin');
  
  allow create: if request.auth != null && 
    request.resource.data.ptId == request.auth.uid &&
    request.resource.data.status == 'pending';
  
  allow update, delete: if request.auth != null && 
    get(/databases/$(database)/documents/employees/$(request.auth.uid)).data.role == 'admin';
}
```

---

## 🔑 Firebase Storage Rules

Thêm rules cho PT certificates:

```javascript
// Storage rules for PT certificates
match /pt_certificates/{ptId}/{filename} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == ptId;
}
```

---

## 🚀 Flow hoạt động

### 1. PT Submit Request

```dart
// PT mở màn hình chỉnh sửa
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => PTEditProfileScreen(employeeData: data),
  ),
);

// PT điền form và chọn ảnh chứng chỉ
_pickCertificateImages(); // Multi-image picker

// PT submit request
await _submitEditRequest();
  ↓
1. Upload certificate images to Firebase Storage
2. Create PTEditRequestModel with status='pending'
3. Save to Firestore ptEditRequests collection
4. Return to profile screen
```

### 2. Admin Review (React Admin - TODO)

```javascript
// Admin xem pending requests
GET /ptEditRequests?status=pending

// Admin xem chi tiết request
GET /ptEditRequests/{requestId}

// So sánh old data vs new data
const oldData = employeeDoc.ptInfo;
const newData = request.requestData.ptInfo;

// Approve
await approveRequest(requestId) {
  // 1. Update employees collection with new data
  await updateDoc(employeeRef, request.requestData);
  
  // 2. Update request status
  await updateDoc(requestRef, {
    status: 'approved',
    reviewedAt: now(),
    reviewedBy: adminUid
  });
}

// Reject
await rejectRequest(requestId, reason) {
  // 1. Delete uploaded certificate images from storage
  for (url of request.certificateImages) {
    await deleteFile(url);
  }
  
  // 2. Update request status
  await updateDoc(requestRef, {
    status: 'rejected',
    reviewedAt: now(),
    reviewedBy: adminUid,
    reviewNote: reason
  });
}
```

### 3. PT Check Status

```dart
// PT profile screen tự động load pending requests
final requests = await PTProfileService.getPendingRequests(ptId);

// Hiển thị banner nếu có pending requests
if (pendingRequests.isNotEmpty) {
  // Show orange banner with request info
}

// Pull-to-refresh để update status
RefreshIndicator(
  onRefresh: _loadProfile,
  child: ...
);
```

---

## 🎨 UI Components

### PTEditProfileScreen

**Sections:**
1. **Notice Banner** (Orange)
   - "Thông tin chỉnh sửa sẽ được gửi đến Admin để duyệt"

2. **Thông tin chuyên môn**
   - Bio (TextFormField, maxLines: 5)
   - Kinh nghiệm (số năm)
   - Số học viên tối đa/ngày
   - Switch: Nhận học viên mới

3. **Chuyên môn** (List editor)
   - Giảm cân, Tăng cơ, Yoga...
   - Add/Remove items

4. **Thành tích** (List editor)
   - Huấn luyện 100+ học viên...
   - Add/Remove items

5. **Ngôn ngữ** (List editor với preset)
   - Tiếng Việt, English, 中文, 日本語, 한국어

6. **Chứng chỉ (Hình ảnh)**
   - Hiển thị ảnh hiện tại (100x100 grid)
   - Hiển thị ảnh mới (với border xanh + nút X để xóa)
   - Button: "Thêm ảnh chứng chỉ" (multi-select)

7. **Submit Button** (AppBar)
   - Icon: send
   - Text: "Gửi yêu cầu"
   - Show loading indicator khi đang submit

### PTProfileScreen

**Sections:**
1. **Pending Requests Banner** (Orange, chỉ hiển thị nếu có)
   - Icon: schedule
   - Text: "Bạn có X yêu cầu đang chờ duyệt"
   - List các request với timestamp

2. **Edit Button** (Full width, Primary color)
   - Icon: edit
   - Text: "Chỉnh sửa hồ sơ"

3. **Thông tin cơ bản** (Card)
   - Họ tên, Email, Điện thoại, Giới tính

4. **Thông tin chuyên môn** (Card)
   - Giới thiệu, Kinh nghiệm, Số học viên tối đa, Nhận học viên mới

5. **Chuyên môn** (Card)
   - List với icon check_circle

6. **Chứng chỉ** (Card)
   - Grid 100x100 images
   - Tap to view fullscreen

7. **Thành tích** (Card)
   - List với icon check_circle

---

## 📊 Service Methods

### PTProfileService

```dart
// Upload certificate images to Firebase Storage
static Future<List<String>> uploadCertificateImages(
  String ptId,
  List<File> imageFiles,
) async { ... }

// Submit edit request
static Future<String> submitEditRequest({
  required String ptId,
  required String ptName,
  required String ptEmail,
  required Map<String, dynamic> requestData,
  required List<String> certificateImageUrls,
}) async { ... }

// Get pending requests
static Future<List<PTEditRequestModel>> getPendingRequests(
  String ptId,
) async { ... }

// Get all requests (pending, approved, rejected)
static Future<List<PTEditRequestModel>> getAllRequests(
  String ptId,
) async { ... }

// Stream pending requests (real-time)
static Stream<List<PTEditRequestModel>> streamPendingRequests(
  String ptId,
) { ... }

// Check if PT has pending requests
static Future<bool> hasPendingRequests(String ptId) async { ... }

// Cancel pending request
static Future<void> cancelEditRequest(String requestId) async { ... }

// Delete certificate image
static Future<void> deleteCertificateImage(String imageUrl) async { ... }

// Get current PT data
static Future<Map<String, dynamic>?> getCurrentPTData() async { ... }
```

---

## 🔒 Security

### Data Validation
- ✅ Form validation trước khi submit
- ✅ Check có thay đổi gì không
- ✅ Confirm dialog trước khi gửi
- ✅ Image size/format validation (ImagePicker auto handles)

### Authentication
- ✅ Chỉ PT mới tạo được request cho chính mình
- ✅ Chỉ Admin mới approve/reject được
- ✅ Firestore rules enforce authentication

### Storage
- ✅ Certificate images lưu theo ptId: `pt_certificates/{ptId}/cert_{timestamp}_{index}.jpg`
- ✅ Chỉ PT owner mới upload được vào folder của mình
- ✅ Delete images khi cancel/reject request

---

## 🧪 Testing

### Test Cases

**PT Side:**
1. ✅ Load profile screen → Show current data
2. ✅ Tap "Chỉnh sửa hồ sơ" → Navigate to edit screen
3. ✅ Fill form with new data
4. ✅ Pick multiple certificate images
5. ✅ Remove selected image
6. ✅ Submit without changes → Show "Không có thay đổi"
7. ✅ Submit with changes → Upload images → Create request → Show success
8. ✅ Return to profile → Show pending request banner
9. ✅ Pull-to-refresh → Update pending requests

**Admin Side (TODO):**
1. ⏳ View pending requests list
2. ⏳ Open request detail → Compare old vs new
3. ⏳ Approve request → Update employee → Change status
4. ⏳ Reject request → Delete images → Change status with note
5. ⏳ PT receive notification (optional)

---

## 📝 TODO for Admin Panel (React)

### 1. PT Edit Requests Management Page

**Route:** `/admin/pt-edit-requests`

**Features:**
- Table view: PT Name, Email, Requested At, Status
- Filters: All | Pending | Approved | Rejected
- Sort by: Requested Date (newest first)
- Actions: View Detail, Approve, Reject

### 2. Request Detail Modal/Page

**Layout:**
```
┌─────────────────────────────────────────┐
│  PT Edit Request Detail                 │
├─────────────────────────────────────────┤
│                                         │
│  PT Info:                               │
│  - Name: Hồ Phúc Thịnh                 │
│  - Email: thinhho171@gmail.com          │
│  - Requested: 09/12/2025 10:30          │
│                                         │
│  ┌─────────────┬─────────────┐         │
│  │ Current     │ Requested   │         │
│  ├─────────────┼─────────────┤         │
│  │ Bio: ...    │ Bio: ...    │         │
│  │ Exp: 3 yrs  │ Exp: 5 yrs  │         │
│  │ Max: 8      │ Max: 10     │         │
│  └─────────────┴─────────────┘         │
│                                         │
│  New Certificate Images:                │
│  [img1] [img2] [img3]                   │
│                                         │
│  Actions:                               │
│  [✅ Approve] [❌ Reject]                │
│                                         │
└─────────────────────────────────────────┘
```

### 3. API Endpoints (Cloud Functions)

```javascript
// Approve request
exports.approvePTEditRequest = functions.https.onCall(async (data, context) => {
  // Verify admin
  const { requestId } = data;
  const adminUid = context.auth.uid;
  
  // Get request
  const requestDoc = await admin.firestore()
    .collection('ptEditRequests')
    .doc(requestId)
    .get();
  
  const request = requestDoc.data();
  
  // Update employee
  await admin.firestore()
    .collection('employees')
    .doc(request.ptId)
    .update(request.requestData);
  
  // Update request status
  await requestDoc.ref.update({
    status: 'approved',
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedBy: adminUid
  });
  
  return { success: true };
});

// Reject request
exports.rejectPTEditRequest = functions.https.onCall(async (data, context) => {
  const { requestId, reason } = data;
  const adminUid = context.auth.uid;
  
  // Get request
  const requestDoc = await admin.firestore()
    .collection('ptEditRequests')
    .doc(requestId)
    .get();
  
  const request = requestDoc.data();
  
  // Delete certificate images
  for (const imageUrl of request.certificateImages) {
    const ref = admin.storage().refFromURL(imageUrl);
    await ref.delete();
  }
  
  // Update request status
  await requestDoc.ref.update({
    status: 'rejected',
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedBy: adminUid,
    reviewNote: reason
  });
  
  return { success: true };
});
```

---

## 🎓 Ưu điểm của feature này

### Về mặt kỹ thuật:
1. ✅ **Approval workflow** - Kiểm soát data quality
2. ✅ **File upload** - Xử lý multi-image với Firebase Storage
3. ✅ **Real-time updates** - Firestore streams cho pending requests
4. ✅ **Security** - Firestore rules + Storage rules
5. ✅ **Clean architecture** - Model, Service, Screen separation
6. ✅ **Error handling** - Try-catch + user-friendly messages

### Về mặt UX:
1. ✅ **Progressive disclosure** - Không overwhelm user với quá nhiều options
2. ✅ **Immediate feedback** - Loading states, success/error messages
3. ✅ **Visual hierarchy** - Cards, sections, colors guide attention
4. ✅ **Confirmation dialogs** - Prevent accidental submissions
5. ✅ **Image preview** - PT thấy ảnh trước khi submit
6. ✅ **Status visibility** - Pending requests banner rõ ràng

### Về mặt đồ án:
1. 🎯 **High impact** - Feature quan trọng cho PT management
2. 🎯 **Complex workflow** - PT → Request → Admin → Approve → Update DB
3. 🎯 **Multiple screens** - Profile, Edit, Admin review
4. 🎯 **File handling** - Upload, store, display, delete images
5. 🎯 **Role-based access** - PT vs Admin permissions
6. 🎯 **Real-world application** - Giống các hệ thống CMS/Admin

---

## 📞 Support & Contact

Nếu có vấn đề khi implement phần Admin React:
1. Check Firestore rules đã thêm chưa
2. Check Storage rules đã thêm chưa
3. Check collection name: `ptEditRequests` (không phải `ptEditRequest`)
4. Check status values: `pending`, `approved`, `rejected` (lowercase)

Good luck! 🚀
