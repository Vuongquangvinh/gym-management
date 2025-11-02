import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import ScheduleModel from './schedule.model.js';

/**
 * Subscribe to schedules for a specific date with realtime updates
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {function} onUpdate - Callback function for updates
 * @param {function} onError - Callback function for errors
 * @returns {function} Unsubscribe function
 */
export function subscribeSchedulesByDate(date, onUpdate, onError) {
  if (!db) {
    console.error('Firestore not initialized');
    if (onError) onError(new Error('Firestore not initialized'));
    return () => {};
  }

  const schedulesRef = collection(db, 'schedule');
  const q = query(
    schedulesRef, 
    where('date', '==', date), 
    orderBy('startTime')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const schedules = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        
        // Convert Timestamps to dates
        Object.keys(data).forEach(field => {
          if (data[field] instanceof Timestamp) {
            data[field] = data[field].toDate();
          }
        });
        
        schedules.push(new ScheduleModel({ _id: doc.id, ...data }));
      });
      
      if (typeof onUpdate === "function") onUpdate(schedules);
    },
    (err) => {
      console.error("subscribeSchedulesByDate error", err);
      if (typeof onError === "function") onError(err);
    }
  );
}

/**
 * Subscribe to schedules for a specific employee with realtime updates
 * @param {string} employeeId - Employee ID
 * @param {function} onUpdate - Callback function for updates
 * @param {function} onError - Callback function for errors
 * @param {number} limit - Maximum number of schedules to fetch
 * @returns {function} Unsubscribe function
 */
export function subscribeSchedulesByEmployee(employeeId, onUpdate, onError, limit = 30) {
  if (!db) {
    console.error('Firestore not initialized');
    if (onError) onError(new Error('Firestore not initialized'));
    return () => {};
  }

  const schedulesRef = collection(db, 'schedule');
  const q = query(
    schedulesRef, 
    where('employeeId', '==', employeeId),
    orderBy('date', 'desc'),
    limit(limit)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const schedules = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        
        // Convert Timestamps to dates
        Object.keys(data).forEach(field => {
          if (data[field] instanceof Timestamp) {
            data[field] = data[field].toDate();
          }
        });
        
        schedules.push(new ScheduleModel({ _id: doc.id, ...data }));
      });
      
      if (typeof onUpdate === "function") onUpdate(schedules);
    },
    (err) => {
      console.error("subscribeSchedulesByEmployee error", err);
      if (typeof onError === "function") onError(err);
    }
  );
}

/**
 * Subscribe to checkins for a specific date with realtime updates
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {function} onUpdate - Callback function for updates
 * @param {function} onError - Callback function for errors
 * @returns {function} Unsubscribe function
 */
export function subscribeCheckinsByDate(date, onUpdate, onError) {
  if (!db) {
    console.error('Firestore not initialized');
    if (onError) onError(new Error('Firestore not initialized'));
    return () => {};
  }

  const checkinsRef = collection(db, 'employee_checkins');
  const q = query(checkinsRef, where('date', '==', date));

  return onSnapshot(
    q,
    (snapshot) => {
      const checkinsByEmployee = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const employeeId = data.employeeId;
        
        if (!checkinsByEmployee[employeeId]) {
          checkinsByEmployee[employeeId] = [];
        }
        
        // Convert Timestamps to dates
        const processedData = { ...data };
        Object.keys(processedData).forEach(field => {
          if (processedData[field] instanceof Timestamp) {
            processedData[field] = processedData[field].toDate();
          }
        });
        
        checkinsByEmployee[employeeId].push({
          id: doc.id,
          ...processedData
        });
      });
      
      if (typeof onUpdate === "function") onUpdate(checkinsByEmployee);
    },
    (err) => {
      console.error("subscribeCheckinsByDate error", err);
      if (typeof onError === "function") onError(err);
    }
  );
}

/**
 * Create a new schedule
 * @param {Object} scheduleData - Schedule data
 * @returns {Promise<string>} Schedule ID
 */
export async function createSchedule(scheduleData) {
  try {
    const schedule = new ScheduleModel(scheduleData);
    const scheduleId = await schedule.save();
    return scheduleId;
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
}

/**
 * Update an existing schedule
 * @param {string} scheduleId - Schedule ID
 * @param {Object} updateData - Update data
 * @returns {Promise<boolean>} Success status
 */
export async function updateSchedule(scheduleId, updateData) {
  try {
    const schedule = await ScheduleModel.getById(scheduleId);
    
    // Update schedule properties
    Object.keys(updateData).forEach(key => {
      if (schedule.hasOwnProperty(key)) {
        schedule[key] = updateData[key];
      }
    });
    
    await schedule.save();
    return true;
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
}

/**
 * Delete a schedule
 * @param {string} scheduleId - Schedule ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteSchedule(scheduleId) {
  try {
    await ScheduleModel.delete(scheduleId);
    return true;
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
}

/**
 * Get schedules for a date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of schedules
 */
export async function getSchedulesByDateRange(startDate, endDate) {
  try {
    const schedulesCollectionRef = collection(db, 'schedule');
    const q = query(
      schedulesCollectionRef, 
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date'),
      orderBy('startTime')
    );
    const querySnapshot = await getDocs(q);

    const schedules = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      
      // Convert Timestamps to dates
      Object.keys(data).forEach(field => {
        if (data[field] instanceof Timestamp) {
          data[field] = data[field].toDate();
        }
      });
      
      schedules.push(new ScheduleModel({ _id: docSnap.id, ...data }));
    });

    return schedules;
  } catch (error) {
    console.error('Error getting schedules by date range:', error);
    throw error;
  }
}

/**
 * Get schedule statistics for a date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Statistics object
 */
export async function getScheduleStats(date) {
  try {
    return await ScheduleModel.getStats(date);
  } catch (error) {
    console.error('Error getting schedule stats:', error);
    throw error;
  }
}
