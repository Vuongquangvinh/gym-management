import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Face Registration API
export const registerFaceAPI = async (employeeId, employeeName, imageBase64) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/face/register`, {
      employeeId,
      employeeName,
      imageBase64
    });
    return response.data;
  } catch (error) {
    console.error('Face registration API error:', error);
    throw new Error(error.response?.data?.message || 'Đăng ký Face ID thất bại');
  }
};

// Face Recognition API
export const recognizeFaceAPI = async (imageBase64) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/face/recognize`, {
      imageBase64
    });
    return response.data;
  } catch (error) {
    console.error('Face recognition API error:', error);
    throw new Error(error.response?.data?.message || 'Nhận diện khuôn mặt thất bại');
  }
};

// Face Checkin API
export const faceCheckinAPI = async (employeeId, checkinType = 'face_recognition', timestamp) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/face/checkin`, {
      employeeId,
      checkinType,
      timestamp
    });
    return response.data;
  } catch (error) {
    console.error('Face checkin API error:', error);
    throw new Error(error.response?.data?.message || 'Check-in thất bại');
  }
};

// Get Face Registration Status
export const getFaceRegistrationStatusAPI = async (employeeId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/face/status/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error('Get face status API error:', error);
    throw new Error(error.response?.data?.message || 'Không thể lấy trạng thái Face ID');
  }
};

// Update Face Registration Status
export const updateFaceRegistrationStatusAPI = async (employeeId, faceRegistered, faceImagePath) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/face/status/${employeeId}`, {
      faceRegistered,
      faceImagePath
    });
    return response.data;
  } catch (error) {
    console.error('Update face status API error:', error);
    throw new Error(error.response?.data?.message || 'Cập nhật trạng thái Face ID thất bại');
  }
};

// Get Face Checkin History
export const getFaceCheckinHistoryAPI = async (employeeId, limit = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/face/checkin-history/${employeeId}?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Get face checkin history API error:', error);
    throw new Error(error.response?.data?.message || 'Không thể lấy lịch sử check-in');
  }
};

// Face Recognition Service (for integration with Python backend)
export class FaceRecognitionService {
  static async processFaceRegistration(employeeData, imageBlob) {
    try {
      // Convert blob to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(imageBlob);
      });

      // Call Python backend
      const result = await registerFaceAPI(
        employeeData._id,
        employeeData.fullName,
        base64
      );

      return result;
    } catch (error) {
      console.error('Face registration service error:', error);
      throw error;
    }
  }

  static async processFaceRecognition(imageBlob) {
    try {
      // Convert blob to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(imageBlob);
      });

      // Call Python backend
      const result = await recognizeFaceAPI(base64);

      return result;
    } catch (error) {
      console.error('Face recognition service error:', error);
      throw error;
    }
  }

  static async processCheckin(employeeId) {
    try {
      const result = await faceCheckinAPI(
        employeeId,
        'face_recognition',
        new Date().toISOString()
      );

      return result;
    } catch (error) {
      console.error('Face checkin service error:', error);
      throw error;
    }
  }
}

export default FaceRecognitionService;