# 🔧 FIX: Document ID vs PackageId Issue

## ❌ Vấn Đề

### Error Message:
```
No document to update: projects/gym-managment-aa0a1/databases/(default)/documents/packages/PK9
```

### Nguyên Nhân:
Nhầm lẫn giữa 2 loại ID:

1. **Firestore Document ID** (auto-generated): `"abc123xyz456"` 
   - Được Firestore tự động tạo khi add document
   - Dùng để update/delete document
   
2. **PackageId** (user-defined): `"PK9"`
   - Do user tự định nghĩa trong form
   - Dùng để hiển thị và tìm kiếm

### Code Lỗi:
```javascript
// ❌ SAI - Dùng PackageId thay vì Firestore document ID
await PackageModel.update("PK9", data);
// "PK9" là PackageId, KHÔNG phải Firestore document ID!
```

## ✅ Giải Pháp

### 1. **Thêm `_firestoreId` vào PackageModel**

```javascript
// packages.model.js - getAll()
const packages = querySnapshot.docs.map((docSnap) => {
  const data = docSnap.data();
  
  const packageInstance = new PackageModel(data);
  // ✅ Lưu Firestore document ID
  packageInstance._firestoreId = docSnap.id;  // "abc123xyz456"
  
  return packageInstance;
});
```

### 2. **Transform Data với Cả 2 IDs**

```javascript
// packageTable.jsx
const transformedPackages = packages.map(pkg => ({
  id: pkg.PackageId,              // "PK9" - để hiển thị
  firestoreId: pkg._firestoreId,  // "abc123xyz456" - để update/delete
  name: pkg.PackageName,
  // ... other fields
  rawData: pkg
}));
```

### 3. **Update Sử Dụng Firestore Document ID**

```javascript
// changePackageInformation.jsx
const firestoreDocId = pkg.firestoreId || pkg.rawData?._firestoreId;

if (!firestoreDocId) {
  throw new Error("Không tìm thấy Firestore document ID");
}

// ✅ ĐÚNG - Dùng Firestore document ID
await PackageModel.update(firestoreDocId, dataToUpdate);
```

## 📊 Data Structure

### Firestore Document:
```javascript
Collection: packages
└── Document ID: "abc123xyz456"  ← Firestore auto-generated
    ├── PackageId: "PK9"          ← User-defined
    ├── PackageName: "Gói VIP"
    ├── Price: 1000000
    └── ... other fields
```

### PackageModel Instance:
```javascript
{
  PackageId: "PK9",              // User-defined ID
  PackageName: "Gói VIP",
  Price: 1000000,
  _firestoreId: "abc123xyz456",  // ✅ Firestore document ID
  // ... other fields
}
```

### Transformed UI Data:
```javascript
{
  id: "PK9",                     // Display ID
  firestoreId: "abc123xyz456",   // Update/Delete ID
  name: "Gói VIP",
  price: "1,000,000đ",
  rawData: { ... }               // Original PackageModel instance
}
```

## 🔄 Update Flow (Fixed)

```
User clicks Edit
    ↓
Get package data with both IDs:
  - id: "PK9" (PackageId)
  - firestoreId: "abc123xyz456" (_firestoreId)
    ↓
User edits form
    ↓
Submit
    ↓
Extract firestoreId from pkg object
    ↓
✅ PackageModel.update("abc123xyz456", data)
    ↓
Firestore updates document at:
packages/abc123xyz456
    ↓
Success! ✅
```

## 📝 Code Changes Summary

### 1. `packages.model.js`
```javascript
// ✅ BEFORE FIX
return new PackageModel({ PackageId: docSnap.id, ...data });
// ❌ Overwrites PackageId with Firestore ID!

// ✅ AFTER FIX
const packageInstance = new PackageModel(data);
packageInstance._firestoreId = docSnap.id;
return packageInstance;
// ✅ Keeps both IDs separate
```

### 2. `packageTable.jsx`
```javascript
// ✅ ADDED
const transformedPackages = packages.map(pkg => ({
  id: pkg.PackageId,              // For display
  firestoreId: pkg._firestoreId,  // For operations
  // ...
}));
```

### 3. `changePackageInformation.jsx`
```javascript
// ✅ BEFORE FIX
await PackageModel.update(pkg.id, dataToUpdate);
// ❌ Uses PackageId "PK9"

// ✅ AFTER FIX
const firestoreDocId = pkg.firestoreId || pkg.rawData?._firestoreId;
await PackageModel.update(firestoreDocId, dataToUpdate);
// ✅ Uses Firestore document ID "abc123xyz456"
```

## 🎯 Key Points

### ✅ DO:
- Use `_firestoreId` for update/delete operations
- Use `PackageId` for display and search
- Keep both IDs in transformed data
- Validate `_firestoreId` exists before update

### ❌ DON'T:
- Don't use `PackageId` for Firestore operations
- Don't overwrite `PackageId` with Firestore document ID
- Don't assume they are the same

## 🧪 Testing

### Test Case 1: Update Package
```javascript
// Given
PackageId: "PK9"
_firestoreId: "abc123xyz456"

// When
User updates package name

// Then
✅ Update succeeds at: packages/abc123xyz456
✅ PackageId "PK9" remains unchanged
```

### Test Case 2: Missing Firestore ID
```javascript
// Given
firestoreId: undefined

// When
User tries to update

// Then
❌ Error: "Không tìm thấy Firestore document ID"
✅ User gets helpful error message
```

## 🐛 Debugging

### Check Console Logs:
```javascript
console.log("🔑 Firestore Document ID:", pkg.firestoreId);
// Should be: "abc123xyz456" (long random string)

console.log("📝 User Package ID:", pkg.id);
// Should be: "PK9" (user-defined)
```

### If Still Getting Error:
1. Check if `_firestoreId` exists in rawData
2. Verify Firestore document actually exists
3. Check Firestore rules allow update
4. Reload page to get fresh data

## ✅ Result

✅ Update operations now work correctly  
✅ Uses correct Firestore document ID  
✅ PackageId preserved for display  
✅ Error handling for missing ID  
✅ Clear console logs for debugging  

---

**Status**: ✅ FIXED  
**Date**: October 19, 2025  
**Issue**: Document ID confusion  
**Solution**: Separate _firestoreId from PackageId
