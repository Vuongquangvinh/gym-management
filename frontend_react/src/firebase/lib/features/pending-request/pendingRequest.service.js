import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../config/firebase.js';

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
    return this.updateRequestStatus(requestId, 'approved');
  }

  /**
   * Reject pending request
   */
  static async rejectRequest(requestId, reason = '') {
    return this.updateRequestStatus(requestId, 'rejected', { rejectionReason: reason });
  }

  /**
   * Subscribe to pending requests (real-time)
   * @returns unsubscribe function
   */
  static subscribeToPendingRequests(filters = {}, onUpdate, onError) {
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

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const requests = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          if (onUpdate) {
            onUpdate(requests);
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
      onUpdate,
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
        type: 'employee_update',  // ✅ Changed from 'profile_update' to 'employee_update'
        status: 'pending',
      },
      onUpdate,
      onError
    );
  }
}

