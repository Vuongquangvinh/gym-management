import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationService } from './notification.service';
import { useAuth } from '../auth/authContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, role }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);

  // Subscribe to real-time notifications with pagination
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    console.log('🔥 [NotificationProvider] Setting up listener for:', currentUser.uid, role);

    const unsubscribe = NotificationService.subscribeToNotifications(
      role === 'admin' ? 'admin' : currentUser.uid,
      role,
      { pageSize: 20, lastDoc: null }, // First page
      (notifs, lastDocument, hasMoreData) => {
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
        setLastDoc(lastDocument);
        setHasMore(hasMoreData);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading notifications:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, role]);

  // Load more notifications
  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    console.log('📄 [NotificationProvider] Loading more notifications...');
    
    try {
      const unsubscribe = NotificationService.subscribeToNotifications(
        role === 'admin' ? 'admin' : currentUser.uid,
        role,
        { pageSize: 20, lastDoc: lastDoc },
        (notifs, lastDocument, hasMoreData) => {
          console.log('🔥 [NotificationProvider] Loaded more:', notifs.length, 'hasMore:', hasMoreData);
          
          // Append to existing
          setNotifications(prev => [...prev, ...notifs]);
          setLastDoc(lastDocument);
          setHasMore(hasMoreData);
          setLoadingMore(false);
          
          // Cleanup after load
          unsubscribe();
        },
        (error) => {
          console.error('Error loading more notifications:', error);
          setLoadingMore(false);
        }
      );
    } catch (error) {
      console.error('Error in loadMore:', error);
      setLoadingMore(false);
    }
  };

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      if (!currentUser) return;
      await NotificationService.markAllAsRead(
        role === 'admin' ? 'admin' : currentUser.uid,
        role
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await NotificationService.deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    loadingMore,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

