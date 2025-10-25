import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePT } from '../../../../firebase/lib/features/pt/pt.provider.jsx';
import PTPackageModel from '../../../../firebase/lib/features/pt/pt-package.model.js';
import TimeSlotManager from './TimeSlotManager.jsx';
import { toast } from 'react-toastify';
import './PTPricingModal.css';

const PACKAGE_TYPES = [
  { value: 'online_single', label: 'Online một người', icon: '👤' },
  { value: 'online_group', label: 'Online nhóm 2 người', icon: '👥' },
  { value: 'offline_single', label: 'Offline một người', icon: '🏋️‍♂️' },
  { value: 'offline_group', label: 'Offline nhóm 2 người', icon: '🤝' }
];

const DURATION_OPTIONS = [
  { value: 30, label: '30 phút' },
  { value: 45, label: '45 phút' },
  { value: 60, label: '60 phút' },
  { value: 90, label: '90 phút' },
  { value: 120, label: '120 phút' }
];

const SESSION_COUNT_OPTIONS = [1, 4, 8, 12, 16, 20, 24, 32];

const FIXED_TIME_SLOTS = [
  { id: 'slot1', startTime: '06:00', endTime: '08:00', duration: 120, label: '6:00 - 8:00 (2h)' },
  { id: 'slot2', startTime: '08:00', endTime: '10:00', duration: 120, label: '8:00 - 10:00 (2h)' },
  { id: 'slot3', startTime: '10:00', endTime: '12:00', duration: 120, label: '10:00 - 12:00 (2h)' },
  { id: 'slot4', startTime: '12:00', endTime: '14:00', duration: 120, label: '12:00 - 14:00 (2h)' },
  { id: 'slot5', startTime: '14:00', endTime: '16:00', duration: 120, label: '14:00 - 16:00 (2h)' },
  { id: 'slot6', startTime: '16:00', endTime: '18:00', duration: 120, label: '16:00 - 18:00 (2h)' },
  { id: 'slot7', startTime: '18:00', endTime: '20:00', duration: 120, label: '18:00 - 20:00 (2h)' },
  { id: 'slot8', startTime: '20:00', endTime: '22:00', duration: 120, label: '20:00 - 22:00 (2h)' }
];

export default function PTPricingModal({ isOpen, onClose, ptId, package: editPackage, onUpdate }) {
  const { createPTPackage, updatePTPackage, deletePTPackage, disablePTPackage, enablePTPackage, getPTPackages } = usePT();
  
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [localPackages, setLocalPackages] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [ptInfo, setPtInfo] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'online_single',
    price: '',
    sessions: 1,
    duration: 120,
    description: '',
    benefits: [],
    isPopular: false,
    isActive: true,
    maxParticipants: 1,
    discountPercent: 0,
    validityDays: 90,
    availableTimeSlots: [],
    customTimeSlots: [],
    advanceBookingDays: 1,
    allowSameDayBooking: true
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const packageToDeleteRef = useRef(null); // Use ref instead of state
  const isDeletingRef = useRef(false); // Flag to prevent interruption during delete
  const [newBenefit, setNewBenefit] = useState('');

  // Local function to load packages and PT info
  const loadPackagesLocal = async (currentPtId) => {
    if (!currentPtId) return;
    
    console.log('🔄 PTPricingModal: Loading PT packages locally for', currentPtId);
    setLocalLoading(true);
    try {
      // Use direct import to avoid provider dependency issues
      const PTPackageModel = (await import('../../../../firebase/lib/features/pt/pt-package.model')).default;
      const EmployeeModel = (await import('../../../../firebase/lib/features/employee/employee.model')).default;
      
      // Get PT info and packages separately
      const [ptData, packages] = await Promise.all([
        EmployeeModel.getById(currentPtId),
        PTPackageModel.getPackagesByPTId(currentPtId)
      ]);
      
      if (ptData) {
        setPtInfo({
          id: ptData._id,
          fullName: ptData.fullName,
          avatarUrl: ptData.avatarUrl,
          ptInfo: ptData.ptInfo || {}
        });
      }
      
      setLocalPackages(packages);
      console.log('✅ PTPricingModal: Loaded PT info:', ptData?.fullName);
      console.log('✅ PTPricingModal: Loaded', packages.length, 'packages');
    } catch (error) {
      console.error('❌ PTPricingModal: Error loading packages:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  // Main effect for modal open/close logic
  useEffect(() => {
    if (isOpen && ptId) {
      // Modal opening - load data and reset state
      console.log('🚀 PTPricingModal: Modal opened, loading packages...');
      setViewMode('list');
      setErrors({});
      setIsSubmitting(false);
      loadPackagesLocal(ptId);
    } else if (!isOpen && !isDeletingRef.current) {
      // Modal closing - cleanup state
      console.log('🔄 PTPricingModal: Modal closed, cleaning up...');
      setSelectedPackage(null);
      setShowDeleteConfirm(false);
      packageToDeleteRef.current = null;
      setPtInfo(null);
      setLocalPackages([]);
    }
  }, [isOpen, ptId]);

  // Initialize form when editing package or creating new
  useEffect(() => {
    console.log('🔄 PTPricingModal: viewMode/selectedPackage changed:', viewMode, selectedPackage);
    if (viewMode === 'form') {
      if (selectedPackage) {
        console.log('📝 Setting form data for editing, selectedPackage:', selectedPackage);
        setFormData({
          name: selectedPackage.name || '',
          type: selectedPackage.packageType || 'single',
          price: selectedPackage.price || '',
          sessions: selectedPackage.sessions || 1,
          duration: selectedPackage.duration || 120,
          description: selectedPackage.description || '',
          benefits: selectedPackage.features || [], // Map features back to benefits for UI
          isPopular: selectedPackage.isPopular || false,
          isActive: selectedPackage.isActive !== false,
          maxParticipants: selectedPackage.maxParticipants || 1,
          discountPercent: selectedPackage.discount || 0,
          validityDays: selectedPackage.validityDays || 90,
          availableTimeSlots: convertDbToTimeSlotFormat(selectedPackage.availableTimeSlots || []),
          customTimeSlots: selectedPackage.customTimeSlots || [],
          advanceBookingDays: selectedPackage.advanceBookingDays || 1,
          allowSameDayBooking: selectedPackage.allowSameDayBooking !== false
        });
        console.log('🎯 FormData set with converted slots:', convertDbToTimeSlotFormat(selectedPackage.availableTimeSlots || []));
        // Clear loading flag after a brief delay to allow TimeSlotManager to receive new props
        setTimeout(() => {
          console.log('⏰ Clearing loading flag after timeout');
          setIsLoadingFormData(false);
        }, 200);
      } else {
        setFormData({
          name: '',
          type: 'single',
          price: '',
          sessions: 1,
          duration: 120,
          description: '',
          benefits: [],
          isPopular: false,
          isActive: true,
          maxParticipants: 1,
          discountPercent: 0,
          validityDays: 90,
          availableTimeSlots: [],
          customTimeSlots: [],
          advanceBookingDays: 1,
          allowSameDayBooking: true
        });
        // Clear loading flag for new package creation
        setTimeout(() => {
          console.log('⏰ Clearing loading flag for new package');
          setIsLoadingFormData(false);
        }, 200);
      }
    }
  }, [viewMode, selectedPackage]);

  // Update maxParticipants based on type (avoid infinite loop)
  useEffect(() => {
    if (formData.type === 'personal' || formData.type === 'online') {
      if (formData.maxParticipants !== 1) {
        setFormData(prev => ({ ...prev, maxParticipants: 1 }));
      }
    } else if (formData.type === 'group' && formData.maxParticipants === 1) {
      setFormData(prev => ({ ...prev, maxParticipants: 4 }));
    }
  }, [formData.type, formData.maxParticipants]);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      let newData = {
        ...prev,
        [field]: value
      };
      
      // Tự động set maxParticipants dựa trên type
      if (field === 'type') {
        if (value.includes('single')) {
          newData.maxParticipants = 1;
        } else if (value.includes('group')) {
          newData.maxParticipants = 2;
        }
      }
      
      return newData;
    });
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const [isLoadingFormData, setIsLoadingFormData] = useState(false);

  // Convert database format to TimeSlotManager format
  const convertDbToTimeSlotFormat = useCallback((dbTimeSlots) => {
    console.log('🔄 Converting DB time slots:', dbTimeSlots);
    if (!dbTimeSlots || !Array.isArray(dbTimeSlots)) return [];
    
    // Group by day
    const dayGroups = {};
    const dayMap = {
      0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
      4: 'thursday', 5: 'friday', 6: 'saturday'
    };
    
    dbTimeSlots.forEach(slot => {
      const dayName = dayMap[slot.dayOfWeek];
      if (!dayName) return;
      
      if (!dayGroups[dayName]) {
        dayGroups[dayName] = [];
      }
      
      // Find matching fixed slot based on time
      const fixedSlot = FIXED_TIME_SLOTS.find(fs => 
        fs.startTime === slot.startTime && fs.endTime === slot.endTime
      );
      
      if (fixedSlot) {
        dayGroups[dayName].push(fixedSlot);
      }
    });
    
    // Convert to array format expected by TimeSlotManager
    const result = Object.entries(dayGroups).map(([day, fixedSlots]) => ({
      day,
      fixedSlots
    }));
    
    console.log('✅ Converted to TimeSlotManager format:', JSON.stringify(result, null, 2));
    return result;
  }, []);

  const handleTimeSlotsChange = useCallback((timeSlots) => {
    // Don't update if we're currently loading form data
    if (isLoadingFormData) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      availableTimeSlots: timeSlots.availableTimeSlots,
      customTimeSlots: timeSlots.customTimeSlots
    }));
  }, [isLoadingFormData]);

  const addBenefit = () => {
    if (newBenefit.trim() && formData.benefits.length < 10) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên gói';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Tên gói phải có ít nhất 3 ký tự';
    }

    const price = parseFloat(formData.price);
    if (!formData.price || isNaN(price) || price <= 0) {
      newErrors.price = 'Vui lòng nhập giá hợp lệ';
    } else if (price > 50000000) {
      newErrors.price = 'Giá không được vượt quá 50,000,000 VNĐ';
    }

    if (formData.sessions < 1 || formData.sessions > 100) {
      newErrors.sessions = 'Số buổi phải từ 1 đến 100';
    }

    if (formData.type === 'group' && (formData.maxParticipants < 2 || formData.maxParticipants > 20)) {
      newErrors.maxParticipants = 'Nhóm phải có từ 2 đến 20 người';
    }

    if (formData.discountPercent < 0 || formData.discountPercent > 50) {
      newErrors.discountPercent = 'Giảm giá phải từ 0% đến 50%';
    }

    if (formData.validityDays < 30 || formData.validityDays > 365) {
      newErrors.validityDays = 'Thời hạn phải từ 30 đến 365 ngày';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'Mô tả không được quá 500 ký tự';
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
      const packageData = {
        name: formData.name,
        packageType: formData.type,
        price: parseFloat(formData.price),
        sessions: formData.sessions,
        duration: formData.duration,
        description: formData.description,
        features: formData.benefits, // Map benefits to features for model compatibility
        isPopular: formData.isPopular,
        isActive: formData.isActive,
        maxParticipants: formData.maxParticipants,
        discount: formData.discountPercent,
        validityDays: formData.validityDays,
        availableTimeSlots: formData.availableTimeSlots,
        customTimeSlots: formData.customTimeSlots,
        advanceBookingDays: formData.advanceBookingDays,
        allowSameDayBooking: formData.allowSameDayBooking
        // Don't include ptId here, it will be passed as separate parameter
      };

      console.log('💾 PTPricingModal: Submitting package data:', packageData);
      console.log('💾 PTPricingModal: ptId:', ptId);

      if (selectedPackage) {
        await updatePTPackage(selectedPackage.id, packageData);
        toast.success(`Cập nhật gói "${formData.name}" thành công!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } else {
        await createPTPackage(ptId, packageData); // Pass ptId as first parameter
        toast.success(`Tạo gói "${formData.name}" thành công!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      }
      
      // Reload packages and go back to list view
      await loadPackagesLocal();
      setViewMode('list');
      setSelectedPackage(null);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error saving package:', error);
      const action = selectedPackage ? 'cập nhật' : 'tạo';
      toast.error(`Lỗi khi ${action} gói dịch vụ: ${error.message || 'Vui lòng thử lại'}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      setErrors({ submit: error.message || 'Có lỗi xảy ra khi lưu gói dịch vụ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    console.log('🗑️ handleDelete called');
    console.log('🗑️ packageToDeleteRef.current at start:', packageToDeleteRef.current);
    console.log('🗑️ showDeleteConfirm at start:', showDeleteConfirm);
    
    if (!packageToDeleteRef.current) {
      console.log('❌ No package ID in ref for deletion - early return');
      return;
    }
    
    const packageIdToDelete = packageToDeleteRef.current; // Store in local variable to prevent ref changes
    console.log('🗑️ Starting delete process for package ID:', packageIdToDelete);
    
    // Set flags to prevent interference
    isDeletingRef.current = true;
    setIsSubmitting(true);
    
    try {
      console.log('🗑️ Calling deletePTPackage with ID:', packageIdToDelete, 'and ptId:', ptId);
      await deletePTPackage(packageIdToDelete, ptId); // Pass ptId as second parameter
      console.log('✅ Package deleted successfully');
      
      toast.success('Xóa gói dịch vụ thành công!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      
      // Reload packages first
      await loadPackagesLocal();
      
      // Then update UI state
      setViewMode('list');
      setSelectedPackage(null);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('❌ Error deleting package:', error);
      toast.error(`Lỗi khi xóa gói dịch vụ: ${error.message || 'Vui lòng thử lại'}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      setErrors({ submit: error.message || 'Có lỗi xảy ra khi xóa gói dịch vụ' });
    } finally {
      console.log('🗑️ Finally block - cleaning up');
      isDeletingRef.current = false;
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      packageToDeleteRef.current = null;
    }
  };

  const handleDisablePackage = async (packageId) => {
    try {
      setIsSubmitting(true);
      console.log('🚫 Disabling package:', packageId);
      
      await disablePTPackage(packageId, ptId);
      await loadPackagesLocal();
      
      toast.success('Vô hiệu hóa gói dịch vụ thành công!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('❌ Error disabling package:', error);
      toast.error(`Lỗi khi vô hiệu hóa gói dịch vụ: ${error.message || 'Vui lòng thử lại'}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      setErrors({ submit: error.message || 'Có lỗi xảy ra khi vô hiệu hóa gói dịch vụ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnablePackage = async (packageId) => {
    try {
      setIsSubmitting(true);
      console.log('✅ Enabling package:', packageId);
      
      await enablePTPackage(packageId, ptId);
      await loadPackagesLocal();
      
      toast.success('Kích hoạt gói dịch vụ thành công!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('❌ Error enabling package:', error);
      toast.error(`Lỗi khi kích hoạt gói dịch vụ: ${error.message || 'Vui lòng thử lại'}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      setErrors({ submit: error.message || 'Có lỗi xảy ra khi kích hoạt gói dịch vụ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPackage = (pkg) => {
    console.log('📝 PTPricingModal: Editing package:', pkg);
    console.log('📝 Package availableTimeSlots:', pkg.availableTimeSlots);
    setIsLoadingFormData(true); // Set loading flag IMMEDIATELY
    setSelectedPackage(pkg);
    setViewMode('form');
  };

  const handleCreateNew = () => {
    console.log('🎯 PTPricingModal: Creating new package, switching to form mode');
    setIsLoadingFormData(true); // Set loading flag IMMEDIATELY
    setSelectedPackage(null);
    setViewMode('form');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPackage(null);
    setErrors({});
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Calculate price per session and total with discount
  const pricePerSession = formData.price ? (parseFloat(formData.price) / formData.sessions) : 0;
  const discountAmount = formData.price ? (parseFloat(formData.price) * formData.discountPercent / 100) : 0;
  const finalPrice = formData.price ? (parseFloat(formData.price) - discountAmount) : 0;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="pt-pricing-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {viewMode === 'list' ? (
              <>
                <span className="icon">💰</span>
                Quản lý giá PT - {ptInfo?.fullName }

              </>
            ) : selectedPackage ? (
              <>
                <span className="icon">✏️</span>
                Chỉnh sửa gói dịch vụ
              </>
            ) : (
              <>
                <span className="icon">➕</span>
                Thêm gói dịch vụ mới
              </>
            )}
          </h2>
          <button className="close-btn" onClick={handleClose} disabled={isSubmitting} title="Đóng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {viewMode === 'list' ? (
          <div className="packages-list-view">
            {/* Header with add button */}
            <div className="list-header">
              <button 
                className="btn-create-new"
                onClick={handleCreateNew}
              >
                <span className="icon">➕</span>
                Thêm gói dịch vụ mới
              </button>
            </div>

            {/* Loading state */}
            {localLoading && viewMode === 'list' ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải gói dịch vụ...</p>
              </div>
            ) : (
              /* Packages list */
              <div className="packages-grid">
                {(() => {
                  console.log('🎨 PTPricingModal: Rendering packages grid');
                  console.log('🎨 localPackages:', localPackages);
                  console.log('🎨 localPackages length:', localPackages?.length);
                  console.log('🎨 viewMode:', viewMode);
                  return null;
                })()}
                {localPackages && localPackages.length > 0 ? (
                  localPackages.map((pkg) => (
                    <div key={pkg.id} className="package-card">
                      <div className="package-header">
                        <h3 className="package-name">{pkg.name}</h3>
                        <div className="package-badges">
                          {pkg.isPopular && <span className="badge popular">Phổ biến</span>}
                          {!pkg.isActive && <span className="badge inactive">Tạm dừng</span>}
                        </div>
                      </div>
                      <div className="package-details">
                        <div className="package-type">
                          {PACKAGE_TYPES.find(t => t.value === pkg.packageType)?.icon} {PACKAGE_TYPES.find(t => t.value === pkg.packageType)?.label}
                        </div>
                        <div className="package-price">
                          {pkg.discount > 0 ? (
                            <>
                              <span className="original-price">{pkg.price.toLocaleString('vi-VN')}đ</span>
                              <span className="final-price">{(pkg.price * (1 - pkg.discount / 100)).toLocaleString('vi-VN')}đ</span>
                            </>
                          ) : (
                            <span className="final-price">{pkg.price.toLocaleString('vi-VN')}đ</span>
                          )}
                        </div>
                        <div className="package-info">
                          <div className="info-item">
                            <span className="label">Số buổi:</span>
                            <span className="value">{pkg.sessions} buổi</span>
                          </div>
                          <div className="info-item">
                            <span className="label">Thời lượng:</span>
                            <span className="value">{pkg.duration} phút</span>
                          </div>
                          {pkg.maxParticipants > 1 && (
                            <div className="info-item">
                              <span className="label">Số người:</span>
                              <span className="value">Tối đa {pkg.maxParticipants}</span>
                            </div>
                          )}
                        </div>
                        
                        {pkg.description && (
                          <div className="package-description">
                            {pkg.description}
                          </div>
                        )}

                        {pkg.features && pkg.features.length > 0 && (
                          <div className="package-benefits">
                            <h4>Lợi ích:</h4>
                            <ul>
                              {pkg.features.slice(0, 3).map((benefit, index) => (
                                <li key={index}>{benefit}</li>
                              ))}
                              {pkg.features.length > 3 && (
                                <li className="more">+{pkg.features.length - 3} lợi ích khác</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="package-actions">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEditPackage(pkg)}
                          disabled={isSubmitting}
                        >
                          <span className="icon">✏️</span>
                          Chỉnh sửa
                        </button>
                        
                        {pkg.isActive ? (
                          <button 
                            className="btn-disable"
                            onClick={() => handleDisablePackage(pkg.id)}
                            disabled={isSubmitting}
                            title="Vô hiệu hóa gói"
                          >
                            <span className="icon">🚫</span>
                            Vô hiệu hóa
                          </button>
                        ) : (
                          <button 
                            className="btn-enable"
                            onClick={() => handleEnablePackage(pkg.id)}
                            disabled={isSubmitting}
                            title="Kích hoạt gói"
                          >
                            <span className="icon">✅</span>
                            Kích hoạt
                          </button>
                        )}
                        
                        <button 
                          className="btn-delete-package"
                          onClick={() => {
                            console.log('🗑️ Delete button clicked for package:', pkg.id);
                            packageToDeleteRef.current = pkg.id;
                            setShowDeleteConfirm(true);
                            console.log('🗑️ Set packageToDeleteRef and showDeleteConfirm to true');
                          }}
                          disabled={isSubmitting}
                          title="Xóa hoàn toàn khỏi database"
                        >
                          <span className="icon">🗑️</span>
                          Xóa vĩnh viễn
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>Chưa có gói dịch vụ nào</h3>
                    <p>Tạo gói dịch vụ đầu tiên để bắt đầu bán dịch vụ PT</p>
                    <button 
                      className="btn-create-first"
                      onClick={handleCreateNew}
                    >
                      <span className="icon">➕</span>
                      Tạo gói đầu tiên
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pricing-form">
            <div className="form-header">
              <button 
                type="button"
                className="btn-back"
                onClick={handleBackToList}
              >
                <span className="icon">⬅️</span>
                Quay lại danh sách
              </button>
            </div>

            <div className="form-content">
            
            {/* Basic Info */}
            <div className="form-section">
              <h3>Thông tin cơ bản</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Tên gói dịch vụ *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="VD: Giảm cân cơ bản"
                    maxLength="100"
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Loại dịch vụ *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className={errors.type ? 'error' : ''}
                  >
                    {PACKAGE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Giá gói (VNĐ) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0"
                    min="0"
                    max="50000000"
                    step="10000"
                    className={errors.price ? 'error' : ''}
                  />
                  {errors.price && <span className="error-message">{errors.price}</span>}
                  {pricePerSession > 0 && (
                    <div className="price-info">
                      Giá mỗi buổi: {pricePerSession.toLocaleString('vi-VN')} VNĐ
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Số buổi tập *</label>
                  <select
                    value={formData.sessions}
                    onChange={(e) => handleInputChange('sessions', parseInt(e.target.value))}
                    className={errors.sessions ? 'error' : ''}
                  >
                    {SESSION_COUNT_OPTIONS.map(count => (
                      <option key={count} value={count}>
                        {count} buổi
                      </option>
                    ))}
                  </select>
                  {errors.sessions && <span className="error-message">{errors.sessions}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thời lượng mỗi buổi *</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  >
                    {DURATION_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(formData.type === 'group' || formData.type === 'online') && (
                  <div className="form-group">
                    <label>Số người tối đa *</label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 1)}
                      min={formData.type === 'group' ? 2 : 1}
                      max="20"
                      className={errors.maxParticipants ? 'error' : ''}
                    />
                    {errors.maxParticipants && <span className="error-message">{errors.maxParticipants}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Description & Benefits */}
            <div className="form-section">
              <h3>Mô tả & Lợi ích</h3>
              
              <div className="form-group">
                <label>Mô tả gói dịch vụ</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Mô tả chi tiết về gói dịch vụ..."
                  rows="3"
                  maxLength="500"
                  className={errors.description ? 'error' : ''}
                />
                <div className="char-count">{formData.description.length}/500</div>
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label>Lợi ích</label>
                <div className="add-benefit-group">
                  <input
                    type="text"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Nhập lợi ích..."
                    maxLength="100"
                  />
                  <button
                    type="button"
                    onClick={addBenefit}
                    disabled={!newBenefit.trim() || formData.benefits.length >= 10}
                    className="add-btn"
                  >
                    Thêm
                  </button>
                </div>
                
                <div className="benefits-list">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="benefit-item">
                      <span className="benefit-icon">✓</span>
                      <span className="benefit-text">{benefit}</span>
                      <button
                        type="button"
                        onClick={() => removeBenefit(index)}
                        className="remove-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing & Settings */}
            <div className="form-section">
              <h3>Giá & Cài đặt</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Giảm giá (%)</label>
                  <input
                    type="number"
                    value={formData.discountPercent}
                    onChange={(e) => handleInputChange('discountPercent', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="50"
                    step="1"
                    className={errors.discountPercent ? 'error' : ''}
                  />
                  {errors.discountPercent && <span className="error-message">{errors.discountPercent}</span>}
                </div>

                <div className="form-group">
                  <label>Thời hạn sử dụng (ngày)</label>
                  <input
                    type="number"
                    value={formData.validityDays}
                    onChange={(e) => handleInputChange('validityDays', parseInt(e.target.value) || 30)}
                    min="30"
                    max="365"
                    className={errors.validityDays ? 'error' : ''}
                  />
                  {errors.validityDays && <span className="error-message">{errors.validityDays}</span>}
                </div>
              </div>

              {/* Price Summary */}
              {formData.price && (
                <div className="price-summary">
                  <div className="price-row">
                    <span>Giá gốc:</span>
                    <span>{parseFloat(formData.price).toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  {formData.discountPercent > 0 && (
                    <>
                      <div className="price-row discount">
                        <span>Giảm giá ({formData.discountPercent}%):</span>
                        <span>-{discountAmount.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                      <div className="price-row final">
                        <span>Giá cuối:</span>
                        <span>{finalPrice.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                    />
                    <span className="checkbox-text">
                      <span className="icon">⭐</span>
                      Gói phổ biến
                    </span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    />
                    <span className="checkbox-text">
                      <span className="icon">🟢</span>
                      Đang hoạt động
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Time Slot Management Section */}
            <div className="form-section">
              <h3>
                <span className="icon">⏰</span>
                Quản lý khung giờ
              </h3>
              <TimeSlotManager
                availableTimeSlots={formData.availableTimeSlots}
                customTimeSlots={formData.customTimeSlots}
                sessionDuration={formData.duration}
                onTimeSlotsChange={handleTimeSlotsChange}
              />
            </div>

            {/* Booking Settings Section */}
            <div className="form-section">
              <h3>
                <span className="icon">📅</span>
                Cài đặt đặt lịch
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="advanceBookingDays">Đặt trước tối thiểu (ngày)</label>
                  <input
                    type="number"
                    id="advanceBookingDays"
                    min="0"
                    max="30"
                    value={formData.advanceBookingDays}
                    onChange={(e) => handleInputChange('advanceBookingDays', parseInt(e.target.value) || 0)}
                  />
                  <small>Khách hàng phải đặt trước ít nhất bao nhiêu ngày</small>
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.allowSameDayBooking}
                      onChange={(e) => handleInputChange('allowSameDayBooking', e.target.checked)}
                    />
                    <span className="checkbox-text">
                      <span className="icon">⚡</span>
                      Cho phép đặt trong ngày
                    </span>
                  </label>
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
                {selectedPackage && (
                  <button
                    type="button"
                    className="btn-delete-ptpricing"
                    onClick={() => {
                      packageToDeleteRef.current = selectedPackage.id;
                      setShowDeleteConfirm(true);
                    }}
                    disabled={isSubmitting}
                  >
                    <span className="icon">🗑️</span>
                    Xóa gói
                  </button>
                )}
                
                <div className="action-group">
                  <button
                    type="button"
                    className="btn-cancel-ptpricing"
                    onClick={handleBackToList}
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
                        {selectedPackage ? 'Đang cập nhật...' : 'Đang tạo...'}
                      </>
                    ) : (
                      <>
                        <span className="icon">💾</span>
                        {selectedPackage ? 'Cập nhật gói' : 'Tạo gói mới'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {errors.submit && (
            <div className="form-error">
              {errors.submit}
            </div>
          )}

        {/* Delete Confirmation */}
        {(() => {
          if (!showDeleteConfirm) return null;
          
        })()}
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay" onClick={() => {
            setShowDeleteConfirm(false);
            packageToDeleteRef.current = null;
          }}>
            <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-confirm-header">
                <h3>Xác nhận xóa gói</h3>
              </div>
              
              <div className="delete-confirm-content">
                <p>Bạn có chắc chắn muốn xóa gói dịch vụ <strong>"{localPackages.find(p => p.id === packageToDeleteRef.current)?.name}"</strong>?</p>
                <p className="warning">Hành động này không thể hoàn tác.</p>
              </div>
              
              <div className="delete-confirm-actions">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    console.log('🗑️ Cancel button clicked');
                    setShowDeleteConfirm(false);
                    packageToDeleteRef.current = null;
                  }}
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  className="btn-delete-confirm-ptmanager"
                  onClick={() => {
                    console.log('🗑️ Delete confirm button clicked');
                    console.log('🗑️ packageToDeleteRef.current before handleDelete:', packageToDeleteRef.current);
                    handleDelete();
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang xóa...' : 'Xóa gói'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}