import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/lib/features/auth/authContext';
import Swal from 'sweetalert2';
import EmployeeService from '../../../firebase/lib/features/employee/employee.service';
import { PendingRequestService } from '../../../firebase/lib/features/pending-request/pendingRequest.service';
import PTBasicInfo from '../components/PTBasicInfo';
import PTProfessionalInfo from '../components/PTProfessionalInfo';
import PTPendingRequestBanner from '../components/PTPendingRequestBanner';
import PTComparisonView from '../components/PTComparisonView';

export default function PTProfile() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ptInfo, setPtInfo] = useState({
    bio: '',
    specialties: [],
    experience: 0,
    certificates: [],
    achievements: [],
    languages: ['vi'],
    socialMedia: {
      facebook: '',
      instagram: '',
      tiktok: '',
      youtube: ''
    },
    maxClientsPerDay: 8,
    isAcceptingNewClients: true
  });

  const [employeeData, setEmployeeData] = useState(null);
  const [editedData, setEditedData] = useState({
    fullName: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: 'male',
    idCard: ''
  });
  const [pendingRequest, setPendingRequest] = useState(null);
  const [rejectedRequest, setRejectedRequest] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertificate, setNewCertificate] = useState('');
  const [newAchievement, setNewAchievement] = useState('');

  // Real-time listener for employee data
  useEffect(() => {
    if (!currentUser?.email) return;

    let unsubscribe;

    const setupListener = async () => {
      try {
        setLoading(true);
        
        // Subscribe to employee changes
        unsubscribe = await EmployeeService.subscribeToEmployeeByEmail(
          currentUser.email,
          (employee) => {
            // Update employee data
            setEmployeeData(employee);
            
            // Update PT info
            if (employee.ptInfo) {
              setPtInfo(prev => ({
                ...prev,
                ...employee.ptInfo
              }));
            }
            
            // Update edited data
            setEditedData({
              fullName: employee.fullName || '',
              phone: employee.phone || '',
              address: employee.address || '',
              dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
              gender: employee.gender || 'male',
              idCard: employee.idCard || ''
            });
            
            setLoading(false);
          },
          (error) => {
            console.error('Error in employee subscription:', error);
            Swal.fire({
              icon: 'error',
              title: 'Lỗi',
              text: error.message || 'Không thể tải thông tin'
            });
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up subscription:', error);
        setLoading(false);
      }
    };

    setupListener();

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.email]);

  // Real-time listener for pending requests
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = PendingRequestService.subscribeToProfilePendingRequest(
      currentUser.uid,
      (requests) => {
        // Get the first pending request (most recent)
        if (requests && requests.length > 0) {
          setPendingRequest(requests[0]);
          // Auto-show comparison when pending request exists
          setShowComparison(true);
        } else {
          setPendingRequest(null);
          setShowComparison(false);
        }
      },
      (error) => {
        console.error('Error in pending request subscription:', error);
      }
    );

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.uid]);

  // Real-time listener for rejected requests
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = PendingRequestService.subscribeToPendingRequests(
      {
        requestedBy: currentUser.uid,
        type: 'employee_update',
        status: 'rejected'
      },
      (requests) => {
        // Get the most recent rejected request
        if (requests && requests.length > 0) {
          const latestRejected = requests[0];
          
          // Check if we've already shown this rejection
          const lastShownRejectionId = localStorage.getItem('lastShownRejectionId');
          if (latestRejected.id !== lastShownRejectionId) {
            setRejectedRequest(latestRejected);
            
            // Show notification
            Swal.fire({
              icon: 'error',
              title: 'Yêu cầu bị từ chối',
              html: `
                <p>Yêu cầu thay đổi thông tin của bạn đã bị admin từ chối.</p>
                ${latestRejected.rejectionReason ? `
                  <div style="margin-top: 12px; padding: 12px; background: #fff3cd; border-radius: 8px; text-align: left;">
                    <strong style="color: #856404;">📝 Lý do:</strong><br>
                    <p style="color: #856404; margin: 8px 0 0 0;">${latestRejected.rejectionReason}</p>
                  </div>
                ` : ''}
              `,
              confirmButtonText: 'Đã hiểu',
              confirmButtonColor: '#007bff'
            });

            // Mark as shown
            localStorage.setItem('lastShownRejectionId', latestRejected.id);
          }
        }
      },
      (error) => {
        console.error('Error in rejected requests subscription:', error);
      }
    );

    // Cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.uid]);

  const loadPTData = async () => {
    try {
      setLoading(true);
      
      // Check if currentUser exists and has email
      if (!currentUser || !currentUser.email) {
        console.error('Current user or email is undefined:', currentUser);
        throw new Error('Không tìm thấy thông tin người dùng');
      }
      
      // Sử dụng EmployeeService để load data
      const result = await EmployeeService.getEmployeeByEmail(currentUser.email);
      
      if (!result.success) {
        throw new Error(result.error || 'Không tìm thấy thông tin nhân viên');
      }

      const employee = result.data;
      console.log('🔍 DEBUG - Full employee data:', employee);
      setEmployeeData(employee);
      
      // Load basic employee info
      setEditedData({
        fullName: employee.fullName || '',
        phone: employee.phone || '',
        address: employee.address || '',
        dateOfBirth: employee.dateOfBirth instanceof Date 
          ? employee.dateOfBirth.toISOString().split('T')[0] 
          : '',
        gender: employee.gender || 'male',
        idCard: employee.idCard || ''
      });
      
      // Load PT specific info
      if (employee.ptInfo) {
        console.log('🔍 DEBUG - ptInfo from DB:', employee.ptInfo);
        setPtInfo({
          bio: employee.ptInfo.bio || '',
          specialties: employee.ptInfo.specialties || [],
          experience: employee.ptInfo.experience || 0,
          certificates: employee.ptInfo.certificates || [],
          achievements: employee.ptInfo.achievements || [],
          languages: employee.ptInfo.languages || ['vi'],
          socialMedia: {
            facebook: employee.ptInfo.socialMedia?.facebook || '',
            instagram: employee.ptInfo.socialMedia?.instagram || '',
            tiktok: employee.ptInfo.socialMedia?.tiktok || '',
            youtube: employee.ptInfo.socialMedia?.youtube || ''
          },
          maxClientsPerDay: employee.ptInfo.maxClientsPerDay || 8,
          isAcceptingNewClients: employee.ptInfo.isAcceptingNewClients !== undefined 
            ? employee.ptInfo.isAcceptingNewClients 
            : true
        });
      }
    } catch (error) {
      console.error('Error loading PT data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.message || 'Không thể tải thông tin PT'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!employeeData?.id && !employeeData?._id) {
        throw new Error('Không tìm thấy thông tin nhân viên');
      }

      const employeeId = employeeData.id || employeeData._id;

      // Tạo pending request thay vì update trực tiếp
      const { db } = await import('../../../firebase/lib/config/firebase');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      const pendingRequestsRef = collection(db, 'pendingRequests');
      
      await addDoc(pendingRequestsRef, {
        type: 'employee_update',
        employeeId: employeeId,
        employeeEmail: employeeData.email || currentUser?.email,
        employeeName: employeeData.fullName || 'Unknown',
        requestedBy: currentUser?.uid || employeeId,
        requestedByName: employeeData.fullName || 'PT',
        employeeAvatar: employeeData.avatarUrl || null,
        status: 'pending',
        data: {
          fullName: editedData.fullName,
          phone: editedData.phone,
          address: editedData.address,
          dateOfBirth: editedData.dateOfBirth,
          gender: editedData.gender,
          idCard: editedData.idCard,
          ptInfo: ptInfo
        },
        previousData: {
          fullName: employeeData.fullName,
          phone: employeeData.phone,
          address: employeeData.address,
          dateOfBirth: employeeData.dateOfBirth,
          gender: employeeData.gender,
          idCard: employeeData.idCard,
          ptInfo: employeeData.ptInfo || {}
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      Swal.fire({
        icon: 'info',
        title: 'Đã gửi yêu cầu!',
        html: `
          <p>Thông tin của bạn đã được gửi đến admin để duyệt.</p>
          <p style="font-size: 13px; color: #6c757d; margin-top: 10px;">
            ⏳ Bạn sẽ nhận được thông báo khi admin phê duyệt.
          </p>
        `,
        confirmButtonText: 'OK',
        confirmButtonColor: '#007bff'
      });

      // Auto-show comparison view after submit
      setShowComparison(true);

      // Real-time listener will automatically reload
    } catch (error) {
      console.error('Error saving PT profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.message || 'Không thể lưu thông tin'
      });
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim()) {
      setPtInfo({
        ...ptInfo,
        specialties: [...(ptInfo.specialties || []), newSpecialty.trim()]
      });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (index) => {
    setPtInfo({
      ...ptInfo,
      specialties: ptInfo.specialties.filter((_, i) => i !== index)
    });
  };

  const addCertificate = () => {
    if (newCertificate.trim()) {
      setPtInfo({
        ...ptInfo,
        certificates: [...(ptInfo.certificates || []), newCertificate.trim()]
      });
      setNewCertificate('');
    }
  };

  const removeCertificate = (index) => {
    setPtInfo({
      ...ptInfo,
      certificates: ptInfo.certificates.filter((_, i) => i !== index)
    });
  };

  const handleCertificateImageUpload = async (certIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Ảnh không được vượt quá 5MB!');
      return;
    }

    try {
      // Upload to backend
      const formData = new FormData();
      formData.append('certificate', file); // Field name must match multer config

      const response = await fetch('http://localhost:3000/api/upload/pt-certificate', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload thất bại');
      }

      // Update certificates array
      const updatedCerts = [...ptInfo.certificates];
      const cert = updatedCerts[certIndex];
      
      // Convert to object format if still string
      if (typeof cert === 'string') {
        updatedCerts[certIndex] = {
          id: `cert_${Date.now()}`,
          text: cert,
          images: [{
            id: `img_${Date.now()}`,
            url: result.url,
            path: result.path,
            fileName: file.name,
            size: file.size,
            uploadedAt: new Date()
          }]
        };
      } else {
        // Add to existing images
        updatedCerts[certIndex] = {
          ...cert,
          images: [
            ...(cert.images || []),
            {
              id: `img_${Date.now()}`,
              url: result.url,
              path: result.path,
              fileName: file.name,
              size: file.size,
              uploadedAt: new Date()
            }
          ]
        };
      }

      setPtInfo({
        ...ptInfo,
        certificates: updatedCerts
      });

      Swal.fire({
        icon: 'success',
        title: 'Upload thành công!',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error uploading certificate image:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.message || 'Không thể upload ảnh'
      });
    }
  };

  const removeCertificateImage = (certIndex, imgIndex) => {
    const updatedCerts = [...ptInfo.certificates];
    const cert = updatedCerts[certIndex];
    
    if (typeof cert === 'object' && cert.images) {
      cert.images = cert.images.filter((_, i) => i !== imgIndex);
      
      setPtInfo({
        ...ptInfo,
        certificates: updatedCerts
      });
    }
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setPtInfo({
        ...ptInfo,
        achievements: [...(ptInfo.achievements || []), newAchievement.trim()]
      });
      setNewAchievement('');
    }
  };

  const removeAchievement = (index) => {
    setPtInfo({
      ...ptInfo,
      achievements: ptInfo.achievements.filter((_, i) => i !== index)
    });
  };

  const handleAchievementImageUpload = async (achIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Ảnh không được vượt quá 5MB!');
      return;
    }

    try {
      // Upload to backend
      const formData = new FormData();
      formData.append('achievement', file); // Field name must match multer config

      const response = await fetch('http://localhost:3000/api/upload/pt-achievement', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Upload thất bại');
      }

      // Update achievements array
      const updatedAchs = [...ptInfo.achievements];
      const ach = updatedAchs[achIndex];
      
      // Convert to object format if still string
      if (typeof ach === 'string') {
        updatedAchs[achIndex] = {
          id: `ach_${Date.now()}`,
          text: ach,
          images: [{
            id: `img_${Date.now()}`,
            url: result.url,
            path: result.path,
            fileName: file.name,
            size: file.size,
            uploadedAt: new Date()
          }]
        };
      } else {
        // Add to existing images
        updatedAchs[achIndex] = {
          ...ach,
          images: [
            ...(ach.images || []),
            {
              id: `img_${Date.now()}`,
              url: result.url,
              path: result.path,
              fileName: file.name,
              size: file.size,
              uploadedAt: new Date()
            }
          ]
        };
      }

      setPtInfo({
        ...ptInfo,
        achievements: updatedAchs
      });

      Swal.fire({
        icon: 'success',
        title: 'Upload thành công!',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error uploading achievement image:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: error.message || 'Không thể upload ảnh'
      });
    }
  };

  const removeAchievementImage = (achIndex, imgIndex) => {
    const updatedAchs = [...ptInfo.achievements];
    const ach = updatedAchs[achIndex];
    
    if (typeof ach === 'object' && ach.images) {
      ach.images = ach.images.filter((_, i) => i !== imgIndex);
      
      setPtInfo({
        ...ptInfo,
        achievements: updatedAchs
      });
    }
  };

  const handleCancelRequest = async () => {
    try {
      const { db } = await import('../../../firebase/lib/config/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');

      const requestRef = doc(db, 'pendingRequests', pendingRequest.id);
      await updateDoc(requestRef, {
        status: 'cancelled',
        cancelledAt: new Date()
      });

      setPendingRequest(null);

      Swal.fire({
        icon: 'success',
        title: 'Đã hủy!',
        text: 'Yêu cầu thay đổi đã được hủy',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error cancelling request:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể hủy yêu cầu'
      });
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
        Thông tin PT của tôi
      </h1>
      <p style={{ color: 'var(--color-textSecondary)', marginBottom: '16px' }}>
        Cập nhật thông tin cá nhân và thông tin PT để học viên hiểu rõ hơn về bạn
      </p>

      {/* Pending Request Banner */}
      <PTPendingRequestBanner
        pendingRequest={pendingRequest}
        showComparison={showComparison}
        setShowComparison={setShowComparison}
        onCancelRequest={handleCancelRequest}
      />

      {/* Comparison View */}
      <PTComparisonView 
        pendingRequest={pendingRequest}
        showComparison={showComparison}
      />

      {/* Warning box */}
      <div style={{
        background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
        border: '2px solid #ffc107',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'start',
        gap: '12px'
      }}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <div>
          <p style={{ fontWeight: 600, color: '#856404', marginBottom: '4px' }}>
            Lưu ý quan trọng
          </p>
          <p style={{ fontSize: '14px', color: '#856404', margin: 0 }}>
            Mọi thay đổi thông tin sẽ được gửi đến admin để duyệt trước khi cập nhật vào hệ thống.
            Bạn sẽ nhận được thông báo khi admin phê duyệt thay đổi của bạn.
          </p>
        </div>
      </div>

      {/* Thông tin cơ bản */}
      <PTBasicInfo
        editedData={editedData}
        setEditedData={setEditedData}
        employeeData={employeeData}
      />

      {/* Thông tin PT */}
      <PTProfessionalInfo
        ptInfo={ptInfo}
        setPtInfo={setPtInfo}
        newSpecialty={newSpecialty}
        setNewSpecialty={setNewSpecialty}
        newCertificate={newCertificate}
        setNewCertificate={setNewCertificate}
        newAchievement={newAchievement}
        setNewAchievement={setNewAchievement}
        addSpecialty={addSpecialty}
        removeSpecialty={removeSpecialty}
        addCertificate={addCertificate}
        removeCertificate={removeCertificate}
        addAchievement={addAchievement}
        removeAchievement={removeAchievement}
        handleCertificateImageUpload={handleCertificateImageUpload}
        removeCertificateImage={removeCertificateImage}
        handleAchievementImageUpload={handleAchievementImageUpload}
        removeAchievementImage={removeAchievementImage}
      />

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            background: saving ? '#ccc' : 'linear-gradient(90deg, var(--color-primary), var(--color-primaryVariant))',
            color: 'white',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '15px'
          }}
        >
          {saving ? 'Đang lưu...' : 'Lưu thông tin'}
        </button>
      </div>
    </div>
  );
}
