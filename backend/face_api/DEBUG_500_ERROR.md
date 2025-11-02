# Debugging 500 Error - Face Registration

## Common Causes

### 1. FastAPI Service Not Running

**Check**: Is FastAPI running on port 8000?

```bash
# Terminal 1 - Start FastAPI
cd backend/face_api
python main.py

# Should see:
# 🚀 Face Recognition API started
# INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Connection Refused

**Error in Node.js logs**: `ECONNREFUSED`

**Solution**: Check if FastAPI is running and the URL is correct

```bash
# Test FastAPI directly
curl http://localhost:8000/face/health

# Should return:
# {"status":"healthy","firestore_connected":true,"loaded_faces":0}
```

### 3. Missing Python Dependencies

**Error**: Module not found (e.g., `face_recognition`, `firebase_admin`)

**Solution**:

```bash
cd backend/face_api
pip install -r requirements.txt
```

### 4. Firebase Credentials Path Wrong

**Error in FastAPI logs**: `Firebase credentials file not found!`

**Solution**:

- Check file exists: `frontend_react/face_checkin/gym-managment-aa0a1-firebase-adminsdk-fbsvc-5004fe1cc0.json`
- Update path in `main.py` line 24:
  ```python
  cred_path = "face_checkin/gym-managment-aa0a1-firebase-adminsdk-fbsvc-5004fe1cc0.json"
  ```

### 5. Cannot Create Directory

**Error**: Permission denied or cannot create directory

**Solution**:

```bash
# Create directory manually
mkdir -p face_checkin/employees_faces

# Or let the script create it
# Check logs for actual path being used
```

### 6. Face Not Detected

**Error**: "No face found in image"

**Solution**:

- Ensure good lighting
- Face should be clearly visible
- No obstructions (glasses, masks)
- Image quality should be at least 100x100px

### 7. Firestore Connection Failed

**Error**: Firebase connection error

**Solution**:

- Check Firebase credentials file is valid
- Verify Firestore rules allow updates
- Check internet connection

## Debugging Steps

### Step 1: Check FastAPI Logs

Look at the terminal where FastAPI is running. You should see logs like:

```
📥 Received registration request for: emp123
💾 Saving image to: emp123_John_Doe.jpg
📁 Saving to: /path/to/file.jpg
✅ Image saved to: /path/to/file.jpg
🔍 Loading image for face encoding...
```

If you see an error, note the exact error message.

### Step 2: Check Node.js Logs

Look at the terminal where Node.js backend is running. You should see:

```
📤 Forwarding to FastAPI: { FASTAPI_URL: 'http://localhost:8000', ... }
```

If you see an error, check:

- Is FASTAPI_URL correct?
- Is FastAPI reachable?

### Step 3: Test Directly

Test FastAPI endpoint directly:

```bash
# Test health
curl http://localhost:8000/face/health

# Test with a sample request (replace with real data)
curl -X POST http://localhost:8000/face/register \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "test123",
    "employeeName": "Test User",
    "imageBase64": "/9j/4AAQSkZJRg..."
  }'
```

### Step 4: Check Browser Console

Open browser DevTools (F12) → Network tab:

- Find the `/api/face/register` request
- Check the response body for error details

### Step 5: Check File Permissions

```bash
# Ensure directories are writable
chmod -R 755 face_checkin/
chmod -R 755 backend/face_api/
```

## Common Fixes

### Fix 1: FastAPI Not Running

```bash
cd backend/face_api
python main.py
```

### Fix 2: Environment Variable

Create `.env` in `backend/`:

```env
FASTAPI_URL=http://localhost:8000
```

### Fix 3: Install Python Dependencies

```bash
cd backend/face_api
pip install fastapi uvicorn face-recognition firebase-admin opencv-python numpy pillow
```

### Fix 4: Create Required Directories

```bash
mkdir -p face_checkin/employees_faces
```

### Fix 5: Fix Firebase Path

Check actual location of credentials file and update `main.py`:

```python
cred_path = "actual/path/to/credentials.json"
```

## Still Having Issues?

1. **Check all logs** (FastAPI, Node.js, Browser console)
2. **Copy the exact error message**
3. **Check version compatibility**:
   - Python 3.8+
   - Node.js 16+
4. **Try restarting everything**:
   - Stop FastAPI (Ctrl+C)
   - Stop Node.js (Ctrl+C)
   - Start FastAPI first
   - Start Node.js second
   - Refresh browser

## Quick Check Script

Run this to verify setup:

```bash
# Check Python version
python --version  # Should be 3.8+

# Check if FastAPI is installed
python -c "import fastapi; print('FastAPI OK')"

# Check if face_recognition is installed
python -c "import face_recognition; print('face_recognition OK')"

# Check if firebase_admin is installed
python -c "import firebase_admin; print('firebase_admin OK')"

# Check credentials file
ls -la face_checkin/*.json

# Test FastAPI
curl http://localhost:8000/face/health
```

## Getting More Help

If still stuck, provide:

1. Full error message from FastAPI terminal
2. Full error message from Node.js terminal
3. Response from browser Network tab
4. Output of `python --version`
5. Whether FastAPI health check works
