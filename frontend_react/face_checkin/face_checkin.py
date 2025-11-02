import firebase_admin
from firebase_admin import credentials, firestore
import cv2
import os
import face_recognition
import numpy as np

# === 1. Kết nối Firestore ===
cred = credentials.Certificate("gym-managment-aa0a1-firebase-adminsdk-fbsvc-5004fe1cc0.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# === 2. Lấy danh sách nhân viên chưa đăng ký khuôn mặt ===
employees_ref = db.collection("employees").where("faceRegistered", "==", False)
docs = employees_ref.stream()

employees = []
print("📋 Danh sách nhân viên chưa có Face ID:\n")
for i, doc in enumerate(docs):
    emp = doc.to_dict()
    employees.append((doc.id, emp))
    name = emp.get("fullName", "Không tên")
    print(f"[{i+1}] {doc.id} - {name}")

if not employees:
    print("✅ Tất cả nhân viên đã đăng ký khuôn mặt!")
    exit()

index = int(input("\n👉 Nhập số thứ tự nhân viên muốn chụp: ")) - 1
selected_doc_id, selected_emp = employees[index]

emp_id = selected_doc_id
emp_name = selected_emp.get("fullName", "unknown")
file_name = f"{emp_id}_{emp_name.replace(' ', '_')}.jpg"

print(f"\n📸 Chuẩn bị chụp ảnh cho {emp_name} ({emp_id})")

os.makedirs("employees_faces", exist_ok=True)
cam = cv2.VideoCapture(0)

print("➡️ Nhấn SPACE để chụp, ESC để thoát")

while True:
    ret, frame = cam.read()
    cv2.imshow("Đăng ký khuôn mặt", frame)
    key = cv2.waitKey(1)

    if key % 256 == 27:
        print("❌ Hủy đăng ký")
        break
    elif key % 256 == 32:
        path = os.path.join("employees_faces", file_name)
        cv2.imwrite(path, frame)
        print(f"✅ Đã lưu ảnh: {path}")

        # === 3. Encode khuôn mặt ===
        img = face_recognition.load_image_file(path)
        encodings = face_recognition.face_encodings(img)

        if len(encodings) > 0:
            encoding_list = encodings[0].tolist()

            # === 4. Lưu lên Firestore ===
            db.collection("employees").document(selected_doc_id).update({
                "faceRegistered": True,
                "faceEncoding": encoding_list,
                "faceImagePath": path
            })

            print("🔥 Firestore đã lưu faceEncoding & cập nhật trạng thái")
        else:
            print("⚠️ Không tìm thấy khuôn mặt trong ảnh, vui lòng chụp lại!")

        break

cam.release()
cv2.destroyAllWindows()
