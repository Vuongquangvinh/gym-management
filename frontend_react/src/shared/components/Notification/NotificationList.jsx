import React from 'react';
import { useNotifications } from '../../../firebase/lib/features/notification/notification.provider';
import { useNavigate } from 'react-router-dom';
import './NotificationList.css';

export const NotificationList = ({ onClose }) => {
  const { notifications, unreadCount, loading, loadingMore, hasMore, markAsRead, markAllAsRead, deleteNotification, loadMore } = useNotifications();
  const navigate = useNavigate();

  const handleDelete = async (e, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      console.log('🔔 [NotificationList] Clicked notification:', notification);
      
      // Mark as read
      if (!notification.read) {
        console.log('📧 [NotificationList] Marking as read...');
        await markAsRead(notification.id);
      }

      // Close modal FIRST
      console.log('❌ [NotificationList] Closing modal...');
      onClose();

      // Navigate to related page with requestId
      if (notification.relatedId) {
        console.log('🗺️ [NotificationList] Navigating to:', notification.recipientRole);
        console.log('🗺️ [NotificationList] relatedId:', notification.relatedId);
        console.log('🗺️ [NotificationList] relatedType:', notification.relatedType);
        
        // Store in sessionStorage for reliable access
        sessionStorage.setItem('pendingRequestId', notification.relatedId);
        console.log('💾 [NotificationList] Stored in sessionStorage:', notification.relatedId);
        
        // Small delay to ensure modal is closed
        setTimeout(() => {
          try {
            if (notification.recipientRole === 'admin') {
              console.log('➡️ [NotificationList] Navigate to admin pending requests');
              const url = `/admin/pending-requests?requestId=${notification.relatedId}`;
              console.log('➡️ [NotificationList] URL:', url);
              navigate(url);
              console.log('✅ [NotificationList] Navigate called successfully');
            } else {
              // PT portal
              if (notification.relatedType === 'employee_update') {
                console.log('➡️ [NotificationList] Navigate to PT profile');
                const url = `/pt/profile?requestId=${notification.relatedId}`;
                console.log('➡️ [NotificationList] URL:', url);
                navigate(url);
                console.log('✅ [NotificationList] Navigate called successfully');
              } else {
                console.log('➡️ [NotificationList] Navigate to PT packages');
                const url = `/pt/packages?requestId=${notification.relatedId}`;
                console.log('➡️ [NotificationList] URL:', url);
                navigate(url);
                console.log('✅ [NotificationList] Navigate called successfully');
              }
            }
          } catch (navError) {
            console.error('❌ [NotificationList] Navigation error:', navError);
          }
        }, 100);
      } else {
        console.warn('⚠️ [NotificationList] No relatedId found');
      }
    } catch (error) {
      console.error('❌ [NotificationList] Error in handleNotificationClick:', error);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="notification-list">
        <div className="notification-header">
          <h3>Thông báo</h3>
        </div>
        <div className="notification-loading">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-list">
      <div className="notification-header">
        <h3>Thông báo</h3>
        {unreadCount > 0 && (
          <button 
            className="mark-all-read-btn"
            onClick={markAllAsRead}
          >
            Đánh dấu đã đọc
          </button>
        )}
      </div>

      <div className="notification-items">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <span className="no-notif-icon">🔔</span>
            <p>Chưa có thông báo nào</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item ${!notif.read ? 'unread' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('👆 [NotificationItem] Clicked!', notif.title);
                handleNotificationClick(notif);
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="notif-icon" style={{ background: getIconBackground(notif.type) }}>
                {getIcon(notif.type)}
              </div>
              
              <div className="notif-content">
                <div className="notif-title">{notif.title}</div>
                <div className="notif-message">{notif.message}</div>
                <div className="notif-time">{formatTime(notif.createdAt)}</div>
              </div>

              <div className="notif-actions">
                {!notif.read && <div className="unread-dot"></div>}
                <button 
                  className="delete-notif-btn"
                  onClick={(e) => handleDelete(e, notif.id)}
                  aria-label="Xóa thông báo"
                  title="Xóa thông báo"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="notification-footer" style={{ borderTop: '1px solid #e9ecef', borderBottom: 'none' }}>
          <button 
            className="view-all-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              loadMore();
            }}
            disabled={loadingMore}
            style={{
              background: loadingMore ? '#f0f0f0' : 'white',
              color: loadingMore ? '#999' : '#667eea',
              cursor: loadingMore ? 'not-allowed' : 'pointer'
            }}
          >
            {loadingMore ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                {' '}Đang tải...
              </>
            ) : (
              <>📄 Tải thêm thông báo</>
            )}
          </button>
        </div>
      )}

      {/* View All / Navigate Button */}
      {notifications.length > 0 && (
        <div className="notification-footer">
          <button 
            className="view-all-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔘 [View All Button] Clicked!');
              console.log('🔘 Notifications:', notifications.length);
              if (notifications[0]?.recipientRole === 'admin') {
                console.log('🔘 Navigate to admin pending requests');
                navigate('/admin/pending-requests');
              } else {
                console.log('🔘 Navigate to PT profile');
                navigate('/pt/profile');
              }
              console.log('🔘 Closing modal...');
              onClose();
            }}
          >
            Xem tất cả
          </button>
        </div>
      )}

      {/* Show count */}
      {!loading && notifications.length > 0 && (
        <div style={{
          textAlign: 'center',
          padding: '8px',
          fontSize: '12px',
          color: '#999',
          background: '#f8f9fa'
        }}>
          {notifications.length} thông báo{hasMore ? ' • Còn nhiều hơn' : ''}
        </div>
      )}
    </div>
  );
};

// Helper functions
const getIcon = (type) => {
  switch (type) {
    case 'request_submitted':
      return '📝';
    case 'request_approved':
      return '✅';
    case 'request_rejected':
      return '❌';
    case 'request_cancelled':
      return '🚫';
    default:
      return '🔔';
  }
};

const getIconBackground = (type) => {
  switch (type) {
    case 'request_submitted':
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    case 'request_approved':
      return 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
    case 'request_rejected':
      return 'linear-gradient(135deg, #F44336 0%, #e53935 100%)';
    case 'request_cancelled':
      return 'linear-gradient(135deg, #FF9800 0%, #fb8c00 100%)';
    default:
      return 'linear-gradient(135deg, #757575 0%, #616161 100%)';
  }
};

