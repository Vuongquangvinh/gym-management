# PT Monthly Package Implementation - Complete

## Overview
Đã hoàn thành việc triển khai đầy đủ chức năng đặt lịch và thanh toán gói tập PT theo tháng.

## Architecture

### Flow
1. User xem danh sách gói PT với khung giờ cố định mỗi tuần
2. User chọn gói và nhấn "Đặt theo tháng"
3. Hệ thống tạo contract với status `pending_payment`
4. Hiển thị QR code thanh toán PayOS
5. User quét mã và thanh toán
6. Webhook cập nhật contract status thành `paid`
7. PT admin sau đó set `startDate`, `endDate` và chuyển status thành `active`
8. Hợp đồng hoạt động và có thể được chuyển thành `completed` hoặc `cancelled`

## Changes Made

### 1. ContractModel Refactoring (contract.mode.dart)
**REMOVED Fields:**
- `totalSessions` - Không dùng session-based nữa
- `completedSessions` - Không dùng session-based nữa  
- `note` - Không cần trong model chính

**ADDED Fields:**
- `paymentOrderCode` (String?) - Mã đơn hàng PayOS
- `paymentAmount` (int?) - Số tiền thanh toán
- `paymentStatus` (String?) - PENDING, PAID, FAILED, CANCELLED
- `paidAt` (Timestamp?) - Thời điểm thanh toán thành công

**Updated Status Values:**
- `pending_payment` - Chờ thanh toán (contract mới tạo)
- `paid` - Đã thanh toán, chờ PT set ngày bắt đầu
- `active` - Đang hoạt động (PT đã set startDate/endDate)
- `completed` - Đã hoàn thành
- `cancelled` - Đã hủy

**New Methods:**
```dart
// Tạo contract mới với payment info
static Future<String> createContract({
  required String userId,
  required String ptId,
  required String ptPackageId,
  required List<Map<String, dynamic>> selectedTimeSlots,
  required int paymentAmount,
  String? paymentOrderCode,
})

// Cập nhật payment info sau khi tạo payment link
Future<void> updatePaymentInfo({
  required String contractId,
  required String paymentOrderCode,
  required int paymentAmount,
})
```

### 2. Backend API (payos.controller.js)

**ADDED: createPTPackagePayment** (lines 782-928)
- Endpoint: `POST /api/payos/create-pt-package-payment`
- Creates contract in Firestore FIRST with status `pending_payment`
- Then creates PayOS payment link
- Updates contract with `paymentOrderCode` and `paymentAmount`
- Returns: `{success, data: {orderCode, checkoutUrl, qrCode, amount, contractId}}`

**UPDATED: handlePaymentWebhook** (lines 213-265)
- Added payment type branching:
  - If `paymentType === 'pt_package'`: Updates contract to `PAID` status
  - If `paymentType === 'gym_package'`: Updates user package (existing logic)
- Updates both `paymentStatus` and `status` fields in contract

### 3. Frontend Service (payos_service.dart)

**ADDED: createPTPackagePayment** (lines 169-280)
```dart
static Future<Map<String, dynamic>> createPTPackagePayment({
  required String ptPackageId,
  required String ptPackageName,
  required int ptPackagePrice,
  required String userId,
  required String ptId,
  required String ptName,
  required List<Map<String, dynamic>> selectedTimeSlots,
})
```
- Calls backend API `/api/payos/create-pt-package-payment`
- Returns payment data + contractId

### 4. PT Packages Screen (pt_packages_screen.dart)

**ADDED: _handleMonthlyBooking** (lines 58-192)
- Gets userId from UserModel
- Converts PTPackageModel.availableTimeSlots to Map format
- Calls PayOSService.createPTPackagePayment()
- Shows PaymentQRDialog
- On success: Reloads packages, shows success message

**Updated Button:**
- "Đặt theo tháng" button now functional
- Calls `_handleMonthlyBooking` when pressed

### 5. UI Updates

**contract_detail_screen.dart:**
- Removed `_buildProgressSection` (session-based progress)
- Removed `_buildNoteSection` (note field removed)
- Added `_buildPaymentInfoSection` - Shows payment amount, status, and paid date
- Updated status text/colors for new status values
- Removed edit functionality (will be handled by PT admin)
- Shows time slots count instead of session count

**contract_card.dart:**
- Removed session progress display
- Added payment amount display
- Updated to show time slots count
- Updated status badges for new status values

### 6. Disable Logic (package_screen.dart)

- PT booking card disabled when user has no valid gym package
- Shows "Bạn cần đăng ký gói tập trước" subtitle
- Opacity 0.5 when disabled

## Database Structure

### Firestore Collection: `contracts`
```json
{
  "userId": "string",
  "ptId": "string",
  "ptPackageId": "string",
  "selectedTimeSlots": [
    {
      "day": "Monday",
      "startTime": "08:00",
      "endTime": "09:00"
    }
  ],
  "startDate": "Timestamp | null",
  "endDate": "Timestamp | null",
  "status": "pending_payment | paid | active | completed | cancelled",
  "paymentOrderCode": "string | null",
  "paymentAmount": "number | null",
  "paymentStatus": "PENDING | PAID | FAILED | CANCELLED | null",
  "paidAt": "Timestamp | null",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### PayOS Order Metadata
```json
{
  "userId": "string",
  "paymentType": "pt_package",
  "contractId": "string",
  "ptPackageId": "string",
  "ptId": "string"
}
```

## Testing Checklist

### User Flow Testing
- [ ] User can view PT packages with available time slots
- [ ] "Đặt theo tháng" button is enabled for monthly packages
- [ ] PT booking is disabled when user has no gym package
- [ ] PT booking is enabled when user has valid gym package

### Payment Flow Testing
- [ ] Clicking "Đặt theo tháng" creates contract in Firestore
- [ ] Contract initial status is `pending_payment`
- [ ] PayOS payment link is generated successfully
- [ ] QR dialog shows with correct amount
- [ ] User can scan and pay
- [ ] Webhook receives payment confirmation
- [ ] Contract status updates to `paid`
- [ ] Contract paymentStatus updates to `PAID`
- [ ] paidAt timestamp is set correctly

### Contract Display Testing
- [ ] Contract list shows monthly PT contracts
- [ ] Contract card displays payment amount
- [ ] Contract card shows time slots count
- [ ] Contract detail shows all payment info
- [ ] Contract detail shows selected time slots
- [ ] Status badges show correct text and colors
- [ ] Edit button is NOT shown (editing via admin panel only)

### Admin Flow (To be implemented on admin panel)
- [ ] PT admin can view contracts with status `paid`
- [ ] PT admin can set startDate and endDate
- [ ] PT admin can change status from `paid` to `active`
- [ ] PT admin can mark contracts as `completed` or `cancelled`

## API Endpoints

### Create PT Package Payment
```
POST /api/payos/create-pt-package-payment
Content-Type: application/json

Request:
{
  "ptPackageId": "string",
  "ptPackageName": "string",
  "ptPackagePrice": number,
  "userId": "string",
  "ptId": "string",
  "ptName": "string",
  "selectedTimeSlots": [
    {
      "day": "Monday",
      "startTime": "08:00",
      "endTime": "09:00"
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "orderCode": number,
    "checkoutUrl": "string",
    "qrCode": "string",
    "amount": number,
    "contractId": "string"
  }
}
```

### PayOS Webhook
```
POST /api/payos/webhook
Content-Type: application/json

Handles both:
- paymentType: "gym_package" -> Updates user.current_package_id
- paymentType: "pt_package" -> Updates contract payment status
```

## Known Issues / Future Improvements

1. **WeeklyScheduleSelectionScreen** - Currently commented out, may need to be implemented for PT admin to edit schedules

2. **Contract Provider** - May need updates to handle new ContractModel structure if it's used elsewhere

3. **Admin Panel Integration** - Need to implement PT admin features:
   - View paid contracts
   - Set start/end dates
   - Activate contracts
   - Mark as completed/cancelled

4. **Notifications** - Consider adding:
   - Payment success notification
   - Contract activation notification
   - Schedule reminder notifications

5. **Error Handling** - Add more robust error handling for:
   - Payment failures
   - Network errors during payment
   - Contract creation failures

## Files Modified

### Backend
- `backend/src/features/payos/payos.controller.js`
- `backend/src/features/payos/payos.routes.js`

### Frontend Flutter
- `frontend_flutter/lib/features/model/contract.mode.dart`
- `frontend_flutter/lib/features/payment/service/payos_service.dart`
- `frontend_flutter/lib/features/package/screen/pt_packages_screen.dart`
- `frontend_flutter/lib/features/package/screen/package_screen.dart`
- `frontend_flutter/lib/features/package/widgets/action_cards_section.dart`
- `frontend_flutter/lib/features/package/widgets/action_card.dart`
- `frontend_flutter/lib/features/personal_PT/screen/contract_detail_screen.dart`
- `frontend_flutter/lib/features/personal_PT/widget/contract_card.dart`
- `frontend_flutter/lib/features/user/model/user.model.dart`
- `frontend_flutter/lib/features/user/widgets/member_card_widget.dart`

## Status
✅ Backend API implementation - COMPLETE
✅ Frontend payment flow - COMPLETE
✅ Contract model refactoring - COMPLETE
✅ UI updates - COMPLETE
✅ Compile errors fixed - COMPLETE
⏳ End-to-end testing - PENDING
⏳ Admin panel integration - PENDING

## Next Steps
1. Test complete flow on emulator
2. Test payment on real device
3. Verify webhook updates work correctly
4. Implement PT admin features on admin panel
5. Add proper error handling and loading states
6. Consider adding notification system
