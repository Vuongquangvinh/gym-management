from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
import cv2
import numpy as np
import face_recognition
import os
import base64
from typing import Optional, List, Dict
import tempfile

app = FastAPI(title="Face Recognition API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase initialization
# Try multiple possible paths
script_dir = os.path.dirname(os.path.abspath(__file__))
possible_cred_paths = [
    os.path.join(script_dir, "gym-managment-aa0a1-firebase-adminsdk-fbsvc-5004fe1cc0.json"),
    os.path.join(script_dir, "..", "face_checkin", "gym-managment-aa0a1-firebase-adminsdk-fbsvc-5004fe1cc0.json"),
    os.path.join(script_dir, "..", "..", "frontend_react", "face_checkin", "gym-managment-aa0a1-firebase-adminsdk-fbsvc-5004fe1cc0.json"),
]

cred_path = None
for path in possible_cred_paths:
    if os.path.exists(path):
        cred_path = path
        break

if cred_path and os.path.exists(cred_path):
    try:
        print(f"📁 Loading Firebase credentials from: {cred_path}")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase initialized successfully")
    except Exception as e:
        print(f"⚠️ Firebase already initialized or error: {e}")
        db = firestore.client()
else:
    print("❌ Firebase credentials file not found!")
    print(f"   Searched in: {possible_cred_paths}")
    db = None

# Storage for face encodings (in production, use database)
known_face_encodings = {}
known_face_metadata = {}


# Request models
class FaceRegisterRequest(BaseModel):
    employeeId: str
    employeeName: str
    imageBase64: str


class FaceRecognizeRequest(BaseModel):
    imageBase64: str


class CheckinRequest(BaseModel):
    employeeId: str
    checkinType: Optional[str] = "face_recognition"
    timestamp: Optional[str] = None


# Helper functions
def save_base64_image(base64_string: str, filename: str) -> str:
    """Save base64 image to file"""
    # Get the directory of this file and resolve paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Try multiple possible paths
    possible_paths = [
        os.path.join(script_dir, "..", "face_checkin", "employees_faces"),
        os.path.join(script_dir, "..", "..", "face_checkin", "employees_faces"),
        os.path.join(os.getcwd(), "face_checkin", "employees_faces"),
    ]
    
    save_dir = None
    for path in possible_paths:
        abs_path = os.path.abspath(path)
        if os.path.exists(os.path.dirname(abs_path)):
            save_dir = abs_path
            break
    
    if not save_dir:
        save_dir = os.path.join(script_dir, "employees_faces")
    
    os.makedirs(save_dir, exist_ok=True)
    filepath = os.path.join(save_dir, filename)
    
    print(f"📁 Saving to: {filepath}")
    
    # Remove data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    image_data = base64.b64decode(base64_string)
    with open(filepath, 'wb') as f:
        f.write(image_data)
    
    return filepath


def load_face_encodings_from_firestore():
    """Load all face encodings from Firestore"""
    global known_face_encodings, known_face_metadata
    
    if not db:
        return
    
    try:
        employees_ref = db.collection("employees")
        docs = employees_ref.stream()
        
        for doc in docs:
            emp_data = doc.to_dict()
            if emp_data.get("faceRegistered") and emp_data.get("faceEncoding"):
                known_face_encodings[doc.id] = np.array(emp_data["faceEncoding"])
                known_face_metadata[doc.id] = {
                    "fullName": emp_data.get("fullName", ""),
                    "position": emp_data.get("position", ""),
                    "avatarUrl": emp_data.get("avatarUrl", "")
                }
        
        print(f"✅ Loaded {len(known_face_encodings)} face encodings from Firestore")
    except Exception as e:
        print(f"❌ Error loading face encodings: {e}")


# Load face encodings on startup
load_face_encodings_from_firestore()


@app.get("/")
def root():
    return {"message": "Face Recognition API", "status": "running"}


@app.get("/face/health")
def health_check():
    return {
        "status": "healthy",
        "firestore_connected": db is not None,
        "loaded_faces": len(known_face_encodings)
    }


@app.post("/face/register")
async def register_face(request: FaceRegisterRequest):
    """Register a face for an employee"""
    try:
        print(f"📥 Received registration request for: {request.employeeId}")
        
        # Save image with timestamp to avoid Unicode issues in filename
        import time
        timestamp = int(time.time() * 1000)
        filename = f"{request.employeeId}_{timestamp}.jpg"
        print(f"💾 Saving image to: {filename}")
        
        image_path = save_base64_image(request.imageBase64, filename)
        print(f"✅ Image saved to: {image_path}")
        
        # Load and encode face
        print("🔍 Loading image for face encoding...")
        img = face_recognition.load_image_file(image_path)
        
        # VALIDATION: Check image quality
        # 1. Check if image is too dark or too bright
        cv_img = cv2.imread(image_path)
        if cv_img is None:
            os.remove(image_path)
            raise HTTPException(status_code=400, detail="Không thể đọc file ảnh. Vui lòng thử lại")
        
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        mean_brightness = np.mean(gray)
        if mean_brightness < 30:
            os.remove(image_path)
            raise HTTPException(status_code=400, detail="Ảnh quá tối. Vui lòng chụp ở nơi có ánh sáng tốt hơn")
        if mean_brightness > 225:
            os.remove(image_path)
            raise HTTPException(status_code=400, detail="Ảnh quá sáng. Vui lòng điều chỉnh ánh sáng")
        
        # 2. Detect faces - use HOG model for faster detection
        face_locations = face_recognition.face_locations(img, model='hog')
        
        # VALIDATION: Must have exactly 1 face
        if len(face_locations) == 0:
            os.remove(image_path)
            print("❌ No face found in image")
            raise HTTPException(status_code=400, detail="Không tìm thấy khuôn mặt trong ảnh. Vui lòng đảm bảo khuôn mặt rõ ràng và nhìn thẳng vào camera")
        
        if len(face_locations) > 1:
            os.remove(image_path)
            print(f"❌ Multiple faces found: {len(face_locations)}")
            raise HTTPException(status_code=400, detail=f"Phát hiện {len(face_locations)} khuôn mặt. Vui lòng đảm bảo chỉ có 1 người trong khung hình")
        
        # 3. Check face size (too small = poor quality)
        top, right, bottom, left = face_locations[0]
        face_width = right - left
        face_height = bottom - top
        img_height, img_width = img.shape[:2]
        
        face_area_ratio = (face_width * face_height) / (img_width * img_height)
        if face_area_ratio < 0.05:  # Face takes less than 5% of image
            os.remove(image_path)
            raise HTTPException(status_code=400, detail="Khuôn mặt quá nhỏ. Vui lòng di chuyển gần camera hơn")
        
        print(f"✅ Image quality check passed (brightness: {mean_brightness:.1f}, face ratio: {face_area_ratio:.2%})")
        
        # Generate face encoding with num_jitters for better accuracy
        print("🔍 Generating face encoding...")
        encodings = face_recognition.face_encodings(img, known_face_locations=face_locations, num_jitters=2)
        
        if len(encodings) == 0:
            os.remove(image_path)
            raise HTTPException(status_code=400, detail="Không thể tạo mã hóa khuôn mặt. Vui lòng thử lại")
        
        print(f"✅ Face encoding generated successfully")
        encoding = encodings[0].tolist()  # Convert numpy array to list
        
        # Update Firestore
        if db:
            print(f"🔥 Updating Firestore for employee: {request.employeeId}")
            db.collection("employees").document(request.employeeId).update({
                "faceRegistered": True,
                "faceEncoding": encoding,
                "faceImagePath": image_path,
                "faceIdCreatedAt": firestore.SERVER_TIMESTAMP
            })
            print("✅ Firestore updated")
        
        # Update in-memory storage
        known_face_encodings[request.employeeId] = np.array(encoding)
        known_face_metadata[request.employeeId] = {
            "fullName": request.employeeName,
            "position": "",
            "avatarUrl": ""
        }
        print("✅ In-memory storage updated")
        
        return {
            "success": True,
            "message": "Đăng ký Face ID thành công",
            "data": {
                "employeeId": request.employeeId,
                "employeeName": request.employeeName,
                "imagePath": image_path,
                "faceQuality": {
                    "brightness": round(float(mean_brightness), 2),
                    "faceAreaRatio": round(float(face_area_ratio), 4)
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in register_face: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi đăng ký: {str(e)}")


@app.post("/face/recognize")
async def recognize_face(request: FaceRecognizeRequest):
    """Recognize a face from an image"""
    try:
        # Save temporary image
        temp_filename = f"temp_{request.employeeId if hasattr(request, 'employeeId') else 'recognition'}_{os.urandom(4).hex()}.jpg"
        
        # Use bytesIO to handle base64 image
        if ',' in request.imageBase64:
            request.imageBase64 = request.imageBase64.split(',')[1]
        
        image_data = base64.b64decode(request.imageBase64)
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
        temp_file.write(image_data)
        temp_file.close()
        
        # Load and encode face
        img = face_recognition.load_image_file(temp_file.name)
        # Use CNN model for better accuracy during recognition
        face_locations = face_recognition.face_locations(img, model='cnn')
        
        # Clean up temp file
        os.unlink(temp_file.name)
        
        if len(face_locations) == 0:
            return {
                "success": False,
                "message": "Không tìm thấy khuôn mặt trong ảnh. Vui lòng đảm bảo khuôn mặt rõ ràng",
                "employee": None
            }
        
        # Get face encodings with higher accuracy (num_jitters=2)
        face_encodings = face_recognition.face_encodings(img, known_face_locations=face_locations, num_jitters=2)
        
        if len(face_encodings) == 0:
            return {
                "success": False,
                "message": "Không thể mã hóa khuôn mặt. Vui lòng thử lại",
                "employee": None
            }
        
        face_encoding = face_encodings[0]
        
        # Compare with known faces
        matches = []
        for emp_id, known_encoding in known_face_encodings.items():
            distance = face_recognition.face_distance([known_encoding], face_encoding)[0]
            
            # Lower threshold for better accuracy (0.5 instead of 0.6)
            # Lower value = stricter matching
            if distance < 0.5:
                matches.append({
                    "employeeId": emp_id,
                    "distance": float(distance),
                    "metadata": known_face_metadata.get(emp_id, {})
                })
        
        if not matches:
            return {
                "success": False,
                "message": "Không nhận diện được khuôn mặt. Vui lòng thử lại hoặc đăng ký Face ID",
                "employee": None
            }
        
        # Get best match (lowest distance)
        best_match = min(matches, key=lambda x: x["distance"])
        confidence = round((1 - best_match["distance"]) * 100, 2)
        
        # Additional check: confidence must be at least 50%
        if confidence < 50:
            return {
                "success": False,
                "message": f"Độ tin cậy thấp ({confidence}%). Vui lòng thử lại",
                "employee": None
            }
        
        print(f"✅ Face recognized: {best_match['metadata'].get('fullName', 'Unknown')} (confidence: {confidence}%)")
        
        return {
            "success": True,
            "message": "Nhận diện khuôn mặt thành công",
            "employee": {
                "_id": best_match["employeeId"],
                "fullName": best_match["metadata"].get("fullName", ""),
                "position": best_match["metadata"].get("position", ""),
                "avatarUrl": best_match["metadata"].get("avatarUrl", ""),
                "confidence": confidence
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi nhận diện: {str(e)}")


@app.post("/face/checkin")
async def process_checkin(request: CheckinRequest):
    """Process face check-in/checkout"""
    try:
        print(f"📥 Received checkin/checkout request for: {request.employeeId}, type: {request.checkinType}")
        
        # Get employee info from Firestore
        if not db:
            raise HTTPException(status_code=500, detail="Firestore not initialized")
        
        emp_doc = db.collection("employees").document(request.employeeId).get()
        if not emp_doc.exists:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")
        
        emp_data = emp_doc.to_dict()
        
        # Get current date (YYYY-MM-DD)
        from datetime import datetime
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        # Check if employee has schedule for today
        print(f"🔍 Checking schedule for employee {request.employeeId} on {current_date}")
        
        # Check if employee is fulltime (always has schedule)
        employee_shift = emp_data.get("shift", "")
        print(f"📋 Employee shift: {employee_shift}")
        
        if employee_shift != "fulltime":
            # For parttime employees, check if they have a schedule for today
            schedule_query = db.collection("schedule").where("employeeId", "==", request.employeeId).where("date", "==", current_date).where("status", "==", "active").limit(1).get()
            
            if len(schedule_query) == 0:
                raise HTTPException(status_code=400, detail="Bạn không có lịch làm việc hôm nay! Vui lòng liên hệ quản lý để được xếp lịch.")
            
            schedule_data = schedule_query[0].to_dict()
            print(f"✅ Found schedule: {schedule_data.get('startTime')} - {schedule_data.get('endTime')}")
        else:
            print("✅ Fulltime employee - always has schedule")
        
        # Check if already checkin/checkout today
        checkin_query = db.collection("employee_checkins").where("employeeId", "==", request.employeeId).where("checkinType", "==", request.checkinType).where("date", "==", current_date).limit(1).get()
        
        if len(checkin_query) > 0:
            existing_checkin = checkin_query[0].to_dict()
            action_text = "check-in" if request.checkinType == "checkin" else "checkout"
            raise HTTPException(status_code=400, detail=f"Bạn đã {action_text} hôm nay rồi!")
        
        # Special check for checkout: must check-in first
        if request.checkinType == "checkout":
            checkin_today_query = db.collection("employee_checkins").where("employeeId", "==", request.employeeId).where("checkinType", "==", "checkin").where("date", "==", current_date).limit(1).get()
            
            if len(checkin_today_query) == 0:
                raise HTTPException(status_code=400, detail="Vui lòng check-in trước khi checkout!")
        
        # Save check-in/checkout data
        checkin_data = {
            "employeeId": request.employeeId,
            "employeeName": emp_data.get("fullName", ""),
            "checkinType": request.checkinType,  # "checkin" or "checkout"
            "timestamp": request.timestamp,
            "date": current_date,
            "status": "success",
            "createdAt": firestore.SERVER_TIMESTAMP
        }
        
        print(f"💾 Saving check-in data: {checkin_data}")
        
        # Add to employee_checkins collection
        checkin_ref = db.collection("employee_checkins").document()
        checkin_id = checkin_ref.id
        print(f"📝 Created document with ID: {checkin_id}")
        
        checkin_ref.set(checkin_data)
        print(f"✅ Check-in saved successfully with ID: {checkin_id}")
        
        # Create notifications
        print(f"📬 Creating notifications...")
        
        # Notification data for admin
        admin_notif_data = {
            "recipientId": "admin",
            "recipientRole": "admin",
            "type": f"employee_{request.checkinType}",
            "title": f"Nhân viên {request.checkinType}",
            "message": f"{emp_data.get('fullName', '')} đã {request.checkinType} lúc {datetime.fromisoformat(request.timestamp.replace('Z', '+00:00')).strftime('%H:%M')}",
            "relatedId": checkin_id,
            "relatedType": request.checkinType,
            "senderName": emp_data.get("fullName", ""),
            "senderAvatar": emp_data.get("avatarUrl", None),
            "read": False,
            "createdAt": firestore.SERVER_TIMESTAMP
        }
        
        # Notification data for PT (confirmation)
        pt_notif_data = {
            "recipientId": request.employeeId,
            "recipientRole": "pt",
            "type": f"{request.checkinType}_confirmation",
            "title": f"{request.checkinType.capitalize()} thành công",
            "message": f"Bạn đã {request.checkinType} thành công lúc {datetime.fromisoformat(request.timestamp.replace('Z', '+00:00')).strftime('%H:%M')}",
            "relatedId": checkin_id,
            "relatedType": request.checkinType,
            "senderName": "Hệ thống",
            "senderAvatar": None,
            "read": False,
            "createdAt": firestore.SERVER_TIMESTAMP
        }
        
        # Save notifications
        db.collection("notifications").add(admin_notif_data)
        db.collection("notifications").add(pt_notif_data)
        print(f"✅ Notifications created for admin and PT")
        
        action_text = "Check-in" if request.checkinType == "checkin" else "Checkout"
        
        return {
            "success": True,
            "message": f"{action_text} thành công",
            "data": {
                "checkinId": checkin_id,
                "employeeId": request.employeeId,
                "employeeName": emp_data.get("fullName", ""),
                "checkinType": request.checkinType,
                "timestamp": request.timestamp,
                "date": current_date,
                "status": "success"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in process_checkin: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi check-in: {str(e)}")


@app.delete("/face/delete/{employeeId}")
async def delete_face_id(employeeId: str):
    """Delete face ID for an employee"""
    try:
        print(f"📥 Received delete face ID request for: {employeeId}")
        
        if not db:
            raise HTTPException(status_code=500, detail="Firestore not initialized")
        
        # Get employee info first
        emp_doc = db.collection("employees").document(employeeId).get()
        if not emp_doc.exists:
            raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")
        
        emp_data = emp_doc.to_dict()
        
        # Delete face image file if exists
        face_image_path = emp_data.get("faceImagePath")
        if face_image_path and os.path.exists(face_image_path):
            try:
                os.remove(face_image_path)
                print(f"🗑️ Deleted face image: {face_image_path}")
            except Exception as e:
                print(f"⚠️ Could not delete face image: {str(e)}")
        
        # Delete face data from Firestore
        update_data = {
            "faceRegistered": False,
            "faceEncoding": firestore.DELETE_FIELD,
            "faceImagePath": firestore.DELETE_FIELD,
            "faceIdCreatedAt": firestore.DELETE_FIELD
        }
        
        db.collection("employees").document(employeeId).update(update_data)
        
        # Remove from in-memory storage
        if employeeId in known_face_encodings:
            del known_face_encodings[employeeId]
            print(f"🗑️ Removed from known_face_encodings")
        if employeeId in known_face_metadata:
            del known_face_metadata[employeeId]
            print(f"🗑️ Removed from known_face_metadata")
        
        print(f"✅ Face ID deleted successfully for: {employeeId}")
        
        return {
            "success": True,
            "message": "Xóa Face ID thành công",
            "data": {
                "employeeId": employeeId,
                "employeeName": emp_data.get("fullName", ""),
                "imageDeleted": face_image_path is not None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in delete_face_id: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi xóa Face ID: {str(e)}")


@app.get("/face/employees/unregistered")
async def get_unregistered_employees():
    """Get list of employees without face registration"""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Firestore not initialized")
        
        employees_ref = db.collection("employees").where("faceRegistered", "==", False)
        docs = employees_ref.stream()
        
        employees = []
        for doc in docs:
            emp_data = doc.to_dict()
            employees.append({
                "_id": doc.id,
                "fullName": emp_data.get("fullName", ""),
                "position": emp_data.get("position", ""),
                "avatarUrl": emp_data.get("avatarUrl", ""),
                "faceRegistered": False
            })
        
        return {
            "success": True,
            "count": len(employees),
            "employees": employees
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy danh sách: {str(e)}")


async def load_face_encodings_from_firestore():
    """Load all face encodings from Firestore on startup"""
    try:
        print("📥 Loading face encodings from Firestore...")
        
        if not db:
            print("⚠️ Firestore not initialized, skipping face encoding load")
            return
        
        # Query all employees with face registered
        employees_ref = db.collection("employees").where("faceRegistered", "==", True)
        docs = employees_ref.stream()
        
        count = 0
        for doc in docs:
            emp_data = doc.to_dict()
            emp_id = doc.id
            
            # Check if faceEncoding exists
            if "faceEncoding" in emp_data and emp_data["faceEncoding"]:
                try:
                    # Convert encoding back to numpy array
                    encoding = np.array(emp_data["faceEncoding"])
                    
                    # Store in memory
                    known_face_encodings[emp_id] = encoding
                    known_face_metadata[emp_id] = {
                        "fullName": emp_data.get("fullName", ""),
                        "position": emp_data.get("position", ""),
                        "avatarUrl": emp_data.get("avatarUrl", "")
                    }
                    count += 1
                    print(f"✅ Loaded: {emp_data.get('fullName', emp_id)}")
                except Exception as e:
                    print(f"⚠️ Error loading encoding for {emp_id}: {str(e)}")
        
        print(f"✅ Successfully loaded {count} face encodings from Firestore")
        
    except Exception as e:
        print(f"❌ Error loading face encodings: {str(e)}")
        import traceback
        traceback.print_exc()


@app.on_event("startup")
async def startup_event():
    print("🚀 Face Recognition API started")
    # Load existing face encodings from database
    await load_face_encodings_from_firestore()


@app.on_event("shutdown")
async def shutdown_event():
    print("👋 Face Recognition API stopped")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
