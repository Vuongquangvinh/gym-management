# Face Recognition API (FastAPI)

Service nhận diện khuôn mặt cho hệ thống gym management, sử dụng FastAPI và face_recognition library.

## 📋 Yêu cầu

- Python 3.8+
- Firebase credentials file
- Thư viện Python (xem `requirements.txt`)

## 🚀 Cài đặt

### 1. Cài đặt dependencies

```bash
cd backend/face_api
pip install -r requirements.txt
```

### 2. Chuẩn bị Firebase credentials

Đảm bảo file `gym-managment-aa0a1-firebase-adminsdk-fbsvc-5004fe1cc0.json` nằm trong thư mục `face_checkin/` (so với backend root).

### 3. Tạo thư mục lưu ảnh

```bash
mkdir -p face_checkin/employees_faces
```

## 🏃 Chạy service

### Development mode

```bash
cd backend/face_api
python main.py
```

Hoặc với uvicorn trực tiếp:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

API sẽ chạy tại: `http://localhost:8000`

## 📚 API Endpoints

### 1. Health Check

```http
GET /face/health
```

Response:

```json
{
  "status": "healthy",
  "firestore_connected": true,
  "loaded_faces": 10
}
```

### 2. Đăng ký khuôn mặt (Face Registration)

```http
POST /face/register
Content-Type: application/json

{
  "employeeId": "emp123",
  "employeeName": "Nguyen Van A",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

Response:

```json
{
  "success": true,
  "message": "Đăng ký Face ID thành công",
  "data": {
    "employeeId": "emp123",
    "employeeName": "Nguyen Van A",
    "imagePath": "face_checkin/employees_faces/emp123_Nguyen_Van_A.jpg"
  }
}
```

### 3. Nhận diện khuôn mặt (Face Recognition)

```http
POST /face/recognize
Content-Type: application/json

{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

Response:

```json
{
  "success": true,
  "message": "Nhận diện khuôn mặt thành công",
  "employee": {
    "_id": "emp123",
    "fullName": "Nguyen Van A",
    "position": "PT",
    "avatarUrl": "...",
    "confidence": 95.5
  }
}
```

### 4. Check-in

```http
POST /face/checkin
Content-Type: application/json

{
  "employeeId": "emp123",
  "checkinType": "face_recognition",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

Response:

```json
{
  "success": true,
  "message": "Check-in thành công",
  "data": {
    "employeeId": "emp123",
    "employeeName": "Nguyen Van A",
    "checkinType": "face_recognition",
    "timestamp": "2024-01-01T10:00:00Z",
    "status": "success"
  }
}
```

### 5. Lấy danh sách nhân viên chưa đăng ký

```http
GET /face/employees/unregistered
```

Response:

```json
{
  "success": true,
  "count": 5,
  "employees": [
    {
      "_id": "emp456",
      "fullName": "Tran Van B",
      "position": "Le Tan",
      "avatarUrl": "...",
      "faceRegistered": false
    }
  ]
}
```

## 🔧 Cấu hình

### Environment Variables

Tạo file `.env` (optional):

```env
FASTAPI_URL=http://localhost:8000
```

### Face Recognition Parameters

Trong `main.py`, bạn có thể điều chỉnh:

- **Distance threshold**: Mặc định `0.6` (càng nhỏ càng chính xác, nhưng khó match hơn)
- **Encoding model**: Mặc định dùng HOG (nhanh) hoặc có thể đổi sang CNN (chính xác hơn nhưng chậm)

## 📝 Lưu ý

1. **Performance**: Face recognition có thể chậm với ảnh lớn. Nên resize ảnh về khoảng 400x400px trước khi gửi lên API.

2. **Storage**: Face encodings được lưu trong:

   - Firestore: `employees` collection, field `faceEncoding`
   - In-memory: Để tăng tốc độ recognition

3. **Security**:

   - Trong production, nên thêm authentication/authorization
   - Sử dụng HTTPS
   - Validate input data

4. **Error Handling**: API trả về HTTP status codes:
   - `200`: Success
   - `400`: Bad Request (thiếu thông tin, không tìm thấy face)
   - `404`: Not Found
   - `500`: Server Error

## 🐛 Troubleshooting

### Lỗi không tìm thấy face

- Kiểm tra ảnh có chất lượng tốt không
- Đảm bảo khuôn mặt nhìn rõ, không che khuất
- Thử giảm distance threshold

### Lỗi Firebase

- Kiểm tra credentials file có đúng path không
- Kiểm tra Firestore rules cho phép đọc/ghi

### Lỗi memory

- Face encoding mỗi face khoảng 512 bytes
- Với 1000 nhân viên: ~512KB memory
- Có thể reload periodical nếu memory cao

## 📚 Tài liệu tham khảo

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [face_recognition Library](https://github.com/ageitgey/face_recognition)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
