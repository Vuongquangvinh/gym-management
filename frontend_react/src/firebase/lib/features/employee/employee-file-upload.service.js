// File upload service for handling backend API calls for employee avatars
class EmployeeFileUploadService {
  constructor() {
    this.baseUrl = '/uploads/employees/avatars';
    this.apiUrl = 'http://localhost:3000/api/upload'; // Backend API URL
  }

  async uploadFile(file, options = {}) {
    try {
      console.log('🔄 Uploading employee avatar to backend:', file.name);
      
      // Validate file
      const isValid = await this.validateFile(file);
      if (!isValid) {
        throw new Error('File không hợp lệ');
      }

      // Create FormData for upload
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Add filename if provided
      if (options.fileName) {
        formData.append('fileName', options.fileName);
      }

      // Upload to backend
      const response = await fetch(`${this.apiUrl}/employee-avatar`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload thất bại');
      }

      console.log('✅ Employee avatar uploaded successfully:', result.fileName);
      
      return {
        success: true,
        fileName: result.fileName,
        url: result.url,
        path: result.path,
        size: result.size,
        originalName: result.originalName
      };
    } catch (error) {
      console.error('❌ Employee avatar upload error:', error);
      throw error;
    }
  }

  async deleteFile(fileName) {
    try {
      console.log('🗑️ Deleting employee avatar from backend:', fileName);
      
      const response = await fetch(`${this.apiUrl}/employee-avatar/${fileName}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Xóa file thất bại');
      }

      console.log('✅ Employee avatar deleted successfully:', fileName);
      return { success: true };
    } catch (error) {
      console.error('❌ Employee avatar delete error:', error);
      throw error;
    }
  }

  getFileUrl(fileName) {
    // Return the URL path for the uploaded file
    return `${this.baseUrl}/${fileName}`;
  }

  async validateFile(file) {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Chỉ hỗ trợ file JPG, JPEG, PNG');
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File không được vượt quá 5MB');
    }

    return true;
  }

  generateFileName(file) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    return `emp_${timestamp}_${random}.${extension}`;
  }

  // Get all uploaded files from backend
  async getAllFiles() {
    try {
      const response = await fetch(`${this.apiUrl}/employee-avatars`);
      const result = await response.json();
      
      if (result.success) {
        return result.files;
      } else {
        throw new Error(result.error || 'Không thể lấy danh sách file');
      }
    } catch (error) {
      console.error('❌ Get files error:', error);
      return [];
    }
  }

  // Check if file exists on backend
  async fileExists(fileName) {
    try {
      const response = await fetch(`${this.apiUrl}/employee-avatar/${fileName}`);
      const result = await response.json();
      return result.success;
    } catch (error) {
      return false;
    }
  }

  // Get file info from backend
  async getFileInfo(fileName) {
    try {
      const response = await fetch(`${this.apiUrl}/employee-avatar/${fileName}`);
      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Get file info error:', error);
      return null;
    }
  }

  // Static methods for backward compatibility with existing code
  static async uploadEmployeeAvatar(imageData) {
    const service = new EmployeeFileUploadService();
    const { file, fileName } = imageData;
    
    try {
      const result = await service.uploadFile(file, { fileName });
      return {
        success: true,
        path: result.path,
        fileName: result.fileName,
        url: result.url
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Có lỗi khi upload ảnh'
      };
    }
  }

  // Static method to get file URL
  static getFileUrl(fileName) {
    const service = new EmployeeFileUploadService();
    return service.getFileUrl(fileName);
  }

  // Static method for deleting employee avatar
  static async deleteEmployeeAvatar(fileName) {
    const service = new EmployeeFileUploadService();
    try {
      const result = await service.deleteFile(fileName);
      return {
        success: true,
        message: 'File đã được xóa thành công'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Có lỗi khi xóa file'
      };
    }
  }
}

export { EmployeeFileUploadService };
export default EmployeeFileUploadService;