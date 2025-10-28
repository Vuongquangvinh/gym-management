# ❌ Lỗi Firebase Admin SDK UNAUTHENTICATED

## Nguyên nhân
Service account key **BỊ VÔ HIỆU HÓA** hoặc **HẾT HẠN** trong Firebase/Google Cloud Console.

## ✅ Giải pháp

### Bước 1: Download Service Account Key MỚI

1. Vào: https://console.firebase.google.com/project/gym-managment-aa0a1/settings/serviceaccounts/adminsdk

2. Click **"Generate new private key"**

3. Click **"Generate key"** trong popup

4. File JSON sẽ được download

### Bước 2: Thay thế file cũ

1. Đổi tên file vừa download thành: 
   ```
   gym-managment-aa0a1-firebase-adminsdk-fbsvc-66a43312d0.json
   ```

2. Copy vào `F:\Doan4\backend\` (thay thế file cũ)

3. Restart backend:
   ```bash
   npm start
   ```

### Bước 3: Kiểm tra

Khi backend start, bạn sẽ thấy:
```
✅ Firestore connection verified - Authentication working!
```

Thay vì:
```
❌ Firestore connection test failed
```

## 🔍 Nguyên nhân cụ thể

Lỗi `16 UNAUTHENTICATED` có nghĩa là:
- Service account key không hợp lệ
- Service account bị disable trong IAM
- Firestore API chưa được enable

## ⚠️ Lưu ý

- File service account key là **BÍ MẬT**, không được commit lên Git
- File này cho phép **FULL ACCESS** vào Firebase project
- Nên tạo key mới và xóa key cũ nếu bị lộ
