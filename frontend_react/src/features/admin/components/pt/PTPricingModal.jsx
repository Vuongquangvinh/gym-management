import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePT } from '../../../../firebase/lib/features/pt/pt.provider.jsx';
import PTPackageModel from '../../../../firebase/lib/features/pt/pt-package.model.js';
import { PendingRequestService } from '../../../../firebase/lib/features/pending-request/pendingRequest.service';
import TimeSlotManager from './TimeSlotManager.jsx';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import styles from  './PTPricingModal.module.css';

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
const MONTH_OPTIONS = [1, 3, 6, 9, 12];

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

export default function PTPricingModal({ isOpen, onClose, ptId, package: editPackage, onUpdate, isPTPortal = false }) {
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
    advanceBookingDays: 1,
    allowSameDayBooking: true,
    billingType: 'session',
    months: 1
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBenefit, setNewBenefit] = useState('');

  // Local function to load packages and PT info
  const loadPackagesLocal = async (currentPtId) => {
    if (!currentPtId) return;
    
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
      setViewMode('list');
      setErrors({});
      setIsSubmitting(false);
      loadPackagesLocal(ptId);
    } else if (!isOpen) {
      // Modal closing - cleanup state
      setSelectedPackage(null);
      setPtInfo(null);
      setLocalPackages([]);
    }
  }, [isOpen, ptId]);

  // Initialize form when editing package or creating new
  useEffect(() => {
    if (viewMode === 'form') {
      if (selectedPackage) {
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
          advanceBookingDays: selectedPackage.advanceBookingDays || 1,
          allowSameDayBooking: selectedPackage.allowSameDayBooking !== false,
          billingType: selectedPackage.billingType || 'session',
          months: selectedPackage.months || 1
        });
        // Clear loading flag after a brief delay to allow TimeSlotManager to receive new props
        setTimeout(() => {
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
          advanceBookingDays: 1,
          allowSameDayBooking: true,
          billingType: 'session',
          months: 1
        });
        // Clear loading flag for new package creation
        setTimeout(() => {
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
    
    return result;
  }, []);

  // Convert TimeSlotManager format back to Firestore format
  const convertToFirestoreFormat = useCallback((timeSlotManagerFormat) => {
    // Check if already in Firestore format (has dayOfWeek property)
    if (timeSlotManagerFormat && timeSlotManagerFormat.length > 0 && timeSlotManagerFormat[0].dayOfWeek !== undefined) {
      return timeSlotManagerFormat;
    }
    
    // Convert from TimeSlotManager format to Firestore format
    const firestoreSlots = [];
    const dayMap = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    
    timeSlotManagerFormat.forEach(daySlot => {
      if (daySlot.fixedSlots) {
        daySlot.fixedSlots.forEach(fixedSlot => {
          firestoreSlots.push({
            id: `${daySlot.day}_${fixedSlot.id}`,
            dayOfWeek: dayMap[daySlot.day],
            startTime: fixedSlot.startTime,
            endTime: fixedSlot.endTime,
            isActive: true,
            isChoosen: false,
            note: `Khung cố định ${fixedSlot.duration} phút`
          });
        });
      }
    });
    
    return firestoreSlots;
  }, []);

  const handleTimeSlotsChange = useCallback((timeSlots) => {
    // Don't update if we're currently loading form data
    if (isLoadingFormData) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      availableTimeSlots: timeSlots.availableTimeSlots
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
      // Map packageType từ frontend sang backend schema
      const packageTypeMapping = {
        'online_single': 'single',
        'offline_single': 'single', 
        'weekly': 'weekly',
        'monthly': 'monthly',
        'package': 'package'
      };

      // Convert availableTimeSlots to Firestore format if needed
      const firestoreTimeSlots = convertToFirestoreFormat(formData.availableTimeSlots || []);

      const packageData = {
        name: formData.name,
        packageType: packageTypeMapping[formData.type] || 'single', // Map type to packageType
        price: parseFloat(formData.price),
        sessions: parseInt(formData.sessions),
        duration: parseInt(formData.duration),
        description: formData.description || '',
        features: formData.benefits || [], // Map benefits to features for model compatibility
        isPopular: formData.isPopular || false,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        maxClientsPerSlot: parseInt(formData.maxParticipants) || 1, // Map maxParticipants to maxClientsPerSlot
        discount: parseFloat(formData.discountPercent) || 0,
        originalPrice: parseFloat(formData.originalPrice) || parseFloat(formData.price),
        availableTimeSlots: firestoreTimeSlots, // Convert to Firestore format
        customTimeSlots: [], // No longer support custom time slots
        sessionDuration: parseInt(formData.sessionDuration) || 60, // Use dedicated sessionDuration field
        requiresAdvanceBooking: formData.advanceBookingDays > 0,
        advanceBookingHours: parseInt(formData.advanceBookingDays) * 24 || 24,
        billingType: formData.billingType || 'session',
        months: parseInt(formData.months) || 1
        // Don't include ptId here, it will be passed as separate parameter
      };


      if (isPTPortal) {
        // PT Portal: Tạo pending request thay vì update trực tiếp
        const requestData = {
          type: selectedPackage ? 'package_update' : 'package_create',
          packageId: selectedPackage?.id || null,
          packageName: formData.name,
          ptId: ptId,
          requestedBy: ptId,
          employeeName: ptInfo?.fullName || 'Unknown PT',
          requestedByName: ptInfo?.fullName || 'Unknown PT',
          employeeAvatar: ptInfo?.avatarUrl || null,
          data: packageData,
          previousData: selectedPackage ? {
            name: selectedPackage.name,
            packageType: selectedPackage.packageType,
            price: selectedPackage.price,
            sessions: selectedPackage.sessions,
            duration: selectedPackage.duration,
            description: selectedPackage.description,
            features: selectedPackage.features,
            isPopular: selectedPackage.isPopular,
            isActive: selectedPackage.isActive,
            billingType: selectedPackage.billingType,
            months: selectedPackage.months,
            discount: selectedPackage.discount || 0,
            originalPrice: selectedPackage.originalPrice || selectedPackage.price,
            availableTimeSlots: selectedPackage.availableTimeSlots || [],
            sessionDuration: selectedPackage.sessionDuration || 60,
            maxClientsPerSlot: selectedPackage.maxClientsPerSlot || 1
          } : null,
        };

        const result = await PendingRequestService.createPendingRequest(requestData);

        if (result.success) {
          Swal.fire({
            icon: 'info',
            title: 'Đã gửi yêu cầu!',
            html: `
              <p>Yêu cầu ${selectedPackage ? 'cập nhật' : 'tạo'} gói "${formData.name}" đã được gửi đến admin.</p>
              <p style="font-size: 13px; color: #6c757d; margin-top: 10px;">
                ⏳ Admin sẽ xem xét và phê duyệt sớm nhất.
              </p>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#007bff'
          });

          // Close modal
          setViewMode('list');
          setSelectedPackage(null);
          if (onUpdate) onUpdate();
        } else {
          throw new Error(result.error);
        }
      } else {
        // Admin: Update trực tiếp
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
          await createPTPackage(ptId, packageData);
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

  const handleDeletePackage = async (packageId, packageName) => {
    const result = await Swal.fire({
      title: isPTPortal ? 'Gửi yêu cầu xóa gói?' : 'Xác nhận xóa gói',
      html: `Bạn có chắc chắn muốn xóa gói dịch vụ <strong>${packageName}</strong>?`,
      text: isPTPortal ? 'Yêu cầu sẽ được gửi đến admin để duyệt.' : 'Hành động này không thể hoàn tác.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: isPTPortal ? 'Gửi yêu cầu' : 'Xóa gói',
      cancelButtonText: 'Hủy',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    
    try {
      if (isPTPortal) {
        // PT Portal: Tạo pending request
        const packageToDelete = localPackages.find(p => p.id === packageId);
        
        const requestData = {
          type: 'package_delete',
          packageId: packageId,
          packageName: packageName,
          ptId: ptId,
          requestedBy: ptId,
          employeeName: ptInfo?.fullName || 'Unknown PT',
          requestedByName: ptInfo?.fullName || 'Unknown PT',
          employeeAvatar: ptInfo?.avatarUrl || null,
          previousData: packageToDelete ? {
            name: packageToDelete.name,
            packageType: packageToDelete.packageType,
            price: packageToDelete.price,
            sessions: packageToDelete.sessions,
            duration: packageToDelete.duration
          } : null,
        };

        const result = await PendingRequestService.createPendingRequest(requestData);

        if (result.success) {
          await Swal.fire({
            icon: 'info',
            title: 'Đã gửi yêu cầu!',
            text: 'Yêu cầu xóa gói đã được gửi đến admin.',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          throw new Error(result.error);
        }
      } else {
        // Admin: Xóa trực tiếp
        await deletePTPackage(packageId, ptId);
        
        await Swal.fire({
          icon: 'success',
          title: 'Xóa thành công!',
          text: 'Gói dịch vụ đã được xóa khỏi hệ thống.',
          timer: 2000,
          showConfirmButton: false
        });
      }
      
      await loadPackagesLocal();
      setViewMode('list');
      setSelectedPackage(null);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Lỗi xóa gói',
        text: error.message || 'Vui lòng thử lại'
      });
      setErrors({ submit: error.message || 'Có lỗi xảy ra khi xóa gói dịch vụ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisablePackage = async (packageId) => {
    try {
      setIsSubmitting(true);
      
      if (isPTPortal) {
        // PT Portal: Gửi yêu cầu disable
        const packageToDisable = localPackages.find(p => p.id === packageId);
        
        const requestData = {
          type: 'package_disable',
          packageId: packageId,
          packageName: packageToDisable?.name || 'Unknown',
          ptId: ptId,
          requestedBy: ptId,
          employeeName: ptInfo?.fullName || 'Unknown PT',
          requestedByName: ptInfo?.fullName || 'Unknown PT',
          employeeAvatar: ptInfo?.avatarUrl || null,
          data: { isActive: false },
          previousData: { isActive: true },
        };

        const result = await PendingRequestService.createPendingRequest(requestData);

        if (result.success) {
          Swal.fire({
            icon: 'info',
            title: 'Đã gửi yêu cầu!',
            text: 'Yêu cầu vô hiệu hóa gói đã được gửi đến admin.',
            timer: 2000
          });
        } else {
          throw new Error(result.error);
        }
      } else {
        // Admin: Disable trực tiếp
        await disablePTPackage(packageId, ptId);
        await loadPackagesLocal();
        
        toast.success('Vô hiệu hóa gói dịch vụ thành công!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      }
      
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
      
      if (isPTPortal) {
        // PT Portal: Gửi yêu cầu enable
        const packageToEnable = localPackages.find(p => p.id === packageId);
        
        const requestData = {
          type: 'package_enable',
          packageId: packageId,
          packageName: packageToEnable?.name || 'Unknown',
          ptId: ptId,
          requestedBy: ptId,
          employeeName: ptInfo?.fullName || 'Unknown PT',
          requestedByName: ptInfo?.fullName || 'Unknown PT',
          employeeAvatar: ptInfo?.avatarUrl || null,
          data: { isActive: true },
          previousData: { isActive: false },
        };

        const result = await PendingRequestService.createPendingRequest(requestData);

        if (result.success) {
          Swal.fire({
            icon: 'info',
            title: 'Đã gửi yêu cầu!',
            text: 'Yêu cầu kích hoạt gói đã được gửi đến admin.',
            timer: 2000
          });
        } else {
          throw new Error(result.error);
        }
      } else {
        // Admin: Enable trực tiếp
        await enablePTPackage(packageId, ptId);
        await loadPackagesLocal();
        
        toast.success('Kích hoạt gói dịch vụ thành công!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      }
      
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
    setIsLoadingFormData(true); // Set loading flag IMMEDIATELY
    setSelectedPackage(pkg);
    setViewMode('form');
  };

  const handleCreateNew = () => {
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
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.ptPricingModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            {viewMode === 'list' ? (
              <>
                <span className={styles.icon}>💰</span>
                {isPTPortal ? 'Quản lý gói tập' : `Quản lý dịch vụ - ${ptInfo?.fullName}`}

              </>
            ) : selectedPackage ? (
              <>
                <span className={styles.icon}>✏️</span>
                Chỉnh sửa gói dịch vụ
              </>
            ) : (
              <>
                <span className={styles.icon}>➕</span>
                Thêm gói dịch vụ mới
              </>
            )}
          </h2>
          <button className={styles.closeBtn} onClick={handleClose} disabled={isSubmitting} title="Đóng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {viewMode === 'list' ? (
          <div className={styles.packagesListView}>
            {/* Header with add button */}
            <div className={styles.listHeader}>
              <button 
                className={styles.btnCreateNew}
                onClick={handleCreateNew}
              >
                <span className={styles.icon}>➕</span>
                Thêm gói dịch vụ mới
              </button>
            </div>

            {/* Loading state */}
            {localLoading && viewMode === 'list' ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Đang tải gói dịch vụ...</p>
              </div>
            ) : (
              /* Packages list */
              <div className={styles.packagesGrid}>
                {localPackages && localPackages.length > 0 ? (
                  localPackages.map((pkg) => (
                    <div key={pkg.id} className={styles.packageCard}>
                      <div className={styles.packageHeader}>
                        <h3 className={styles.packageName}>{pkg.name}</h3>
                        <div className={styles.packageBadges}>
                          {pkg.isPopular && <span className={`${styles.badge} ${styles.popular}`}>Phổ biến</span>}
                          {!pkg.isActive && <span className={`${styles.badge} ${styles.inactive}`}>Tạm dừng</span>}
                        </div>
                      </div>
                      <div className={styles.packageDetails}>
                        <div className={styles.packageType}>
                          {PACKAGE_TYPES.find(t => t.value === pkg.packageType)?.icon} {PACKAGE_TYPES.find(t => t.value === pkg.packageType)?.label}
                        </div>
                        <div className={styles.packagePrice}>
                          {pkg.discount > 0 ? (
                            <>
                              <span className={styles.originalPrice}>{pkg.price.toLocaleString('vi-VN')}đ</span>
                              <span className={styles.finalPrice}>{(pkg.price * (1 - pkg.discount / 100)).toLocaleString('vi-VN')}đ</span>
                            </>
                          ) : (
                            <span className={styles.finalPrice}>{pkg.price.toLocaleString('vi-VN')}đ</span>
                          )}
                        </div>
                        <div className={styles.packageInfo}>
                          <div className={styles.infoItem}>
                            <span className={styles.label}>Số buổi:</span>
                            <span className={styles.value}>{pkg.sessions} buổi</span>
                          </div>
                          <div className={styles.infoItem}>
                            <span className={styles.label}>Thời lượng:</span>
                            <span className={styles.value}>{pkg.duration} phút</span>
                          </div>
                          {pkg.maxParticipants > 1 && (
                            <div className={styles.infoItem}>
                              <span className={styles.label}>Số người:</span>
                              <span className={styles.value}>Tối đa {pkg.maxParticipants}</span>
                            </div>
                          )}
                        </div>
                        
                        {pkg.description && (
                          <div className={styles.packageDescription}>
                            {pkg.description}
                          </div>
                        )}

                        {pkg.features && pkg.features.length > 0 && (
                          <div className={styles.packageBenefits}>
                            <h4>Lợi ích:</h4>
                            <ul>
                              {pkg.features.slice(0, 3).map((benefit, index) => (
                                <li key={index}>{benefit}</li>
                              ))}
                              {pkg.features.length > 3 && (
                                <li className={styles.more}>+{pkg.features.length - 3} lợi ích khác</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className={styles.packageActions}>
                        <button 
                          className={styles.btnEdit}
                          onClick={() => handleEditPackage(pkg)}
                          disabled={isSubmitting}
                        >
                          <span className={styles.icon}>✏️</span>
                          Chỉnh sửa
                        </button>
                        
                        {pkg.isActive ? (
                          <button 
                            className={styles.btnDisable}
                            onClick={() => handleDisablePackage(pkg.id)}
                            disabled={isSubmitting}
                            title="Vô hiệu hóa gói"
                          >
                            <span className={styles.icon}>🚫</span>
                            Vô hiệu hóa
                          </button>
                        ) : (
                          <button 
                            className={styles.btnEnable}
                            onClick={() => handleEnablePackage(pkg.id)}
                            disabled={isSubmitting}
                            title="Kích hoạt gói"
                          >
                            <span className={styles.icon}>✅</span>
                            Kích hoạt
                          </button>
                        )}
                        
                        <button 
                          className={styles.btnDeletePackage}
                          onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                          disabled={isSubmitting}
                          title="Xóa hoàn toàn khỏi database"
                        >
                          <span className={styles.icon}>🗑️</span>
                          Xóa vĩnh viễn
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📦</div>
                    <h3>Chưa có gói dịch vụ nào</h3>
                    <p>Tạo gói dịch vụ đầu tiên để bắt đầu bán dịch vụ PT</p>
                    <button 
                      className={styles.btnCreateFirst}
                      onClick={handleCreateNew}
                    >
                      <span className={styles.icon}>➕</span>
                      Tạo gói đầu tiên
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.pricingForm}>
            <div className={styles.formHeader}>
              <button 
                type="button"
                className={styles.btnBack}
                onClick={handleBackToList}
              >
                <span className={styles.icon}>⬅️</span>
                Quay lại danh sách
              </button>
            </div>

            <div className={styles.formContent}>
            
            {/* Basic Info */}
            <div className={styles.formSection}>
              <h3>Thông tin cơ bản</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Tên gói dịch vụ *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="VD: Giảm cân cơ bản"
                    maxLength="100"
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
                </div>

                <div className={styles.formGroup}>
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

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Loại tính phí *</label>
                  <select
                    value={formData.billingType}
                    onChange={(e) => handleInputChange('billingType', e.target.value)}
                  >
                    <option value="session">Theo buổi</option>
                    <option value="monthly">Theo tháng</option>
                  </select>
                </div>

                {formData.billingType === 'monthly' ? (
                  <div className={styles.formGroup}>
                    <label>Số tháng *</label>
                    <select
                      value={formData.months}
                      onChange={(e) => handleInputChange('months', parseInt(e.target.value))}
                    >
                      {MONTH_OPTIONS.map(months => (
                        <option key={months} value={months}>
                          {months} tháng
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className={styles.formGroup}>
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
                    {errors.sessions && <span className={styles.errorMessage}>{errors.sessions}</span>}
                  </div>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
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
                  {errors.price && <span className={styles.errorMessage}>{errors.price}</span>}
                  {pricePerSession > 0 && formData.billingType === 'session' && (
                    <div className={styles.priceInfo}>
                      Giá mỗi buổi: {pricePerSession.toLocaleString('vi-VN')} VNĐ
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}></div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
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
                  <div className={styles.formGroup}>
                    <label>Số người tối đa *</label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 1)}
                      min={formData.type === 'group' ? 2 : 1}
                      max="20"
                      className={errors.maxParticipants ? 'error' : ''}
                    />
                    {errors.maxParticipants && <span className={styles.errorMessage}>{errors.maxParticipants}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Description & Benefits */}
            <div className={styles.formSection}>
              <h3>Mô tả & Lợi ích</h3>
              
              <div className={styles.formGroup}>
                <label>Mô tả gói dịch vụ</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Mô tả chi tiết về gói dịch vụ..."
                  rows="3"
                  maxLength="500"
                  className={errors.description ? 'error' : ''}
                />
                <div className={styles.charCount}>{formData.description.length}/500</div>
                {errors.description && <span className={styles.errorMessage}>{errors.description}</span>}
              </div>

              <div className={styles.formGroup}>
                <label>Lợi ích</label>
                <div className={styles.addBenefitGroup}>
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
                    className={styles.addBtn}
                  >
                    Thêm
                  </button>
                </div>
                
                <div className={styles.benefitsList}>
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className={styles.benefitItem}>
                      <span className={styles.benefitIcon}>✓</span>
                      <span className={styles.benefitText}>{benefit}</span>
                      <button
                        type="button"
                        onClick={() => removeBenefit(index)}
                        className={styles.removeBtn}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing & Settings */}
            <div className={styles.formSection}>
              <h3>Giá & Cài đặt</h3>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
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
                  {errors.discountPercent && <span className={styles.errorMessage}>{errors.discountPercent}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label>Thời hạn sử dụng (ngày)</label>
                  <input
                    type="number"
                    value={formData.validityDays}
                    onChange={(e) => handleInputChange('validityDays', parseInt(e.target.value) || 30)}
                    min="30"
                    max="365"
                    className={errors.validityDays ? 'error' : ''}
                  />
                  {errors.validityDays && <span className={styles.errorMessage}>{errors.validityDays}</span>}
                </div>
              </div>

              {/* Price Summary */}
              {formData.price && (
                <div className={styles.priceSummary}>
                  <div className={styles.priceRow}>
                    <span>Giá gốc:</span>
                    <span>{parseFloat(formData.price).toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  {formData.discountPercent > 0 && (
                    <>
                      <div className={`${styles.priceRow} ${styles.discount}`}>
                        <span>Giảm giá ({formData.discountPercent}%):</span>
                        <span>-{discountAmount.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                      <div className={`${styles.priceRow} ${styles.final}`}>
                        <span>Giá cuối:</span>
                        <span>{finalPrice.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className={styles.formRow}>
                <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => handleInputChange('isPopular', e.target.checked)}
                    />
                    <span className={styles.checkboxText}>
                      <span className={styles.icon}>⭐</span>
                      Gói phổ biến
                    </span>
                  </label>
                </div>

                <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    />
                    <span className={styles.checkboxText}>
                      <span className={styles.icon}>🟢</span>
                      Đang hoạt động
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Time Slot Management Section */}
            <div className={styles.formSection}>
              <h3>
                <span className={styles.icon}>⏰</span>
                Quản lý khung giờ
              </h3>
              <TimeSlotManager
                availableTimeSlots={formData.availableTimeSlots}
                sessionDuration={formData.duration}
                onTimeSlotsChange={handleTimeSlotsChange}
              />
            </div>

            {/* Booking Settings Section */}
            <div className={styles.formSection}>
              <h3>
                <span className={styles.icon}>📅</span>
                Cài đặt đặt lịch
              </h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
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
                <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.allowSameDayBooking}
                      onChange={(e) => handleInputChange('allowSameDayBooking', e.target.checked)}
                    />
                    <span className={styles.checkboxText}>
                      <span className={styles.icon}>⚡</span>
                      Cho phép đặt trong ngày
                    </span>
                  </label>
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
                {selectedPackage && (
                  <button
                    type="button"
                    className={styles.btnDeletePtpricing}
                    onClick={() => handleDeletePackage(selectedPackage.id, selectedPackage.name)}
                    disabled={isSubmitting}
                  >
                    <span className={styles.icon}>🗑️</span>
                    Xóa gói
                  </button>
                )}
                
                <div className={styles.actionGroup}>
                  <button
                    type="button"
                    className={styles.btnCancelPtpricing}
                    onClick={handleBackToList}
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
                        {selectedPackage ? 'Đang cập nhật...' : 'Đang tạo...'}
                      </>
                    ) : (
                      <>
                        <span className={styles.icon}>💾</span>
                        {selectedPackage ? 'Cập nhật gói' : 'Tạo gói mới'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

      </div>
    </div>
  );
}