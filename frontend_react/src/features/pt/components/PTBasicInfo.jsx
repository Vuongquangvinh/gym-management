import React from 'react';

export default function PTBasicInfo({ editedData, setEditedData, employeeData }) {
  return (
    <div style={{ 
      background: 'var(--color-surface)', 
      borderRadius: '14px', 
      padding: '24px',
      boxShadow: '0 10px 30px rgba(11,37,69,0.06)',
      marginBottom: '20px'
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-primary)' }}>
        📋 Thông tin cơ bản
      </h2>

      {/* Full Name */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
          Họ và Tên *
        </label>
        <input
          type="text"
          value={editedData.fullName}
          onChange={(e) => setEditedData({ ...editedData, fullName: e.target.value })}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Gender & Date of Birth */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Giới Tính
          </label>
          <select
            value={editedData.gender}
            onChange={(e) => setEditedData({ ...editedData, gender: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px'
            }}
          >
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Ngày Sinh
          </label>
          <input
            type="date"
            value={editedData.dateOfBirth}
            onChange={(e) => setEditedData({ ...editedData, dateOfBirth: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Phone */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
          Số Điện Thoại *
        </label>
        <input
          type="tel"
          value={editedData.phone}
          onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
          placeholder="0901234567"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Address */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
          Địa Chỉ *
        </label>
        <textarea
          value={editedData.address}
          onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
          placeholder="Nhập địa chỉ đầy đủ"
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* ID Card */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
          Căn Cước Công Dân *
        </label>
        <input
          type="text"
          value={editedData.idCard}
          onChange={(e) => setEditedData({ ...editedData, idCard: e.target.value })}
          placeholder="Nhập 9 hoặc 12 chữ số"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '14px'
          }}
        />
        <small style={{ color: '#6c757d', fontSize: '0.85em' }}>
          VD: 012345678 hoặc 012345678901
        </small>
      </div>

      {/* Read-only fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#6c757d' }}>
            Email (Không thể sửa)
          </label>
          <input
            type="email"
            value={employeeData?.email || ''}
            disabled
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px',
              backgroundColor: '#f8f9fa',
              color: '#6c757d',
              cursor: 'not-allowed'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#6c757d' }}>
            Vị Trí (Không thể sửa)
          </label>
          <input
            type="text"
            value={employeeData?.position || ''}
            disabled
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px',
              backgroundColor: '#f8f9fa',
              color: '#6c757d',
              cursor: 'not-allowed'
            }}
          />
        </div>
      </div>

      {/* Salary & Commission (Read-only) */}
      <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #dee2e6' }}>
        <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#495057', marginBottom: '12px' }}>
          💰 Thông tin lương (Chỉ xem)
        </h5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#6c757d' }}>
              Lương cơ bản
            </label>
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '2px solid #28a745',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#28a745',
              backgroundColor: '#d4edda',
              textAlign: 'right'
            }}>
              {employeeData?.salary ? employeeData.salary.toLocaleString('vi-VN') : '0'} VNĐ
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#6c757d' }}>
              Tỷ lệ hoa hồng
            </label>
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '2px solid #17a2b8',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#17a2b8',
              backgroundColor: '#d1ecf1',
              textAlign: 'right'
            }}>
              {employeeData?.commissionRate || 0}%
            </div>
          </div>
        </div>
        <small style={{ display: 'block', color: '#6c757d', fontSize: '0.85em', marginTop: '8px' }}>
          ℹ️ Thông tin lương chỉ được xem, không thể chỉnh sửa. Liên hệ admin nếu có thắc mắc.
        </small>
      </div>

      {/* Work Info (Read-only) */}
      <div>
        <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#495057', marginBottom: '12px' }}>
          📅 Thông tin công việc (Chỉ xem)
        </h5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#6c757d' }}>
              Ngày bắt đầu làm việc
            </label>
            <input
              type="text"
              value={employeeData?.startDate ? new Date(employeeData.startDate.seconds * 1000).toLocaleDateString('vi-VN') : 'N/A'}
              disabled
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                backgroundColor: '#f8f9fa',
                color: '#6c757d',
                cursor: 'not-allowed'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#6c757d' }}>
              Ca làm việc
            </label>
            <input
              type="text"
              value={employeeData?.shift === 'fulltime' ? 'Full-time (8:00-17:00)' : employeeData?.shift === 'parttime' ? 'Part-time' : 'N/A'}
              disabled
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
                backgroundColor: '#f8f9fa',
                color: '#6c757d',
                cursor: 'not-allowed'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

