import { collection, query, orderBy, limit as limitFn, onSnapshot, startAfter, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import CheckinModel from './checkin.model.js';

/**
 * Subscribe to recent checkins (realtime)
 * @param {number} limit
 * @param {(payload:{docs: Array, last: import('firebase/firestore').DocumentSnapshot|null}) => void} onUpdate
 * @param {(error:Error) => void} onError
 * @returns {() => void} unsubscribe
 */
export function subscribeRecentCheckins(limit = 50, onUpdate, onError) {
  const col = collection(db, 'checkins');
  const q = query(col, orderBy('checkedAt', 'desc'), limitFn(limit));

  const unsub = onSnapshot(
    q,
    (snapshot) => {
      console.log('subscribeRecentCheckins snapshot:', snapshot.docs.map((d) => d.data())); // Log dữ liệu trả về
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

  return unsub;
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
  console.log('fetchMoreCheckins snapshot:', snap.docs.map((d) => d.data())); // Log dữ liệu trả về
  const docs = snap.docs.map((d) => CheckinModel.normalizeCheckin({ id: d.id, ...d.data() }));
  const last = snap.docs[snap.docs.length - 1] || null;
  return { docs, last };
}

/**
 * Create a checkin document (uses model to prepare payload)
 * @param {{memberId:string, memberName:string, packageId?:string, source?:string, locationId?:string, meta?:object}} payload
 */
export async function createCheckin(payload) {
  try {

    // Validate and prepare payload using CheckinModel
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
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getCheckinById(id) {
  const docRef = doc(db, 'checkins', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return CheckinModel.normalizeCheckin({ id: docSnap.id, ...docSnap.data() });
}

/**
 * Update a checkin by ID
 * @param {string} id
 * @param {object} updateData
 * @returns {Promise<void>}
 */
export async function updateCheckin(id, updateData) {
  const validated = CheckinModel.validate(updateData);
  const docRef = doc(db, 'checkins', id);
  await updateDoc(docRef, {
    ...validated,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a checkin by ID
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteCheckin(id) {
  const docRef = doc(db, 'checkins', id);
  await deleteDoc(docRef);
}

/**
 * Fetch all members from Firestore
 * @returns {Promise<Array<{id: string, name: string, phone: string}>>}
 */
export async function fetchAllMembers() {
  try {
    const col = collection(db, 'users');
    const querySnapshot = await getDocs(col);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
}

export default {
  subscribeRecentCheckins,
  fetchMoreCheckins,
  createCheckin,
  getCheckinById,
  updateCheckin,
  deleteCheckin,
};
