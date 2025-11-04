import React from 'react';
import Swal from 'sweetalert2';

export default function PTPendingRequestBanner({ 
  pendingRequest, 
  showComparison, 
  setShowComparison, 
  onCancelRequest 
}) {
  if (!pendingRequest) return null;

  const handleCancelClick = async () => {
    const confirmResult = await Swal.fire({
      icon: 'warning',
      title: 'Hủy yêu cầu?',
      text: 'Bạn có chắc muốn hủy yêu cầu thay đổi đang chờ duyệt?',
      showCancelButton: true,
      confirmButtonText: 'Hủy yêu cầu',
      cancelButtonText: 'Đóng',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (confirmResult.isConfirmed) {
      onCancelRequest();
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #cfe2ff 0%, #b6d4fe 100%)',
      border: '2px solid #0d6efd',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'start',
      gap: '12px'
    }}>
      <span style={{ fontSize: '24px' }}>⏳</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, color: '#084298', marginBottom: '4px' }}>
          Có yêu cầu thay đổi đang chờ duyệt
        </p>
        <p style={{ fontSize: '14px', color: '#084298', margin: 0, marginBottom: '8px' }}>
          Bạn đã gửi yêu cầu thay đổi thông tin vào{' '}
          {pendingRequest.createdAt ? new Date(pendingRequest.createdAt.seconds * 1000).toLocaleString('vi-VN') : 'N/A'}.
          Admin sẽ xem xét và phê duyệt sớm nhất.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowComparison(!showComparison)}
            style={{
              padding: '6px 12px',
              background: '#0d6efd',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            {showComparison ? '🔼 Ẩn chi tiết' : '🔽 Xem chi tiết'}
          </button>
          <button
            onClick={handleCancelClick}
            style={{
              padding: '6px 12px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            ❌ Hủy yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
}

