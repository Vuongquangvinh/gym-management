import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEmployees } from '../../../../firebase/lib/features/employee/employee.provider.jsx';
import styles from './PTInfoModal.module.css';

const SPECIALTY_OPTIONS = [
  'Giảm cân',
  'Tăng cơ', 
  'Yoga',
  'Cardio',
  'Phục hồi chấn thương',
  'Powerlifting',
  'CrossFit',
  'Pilates',
  'Boxing',
  'Khác'
];

const LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' }
];

export default function PTInfoModal({ isOpen, onClose, pt, onUpdate }) {
  const { updateEmployee } = useEmployees();
  
  const [formData, setFormData] = useState({
    specialties: [],
    experience: 0,
    bio: '',
    certificates: [],
    availableHours: [],
    maxClientsPerDay: 8,
    isAcceptingNewClients: true,
    languages: ['vi'],
    achievements: [],
    socialMedia: {
      facebook: '',
      instagram: '',
      youtube: '',
      tiktok: ''
    }
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCertificate, setNewCertificate] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  
  // Image management states
  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    imageUrl: '',
    imageType: '', // 'certificate' or 'achievement'
    imageIndex: -1
  });
  const [uploadingImages, setUploadingImages] = useState({
    certificates: false,
    achievements: false
  });
  const [newTimeSlot, setNewTimeSlot] = useState({ from: '', to: '' });
  
  // Ref to store recent uploads to prevent duplicates (StrictMode safe)
  const recentUploadsRef = useRef(new Set());

  // Initialize form with PT data
  useEffect(() => {
    if (pt && isOpen) {
      const ptInfo = pt.ptInfo || {};
      
      // Convert legacy string arrays to new object format
      const convertToObjectArray = (items, prefix = 'item') => {
        if (!items || items.length === 0) return [];
        return items.map((item, index) => {
          // If item is a Firebase Storage URL (string starting with https://firebasestorage)
          if (typeof item === 'string' && item.startsWith('https://firebasestorage')) {
            return {
              id: `${prefix}_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
              text: `${prefix === 'cert' ? 'Chứng chỉ' : 'Thành tích'} ${index + 1}`,
              images: [{
                id: `img_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
                url: item,
                fileName: item.split('/').pop().split('?')[0], // Extract filename from URL
                uploadedAt: new Date()
              }]
            };
          }
          
          // If item is a plain string (not a URL)
          if (typeof item === 'string') {
            return {
              id: `${prefix}_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
              text: item,
              images: []
            };
          }
          
          // If item is object, ensure images have proper Date objects for uploadedAt
          if (item.images && Array.isArray(item.images)) {
            item.images = item.images.map(img => {
              let uploadedAt;
              if (img.uploadedAt) {
                // If it's already a Date object, use it directly
                if (img.uploadedAt instanceof Date) {
                  uploadedAt = img.uploadedAt;
                } else {
                  // If it's a string or timestamp, convert to Date
                  uploadedAt = new Date(img.uploadedAt);
                  // Check if the created Date is valid
                  if (isNaN(uploadedAt.getTime())) {
                    uploadedAt = new Date();
                  }
                }
              } else {
                uploadedAt = new Date();
              }
              
              return {
                ...img,
                uploadedAt: uploadedAt
              };
            });
          }
          
          return item; // Already in new format
        });
      };

      setFormData({
        specialties: ptInfo.specialties || [],
        experience: ptInfo.experience || 0,
        bio: ptInfo.bio || '',
        certificates: convertToObjectArray(ptInfo.certificates, 'cert'),
        availableHours: ptInfo.availableHours || [],
        maxClientsPerDay: ptInfo.maxClientsPerDay || 8,
        isAcceptingNewClients: ptInfo.isAcceptingNewClients !== false,
        languages: ptInfo.languages || ['vi'],
        achievements: convertToObjectArray(ptInfo.achievements, 'achiev'),
        socialMedia: {
          facebook: ptInfo.socialMedia?.facebook || '',
          instagram: ptInfo.socialMedia?.instagram || '',
          youtube: ptInfo.socialMedia?.youtube || '',
          tiktok: ptInfo.socialMedia?.tiktok || ''
        }
      });
      
      setErrors({});
    }
  }, [pt, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSocialMediaChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleSpecialtyToggle = (specialty) => {
    setFormData(prev => {
      const specialties = prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty];
      
      return {
        ...prev,
        specialties: specialties.slice(0, 5) // Max 5 specialties
      };
    });
  };

  const handleLanguageToggle = (language) => {
    setFormData(prev => {
      const languages = prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language];
      
      return {
        ...prev,
        languages: languages.length > 0 ? languages : ['vi'] // At least Vietnamese
      };
    });
  };

  const addCertificate = () => {
    if (newCertificate.trim() && formData.certificates.length < 10) {
      const newCert = {
        id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: newCertificate.trim(),
        images: []
      };
      setFormData(prev => ({
        ...prev,
        certificates: [...prev.certificates, newCert]
      }));
      setNewCertificate('');
    }
  };

  const removeCertificate = (index) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index)
    }));
  };

  const addAchievement = () => {
    if (newAchievement.trim() && formData.achievements.length < 20) {
      const newAchiev = {
        id: `achiev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: newAchievement.trim(),
        images: []
      };
      setFormData(prev => ({
        ...prev,
        achievements: [...prev.achievements, newAchiev]
      }));
      setNewAchievement('');
    }
  };

  const removeAchievement = (index) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  // Image handling functions
  const handleImageUpload = useCallback(async (file, type, itemIndex) => {
    if (!file || file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File quá lớn. Vui lòng chọn ảnh dưới 5MB.');
      return;
    }

    // Prevent duplicate uploads - check both global and specific item uploading
    if (uploadingImages[type]) {
      console.log('⚠️ Upload already in progress for', type);
      return;
    }

    // Additional check: prevent duplicate upload for same file content
    const fileHash = `${file.name}_${file.size}_${file.lastModified}`;
    const uploadKey = `${type}_${itemIndex}_${fileHash}`;
    
    // Use ref to store recent uploads (StrictMode safe)
    if (recentUploadsRef.current.has(uploadKey)) {
      console.log('⚠️ Duplicate upload detected, skipping:', uploadKey);
      return;
    }
    recentUploadsRef.current.add(uploadKey);
    
    // Clean up cache after 5 seconds
    setTimeout(() => {
      recentUploadsRef.current.delete(uploadKey);
    }, 5000);

    console.log('🚀 Starting upload:', { type, itemIndex, fileName: file.name });
    setUploadingImages(prev => ({ ...prev, [type]: true }));

    try {
      // Create FormData for file upload
      const formData = new FormData();
      const fieldName = type === 'certificates' ? 'certificate' : 'achievement';
      formData.append(fieldName, file);

      // API endpoint based on type (backend mounts upload routes under /api/upload)
      const endpoint = type === 'certificates' ? '/api/upload/pt-certificate' : '/api/upload/pt-achievement';

      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Create truly unique ID with more entropy
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 12); // Longer random string
        const uniqueId = `${type.slice(0, -1)}_${timestamp}_${randomId}_${itemIndex}_${Math.floor(Math.random() * 10000)}`;
        
        const imageData = {
          id: uniqueId,
          url: result.url, // File path instead of base64
          path: result.path,
          fileName: result.fileName,
          name: result.originalName || file.name,
          size: result.size,
          uploadedAt: new Date()
        };

        console.log('✅ Upload successful, adding image with ID:', uniqueId);

        setFormData(prev => {
          const newData = { ...prev };
          
          // Extra protection: Check if image with same ID already exists
          let targetArray;
          if (type === 'certificates') {
            targetArray = newData.certificates[itemIndex].images;
          } else if (type === 'achievements') {
            targetArray = newData.achievements[itemIndex].images;
          }
          
          // Check for duplicate ID
          const existingImage = targetArray.find(img => img.id === uniqueId);
          if (existingImage) {
            console.warn('⚠️ Image with same ID already exists, skipping:', uniqueId);
            return prev; // Don't update if duplicate
          }
          
          // Add image to array
          if (type === 'certificates') {
            newData.certificates[itemIndex].images.push(imageData);
          } else if (type === 'achievements') {
            newData.achievements[itemIndex].images.push(imageData);
          }
          
          console.log(`📊 Current ${type}[${itemIndex}] images count:`, targetArray.length + 1);
          return newData;
        });

        console.log(`✅ Image added to formData for ${type}[${itemIndex}]:`, {
          imageId: uniqueId,
          fileName: result.fileName,
          url: result.url
        });
      } else {
        console.error('❌ Upload failed:', result.error);
        alert(`Lỗi upload ${type === 'certificates' ? 'chứng chỉ' : 'thành tích'}: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      alert('Có lỗi khi tải ảnh lên. Vui lòng thử lại.');
    } finally {
      // Always reset uploading flag
      console.log('🏁 Upload process finished for', type);
      setUploadingImages(prev => ({ ...prev, [type]: false }));
    }
  }, [uploadingImages]); // Dependencies for useCallback

  const removeImage = async (type, itemIndex, imageId) => {
    try {
      // Find the image to get fileName for deletion
      let imageToDelete = null;
      if (type === 'certificates') {
        imageToDelete = formData.certificates[itemIndex].images.find(img => img.id === imageId);
      } else if (type === 'achievements') {
        imageToDelete = formData.achievements[itemIndex].images.find(img => img.id === imageId);
      }

      // If image has fileName (uploaded via API), delete from server
      if (imageToDelete && imageToDelete.fileName) {
        // Backend delete route is mounted under /api/upload
        const endpoint = type === 'certificates' ? '/api/upload/pt-certificate' : '/api/upload/pt-achievement';

        const response = await fetch(`http://localhost:3000${endpoint}/${imageToDelete.fileName}`, {
          method: 'DELETE'
        });

        const result = await response.json();
        if (!result.success) {
          console.warn('Failed to delete file from server:', result.error);
          // Continue with local removal even if server deletion fails
        } else {
          console.log(`🗑️ ${type} deleted from server:`, imageToDelete.fileName);
        }
      }

      // Remove from local state
      setFormData(prev => {
        const newData = { ...prev };
        if (type === 'certificates') {
          newData.certificates[itemIndex].images = newData.certificates[itemIndex].images.filter(img => img.id !== imageId);
        } else if (type === 'achievements') {
          newData.achievements[itemIndex].images = newData.achievements[itemIndex].images.filter(img => img.id !== imageId);
        }
        return newData;
      });
    } catch (error) {
      console.error('Error removing image:', error);
      // Still remove from local state even if server deletion fails
      setFormData(prev => {
        const newData = { ...prev };
        if (type === 'certificates') {
          newData.certificates[itemIndex].images = newData.certificates[itemIndex].images.filter(img => img.id !== imageId);
        } else if (type === 'achievements') {
          newData.achievements[itemIndex].images = newData.achievements[itemIndex].images.filter(img => img.id !== imageId);
        }
        return newData;
      });
    }
  };

  const openImageViewer = (imageUrl, type, imageIndex) => {
    setImageViewer({
      isOpen: true,
      imageUrl,
      imageType: type,
      imageIndex
    });
  };

  const closeImageViewer = () => {
    setImageViewer({
      isOpen: false,
      imageUrl: '',
      imageType: '',
      imageIndex: -1
    });
  };

  const addTimeSlot = () => {
    if (newTimeSlot.from && newTimeSlot.to) {
      const timeSlotString = `${newTimeSlot.from}-${newTimeSlot.to}`;
      
      if (!formData.availableHours.includes(timeSlotString) && formData.availableHours.length < 10) {
        setFormData(prev => ({
          ...prev,
          availableHours: [...prev.availableHours, timeSlotString]
        }));
        setNewTimeSlot({ from: '', to: '' });
      }
    }
  };

  const removeTimeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      availableHours: prev.availableHours.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.experience < 0 || formData.experience > 50) {
      newErrors.experience = 'Kinh nghiệm phải từ 0 đến 50 năm';
    }

    if (formData.bio.length > 1000) {
      newErrors.bio = 'Mô tả không được quá 1000 ký tự';
    }

    if (formData.maxClientsPerDay < 1 || formData.maxClientsPerDay > 20) {
      newErrors.maxClientsPerDay = 'Số khách hàng tối đa phải từ 1 đến 20';
    }

    if (formData.specialties.length === 0) {
      newErrors.specialties = 'Vui lòng chọn ít nhất 1 chuyên môn';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Ensure all uploadedAt fields are proper Date objects before saving
      const sanitizedFormData = {
        ...formData,
        certificates: formData.certificates.map(cert => ({
          ...cert,
          images: cert.images?.map(img => {
            let uploadedAt;
            if (img.uploadedAt) {
              // If it's already a Date object, use it directly
              if (img.uploadedAt instanceof Date) {
                uploadedAt = img.uploadedAt;
              } else {
                // If it's a string or timestamp, convert to Date
                uploadedAt = new Date(img.uploadedAt);
                // Check if the created Date is valid
                if (isNaN(uploadedAt.getTime())) {
                  uploadedAt = new Date();
                }
              }
            } else {
              uploadedAt = new Date();
            }
            
            return {
              ...img,
              uploadedAt: uploadedAt
            };
          }) || []
        })),
        achievements: formData.achievements.map(achiev => ({
          ...achiev,
          images: achiev.images?.map(img => {
            let uploadedAt;
            if (img.uploadedAt) {
              // If it's already a Date object, use it directly
              if (img.uploadedAt instanceof Date) {
                uploadedAt = img.uploadedAt;
              } else {
                // If it's a string or timestamp, convert to Date
                uploadedAt = new Date(img.uploadedAt);
                // Check if the created Date is valid
                if (isNaN(uploadedAt.getTime())) {
                  uploadedAt = new Date();
                }
              }
            } else {
              uploadedAt = new Date();
            }
            
            return {
              ...img,
              uploadedAt: uploadedAt
            };
          }) || []
        }))
      };
      
      // Update employee with sanitized ptInfo
      const updateData = {
        ...pt,
        ptInfo: sanitizedFormData
      };

      await updateEmployee(pt._id, updateData);
      
      if (onUpdate) {
        onUpdate();
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating PT info:', error);
      setErrors({ submit: error.message || 'Có lỗi xảy ra khi cập nhật thông tin PT' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !pt) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.ptInfoModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Thông tin PT: {pt.fullName}</h2>
          <button className={styles.closeBtn} onClick={handleClose} disabled={isSubmitting} title="Đóng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.ptInfoForm}>
          <div className={styles.formSections}>
            
            {/* Basic Info Section */}
            <div className={styles.formSection}>
              <h3>Thông tin cơ bản</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Kinh nghiệm (năm) *</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                    min="0"
                    max="50"
                    className={errors.experience ? 'error' : ''}
                  />
                  {errors.experience && <span className={styles.errorMessage}>{errors.experience}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label>Số khách hàng tối đa/ngày *</label>
                  <input
                    type="number"
                    value={formData.maxClientsPerDay}
                    onChange={(e) => handleInputChange('maxClientsPerDay', parseInt(e.target.value) || 1)}
                    min="1"
                    max="20"
                    className={errors.maxClientsPerDay ? 'error' : ''}
                  />
                  {errors.maxClientsPerDay && <span className={styles.errorMessage}>{errors.maxClientsPerDay}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Mô tả bản thân</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Giới thiệu về bản thân, phong cách tập luyện..."
                    rows="4"
                    maxLength="1000"
                    className={errors.bio ? 'error' : ''}
                  />
                  <div className={styles.charCount}>{formData.bio.length}/1000</div>
                  {errors.bio && <span className={styles.errorMessage}>{errors.bio}</span>}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isAcceptingNewClients}
                      onChange={(e) => handleInputChange('isAcceptingNewClients', e.target.checked)}
                    />
                    Đang nhận khách hàng mới
                  </label>
                </div>
              </div>
            </div>

            {/* Specialties Section */}
            <div className={styles.formSection}>
              <h3>Chuyên môn *</h3>
              <p className={styles.sectionDesc}>Chọn tối đa 5 chuyên môn</p>
              
              <div className={styles.specialtiesGrid}>
                {SPECIALTY_OPTIONS.map(specialty => (
                  <label key={specialty} className={styles.specialtyCheckbox}>
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={() => handleSpecialtyToggle(specialty)}
                      disabled={!formData.specialties.includes(specialty) && formData.specialties.length >= 5}
                    />
                    <span className={styles.specialtyLabel}>{specialty}</span>
                  </label>
                ))}
              </div>
              
              {errors.specialties && <span className={styles.errorMessage}>{errors.specialties}</span>}
            </div>

            {/* Languages Section */}
            <div className={styles.formSection}>
              <h3>Ngôn ngữ</h3>
              
              <div className={styles.languagesGrid}>
                {LANGUAGE_OPTIONS.map(lang => (
                  <label key={lang.value} className={styles.languageCheckbox}>
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(lang.value)}
                      onChange={() => handleLanguageToggle(lang.value)}
                      disabled={lang.value === 'vi' && formData.languages.length === 1 && formData.languages[0] === 'vi'}
                    />
                    <span className={styles.languageLabel}>{lang.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Certificates Section */}
            <div className={styles.formSection}>
              <h3>Chứng chỉ</h3>
              
              <div className={styles.addItemGroup}>
                <input
                  type="text"
                  value={newCertificate}
                  onChange={(e) => setNewCertificate(e.target.value)}
                  placeholder="Nhập tên chứng chỉ..."
                  maxLength="100"
                />
                <button
                  type="button"
                  onClick={addCertificate}
                  disabled={!newCertificate.trim() || formData.certificates.length >= 10}
                  className={styles.addBtn}
                >
                  Thêm
                </button>
              </div>
              
              <div className={styles.itemsList}>
                {formData.certificates.map((cert, index) => (
                  <div key={cert.id || index} className={styles.certificateItem}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemText}>{typeof cert === 'string' ? cert : cert.text}</span>
                      <button
                        type="button"
                        onClick={() => removeCertificate(index)}
                        className={styles.removeBtn}
                        title="Xóa chứng chỉ"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {typeof cert === 'object' && (
                      <div className={styles.itemImages}>
                        <div className={styles.uploadSection}>
                          <input
                            type="file"
                            id={`cert-upload-${index}`}
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleImageUpload(file, 'certificates', index);
                                e.target.value = ''; // Reset input to allow re-selecting same file
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor={`cert-upload-${index}`} className={styles.uploadBtn}>
                            {uploadingImages.certificates ? (
                              <span>📤 Đang tải...</span>
                            ) : (
                              <span>📷 Thêm ảnh</span>
                            )}
                          </label>
                        </div>
                        
                        {cert.images && cert.images.length > 0 && (
                          <div className={styles.imageGallery}>
                            {cert.images.map((image, imgIndex) => {
                              // Extra safety: create fallback key in case of duplicates
                              const safeKey = `${image.id}_${imgIndex}_${image.fileName || 'nofile'}`;
                              const imageUrl = image.url?.startsWith('http') ? image.url : `http://localhost:3000${image.url}`;
                              return (
                                <div key={safeKey} className={styles.imageItem}>
                                  <img 
                                    src={imageUrl} 
                                    alt={`Certificate ${index + 1} - Image ${imgIndex + 1}`}
                                    onClick={() => openImageViewer(imageUrl, 'certificate', imgIndex)}
                                    className={styles.thumbnail}
                                    onError={(e) => {
                                      console.error('Error loading certificate image:', imageUrl);
                                      e.target.style.border = '2px solid red';
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage('certificates', index, image.id)}
                                    className={styles.imageRemoveBtn}
                                    title="Xóa ảnh"
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Available Hours Section */}
            <div className={styles.formSection}>
              <h3>Khung giờ làm việc</h3>
              
              <div className={styles.timeSlotGroup}>
                <input
                  type="time"
                  value={newTimeSlot.from}
                  onChange={(e) => setNewTimeSlot(prev => ({ ...prev, from: e.target.value }))}
                />
                <span>đến</span>
                <input
                  type="time"
                  value={newTimeSlot.to}
                  onChange={(e) => setNewTimeSlot(prev => ({ ...prev, to: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={addTimeSlot}
                  disabled={!newTimeSlot.from || !newTimeSlot.to || formData.availableHours.length >= 10}
                  className={styles.addBtn}
                >
                  Thêm
                </button>
              </div>
              
              <div className={styles.itemsList}>
                {formData.availableHours.map((timeSlot, index) => (
                  <div key={index} className={styles.itemTag}>
                    <span>{timeSlot}</span>
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(index)}
                      className={styles.removeBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements Section */}
            <div className={styles.formSection}>
              <h3>Thành tích</h3>
              
              <div className={styles.addItemGroup}>
                <input
                  type="text"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  placeholder="Nhập thành tích..."
                  maxLength="200"
                />
                <button
                  type="button"
                  onClick={addAchievement}
                  disabled={!newAchievement.trim() || formData.achievements.length >= 20}
                  className={styles.addBtn}
                >
                  Thêm
                </button>
              </div>
              
              <div className={styles.itemsList}>
                {formData.achievements.map((achievement, index) => (
                  <div key={achievement.id || index} className={styles.achievementItem}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemText}>{typeof achievement === 'string' ? achievement : achievement.text}</span>
                      <button
                        type="button"
                        onClick={() => removeAchievement(index)}
                        className={styles.removeBtn}
                        title="Xóa thành tích"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {typeof achievement === 'object' && (
                      <div className={styles.itemImages}>
                        <div className={styles.uploadSection}>
                          <input
                            type="file"
                            id={`achievement-upload-${index}`}
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleImageUpload(file, 'achievements', index);
                                e.target.value = ''; // Reset input to allow re-selecting same file
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor={`achievement-upload-${index}`} className={styles.uploadBtn}>
                            {uploadingImages.achievements ? (
                              <span>📤 Đang tải...</span>
                            ) : (
                              <span>🏆 Thêm ảnh</span>
                            )}
                          </label>
                        </div>
                        
                        {achievement.images && achievement.images.length > 0 && (
                          <div className={styles.imageGallery}>
                            {achievement.images.map((image, imgIndex) => {
                              // Extra safety: create fallback key in case of duplicates  
                              const safeKey = `${image.id}_${imgIndex}_${image.fileName || 'nofile'}`;
                              const imageUrl = image.url?.startsWith('http') ? image.url : `http://localhost:3000${image.url}`;
                              return (
                                <div key={safeKey} className={styles.imageItem}>
                                  <img 
                                    src={imageUrl} 
                                    alt={`Achievement ${index + 1} - Image ${imgIndex + 1}`}
                                    onClick={() => openImageViewer(imageUrl, 'achievement', imgIndex)}
                                    onError={(e) => {
                                      console.error('Error loading achievement image:', imageUrl);
                                      e.target.style.border = '2px solid red';
                                    }}
                                    className={styles.thumbnail}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage('achievements', index, image.id)}
                                    className={styles.imageRemoveBtn}
                                    title="Xóa ảnh"
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media Section */}
            <div className={styles.formSection}>
              <h3>Mạng xã hội</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Facebook</label>
                  <input
                    type="url"
                    value={formData.socialMedia.facebook}
                    onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                    placeholder="https://facebook.com/username"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Instagram</label>
                  <input
                    type="url"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/username"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>YouTube</label>
                  <input
                    type="url"
                    value={formData.socialMedia.youtube}
                    onChange={(e) => handleSocialMediaChange('youtube', e.target.value)}
                    placeholder="https://youtube.com/@username"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>TikTok</label>
                  <input
                    type="url"
                    value={formData.socialMedia.tiktok}
                    onChange={(e) => handleSocialMediaChange('tiktok', e.target.value)}
                    placeholder="https://tiktok.com/@username"
                  />
                </div>
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className={styles.formError}>
              {errors.submit}
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.btnCancelInfopt}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <span className={styles.icon}>💾</span>
                  Lưu thông tin
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Image Viewer Modal */}
      {imageViewer.isOpen && (
        <div className={styles.imageViewerOverlay} onClick={closeImageViewer}>
          <div className={styles.imageViewerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.imageViewerHeader}>
              <h3>
                {imageViewer.imageType === 'certificate' ? '📷 Chứng chỉ' : '🏆 Thành tích'}
              </h3>
              <button className={styles.closeBtn} onClick={closeImageViewer} title="Đóng">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className={styles.imageViewerContent}>
              <img src={imageViewer.imageUrl} alt="Xem ảnh lớn" />
            </div>
            <div className={styles.imageViewerActions}>
              <button 
                className={styles.btnDownload}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = imageViewer.imageUrl;
                  link.download = `${imageViewer.imageType}_${Date.now()}.jpg`;
                  link.click();
                }}
              >
                📥 Tải về
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}