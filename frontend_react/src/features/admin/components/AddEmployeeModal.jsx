import React, { useState } from 'react';
import { useEmployees } from '../../../firebase/lib/features/employee/employee.provider.jsx';
import { ImageUpload } from '../../../shared/components/ImageUpload';
import { ImageModal } from '../../../shared/components/ImageModal';
import EmployeeFileUploadService from '../../../firebase/lib/features/employee/employee-file-upload.service.js';
import { EmployeeModel } from '../../../firebase/lib/features/employee/employee.model.js';
import Swal from 'sweetalert2';
import './AddEmployeeModal.css';

export default function AddEmployeeModal({ isOpen, onClose }) {
  const { addEmployee } = useEmployees();
  
  const [formData, setFormData] = useState({
    idCard: '',
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
    avatarUrl: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [checkingIdCard, setCheckingIdCard] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

    // Căn cước công dân validation
    const idCardVal = (formData.idCard || '').trim();
    if (!idCardVal) {
      newErrors.idCard = 'Căn cước công dân là bắt buộc';
    } else if (!/^(?:\d{9}|\d{12})$/.test(idCardVal)) {
      newErrors.idCard = 'Căn cước công dân phải là 9 hoặc 12 chữ số';
    }

    // Required fields
    if (!formData.fullName.trim()) newErrors.fullName = 'Họ tên là bắt buộc';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Ngày sinh là bắt buộc';
    if (!formData.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
    if (!formData.email.trim()) newErrors.email = 'Email là bắt buộc';
    if (!formData.address.trim()) newErrors.address = 'Địa chỉ là bắt buộc';
    if (!formData.position) newErrors.position = 'Vị trí làm việc là bắt buộc';
    if (!formData.startDate) newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
    if (!formData.shift) newErrors.shift = 'Ca làm việc là bắt buộc';
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
    if (imageData && previewImageUrl) {
      setImageModalOpen(true);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Kiểm tra căn cước có bị trùng không
      setCheckingIdCard(true);
      const idExists = await EmployeeModel.existsByIdCard(formData.idCard);
      setCheckingIdCard(false);
      
      if (idExists) {
        setErrors({ idCard: 'Căn cước công dân đã tồn tại trong hệ thống' });
        setIsSubmitting(false);
        return;
      }

      let avatarUrl = '';
      
      // Upload image if provided
      if (imageData) {
        setUploadingImage(true);
        const uploadResult = await EmployeeFileUploadService.uploadEmployeeAvatar(imageData);
        
        if (uploadResult.success) {
          avatarUrl = uploadResult.url;
        } else {
          throw new Error(uploadResult.error || 'Lỗi upload ảnh');
        }
      }

      // Step 1: Create Firebase Auth account (only for PT and Admin)
      let uid = null;
      let tempPassword = '';
      
      const needsLoginAccount = formData.role === 'pt' || formData.role === 'admin';
      
      if (needsLoginAccount) {
        try {
          const authResponse = await fetch('http://localhost:3000/api/employees/create-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              displayName: formData.fullName,
              phone: formData.phone
            })
          });

          const authResult = await authResponse.json();
          
          if (!authResult.success) {
            throw new Error(authResult.error || 'Không thể tạo tài khoản đăng nhập');
          }

          uid = authResult.uid;
          tempPassword = authResult.tempPassword;
          
          // Set generated password to display in modal
          setGeneratedPassword(tempPassword);
          
          console.log('✅ Created Firebase Auth account for', formData.role, ':', uid);
        } catch (authError) {
          console.error('Error creating auth account:', authError);
          throw new Error('Không thể tạo tài khoản đăng nhập: ' + authError.message);
        }
      } else {
        console.log('ℹ️ Skipping auth account creation for role:', formData.role);
      }

      // Step 2: Convert string values to appropriate types
      const employeeData = {
        ...formData,
        idCard: formData.idCard,
        uid: uid, // Link to Firebase Auth
        // ❌ REMOVED: tempPassword (security risk - don't store plaintext passwords)
        avatarUrl: avatarUrl || '',
        dateOfBirth: new Date(formData.dateOfBirth),
        startDate: new Date(formData.startDate),
        salary: parseFloat(formData.salary),
        commissionRate: parseFloat(formData.commissionRate),
        totalClients: 0,
        faceRegistered: false // Default face registration status
      };

      // Step 3: Create employee record in Firestore
      await addEmployee(employeeData);
      
      resetForm();
      onClose();
      
      // Step 4: Show success message
      if (needsLoginAccount && tempPassword) {
        // Show password for PT/Admin
        await Swal.fire({
          icon: 'success',
          title: 'Thêm nhân viên thành công!',
          html: `
            <div style="text-align: left; padding: 10px;">
              <p><strong>👤 Nhân viên:</strong> ${formData.fullName}</p>
              <p><strong>📧 Email:</strong> ${formData.email}</p>
              <p><strong>🎭 Quyền:</strong> ${formData.role === 'pt' ? 'PT' : 'Admin/Quản lý'}</p>
              <hr style="margin: 15px 0;">
              <p style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0;">
                <strong>🔑 Mật khẩu tạm thời:</strong><br>
                <span style="font-size: 20px; font-weight: bold; color: #000;">${tempPassword}</span>
              </p>
              <p style="font-size: 12px; color: #dc3545; font-weight: 600;">
                ⚠️ LƯU Ý: Mật khẩu chỉ hiển thị 1 lần này. Hãy copy và gửi cho nhân viên ngay!
              </p>
              <p style="font-size: 11px; color: #6c757d; margin-top: 8px;">
                💡 Nếu quên mật khẩu, admin có thể reset trong phần chỉnh sửa nhân viên.
              </p>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: '📋 Copy Mật Khẩu',
          cancelButtonText: 'Đóng',
          confirmButtonColor: '#28a745',
          cancelButtonColor: '#6c757d',
          width: '500px'
        }).then((result) => {
          if (result.isConfirmed) {
            navigator.clipboard.writeText(tempPassword);
            Swal.fire({
              icon: 'success',
              title: 'Đã copy!',
              text: 'Mật khẩu đã được copy vào clipboard',
              timer: 1500,
              showConfirmButton: false
            });
          }
        });
      } else {
        // Simple success for regular employees
        await Swal.fire({
          icon: 'success',
          title: 'Thêm nhân viên thành công!',
          html: `
            <div style="text-align: left; padding: 10px;">
              <p><strong>👤 Nhân viên:</strong> ${formData.fullName}</p>
              <p><strong>📧 Email:</strong> ${formData.email}</p>
              <p><strong>🎭 Quyền:</strong> Nhân viên</p>
              <hr style="margin: 15px 0;">
              <p style="font-size: 13px; color: #6c757d;">
                ℹ️ Nhân viên thông thường không cần tài khoản đăng nhập hệ thống.
              </p>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#007bff',
          width: '450px'
        });
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      setErrors({ submit: error.message || 'Có lỗi xảy ra khi thêm nhân viên' });
    } finally {
      setIsSubmitting(false);
      setUploadingImage(false);
      setCheckingIdCard(false);
    }
  };

  // Reset form when modal closes
  const resetForm = () => {
    setFormData({
      idCard: '',
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
      avatarUrl: '',
      notes: ''
    });
    setErrors({});
    setImageData(null);
    setUploadingImage(false);
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="add-employee-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Thêm Nhân Viên Mới</h2>
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
                  currentImage={null}
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
                    <option value="admin">Admin/Quản lý</option>
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
                    <option value="fulltime">Fulltime (8:00-17:00)</option>
                    <option value="parttime">Partime</option>
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

            {/* Account Information Section - Only for PT and Admin */}
            {(formData.role === 'pt' || formData.role === 'admin') && (
              <div className="form-section">
                <h3>Thông Tin Tài Khoản</h3>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Tài Khoản Đăng Nhập</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    style={{ 
                      backgroundColor: '#f8f9fa', 
                      color: '#6c757d',
                      cursor: 'not-allowed'
                    }}
                    placeholder="Tài khoản sẽ dùng email đã nhập"
                  />
                  <small style={{ color: '#6c757d', fontSize: '0.85em' }}>
                    💡 Tài khoản đăng nhập sẽ tự động tạo bằng email
                  </small>
                </div>
              </div>

              {generatedPassword && (
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Mật Khẩu Tạm Thời</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={generatedPassword}
                        disabled
                        style={{ 
                          flex: 1,
                          backgroundColor: '#fff3cd', 
                          color: '#856404',
                          fontWeight: 'bold',
                          border: '2px solid #ffc107'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          padding: '10px 15px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPassword);
                          alert('Đã copy mật khẩu!');
                        }}
                        style={{
                          padding: '10px 15px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        📋
                      </button>
                    </div>
                    <small style={{ color: '#856404', fontSize: '0.85em' }}>
                      ⚠️ Lưu ý: Mật khẩu này sẽ được gửi cho nhân viên để đăng nhập lần đầu
                    </small>
                  </div>
                </div>
              )}
              </div>
            )}

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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Đang thêm...
                </>
              ) : (
                <>
                  <span className="icon">👥</span>
                  Thêm Nhân Viên
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