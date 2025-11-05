import { db } from '../../../../firebase/lib/config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { NotificationModel } from './notification.model';

export class NotificationService {
  static collectionName = 'notifications';

  /**
   * Create a new notification
   */
  static async createNotification(notificationData) {
    try {
      const notifRef = collection(db, this.collectionName);
      const docRef = await addDoc(notifRef, {
        ...notificationData,
        read: false,
        createdAt: serverTimestamp()
      });
      
      console.log('✅ [NotificationService] Created notification:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ [NotificationService] Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Subscribe to notifications for a specific user (real-time) with pagination
   * @param {string} userId - User ID or 'admin'
   * @param {string} role - 'admin' or 'pt'
   * @param {Object} pagination - { pageSize: number, lastDoc: DocumentSnapshot }
   * @param {Function} onUpdate - Callback with (notifications, lastDoc, hasMore)
   * @param {Function} onError - Error callback
   * @returns unsubscribe function
   */
  static subscribeToNotifications(userId, role, pagination = {}, onUpdate, onError) {
    try {
      const notifRef = collection(db, this.collectionName);
      let q = query(
        notifRef,
        where('recipientId', '==', userId),
        where('recipientRole', '==', role),
        orderBy('createdAt', 'desc')
      );

      // Apply pagination
      const pageSize = pagination.pageSize || 20;
      q = query(q, limit(pageSize + 1));

      if (pagination.lastDoc) {
        q = query(q, startAfter(pagination.lastDoc));
      }

      console.log('🔥 [NotificationService] Subscribing to notifications for:', userId, role, 'pageSize:', pageSize);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs;
          const hasMore = docs.length > pageSize;
          const notifications = docs.slice(0, pageSize).map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              readAt: data.readAt?.toDate?.() || null,
              _doc: doc
            };
          });
          
          const lastDoc = notifications.length > 0 ? docs[Math.min(pageSize - 1, docs.length - 1)] : null;
          
          console.log('📬 [NotificationService] Loaded notifications:', notifications.length, 'hasMore:', hasMore);
          onUpdate(notifications, lastDoc, hasMore);
        },
        (error) => {
          console.error('❌ [NotificationService] Error subscribing:', error);
          if (onError) onError(error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ [NotificationService] Error setting up subscription:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId) {
    try {
      const notifRef = doc(db, this.collectionName, notificationId);
      await updateDoc(notifRef, {
        read: true,
        readAt: serverTimestamp()
      });
      
      console.log('✅ [NotificationService] Marked as read:', notificationId);
    } catch (error) {
      console.error('❌ [NotificationService] Error marking as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId, role) {
    try {
      const notifRef = collection(db, this.collectionName);
      const q = query(
        notifRef,
        where('recipientId', '==', userId),
        where('recipientRole', '==', role),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach(document => {
        batch.update(document.ref, {
          read: true,
          readAt: serverTimestamp()
        });
      });

      await batch.commit();
      console.log('✅ [NotificationService] Marked all as read for:', userId);
    } catch (error) {
      console.error('❌ [NotificationService] Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification (hard delete)
   */
  static async deleteNotification(notificationId) {
    try {
      const notifRef = doc(db, this.collectionName, notificationId);
      await deleteDoc(notifRef);
      
      console.log('✅ [NotificationService] Deleted notification:', notificationId);
    } catch (error) {
      console.error('❌ [NotificationService] Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Helper: Create notification when PT submits a request
   */
  static async notifyAdminOfNewRequest(requestData) {
    const message = requestData.type === 'employee_update' 
      ? `${requestData.employeeName || 'PT'} đã gửi yêu cầu cập nhật thông tin cá nhân`
      : `${requestData.employeeName || 'PT'} đã gửi yêu cầu thay đổi gói tập`;

    return await this.createNotification({
      recipientId: 'admin', // All admins
      recipientRole: 'admin',
      type: 'request_submitted',
      title: 'Yêu cầu mới',
      message,
      relatedId: requestData.id,
      relatedType: requestData.type,
      senderName: requestData.employeeName,
      senderAvatar: requestData.employeeAvatar
    });
  }

  /**
   * Helper: Create notification when admin approves/rejects
   */
  static async notifyPTOfRequestStatus(requestData, status, rejectionReason = null) {
    const isApproved = status === 'approved';
    const message = isApproved
      ? 'Yêu cầu của bạn đã được phê duyệt'
      : `Yêu cầu của bạn đã bị từ chối${rejectionReason ? ': ' + rejectionReason : ''}`;

    return await this.createNotification({
      recipientId: requestData.requestedBy,
      recipientRole: 'pt',
      type: isApproved ? 'request_approved' : 'request_rejected',
      title: isApproved ? 'Đã phê duyệt' : 'Đã từ chối',
      message,
      relatedId: requestData.id,
      relatedType: requestData.type,
      senderName: 'Admin',
      senderAvatar: null
    });
  }
}

