import React from 'react';
import { usePendingRequests } from '../../../firebase/lib/features/pending-request/pendingRequest.provider';
import './PendingRequests.css';

export default function PendingRequests() {
  const { 
    requests, 
    loading, 
    filter, 
    setFilter, 
    approveRequest, 
    rejectRequest, 
    viewRequestDetails,
    counts
  } = usePendingRequests();

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Chờ duyệt', class: 'badge-warning' },
      approved: { text: 'Đã duyệt', class: 'badge-success' },
      rejected: { text: 'Từ chối', class: 'badge-danger' },
      cancelled: { text: 'Đã hủy', class: 'badge-secondary' }
    };
    
    const badge = badges[status] || { text: status, class: 'badge-secondary' };
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const getTypeLabel = (type) => {
    const labels = {
      'employee_update': { icon: '👤', text: 'Cập nhật thông tin', color: '#007bff' },
      'package_create': { icon: '➕', text: 'Tạo gói tập', color: '#28a745' },
      'package_update': { icon: '✏️', text: 'Cập nhật gói', color: '#007bff' },
      'package_delete': { icon: '🗑️', text: 'Xóa gói', color: '#dc3545' },
      'package_enable': { icon: '✅', text: 'Kích hoạt gói', color: '#17a2b8' },
      'package_disable': { icon: '🚫', text: 'Vô hiệu hóa gói', color: '#ffc107' }
    };
    return labels[type] || { icon: '📦', text: type, color: '#6c757d' };
  };

  if (loading) {
    return (
      <div className="pending-requests-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="pending-requests-container">
      <div className="page-header">
        <h1>Yêu Cầu Chờ Duyệt</h1>
        <p>Quản lý các yêu cầu thay đổi thông tin từ nhân viên</p>
      </div>

      <div className="filter-tabs">
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          ⏳ Chờ duyệt ({counts.pending})
        </button>
        <button 
          className={filter === 'approved' ? 'active' : ''}
          onClick={() => setFilter('approved')}
        >
          ✅ Đã duyệt ({counts.approved})
        </button>
        <button 
          className={filter === 'rejected' ? 'active' : ''}
          onClick={() => setFilter('rejected')}
        >
          ❌ Từ chối ({counts.rejected})
        </button>
        <button 
          className={filter === 'cancelled' ? 'active' : ''}
          onClick={() => setFilter('cancelled')}
        >
          🚫 Đã hủy ({counts.cancelled})
        </button>
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          📋 Tất cả ({counts.all})
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>Không có yêu cầu nào</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map(request => {
            const typeInfo = getTypeLabel(request.type);
            return (
              <div key={request.id} className={`request-card ${request.status}`}>
                <div className="request-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Avatar */}
                    {request.employeeAvatar ? (
                      <img 
                        src={request.employeeAvatar.startsWith('http') ? request.employeeAvatar : `${window.location.origin}${request.employeeAvatar}`}
                        alt={request.employeeName || 'Avatar'}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #007bff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div style={{
                      display: request.employeeAvatar ? 'none' : 'flex',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 700,
                      border: '2px solid #667eea',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {(request.employeeName || request.requestedByName || 'U').charAt(0).toUpperCase()}
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '20px' }}>{typeInfo.icon}</span>
                        <h3>{request.employeeName || request.requestedByName || 'N/A'}</h3>
                      </div>
                      <p className="request-email">{request.employeeEmail || request.packageName || 'N/A'}</p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                
                <div className="request-body">
                  <div className="request-info">
                    <span className="label">Loại:</span>
                    <span style={{ 
                      color: typeInfo.color, 
                      fontWeight: 600,
                      background: `${typeInfo.color}15`,
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}>
                      {typeInfo.text}
                    </span>
                  </div>
                  <div className="request-info">
                    <span className="label">Ngày gửi:</span>
                    <span>{request.createdAt?.toLocaleString('vi-VN')}</span>
                  </div>
                  {request.packageName && (
                    <div className="request-info">
                      <span className="label">Gói tập:</span>
                      <span style={{ fontWeight: 600 }}>{request.packageName}</span>
                    </div>
                  )}
                </div>

                <div className="request-actions">
                  <button 
                    className="btn-view"
                    onClick={() => viewRequestDetails(request)}
                  >
                    👁️ Xem chi tiết
                  </button>
                  
                  {request.status === 'pending' && (
                    <>
                      <button 
                        className="btn-approve"
                        onClick={() => approveRequest(request)}
                      >
                        ✓ Duyệt
                      </button>
                      <button 
                        className="btn-reject"
                        onClick={() => rejectRequest(request.id, request)}
                      >
                        ✕ Từ chối
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

