import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { NotificationService } from '../notification/notification.service.js';

/**
 * Service quản lý Pending Requests
 */
export class PendingRequestService {
  static COLLECTION_NAME = 'pendingRequests';

  /**
   * Tạo pending request mới
   */
  static async createPendingRequest(requestData) {
    try {
      const pendingRequestsRef = collection(db, this.COLLECTION_NAME);
      
      const docRef = await addDoc(pendingRequestsRef, {
        ...requestData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create notification for admin
      try {
        await NotificationService.notifyAdminOfNewRequest({
          id: docRef.id,
          ...requestData
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail the request if notification fails
      }

      return {
        success: true,
        id: docRef.id,
        message: 'Yêu cầu đã được gửi thành công',
      };
    } catch (error) {
      console.error('Error creating pending request:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Lấy danh sách pending requests theo điều kiện
   */
  static async getPendingRequests(filters = {}) {
    try {
      const pendingRequestsRef = collection(db, this.COLLECTION_NAME);
      let q = query(pendingRequestsRef);

      // Apply filters
      if (filters.ptId) {
        q = query(q, where('ptId', '==', filters.ptId));
      }

      if (filters.type) {
        if (Array.isArray(filters.type)) {
          q = query(q, where('type', 'in', filters.type));
        } else {
          q = query(q, where('type', '==', filters.type));
        }
      }

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      // Order by createdAt descending
      q = query(q, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        data: requests,
      };
    } catch (error) {
      console.error('Error getting pending requests:', error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Lấy pending requests cho package operations
   */
  static async getPackagePendingRequests(ptId) {
    const packageTypes = [
      'package_create',
      'package_update',
      'package_delete',
      'package_enable',
      'package_disable',
    ];

    return this.getPendingRequests({
      ptId,
      type: packageTypes,
      status: 'pending',
    });
  }

  /**
   * Lấy pending requests cho profile updates
   */
  static async getProfilePendingRequest(ptId) {
    return this.getPendingRequests({
      ptId,
      type: 'profile_update',
      status: 'pending',
    });
  }

  /**
   * Update status của pending request
   */
  static async updateRequestStatus(requestId, status, additionalData = {}) {
    try {
      const requestRef = doc(db, this.COLLECTION_NAME, requestId);
      
      await updateDoc(requestRef, {
        status,
        ...additionalData,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        message: `Yêu cầu đã được ${status === 'cancelled' ? 'hủy' : 'cập nhật'}`,
      };
    } catch (error) {
      console.error('Error updating request status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Hủy pending request
   */
  static async cancelRequest(requestId) {
    return this.updateRequestStatus(requestId, 'cancelled');
  }

  /**
   * Approve pending request
   */
  static async approveRequest(requestId) {
    const result = await this.updateRequestStatus(requestId, 'approved');
    
    // Create notification for PT
    if (result.success) {
      try {
        const requestDocRef = doc(db, this.COLLECTION_NAME, requestId);
        const requestDoc = await getDoc(requestDocRef);
        
        if (requestDoc.exists()) {
          const requestData = { id: requestId, ...requestDoc.data() };
          await NotificationService.notifyPTOfRequestStatus(requestData, 'approved');
        }
      } catch (notifError) {
        console.error('Error creating approval notification:', notifError);
      }
    }
    
    return result;
  }

  /**
   * Reject pending request
   */
  static async rejectRequest(requestId, reason = '') {
    const result = await this.updateRequestStatus(requestId, 'rejected', { rejectionReason: reason });
    
    // Create notification for PT
    if (result.success) {
      try {
        const requestDocRef = doc(db, this.COLLECTION_NAME, requestId);
        const requestDoc = await getDoc(requestDocRef);
        
        if (requestDoc.exists()) {
          const requestData = { id: requestId, ...requestDoc.data() };
          await NotificationService.notifyPTOfRequestStatus(requestData, 'rejected', reason);
        }
      } catch (notifError) {
        console.error('Error creating rejection notification:', notifError);
      }
    }
    
    return result;
  }

  /**
   * Subscribe to pending requests (real-time) with pagination
   * @param {Object} filters - Filter conditions
   * @param {Object} pagination - { pageSize: number, lastDoc: DocumentSnapshot }
   * @param {Function} onUpdate - Callback with (requests, lastDoc, hasMore)
   * @param {Function} onError - Error callback
   * @returns unsubscribe function
   */
  static subscribeToPendingRequests(filters = {}, pagination = {}, onUpdate, onError) {
    try {
      const pendingRequestsRef = collection(db, this.COLLECTION_NAME);
      let q = query(pendingRequestsRef);

      // Apply filters
      if (filters.ptId) {
        q = query(q, where('ptId', '==', filters.ptId));
      }

      if (filters.requestedBy) {
        q = query(q, where('requestedBy', '==', filters.requestedBy));
      }

      if (filters.type) {
        if (Array.isArray(filters.type)) {
          q = query(q, where('type', 'in', filters.type));
        } else {
          q = query(q, where('type', '==', filters.type));
        }
      }

      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }

      // Order by createdAt descending
      q = query(q, orderBy('createdAt', 'desc'));

      // Apply pagination
      const pageSize = pagination.pageSize || 20;
      q = query(q, limit(pageSize + 1)); // Load 1 extra to check hasMore

      if (pagination.lastDoc) {
        q = query(q, startAfter(pagination.lastDoc));
      }

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const docs = querySnapshot.docs;
          const hasMore = docs.length > pageSize;
          const requests = docs.slice(0, pageSize).map(doc => ({
            id: doc.id,
            ...doc.data(),
            _doc: doc // Store doc for next page
          }));

          const lastDoc = requests.length > 0 ? docs[Math.min(pageSize - 1, docs.length - 1)] : null;

          if (onUpdate) {
            onUpdate(requests, lastDoc, hasMore);
          }
        },
        (error) => {
          console.error('Error in pending requests subscription:', error);
          if (onError) {
            onError(error);
          }
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up subscription:', error);
      if (onError) {
        onError(error);
      }
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Subscribe to package pending requests (real-time)
   */
  static subscribeToPackagePendingRequests(ptId, onUpdate, onError) {
    const packageTypes = [
      'package_create',
      'package_update',
      'package_delete',
      'package_enable',
      'package_disable',
    ];

    return this.subscribeToPendingRequests(
      {
        ptId,
        type: packageTypes,
        status: 'pending',
      },
      { pageSize: 100 }, // PT usually has fewer requests
      (requests) => onUpdate(requests), // Adapter to old signature
      onError
    );
  }

  /**
   * Subscribe to profile pending request (real-time)
   */
  static subscribeToProfilePendingRequest(userId, onUpdate, onError) {
    // Use requestedBy field for employee updates (profile updates)
    return this.subscribeToPendingRequests(
      {
        requestedBy: userId,
        type: 'employee_update',
        status: 'pending',
      },
      { pageSize: 100 }, // PT usually has fewer requests
      (requests) => onUpdate(requests), // Adapter to old signature
      onError
    );
  }
}

