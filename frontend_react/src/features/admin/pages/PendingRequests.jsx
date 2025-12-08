import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePendingRequests } from '../../../firebase/lib/features/pending-request/pendingRequest.provider';
import styles from './PendingRequests.module.css';

export default function PendingRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    requests, 
    loading,
    loadingMore,
    hasMore,
    filter, 
    setFilter, 
    approveRequest, 
    rejectRequest, 
    viewRequestDetails,
    loadMore,
    counts
  } = usePendingRequests();

  // Debug: Log on every render
  console.log('🎬 [PendingRequests] Component render');
  console.log('🎬 [PendingRequests] URL:', window.location.href);
  console.log('🎬 [PendingRequests] searchParams:', Object.fromEntries(searchParams));
  console.log('🎬 [PendingRequests] requests.length:', requests.length);
  console.log('🎬 [PendingRequests] loading:', loading);

  // Auto-open request from notification
  useEffect(() => {
    console.log('🔄 [useEffect] Running...');
    
    // Try URL first, then sessionStorage
    let requestId = searchParams.get('requestId');
    if (!requestId) {
      requestId = sessionStorage.getItem('pendingRequestId');
      console.log('🔍 [PendingRequests] requestId from sessionStorage:', requestId);
    } else {
      console.log('🔍 [PendingRequests] requestId from URL:', requestId);
    }
    
    console.log('🔍 [PendingRequests] requests loaded:', requests.length);
    console.log('🔍 [PendingRequests] all requests:', requests.map(r => r.id));
    
    if (requestId) {
      // Clear sessionStorage and URL immediately
      sessionStorage.removeItem('pendingRequestId');
      
      if (requests.length > 0) {
        const request = requests.find(r => r.id === requestId);
        console.log('🔍 [PendingRequests] Found request:', request);
        
        if (request) {
          console.log('✅ [PendingRequests] Opening modal for request:', request.id);
          
          // Scroll to the request card
          setTimeout(() => {
            const element = document.getElementById(`request-${requestId}`);
            console.log('📍 Element found:', element);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          
          // Open modal after scroll
          setTimeout(() => {
            console.log('🚀 Calling viewRequestDetails...');
            viewRequestDetails(request);
            // Clear URL param after opening
            setTimeout(() => {
              console.log('🧹 Clearing URL params...');
              setSearchParams({});
            }, 1000);
          }, 500);
        } else {
          console.warn('⚠️ [PendingRequests] Request not found in list');
          console.warn('⚠️ Looking for:', requestId);
          console.warn('⚠️ Available IDs:', requests.map(r => r.id));
          console.warn('⚠️ Request có thể đã bị xóa hoặc đã được duyệt/từ chối');
          // Just clear URL and show the page normally
          setSearchParams({});
        }
      } else {
        console.log('ℹ️ [PendingRequests] Waiting for requests to load...');
      }
    }
  }, [requests, searchParams, setSearchParams, viewRequestDetails]);

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Chờ duyệt', class: styles.badgeWarning },
      approved: { text: 'Đã duyệt', class: styles.badgeSuccess },
      rejected: { text: 'Từ chối', class: styles.badgeDanger },
      cancelled: { text: 'Đã hủy', class: styles.badgeSecondary }
    };
    
    const badge = badges[status] || { text: status, class: styles.badgeSecondary };
    return <span className={`${styles.badge} ${badge.class}`}>{badge.text}</span>;
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
      <div className={styles.pendingRequestsContainer}>
        <div className={styles.loading}>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className={styles.pendingRequestsContainer}>
      <div className={styles.pageHeader}>
        <h1>Yêu Cầu Chờ Duyệt</h1>
        <p>Quản lý các yêu cầu thay đổi thông tin từ nhân viên</p>
      </div>

      <div className={styles.filterTabs}>
        <button
          className={filter === 'pending' ? styles.active : ''}
          onClick={() => setFilter('pending')}
        >
          ⏳ Chờ duyệt ({counts.pending})
        </button>
        <button
          className={filter === 'approved' ? styles.active : ''}
          onClick={() => setFilter('approved')}
        >
          ✅ Đã duyệt ({counts.approved})
        </button>
        <button
          className={filter === 'rejected' ? styles.active : ''}
          onClick={() => setFilter('rejected')}
        >
          ❌ Từ chối ({counts.rejected})
        </button>
        <button
          className={filter === 'cancelled' ? styles.active : ''}
          onClick={() => setFilter('cancelled')}
        >
          🚫 Đã hủy ({counts.cancelled})
        </button>
        <button
          className={filter === 'all' ? styles.active : ''}
          onClick={() => setFilter('all')}
        >
          📋 Tất cả ({counts.all})
        </button>
      </div>

      {requests.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Không có yêu cầu nào</p>
        </div>
      ) : (
        <div className={styles.requestsList}>
          {requests.map(request => {
            const typeInfo = getTypeLabel(request.type);
            const isHighlighted = searchParams.get('requestId') === request.id;
            return (
              <div 
                key={request.id} 
                id={`request-${request.id}`}
                className={`${styles.requestCard} ${styles[request.status]} ${isHighlighted ? styles.highlighted : ''}`}
              >
                <div className={styles.requestHeader}>
                  <div className={styles.avatarContainer}>
                    {/* Avatar */}
                    {request.employeeAvatar ? (
                      <img 
                        src={request.employeeAvatar.startsWith('http') ? request.employeeAvatar : `${window.location.origin}${request.employeeAvatar}`}
                        alt={request.employeeName || 'Avatar'}
                        className={styles.avatar}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={styles.avatarPlaceholder}
                      style={{ display: request.employeeAvatar ? 'none' : 'flex' }}
                    >
                      {(request.employeeName || request.requestedByName || 'U').charAt(0).toUpperCase()}
                    </div>
                    
                    <div className={styles.employeeInfo}>
                      <div className={styles.employeeName}>
                        <span className={styles.typeIcon}>{typeInfo.icon}</span>
                        <h3>{request.employeeName || request.requestedByName || 'N/A'}</h3>
                      </div>
                      <p className={styles.requestEmail}>{request.employeeEmail || request.packageName || 'N/A'}</p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                
                <div className={styles.requestBody}>
                  <div className={styles.requestInfo}>
                    <span className={styles.label}>Loại:</span>
                    <span 
                      className={styles.typeBadge}
                      style={{ 
                        color: typeInfo.color,
                        background: `${typeInfo.color}15`
                      }}
                    >
                      {typeInfo.text}
                    </span>
                  </div>
                  <div className={styles.requestInfo}>
                    <span className={styles.label}>Ngày gửi:</span>
                    <span>{request.createdAt?.toLocaleString('vi-VN')}</span>
                  </div>
                  {request.packageName && (
                    <div className={styles.requestInfo}>
                      <span className={styles.label}>Gói tập:</span>
                      <span className={styles.packageName}>{request.packageName}</span>
                    </div>
                  )}
                </div>

                <div className={styles.requestActions}>
                  <button 
                    className={styles.btnView}
                    onClick={() => viewRequestDetails(request)}
                  >
                    👁️ Xem chi tiết
                  </button>
                  
                  {request.status === 'pending' && (
                    <>
                      <button 
                        className={styles.btnApprove}
                        onClick={() => approveRequest(request)}
                      >
                        ✓ Duyệt
                      </button>
                      <button 
                        className={styles.btnReject}
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

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className={styles.loadMoreContainer}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className={styles.btnLoadMore}
          >
            {loadingMore ? (
              <>
                <span className={styles.loadingIcon}>⏳</span>
                {' '}Đang tải...
              </>
            ) : (
              <>📄 Tải thêm yêu cầu</>
            )}
          </button>
        </div>
      )}

      {/* Show total loaded */}
      {!loading && requests.length > 0 && (
        <div className={styles.totalCount}>
          Đã hiển thị {requests.length} / {counts[filter] || counts.all} yêu cầu
        </div>
      )}
    </div>
  );
}

