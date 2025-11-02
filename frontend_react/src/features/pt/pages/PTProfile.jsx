import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../firebase/lib/features/auth/authContext';
import EmployeeService from '../../../firebase/lib/features/employee/employee.service';
import Swal from 'sweetalert2';

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
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertificate, setNewCertificate] = useState('');
  const [newAchievement, setNewAchievement] = useState('');

  useEffect(() => {
    loadPTData();
  }, [currentUser]);

  const loadPTData = async () => {
    try {
      setLoading(true);
      
      // Lấy thông tin employee dựa trên email bằng Firestore trực tiếp
      const { db } = await import('../../../firebase/lib/config/firebase');
      const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
      
      const employeesRef = collection(db, 'employees');
      const q = query(employeesRef, where('email', '==', currentUser?.email), limit(1));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const employee = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setEmployeeData(employee);
        
        if (employee.ptInfo) {
          setPtInfo({
            ...ptInfo,
            ...employee.ptInfo
          });
        }
      }
    } catch (error) {
      console.error('Error loading PT data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải thông tin PT'
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
        status: 'pending',
        data: {
          ptInfo: ptInfo
        },
        previousData: {
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

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
        Thông tin PT của tôi
      </h1>
      <p style={{ color: 'var(--color-textSecondary)', marginBottom: '28px' }}>
        Cập nhật thông tin để học viên hiểu rõ hơn về bạn
      </p>

      <div style={{ 
        background: 'var(--color-surface)', 
        borderRadius: '14px', 
        padding: '24px',
        boxShadow: '0 10px 30px rgba(11,37,69,0.06)',
        marginBottom: '20px'
      }}>
        {/* Bio */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Giới thiệu bản thân
          </label>
          <textarea
            value={ptInfo.bio}
            onChange={(e) => setPtInfo({ ...ptInfo, bio: e.target.value })}
            placeholder="Viết vài dòng giới thiệu về bản thân, kinh nghiệm, phong cách tập luyện..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Experience */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Số năm kinh nghiệm
          </label>
          <input
            type="number"
            value={ptInfo.experience}
            onChange={(e) => setPtInfo({ ...ptInfo, experience: parseInt(e.target.value) || 0 })}
            style={{
              width: '200px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Specialties */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Chuyên môn
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
              placeholder="VD: Tăng cơ, Giảm cân, Yoga..."
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px'
              }}
            />
            <button
              onClick={addSpecialty}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Thêm
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(ptInfo.specialties || []).map((specialty, index) => (
              <div
                key={index}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: 'rgba(13,71,161,0.1)',
                  color: 'var(--color-primary)',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {specialty}
                <button
                  onClick={() => removeSpecialty(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-primary)',
                    fontWeight: 'bold'
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Certificates */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Chứng chỉ
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={newCertificate}
              onChange={(e) => setNewCertificate(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCertificate()}
              placeholder="VD: ACE Personal Trainer, NASM-CPT..."
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px'
              }}
            />
            <button
              onClick={addCertificate}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Thêm
            </button>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {(ptInfo.certificates || []).map((cert, index) => (
              <li key={index} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{cert}</span>
                <button
                  onClick={() => removeCertificate(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#dc3545',
                    fontWeight: 'bold'
                  }}
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Achievements */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Thành tích
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
              placeholder="VD: Huấn luyện viên xuất sắc 2023..."
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px'
              }}
            />
            <button
              onClick={addAchievement}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Thêm
            </button>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {(ptInfo.achievements || []).map((achievement, index) => (
              <li key={index} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{achievement}</span>
                <button
                  onClick={() => removeAchievement(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#dc3545',
                    fontWeight: 'bold'
                  }}
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Social Media */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Mạng xã hội
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              type="text"
              value={ptInfo.socialMedia?.facebook || ''}
              onChange={(e) => setPtInfo({ ...ptInfo, socialMedia: { ...ptInfo.socialMedia, facebook: e.target.value } })}
              placeholder="Facebook URL"
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px'
              }}
            />
            <input
              type="text"
              value={ptInfo.socialMedia?.instagram || ''}
              onChange={(e) => setPtInfo({ ...ptInfo, socialMedia: { ...ptInfo.socialMedia, instagram: e.target.value } })}
              placeholder="Instagram URL"
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px'
              }}
            />
            <input
              type="text"
              value={ptInfo.socialMedia?.tiktok || ''}
              onChange={(e) => setPtInfo({ ...ptInfo, socialMedia: { ...ptInfo.socialMedia, tiktok: e.target.value } })}
              placeholder="TikTok URL"
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px'
              }}
            />
            <input
              type="text"
              value={ptInfo.socialMedia?.youtube || ''}
              onChange={(e) => setPtInfo({ ...ptInfo, socialMedia: { ...ptInfo.socialMedia, youtube: e.target.value } })}
              placeholder="YouTube URL"
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Max Clients & Accepting New Clients */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
              Số học viên tối đa / ngày
            </label>
            <input
              type="number"
              value={ptInfo.maxClientsPerDay}
              onChange={(e) => setPtInfo({ ...ptInfo, maxClientsPerDay: parseInt(e.target.value) || 8 })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
              Nhận học viên mới
            </label>
            <select
              value={ptInfo.isAcceptingNewClients ? 'yes' : 'no'}
              onChange={(e) => setPtInfo({ ...ptInfo, isAcceptingNewClients: e.target.value === 'yes' })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px'
              }}
            >
              <option value="yes">Có</option>
              <option value="no">Không</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
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
    </div>
  );
}

