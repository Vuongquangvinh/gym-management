import React, { useState, useEffect } from 'react';
import { useEmployees } from '../../../firebase/lib/features/employee/employee.provider.jsx';
import { ImageUpload } from '../../../shared/components/ImageUpload';
import { ImageModal } from '../../../shared/components/ImageModal';
import EmployeeFileUploadService from '../../../firebase/lib/features/employee/employee-file-upload.service.js';
import { EmployeeModel } from '../../../firebase/lib/features/employee/employee.model.js';
import './AddEmployeeModal.css'; 
export default function EditEmployeeModal({ isOpen, onClose, employee }) {
  const { updateEmployee } = useEmployees();
  
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'male',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
    position: '',
    startDate: '',
    status: 'active',
    shift: '',
    role: 'employee',
    salary: '',
    commissionRate: '0',
    idCard: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(null);
  const [checkingIdCard, setCheckingIdCard] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // Initialize form with employee data
  useEffect(() => {
    if (employee && isOpen) {
      console.log('📋 EditEmployeeModal: Loading employee data:', employee);
      console.log('🖼️ Employee avatarUrl:', employee.avatarUrl);
      
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };

      setFormData({
        fullName: employee.fullName || '',
        gender: employee.gender || 'male',
        dateOfBirth: formatDate(employee.dateOfBirth),
        phone: employee.phone || '',
        email: employee.email || '',
        address: employee.address || '',
        position: employee.position || '',
        startDate: formatDate(employee.startDate),
        status: employee.status || 'active',
        shift: employee.shift || '',
        role: employee.role || 'employee',
        salary: employee.salary?.toString() || '',
        commissionRate: employee.commissionRate?.toString() || '0',
        idCard: employee.idCard || '',
        notes: employee.notes || ''
      });

      // Set current avatar for preview
      if (employee.avatarUrl) {
        console.log('🖼️ Setting current avatar:', employee.avatarUrl);
        // Use backend server to serve uploaded images
        const avatarUrl = employee.avatarUrl.startsWith('http') 
          ? employee.avatarUrl 
          : `http://localhost:3000${employee.avatarUrl}`;
        setCurrentAvatar(avatarUrl);
      } else {
        console.log('❌ No avatar URL found for employee');
        setCurrentAvatar(null);
      }
    }
  }, [employee, isOpen]);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.fullName.trim()) newErrors.fullName = 'Họ tên là bắt buộc';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Ngày sinh là bắt buộc';
    if (!formData.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
    if (!formData.email.trim()) newErrors.email = 'Email là bắt buộc';
    if (!formData.address.trim()) newErrors.address = 'Địa chỉ là bắt buộc';
    if (!formData.position) newErrors.position = 'Vị trí làm việc là bắt buộc';
    if (!formData.startDate) newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
    if (!formData.shift) newErrors.shift = 'Ca làm việc là bắt buộc';
    if (!formData.idCard.trim()) newErrors.idCard = 'Căn cước công dân là bắt buộc';
    if (!formData.salary || parseFloat(formData.salary) < 0) {
      newErrors.salary = 'Lương phải là số dương';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10,11}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải có 10-11 chữ số';
    }

    // ID Card validation
    const idCardRegex = /^(?:\d{9}|\d{12})$/;
    if (formData.idCard && !idCardRegex.test(formData.idCard)) {
      newErrors.idCard = 'Căn cước công dân phải có 9 hoặc 12 chữ số';
    }

    // Date validations
    const today = new Date();
    const birthDate = new Date(formData.dateOfBirth);
    const startDate = new Date(formData.startDate);

    if (formData.dateOfBirth && birthDate >= today) {
      newErrors.dateOfBirth = 'Ngày sinh phải nhỏ hơn ngày hiện tại';
    }

    if (formData.startDate && startDate > today) {
      newErrors.startDate = 'Ngày bắt đầu không được lớn hơn ngày hiện tại';
    }

    // Commission rate validation
    const commissionRate = parseFloat(formData.commissionRate);
    if (commissionRate < 0 || commissionRate > 100) {
      newErrors.commissionRate = 'Tỷ lệ hoa hồng phải từ 0-100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle image upload
  const handleImageChange = (data) => {
    setImageData(data);
    // Set preview URL cho image modal
    if (data && data.file) {
      const url = URL.createObjectURL(data.file);
      setPreviewImageUrl(url);
    }
  };

  // Handle click vào ảnh để phóng to
  const handleImageClick = () => {
    // Kiểm tra ảnh mới upload hoặc ảnh hiện tại
    if (imageData && previewImageUrl) {
      setImageModalOpen(true);
    } else if (currentAvatar) {
      setPreviewImageUrl(currentAvatar);
      setImageModalOpen(true);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Kiểm tra idCard trùng lặp (loại trừ nhân viên hiện tại)
    setCheckingIdCard(true);
    try {
      const employeeId = employee._id || employee.id;
      console.log('🔍 Checking idCard:', formData.idCard, 'excluding employee:', employeeId);
      
      const idCardExists = await EmployeeModel.existsByIdCard(formData.idCard, employeeId);
      if (idCardExists) {
        setErrors(prev => ({
          ...prev,
          idCard: 'Căn cước công dân này đã tồn tại trong hệ thống'
        }));
        setCheckingIdCard(false);
        return;
      }
    } catch (error) {
      console.error('Lỗi kiểm tra idCard:', error);
      setErrors(prev => ({
        ...prev,
        idCard: 'Lỗi khi kiểm tra căn cước công dân'
      }));
      setCheckingIdCard(false);
      return;
    }
    setCheckingIdCard(false);

    setIsSubmitting(true);
    
    try {
      let avatarUrl = employee.avatarUrl || ''; // Giữ nguyên URL cũ
      console.log('💾 Saving employee - Original avatarUrl:', employee.avatarUrl);
      console.log('🖼️ New image data:', !!imageData);
      
      // Upload new image if provided
      if (imageData) {
        setUploadingImage(true);
        
        // Delete old avatar if exists
        if (employee.avatarUrl) {
          const oldFileName = employee.avatarUrl.split('/').pop();
          await EmployeeFileUploadService.deleteEmployeeAvatar(oldFileName);
        }
        
        const uploadResult = await EmployeeFileUploadService.uploadEmployeeAvatar(imageData);
        
        if (uploadResult.success) {
          avatarUrl = uploadResult.url;
        } else {
          throw new Error(uploadResult.error || 'Lỗi upload ảnh');
        }
      }

      // Convert string values to appropriate types  
      const updateData = {
        ...formData,
        avatarUrl, // Sẽ giữ nguyên URL cũ nếu không có ảnh mới
        dateOfBirth: new Date(formData.dateOfBirth),
        startDate: new Date(formData.startDate),
        salary: parseFloat(formData.salary),
        commissionRate: parseFloat(formData.commissionRate)
      };

      console.log('💾 Final update data avatarUrl:', updateData.avatarUrl);
      await updateEmployee(employee._id, updateData);
      onClose();
    } catch (error) {
      console.error('Error updating employee:', error);
      setErrors({ submit: error.message || 'Có lỗi xảy ra khi cập nhật nhân viên' });
    } finally {
      setIsSubmitting(false);
      setUploadingImage(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="add-employee-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chỉnh Sửa Nhân Viên</h2>
          <button className="close-btn" onClick={handleClose} disabled={isSubmitting}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="employee-form">
          <div className="form-sections">
            {/* Avatar Upload Section */}
            <div className="form-section avatar-section">
              <h3>Ảnh Đại Diện</h3>
              <div className="avatar-upload-container">
                <ImageUpload
                  currentImage={currentAvatar}
                  onImageChange={handleImageChange}
                  onImageClick={handleImageClick}
                  width={160}
                  height={200}
                  maxSizeKB={500}
                  acceptedFormats="image/jpeg,image/jpg,image/png"
                />
                {uploadingImage && (
                  <div className="upload-status">
                    <span>📤 Đang upload ảnh...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="form-section">
              <h3>Thông Tin Cá Nhân</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Họ và Tên *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                    className={errors.fullName ? 'error' : ''}
                  />
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label>Giới Tính *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày Sinh *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={errors.dateOfBirth ? 'error' : ''}
                  />
                  {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
                </div>

                <div className="form-group">
                  <label>Số Điện Thoại *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0901234567"
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Địa Chỉ *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ đầy đủ"
                    rows="2"
                    className={errors.address ? 'error' : ''}
                  />
                  {errors.address && <span className="error-message">{errors.address}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Căn Cước Công Dân *</label>
                  <input
                    type="text"
                    name="idCard"
                    value={formData.idCard}
                    onChange={handleChange}
                    placeholder="Nhập 9 hoặc 12 chữ số (VD: 012345678 hoặc 012345678901)"
                    className={errors.idCard ? 'error' : ''}
                  />
                  {errors.idCard && <span className="error-message">{errors.idCard}</span>}
                </div>
              </div>
            </div>

            {/* Work Information Section */}
            <div className="form-section">
              <h3>Thông Tin Công Việc</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Vị Trí Làm Việc *</label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className={errors.position ? 'error' : ''}
                  >
                    <option value="">Chọn vị trí</option>
                    <option value="PT">PT (Personal Trainer)</option>
                    <option value="Lễ tân">Lễ tân</option>
                    <option value="Quản lý">Quản lý</option>
                    <option value="Kế toán">Kế toán</option>
                    <option value="Bảo vệ">Bảo vệ</option>
                    <option value="Vệ sinh">Vệ sinh</option>
                    <option value="Khác">Khác</option>
                  </select>
                  {errors.position && <span className="error-message">{errors.position}</span>}
                </div>

                <div className="form-group">
                  <label>Quyền Hệ Thống *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="employee">Nhân viên</option>
                    <option value="pt">PT</option>
                    <option value="manager">Quản lý</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngày Bắt Đầu *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={errors.startDate ? 'error' : ''}
                  />
                  {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                </div>

                <div className="form-group">
                  <label>Ca Làm Việc *</label>
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleChange}
                    className={errors.shift ? 'error' : ''}
                  >
                    <option value="">Chọn ca làm việc</option>
                    <option value="morning">Ca sáng (6:00-14:00)</option>
                    <option value="afternoon">Ca chiều (14:00-22:00)</option>
                    <option value="evening">Ca tối (18:00-22:00)</option>
                    <option value="full-time">Full-time (8:00-17:00)</option>
                    <option value="part-time">Part-time</option>
                  </select>
                  {errors.shift && <span className="error-message">{errors.shift}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Trạng Thái</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">Đang làm việc</option>
                    <option value="inactive">Tạm nghỉ</option>
                    <option value="resigned">Đã nghỉ việc</option>
                    <option value="suspended">Tạm đình chỉ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Information Section */}
            <div className="form-section">
              <h3>Thông Tin Lương</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Lương Cơ Bản (VNĐ) *</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="5000000"
                    min="0"
                    step="100000"
                    className={errors.salary ? 'error' : ''}
                  />
                  {errors.salary && <span className="error-message">{errors.salary}</span>}
                </div>

                <div className="form-group">
                  <label>Tỷ Lệ Hoa Hồng (%)</label>
                  <input
                    type="number"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleChange}
                    placeholder="10"
                    min="0"
                    max="100"
                    step="0.5"
                    className={errors.commissionRate ? 'error' : ''}
                  />
                  {errors.commissionRate && <span className="error-message">{errors.commissionRate}</span>}
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="form-section">
              <h3>Thông Tin Bổ Sung</h3>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Ghi Chú</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Thông tin bổ sung về nhân viên..."
                    rows="3"
                  />
                </div>
              </div>

              {/* Display additional info */}
              <div className="form-row">
                <div className="form-group">
                  <label>ID Nhân Viên</label>
                  <input
                    type="text"
                    value={employee._id}
                    disabled
                    style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                  />
                </div>
                
                <div className="form-group">
                  <label>Ngày Tạo</label>
                  <input
                    type="text"
                    value={employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    disabled
                    style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                  />
                </div>
              </div>

              {employee.position === 'PT' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Số Khách Hàng</label>
                    <input
                      type="text"
                      value={`${employee.totalClients || 0} khách hàng`}
                      disabled
                      style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="form-error">
              {errors.submit}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel-addemployee"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting || checkingIdCard}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Đang cập nhật...
                </>
              ) : checkingIdCard ? (
                <>
                  <span className="spinner"></span>
                  Kiểm tra căn cước...
                </>
              ) : (
                <>
                  <span className="icon">✏️</span>
                  Cập Nhật Nhân Viên
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={previewImageUrl}
        title="Ảnh đại diện nhân viên"
      />
    </div>
  );
}