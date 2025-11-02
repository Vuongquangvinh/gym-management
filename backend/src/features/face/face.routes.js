import express from 'express';
import axios from 'axios';

const router = express.Router();

// FastAPI endpoint (adjust port as needed)
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// POST /api/face/register - Register face for employee
router.post('/register', async (req, res) => {
  try {
    const { employeeId, employeeName, imageBase64 } = req.body;

    if (!employeeId || !employeeName || !imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: employeeId, employeeName, imageBase64'
      });
    }

    console.log('📤 Forwarding to FastAPI:', {
      FASTAPI_URL,
      employeeId,
      employeeName,
      imageSize: imageBase64?.length || 0
    });

    // Forward request to FastAPI
    const response = await axios.post(`${FASTAPI_URL}/face/register`, {
      employeeId,
      employeeName,
      imageBase64
    });

    console.log('✅ FastAPI response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Face registration error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    });
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.detail || 'Đăng ký Face ID thất bại: ' + error.message
    });
  }
});

// POST /api/face/recognize - Recognize face from image
router.post('/recognize', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu dữ liệu hình ảnh'
      });
    }

    // Forward request to FastAPI
    const response = await axios.post(`${FASTAPI_URL}/face/recognize`, {
      imageBase64
    });

    res.json(response.data);
  } catch (error) {
    console.error('Face recognition error:', error);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.detail || 'Nhận diện khuôn mặt thất bại: ' + error.message
    });
  }
});

// POST /api/face/checkin - Process face checkin
router.post('/checkin', async (req, res) => {
  try {
    const { employeeId, checkinType, timestamp } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu employeeId'
      });
    }

    console.log('📤 Forwarding checkin to FastAPI:', {
      FASTAPI_URL,
      employeeId,
      checkinType,
      timestamp
    });

    // Forward request to FastAPI
    const response = await axios.post(`${FASTAPI_URL}/face/checkin`, {
      employeeId,
      checkinType: checkinType || 'face_recognition',
      timestamp: timestamp || new Date().toISOString()
    });

    console.log('✅ FastAPI checkin response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Face checkin error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    });
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.detail || 'Check-in thất bại: ' + error.message
    });
  }
});

// DELETE /api/face/delete/:employeeId - Delete face ID for employee
router.delete('/delete/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    console.log('📤 Forwarding delete face ID to FastAPI:', {
      FASTAPI_URL,
      employeeId
    });

    const response = await axios.delete(`${FASTAPI_URL}/face/delete/${employeeId}`);

    console.log('✅ FastAPI delete response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Face delete error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    });
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.detail || 'Xóa Face ID thất bại: ' + error.message
    });
  }
});

// GET /api/face/employees/unregistered - Get employees without face registration
router.get('/employees/unregistered', async (req, res) => {
  try {
    // Forward request to FastAPI
    const response = await axios.get(`${FASTAPI_URL}/face/employees/unregistered`);
    res.json(response.data);
  } catch (error) {
    console.error('Get unregistered employees error:', error);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.detail || 'Không thể lấy danh sách nhân viên'
    });
  }
});

export default router;