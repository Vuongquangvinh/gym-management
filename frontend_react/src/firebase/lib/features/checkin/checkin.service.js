import { collection, query, orderBy, limit as limitFn, onSnapshot, startAfter, 
  getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, where, 
  or, and, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import CheckinModel from './checkin.model.js';

/**
 * Subscribe to recent checkins (realtime)
 * @param {Object} filters - Các điều kiện lọc
 * @param {number} limit - Số lượng kết quả mỗi trang
 * @param {Function} onUpdate - Callback khi có dữ liệu mới
 * @param {Function} onError - Callback khi có lỗi
 * @returns {Function} Hàm hủy subscription
 */
export function subscribeRecentCheckins(filters = {}, limit = 50, onUpdate, onError) {
  const col = collection(db, 'checkins');
  let queryConstraints = [];

  // Xử lý tìm kiếm theo tên hoặc gói trước
  if (filters.searchQuery?.trim()) {
    const searchTerm = filters.searchQuery.trim().toLowerCase();
    // Sử dụng OR để tìm theo tên hoặc gói
    queryConstraints.push(
      or(
        where('memberName', '>=', searchTerm),
        where('packageId', '>=', searchTerm)
      )
    );
  }
  
  // Xử lý filter thời gian
  if (filters.date || filters.range) {
    let startDate = null;
    let endDate = null;

    if (filters.date) {
      startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);
    } else if (filters.range) {
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      switch(filters.range) {
        case 'today':
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          break;
      }
    }

    if (startDate && endDate) {
      queryConstraints.push(where('checkedAt', '>=', Timestamp.fromDate(startDate)));
      queryConstraints.push(where('checkedAt', '<=', Timestamp.fromDate(endDate)));
    }
  }

  // Xử lý lọc theo nguồn check-in
  if (filters.source) {
    queryConstraints.push(where('source', '==', filters.source));
  } else if (filters.onlyQR) {
    queryConstraints.push(where('source', '==', 'QR'));
  }

  // Sắp xếp theo thời gian gần nhất
  queryConstraints.push(orderBy('checkedAt', 'desc'));

  // Thêm giới hạn số lượng
  queryConstraints.push(limitFn(limit));

  // Tạo query với tất cả các điều kiện
  const q = query(col, ...queryConstraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map((d) =>
        CheckinModel.normalizeCheckin({ id: d.id, ...d.data() })
      );
      const last = snapshot.docs[snapshot.docs.length - 1] || null;
      if (typeof onUpdate === 'function') onUpdate({ docs, last });
    },
    (err) => {
      console.error('subscribeRecentCheckins error', err);
      if (typeof onError === 'function') onError(err);
    }
  );
}

/**
 * Fetch more checkins after a given DocumentSnapshot
 * @param {import('firebase/firestore').DocumentSnapshot} lastDoc
 * @param {number} limit
 * @returns {Promise<{docs: Array, last: import('firebase/firestore').DocumentSnapshot|null}>}
 */
export async function fetchMoreCheckins(lastDoc, limit = 50) {
  if (!lastDoc) return { docs: [], last: null };
  const col = collection(db, 'checkins');
  const q = query(col, orderBy('checkedAt', 'desc'), startAfter(lastDoc), limitFn(limit));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => CheckinModel.normalizeCheckin({ id: d.id, ...d.data() }));
  const last = snap.docs[snap.docs.length - 1] || null;
  return { docs, last };
}

/**
 * Create a checkin document
 * @param {Object} payload - Dữ liệu check-in
 * @returns {Promise<Object>} Created checkin data
 */
export async function createCheckin(payload) {
  try {
    const validated = CheckinModel.validate(payload);
    const prepared = CheckinModel.prepare(validated);
    const col = collection(db, 'checkins');
    const res = await addDoc(col, prepared);
    return { id: res.id, ...prepared };
  } catch (error) {
    console.error('Error creating checkin:', error);
    throw error;
  }
}

/**
 * Get a checkin by ID
 * @param {string} id - ID của check-in
 * @returns {Promise<Object|null>} Checkin data
 */
export async function getCheckinById(id) {
  const docRef = doc(db, 'checkins', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return CheckinModel.normalizeCheckin({ id: docSnap.id, ...docSnap.data() });
}

/**
 * Update a checkin document
 * @param {string} id - ID của check-in
 * @param {Object} data - Dữ liệu cần cập nhật
 * @returns {Promise<void>}
 */
export async function updateCheckin(id, data) {
  const docRef = doc(db, 'checkins', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

/**
 * Delete a checkin document
 * @param {string} id - ID của check-in
 * @returns {Promise<void>}
 */
export async function deleteCheckin(id) {
  const docRef = doc(db, 'checkins', id);
  await deleteDoc(docRef);
}