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
        
        # Save image
        filename = f"{request.employeeId}_{request.employeeName.replace(' ', '_')}.jpg"
        print(f"💾 Saving image to: {filename}")
        
        image_path = save_base64_image(request.imageBase64, filename)
        print(f"✅ Image saved to: {image_path}")
        
        # Load and encode face
        print("🔍 Loading image for face encoding...")
        img = face_recognition.load_image_file(image_path)
        
        # Try with HOG model first (faster and more tolerant)
        # Options: 
        # - None or 'small' = uses HOG (faster, more tolerant)
        # - 'large' = uses CNN (slower but more accurate)
        encodings = face_recognition.face_encodings(img, num_jitters=1)
        
        if len(encodings) == 0:
            os.remove(image_path)  # Clean up
            print("❌ No face found in image")
            raise HTTPException(status_code=400, detail="Không tìm thấy khuôn mặt trong ảnh")
        
        print(f"✅ Found face, generating encoding...")
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
                "imagePath": image_path
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
        # Use large model for recognition too (more accurate)
        face_encodings = face_recognition.face_encodings(img, model='large')
        
        # Clean up temp file
        os.unlink(temp_file.name)
        
        if len(face_encodings) == 0:
            return {
                "success": False,
                "message": "Không tìm thấy khuôn mặt trong ảnh",
                "employee": None
            }
        
        face_encoding = face_encodings[0]
        
        # Compare with known faces
        matches = []
        for emp_id, known_encoding in known_face_encodings.items():
            distance = face_recognition.face_distance([known_encoding], face_encoding)[0]
            
            # Threshold for face recognition (0.6 is default)
            if distance < 0.6:
                matches.append({
                    "employeeId": emp_id,
                    "distance": float(distance),
                    "metadata": known_face_metadata.get(emp_id, {})
                })
        
        if not matches:
            return {
                "success": False,
                "message": "Không nhận diện được khuôn mặt",
                "employee": None
            }
        
        # Get best match (lowest distance)
        best_match = min(matches, key=lambda x: x["distance"])
        
        return {
            "success": True,
            "message": "Nhận diện khuôn mặt thành công",
            "employee": {
                "_id": best_match["employeeId"],
                "fullName": best_match["metadata"].get("fullName", ""),
                "position": best_match["metadata"].get("position", ""),
                "avatarUrl": best_match["metadata"].get("avatarUrl", ""),
                "confidence": round((1 - best_match["distance"]) * 100, 2)
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
        
        # Delete face data
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
        if employeeId in known_face_metadata:
            del known_face_metadata[employeeId]
        
        print(f"✅ Face ID deleted successfully for: {employeeId}")
        
        return {
            "success": True,
            "message": "Xóa Face ID thành công",
            "data": {
                "employeeId": employeeId,
                "employeeName": emp_data.get("fullName", "")
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


@app.on_event("startup")
async def startup_event():
    print("🚀 Face Recognition API started")


@app.on_event("shutdown")
async def shutdown_event():
    print("👋 Face Recognition API stopped")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
