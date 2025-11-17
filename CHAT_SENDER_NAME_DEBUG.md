# 🐛 Debug Chat Notification - Sender Name Issue

## 🎯 Vấn Đề

Notification hiển thị "Người dùng" thay vì tên thực của người gửi.

---

## 🔍 Nguyên Nhân

Backend controller không tìm thấy tên người gửi trong Firestore do:

1. **Document không tồn tại** - senderId không có trong `users` collection
2. **Field name thiếu** - Document tồn tại nhưng không có field `name`
3. **Collection sai** - PT lưu trong `pt_accounts` thay vì `users`
4. **Field name khác** - Dùng `fullName`, `displayName` thay vì `name`

---

## ✅ Giải Pháp Đã Implement

### Backend Controller Update
**File:** `backend/src/features/chat/chat.controller.js`

**Cải tiến:**
```javascript
// 1. Tìm trong users collection
const senderDoc = await db.collection("users").doc(senderId).get();

if (senderDoc.exists) {
  const senderData = senderDoc.data();
  
  // Thử nhiều field khác nhau
  senderName = senderData?.name ||           // Ưu tiên 'name'
               senderData?.fullName ||       // Hoặc 'fullName'
               senderData?.displayName ||    // Hoặc 'displayName'
               senderData?.username ||       // Hoặc 'username'
               senderData?.email?.split('@')[0] || // Email prefix
               senderId;                     // Cuối cùng dùng ID
}

// 2. Nếu không tìm thấy, thử pt_accounts collection
else {
  const ptDoc = await db.collection("pt_accounts").doc(senderId).get();
  
  if (ptDoc.exists) {
    const ptData = ptDoc.data();
    senderName = ptData?.name || ptData?.fullName || ... || senderId;
  }
}
```

### Fallback Chain
```
1. users/{senderId}.name
2. users/{senderId}.fullName
3. users/{senderId}.displayName
4. users/{senderId}.username
5. users/{senderId}.email (phần trước @)
6. pt_accounts/{senderId}.name
7. pt_accounts/{senderId}.fullName
8. pt_accounts/{senderId}.displayName
9. pt_accounts/{senderId}.email
10. senderId (ID của user)
```

---

## 🧪 Testing & Debugging

### 1. Enable Debug Logs

Backend đã có log chi tiết:

```javascript
// Khi tìm thấy trong users
console.log(`🔍 Sender data found:`, {
  id: senderId,
  name: senderData?.name,
  fullName: senderData?.fullName,
  displayName: senderData?.displayName,
  username: senderData?.username,
  email: senderData?.email,
});
console.log(`👤 Sender name resolved: "${senderName}"`);

// Khi tìm trong pt_accounts
console.log(`⚠️ User not found in users collection, trying pt_accounts...`);
console.log(`🔍 PT data found:`, { ... });
```

### 2. Run Backend với Logs

```powershell
cd backend\src
node server.js
```

**Gửi tin nhắn và xem logs:**
```
📬 Sending chat notification: { chatId, senderId, receiverId }
🔍 Sender data found: {
  id: "abc123",
  name: "John Doe",      ← Có value
  fullName: undefined,
  displayName: undefined,
  email: "john@example.com"
}
👤 Sender name resolved: "John Doe" (from users collection)
✅ Notification sent successfully
```

### 3. Check Firestore Structure

**Trường hợp 1: Có tên**
```javascript
users/abc123
{
  name: "John Doe",          ✅ OK
  email: "john@example.com",
  uid: "abc123"
}
```

**Trường hợp 2: Field khác**
```javascript
users/abc123
{
  fullName: "Jane Smith",    ✅ OK (fallback)
  email: "jane@example.com"
}
```

**Trường hợp 3: Chỉ có email**
```javascript
users/abc123
{
  email: "user@example.com"  ✅ OK (dùng "user")
}
```

**Trường hợp 4: PT account**
```javascript
pt_accounts/pt123
{
  name: "PT Mike",           ✅ OK (fallback to pt_accounts)
  email: "mike@gym.com"
}
```

**Trường hợp 5: Không có gì**
```javascript
// Document không tồn tại
✅ OK (dùng senderId làm tên)
```

---

## 🔧 Manual Fix - Nếu Vẫn Hiện "Người dùng"

### Option 1: Cập nhật Firestore

**Thêm field `name` vào user document:**
```javascript
// Firebase Console → Firestore
users/{userId}
  - Add field: name = "Tên User"
```

### Option 2: Migration Script

```javascript
// Tạo script migrate_user_names.js
import admin from "firebase-admin";
import serviceAccount from "./gym-managment-aa0a1-firebase-adminsdk-*.json" with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateUserNames() {
  const usersRef = db.collection("users");
  const snapshot = await usersRef.get();
  
  let updated = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Nếu chưa có field 'name' nhưng có email
    if (!data.name && data.email) {
      const name = data.email.split('@')[0];
      await doc.ref.update({ name });
      console.log(`✅ Updated ${doc.id}: ${name}`);
      updated++;
    }
  }
  
  console.log(`\n🎉 Migration complete! Updated ${updated} users`);
}

migrateUserNames();
```

**Run:**
```powershell
node migrate_user_names.js
```

---

## 📊 Test Cases

### Test 1: User có field 'name'
```
Sender: users/abc123 { name: "John" }
Expected: Notification title = "John" ✅
```

### Test 2: User có 'fullName'
```
Sender: users/xyz789 { fullName: "Jane Smith" }
Expected: Notification title = "Jane Smith" ✅
```

### Test 3: User chỉ có email
```
Sender: users/def456 { email: "test@example.com" }
Expected: Notification title = "test" ✅
```

### Test 4: PT account
```
Sender: pt_accounts/pt123 { name: "PT Mike" }
Expected: Notification title = "PT Mike" ✅
```

### Test 5: Document không tồn tại
```
Sender: unknownUserId
Expected: Notification title = "unknownUserId" ✅
```

---

## 🎯 Verification Steps

### 1. Send Test Message
```
1. Start backend: cd backend\src && node server.js
2. Send message from React/Flutter
3. Check backend logs:
```

**Success Case:**
```
📬 Sending chat notification: {...}
🔍 Sender data found: { name: "John Doe", ... }
👤 Sender name resolved: "John Doe" (from users collection)
✅ Notification sent successfully
```

**Fallback Case:**
```
📬 Sending chat notification: {...}
🔍 Sender data found: { name: undefined, email: "user@ex.com", ... }
👤 Sender name resolved: "user" (from users collection)
✅ Notification sent successfully
```

**PT Account Case:**
```
📬 Sending chat notification: {...}
⚠️ User not found in users collection, trying pt_accounts...
🔍 PT data found: { name: "PT Mike", ... }
👤 Sender name resolved: "PT Mike" (from pt_accounts)
✅ Notification sent successfully
```

### 2. Check Notification
```
Device notification should show:
┌─────────────────────┐
│ John Doe           │  ← Sender name (NOT "Người dùng")
│ Hello there!       │
└─────────────────────┘
```

---

## 💡 Best Practices

### 1. Ensure Name Field on User Creation

**When creating new user:**
```javascript
// In registration/signup
await db.collection("users").doc(userId).set({
  name: displayName || email.split('@')[0],  // Always set name
  email: email,
  uid: userId,
  created_at: admin.firestore.FieldValue.serverTimestamp(),
});
```

### 2. PT Account Creation

```javascript
await db.collection("pt_accounts").doc(ptId).set({
  name: ptName,  // Required field
  email: email,
  // ...
});
```

### 3. Data Validation

```javascript
// Before saving, validate name exists
if (!userData.name && userData.email) {
  userData.name = userData.email.split('@')[0];
}
```

---

## 🔮 Future Improvements

### 1. Real-time Name Sync
```javascript
// Listen to user profile changes
db.collection("users").doc(userId).onSnapshot(snapshot => {
  const name = snapshot.data()?.name;
  // Update local cache
});
```

### 2. Name Cache in Backend
```javascript
// Cache frequently accessed names
const nameCache = new Map();

function getCachedName(userId) {
  if (nameCache.has(userId)) {
    return nameCache.get(userId);
  }
  // Fetch from Firestore...
}
```

### 3. GraphQL Resolver
```graphql
type User {
  id: ID!
  displayName: String!  # Computed field with fallback logic
}
```

---

## ✅ Checklist

Để đảm bảo notification hiển thị đúng tên:

- [x] Backend controller có fallback chain đầy đủ
- [x] Debug logs enabled để track issues
- [x] Test với nhiều trường hợp khác nhau
- [ ] Verify Firestore users có field `name`
- [ ] Verify Firestore pt_accounts có field `name`
- [ ] Run migration script nếu cần
- [ ] Test notification với real device

---

**Giải pháp:** Backend đã được cập nhật với logic fallback thông minh. Nếu vẫn thấy "Người dùng", check Firestore structure và run migration script để thêm field `name`.
