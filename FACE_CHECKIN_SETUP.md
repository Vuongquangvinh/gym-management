# Face Checkin Feature - Setup Guide

Hướng dẫn thiết lập và chạy tính năng nhận diện khuôn mặt cho hệ thống gym management.

## 📋 Tổng quan

Hệ thống face checkin gồm 3 phần:

1. **FastAPI Backend** (`backend/face_api/`) - Xử lý face recognition
2. **Node.js Express API** (`backend/src/features/face/`) - Proxy requests
3. **React Frontend** (`frontend_react/src/features/admin/pages/FaceCheckinPage.jsx`) - UI quản lý

## 🚀 Setup

### 1. Cài đặt Python Dependencies

```bash
cd backend/face_api
pip install -r requirements.txt
```

**Lưu ý**: Nếu gặp lỗi khi cài `face-recognition`, xem [troubleshooting](#troubleshooting) bên dưới.

### 2. Chuẩn bị Firebase Credentials

Đảm bảo file `gym-managment-aa0a1-firebase-adminsdk-fbsvc-5004fe1cc0.json` nằm trong:

- `frontend_react/face_checkin/` (cho Python scripts cũ)
- Copy sang `backend/` hoặc điều chỉnh path trong `main.py`

### 3. Tạo thư mục lưu ảnh

```bash
mkdir -p face_checkin/employees_faces
```

### 4. Chạy FastAPI Service

```bash
cd backend/face_api
python main.py
```

Service sẽ chạy tại: `http://localhost:8000`

### 5. Chạy Node.js Backend

```bash
cd backend
npm start
```

Backend sẽ chạy tại: `http://localhost:3000`

### 6. Chạy React Frontend

```bash
cd frontend_react
npm start
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 📝 Kiểm tra hoạt động

### 1. Test FastAPI Health

```bash
curl http://localhost:8000/face/health
```

Response mong đợi:

```json
{
  "status": "healthy",
  "firestore_connected": true,
  "loaded_faces": 0
}
```

### 2. Test API Endpoint

```bash
curl http://localhost:3000/api/face/employees/unregistered
```

### 3. Test Frontend

1. Mở `http://localhost:5173`
2. Đăng nhập admin
3. Vào menu "Face Checkin" trên sidebar
4. Test các chức năng:
   - Xem danh sách nhân viên
   - Đăng ký khuôn mặt
   - Nhận diện và check-in

## 🔄 Flow hoạt động

### Đăng ký khuôn mặt (Registration)

```
[React Frontend]
    ↓
[Người dùng chọn nhân viên và chụp ảnh]
    ↓
[Gửi POST /api/face/register với base64 image]
    ↓
[Node.js Express]
    ↓
[Proxy đến FastAPI /face/register]
    ↓
[FastAPI xử lý]
    - Decode base64 → image
    - Face encoding với face_recognition
    - Lưu lên Firestore
    - Return kết quả
    ↓
[React hiển thị success/error]
```

### Nhận diện khuôn mặt (Recognition)

```
[React Frontend - Checkin Modal]
    ↓
[Người dùng chụp ảnh qua webcam]
    ↓
[Gửi POST /api/face/recognize với base64 image]
    ↓
[Node.js Express]
    ↓
[Proxy đến FastAPI /face/recognize]
    ↓
[FastAPI xử lý]
    - Decode base64 → image
    - Face encoding
    - So sánh với known faces
    - Return nhân viên tìm thấy
    ↓
[React hiển thị kết quả]
[Gọi POST /api/face/checkin để lưu check-in]
```

## 🔧 Cấu hình

### Environment Variables

Tạo file `.env` trong `backend/`:

```env
FASTAPI_URL=http://localhost:8000
NODE_ENV=development
```

### Firebase Path

Nếu Firebase credentials ở vị trí khác, sửa trong `backend/face_api/main.py`:

```python
cred_path = "path/to/your/credentials.json"
```

## 🐛 Troubleshooting

### Lỗi khi cài face-recognition

**Lỗi**: `CMake must be installed to build the following extensions`

**Giải pháp**:

Trên Windows:

```powershell
# Cài CMake
choco install cmake

# Hoặc download từ https://cmake.org/download/
```

Trên Linux:

```bash
sudo apt-get install cmake
```

Trên Mac:

```bash
brew install cmake
```

### Lỗi không tìm thấy face

**Nguyên nhân**:

- Ảnh mờ, thiếu sáng
- Khuôn mặt bị che
- Ảnh quá nhỏ (< 100x100px)

**Giải pháp**:

- Đảm bảo điều kiện chụp tốt
- Có thể điều chỉnh threshold trong `main.py`:

```python
if distance < 0.7:  # Tăng từ 0.6 lên 0.7 để dễ match hơn
```

### Lỗi Firebase

**Lỗi**: `Firebase credentials file not found!`

**Giải pháp**:

- Kiểm tra path đến credentials file
- Đảm bảo file có quyền đọc

### Performance chậm

**Nguyên nhân**:

- Ảnh quá lớn
- Quá nhiều nhân viên (known faces)

**Giải pháp**:

1. Resize ảnh trước khi gửi (400x400px là đủ)
2. Sử dụng encoding model nhẹ hơn
3. Cân nhắc dùng Redis để cache

## 📊 Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Port 5173)   │
└────────┬────────┘
         │ HTTP/JSON
         ↓
┌─────────────────┐
│  Node.js API    │
│   (Port 3000)   │
└────────┬────────┘
         │ HTTP/JSON
         ↓
┌─────────────────┐
│  FastAPI Service│
│   (Port 8000)   │
└────────┬────────┘
         │
         ├─→ Firestore (employees)
         └─→ File System (face images)
```

## 🔐 Security Notes

⚠️ **Lưu ý quan trọng cho production**:

1. **Authentication**: Thêm JWT authentication cho FastAPI
2. **Rate Limiting**: Limit số request từ client
3. **HTTPS**: Sử dụng HTTPS trong production
4. **Input Validation**: Validate base64 images
5. **CORS**: Giới hạn origins trong CORS middleware

## 📚 API Documentation

Xem chi tiết API endpoints tại: `backend/face_api/README.md`

## 🎯 Next Steps

Sau khi setup thành công:

1. Test với dữ liệu thực
2. Tối ưu performance nếu cần
3. Thêm authentication/authorization
4. Deploy lên production server

## 💡 Tips

- Face recognition hoạt động tốt nhất với:

  - Ảnh chụp thẳng, ánh sáng đầy đủ
  - Khuôn mặt không che khuất
  - Chất lượng ảnh >= 480p

- Để tăng độ chính xác:
  - Capture nhiều góc độ khi đăng ký
  - Sử dụng ảnh chất lượng cao
  - Fine-tune distance threshold

## 📞 Support

Nếu gặp vấn đề, kiểm tra:

1. Logs của FastAPI service
2. Browser console (React)
3. Network tab trong DevTools
