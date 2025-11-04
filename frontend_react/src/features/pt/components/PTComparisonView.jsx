import React from 'react';

export default function PTComparisonView({ pendingRequest, showComparison }) {
  if (!pendingRequest || !showComparison) return null;

  // Helper function to normalize date for comparison
  const normalizeDate = (date) => {
    if (!date) return null;
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? date : parsed.toISOString().split('T')[0];
    }
    if (date?.seconds) {
      return new Date(date.seconds * 1000).toISOString().split('T')[0];
    }
    return null;
  };

  const isSameDate = (date1, date2) => {
    return normalizeDate(date1) === normalizeDate(date2);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') return date;
    if (date?.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('vi-VN');
    }
    return 'N/A';
  };

  return (
    <div style={{
      background: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#495057' }}>
        📊 So sánh thay đổi
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Current Data */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#6c757d', marginBottom: '12px' }}>
            ✅ Thông tin hiện tại (Đã duyệt)
          </h4>
          <div style={{ background: 'white', padding: '16px', borderRadius: '8px', fontSize: '13px' }}>
            {/* Basic Info */}
            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #dee2e6' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#495057', marginBottom: '8px' }}>Thông tin cơ bản</h5>
              <p style={{ 
                marginBottom: '6px', 
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.fullName !== pendingRequest.data?.fullName ? '#fff3cd' : 'transparent'
              }}>
                <strong>Họ tên:</strong> {pendingRequest.previousData?.fullName || 'N/A'}
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.gender !== pendingRequest.data?.gender ? '#fff3cd' : 'transparent'
              }}>
                <strong>Giới tính:</strong> {pendingRequest.previousData?.gender === 'male' ? 'Nam' : pendingRequest.previousData?.gender === 'female' ? 'Nữ' : 'Khác'}
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: !isSameDate(pendingRequest.previousData?.dateOfBirth, pendingRequest.data?.dateOfBirth) ? '#fff3cd' : 'transparent'
              }}>
                <strong>Ngày sinh:</strong> {formatDate(pendingRequest.previousData?.dateOfBirth)}
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.phone !== pendingRequest.data?.phone ? '#fff3cd' : 'transparent'
              }}>
                <strong>SĐT:</strong> {pendingRequest.previousData?.phone || 'N/A'}
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.address !== pendingRequest.data?.address ? '#fff3cd' : 'transparent'
              }}>
                <strong>Địa chỉ:</strong> {pendingRequest.previousData?.address || 'N/A'}
              </p>
              <p style={{ 
                marginBottom: '0',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.idCard !== pendingRequest.data?.idCard ? '#fff3cd' : 'transparent'
              }}>
                <strong>CCCD:</strong> {pendingRequest.previousData?.idCard || 'N/A'}
              </p>
            </div>

            {/* PT Info */}
            <div>
              <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#495057', marginBottom: '8px' }}>Thông tin PT</h5>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.ptInfo?.bio !== pendingRequest.data?.ptInfo?.bio ? '#fff3cd' : 'transparent'
              }}>
                <strong>Bio:</strong> {pendingRequest.previousData?.ptInfo?.bio || 'Chưa có'}
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.ptInfo?.experience !== pendingRequest.data?.ptInfo?.experience ? '#fff3cd' : 'transparent'
              }}>
                <strong>Kinh nghiệm:</strong> {pendingRequest.previousData?.ptInfo?.experience || 0} năm
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: JSON.stringify(pendingRequest.previousData?.ptInfo?.specialties) !== JSON.stringify(pendingRequest.data?.ptInfo?.specialties) ? '#fff3cd' : 'transparent'
              }}>
                <strong>Chuyên môn:</strong> {
                  Array.isArray(pendingRequest.previousData?.ptInfo?.specialties) 
                    ? pendingRequest.previousData.ptInfo.specialties.map(s => typeof s === 'string' ? s : s.text || s.name).join(', ') 
                    : 'Chưa có'
                }
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: JSON.stringify(pendingRequest.previousData?.ptInfo?.certificates) !== JSON.stringify(pendingRequest.data?.ptInfo?.certificates) ? '#fff3cd' : 'transparent'
              }}>
                <strong>Chứng chỉ:</strong> {pendingRequest.previousData?.ptInfo?.certificates?.length || 0} chứng chỉ
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: JSON.stringify(pendingRequest.previousData?.ptInfo?.achievements) !== JSON.stringify(pendingRequest.data?.ptInfo?.achievements) ? '#fff3cd' : 'transparent'
              }}>
                <strong>Thành tích:</strong> {pendingRequest.previousData?.ptInfo?.achievements?.length || 0} thành tích
              </p>
              <p style={{ 
                marginBottom: '0',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.ptInfo?.maxClientsPerDay !== pendingRequest.data?.ptInfo?.maxClientsPerDay ? '#fff3cd' : 'transparent'
              }}>
                <strong>Số HV tối đa/ngày:</strong> {pendingRequest.previousData?.ptInfo?.maxClientsPerDay || 8}
              </p>
            </div>
          </div>
        </div>

        {/* Requested Data */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0d6efd', marginBottom: '12px' }}>
            ⏳ Yêu cầu thay đổi (Chờ duyệt)
          </h4>
          <div style={{ background: '#e7f1ff', padding: '16px', borderRadius: '8px', fontSize: '13px' }}>
            {/* Basic Info */}
            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #b6d4fe' }}>
              <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#084298', marginBottom: '8px' }}>Thông tin cơ bản</h5>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.fullName !== pendingRequest.data?.fullName ? '#ffc107' : 'transparent',
                fontWeight: pendingRequest.previousData?.fullName !== pendingRequest.data?.fullName ? 600 : 400,
                color: pendingRequest.previousData?.fullName !== pendingRequest.data?.fullName ? '#000' : 'inherit'
              }}>
                <strong>Họ tên:</strong> {pendingRequest.data?.fullName || 'N/A'}
                {pendingRequest.previousData?.fullName !== pendingRequest.data?.fullName && ' 🔥'}
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.gender !== pendingRequest.data?.gender ? '#ffc107' : 'transparent',
                fontWeight: pendingRequest.previousData?.gender !== pendingRequest.data?.gender ? 600 : 400,
                color: pendingRequest.previousData?.gender !== pendingRequest.data?.gender ? '#000' : 'inherit'
              }}>
                <strong>Giới tính:</strong> {pendingRequest.data?.gender === 'male' ? 'Nam' : pendingRequest.data?.gender === 'female' ? 'Nữ' : 'Khác'}
                {pendingRequest.previousData?.gender !== pendingRequest.data?.gender && ' 🔥'}
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: !isSameDate(pendingRequest.previousData?.dateOfBirth, pendingRequest.data?.dateOfBirth) ? '#ffc107' : 'transparent',
                fontWeight: !isSameDate(pendingRequest.previousData?.dateOfBirth, pendingRequest.data?.dateOfBirth) ? 600 : 400,
                color: !isSameDate(pendingRequest.previousData?.dateOfBirth, pendingRequest.data?.dateOfBirth) ? '#000' : 'inherit'
              }}>
                <strong>Ngày sinh:</strong> {formatDate(pendingRequest.data?.dateOfBirth)}
                {!isSameDate(pendingRequest.previousData?.dateOfBirth, pendingRequest.data?.dateOfBirth) && ' 🔥'}
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.phone !== pendingRequest.data?.phone ? '#ffc107' : 'transparent',
                fontWeight: pendingRequest.previousData?.phone !== pendingRequest.data?.phone ? 600 : 400,
                color: pendingRequest.previousData?.phone !== pendingRequest.data?.phone ? '#000' : 'inherit'
              }}>
                <strong>SĐT:</strong> {pendingRequest.data?.phone || 'N/A'}
                {pendingRequest.previousData?.phone !== pendingRequest.data?.phone && ' 🔥'}
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.address !== pendingRequest.data?.address ? '#ffc107' : 'transparent',
                fontWeight: pendingRequest.previousData?.address !== pendingRequest.data?.address ? 600 : 400,
                color: pendingRequest.previousData?.address !== pendingRequest.data?.address ? '#000' : 'inherit'
              }}>
                <strong>Địa chỉ:</strong> {pendingRequest.data?.address || 'N/A'}
                {pendingRequest.previousData?.address !== pendingRequest.data?.address && ' 🔥'}
              </p>
              <p style={{ 
                marginBottom: '0',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.idCard !== pendingRequest.data?.idCard ? '#ffc107' : 'transparent',
                fontWeight: pendingRequest.previousData?.idCard !== pendingRequest.data?.idCard ? 600 : 400,
                color: pendingRequest.previousData?.idCard !== pendingRequest.data?.idCard ? '#000' : 'inherit'
              }}>
                <strong>CCCD:</strong> {pendingRequest.data?.idCard || 'N/A'}
                {pendingRequest.previousData?.idCard !== pendingRequest.data?.idCard && ' 🔥'}
              </p>
            </div>

            {/* PT Info */}
            <div>
              <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#084298', marginBottom: '8px' }}>Thông tin PT</h5>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.ptInfo?.bio !== pendingRequest.data?.ptInfo?.bio ? '#ffc107' : 'transparent',
                fontWeight: pendingRequest.previousData?.ptInfo?.bio !== pendingRequest.data?.ptInfo?.bio ? 600 : 400,
                color: pendingRequest.previousData?.ptInfo?.bio !== pendingRequest.data?.ptInfo?.bio ? '#000' : 'inherit'
              }}>
                <strong>Bio:</strong> {pendingRequest.data?.ptInfo?.bio || 'Chưa có'}
                {pendingRequest.previousData?.ptInfo?.bio !== pendingRequest.data?.ptInfo?.bio && ' 🔥'}
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.ptInfo?.experience !== pendingRequest.data?.ptInfo?.experience ? '#ffc107' : 'transparent',
                fontWeight: pendingRequest.previousData?.ptInfo?.experience !== pendingRequest.data?.ptInfo?.experience ? 600 : 400,
                color: pendingRequest.previousData?.ptInfo?.experience !== pendingRequest.data?.ptInfo?.experience ? '#000' : 'inherit'
              }}>
                <strong>Kinh nghiệm:</strong> {pendingRequest.data?.ptInfo?.experience || 0} năm
                {pendingRequest.previousData?.ptInfo?.experience !== pendingRequest.data?.ptInfo?.experience && ' 🔥'}
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: JSON.stringify(pendingRequest.previousData?.ptInfo?.specialties) !== JSON.stringify(pendingRequest.data?.ptInfo?.specialties) ? '#ffc107' : 'transparent',
                fontWeight: JSON.stringify(pendingRequest.previousData?.ptInfo?.specialties) !== JSON.stringify(pendingRequest.data?.ptInfo?.specialties) ? 600 : 400,
                color: JSON.stringify(pendingRequest.previousData?.ptInfo?.specialties) !== JSON.stringify(pendingRequest.data?.ptInfo?.specialties) ? '#000' : 'inherit'
              }}>
                <strong>Chuyên môn:</strong> {
                  Array.isArray(pendingRequest.data?.ptInfo?.specialties) 
                    ? pendingRequest.data.ptInfo.specialties.map(s => typeof s === 'string' ? s : s.text || s.name).join(', ') 
                    : 'Chưa có'
                }
                {JSON.stringify(pendingRequest.previousData?.ptInfo?.specialties) !== JSON.stringify(pendingRequest.data?.ptInfo?.specialties) && ' 🔥'}
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: JSON.stringify(pendingRequest.previousData?.ptInfo?.certificates) !== JSON.stringify(pendingRequest.data?.ptInfo?.certificates) ? '#ffc107' : 'transparent',
                fontWeight: JSON.stringify(pendingRequest.previousData?.ptInfo?.certificates) !== JSON.stringify(pendingRequest.data?.ptInfo?.certificates) ? 600 : 400,
                color: JSON.stringify(pendingRequest.previousData?.ptInfo?.certificates) !== JSON.stringify(pendingRequest.data?.ptInfo?.certificates) ? '#000' : 'inherit'
              }}>
                <strong>Chứng chỉ:</strong> {pendingRequest.data?.ptInfo?.certificates?.length || 0} chứng chỉ
                {JSON.stringify(pendingRequest.previousData?.ptInfo?.certificates) !== JSON.stringify(pendingRequest.data?.ptInfo?.certificates) && ' 🔥'}
              </p>
              <p style={{ 
                marginBottom: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: JSON.stringify(pendingRequest.previousData?.ptInfo?.achievements) !== JSON.stringify(pendingRequest.data?.ptInfo?.achievements) ? '#ffc107' : 'transparent',
                fontWeight: JSON.stringify(pendingRequest.previousData?.ptInfo?.achievements) !== JSON.stringify(pendingRequest.data?.ptInfo?.achievements) ? 600 : 400,
                color: JSON.stringify(pendingRequest.previousData?.ptInfo?.achievements) !== JSON.stringify(pendingRequest.data?.ptInfo?.achievements) ? '#000' : 'inherit'
              }}>
                <strong>Thành tích:</strong> {pendingRequest.data?.ptInfo?.achievements?.length || 0} thành tích
                {JSON.stringify(pendingRequest.previousData?.ptInfo?.achievements) !== JSON.stringify(pendingRequest.data?.ptInfo?.achievements) && ' 🔥'}
              </p>
              <p style={{ 
                marginBottom: '0',
                padding: '4px 8px',
                borderRadius: '4px',
                background: pendingRequest.previousData?.ptInfo?.maxClientsPerDay !== pendingRequest.data?.ptInfo?.maxClientsPerDay ? '#ffc107' : 'transparent',
                fontWeight: pendingRequest.previousData?.ptInfo?.maxClientsPerDay !== pendingRequest.data?.ptInfo?.maxClientsPerDay ? 600 : 400,
                color: pendingRequest.previousData?.ptInfo?.maxClientsPerDay !== pendingRequest.data?.ptInfo?.maxClientsPerDay ? '#000' : 'inherit'
              }}>
                <strong>Số HV tối đa/ngày:</strong> {pendingRequest.data?.ptInfo?.maxClientsPerDay || 8}
                {pendingRequest.previousData?.ptInfo?.maxClientsPerDay !== pendingRequest.data?.ptInfo?.maxClientsPerDay && ' 🔥'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: '16px', padding: '12px', background: '#fff3cd', borderRadius: '8px', fontSize: '12px' }}>
        <p style={{ margin: 0 }}>
          <strong>🔥 = Có thay đổi</strong> | 
          <span style={{ marginLeft: '12px', padding: '2px 8px', background: '#ffc107', borderRadius: '4px', color: '#000' }}>
            Highlight vàng
          </span>
          <span style={{ marginLeft: '8px' }}>= Giá trị đã thay đổi</span>
        </p>
      </div>
    </div>
  );
}

