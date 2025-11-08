import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDocs, 
    getDoc,
    query, 
    where, 
    orderBy, 
    limit as fsLimit, 
    startAfter as fsStartAfter,
    Timestamp 
  } from 'firebase/firestore';
  import { db } from '../../config/firebase.js';
  import Joi from 'joi';
  
  export class ScheduleModel {
    constructor({
      _id = null,
      employeeId = '',
      employeeName = '',
      date = '',
      startTime = '09:00',
      endTime = '17:00',
      status = 'active',
      createdAt = new Date(),
      updatedAt = new Date(),
      notes = ''
    } = {}) {
      this._id = _id;
      this.employeeId = employeeId;
      this.employeeName = employeeName;
      this.date = date;
      this.startTime = startTime;
      this.endTime = endTime;
      this.status = status;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
      this.notes = notes;
    }
  
    // Validation schema
    static validationSchema = Joi.object({
      employeeId: Joi.string().required().messages({
        'string.empty': 'Employee ID không được để trống'
      }),
      employeeName: Joi.string().min(2).max(100).required().messages({
        'string.empty': 'Tên nhân viên không được để trống',
        'string.min': 'Tên nhân viên phải có ít nhất 2 ký tự',
        'string.max': 'Tên nhân viên không được quá 100 ký tự'
      }),
      date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        'string.pattern.base': 'Ngày phải có định dạng YYYY-MM-DD'
      }),
      startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required().messages({
        'string.pattern.base': 'Giờ bắt đầu phải có định dạng HH:MM'
      }),
      endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required().messages({
        'string.pattern.base': 'Giờ kết thúc phải có định dạng HH:MM'
      }),
      status: Joi.string().valid('active', 'inactive', 'cancelled', 'scheduled').default('active'),
      notes: Joi.string().max(500).allow('').optional().messages({
        'string.max': 'Ghi chú không được quá 500 ký tự'
      })
    });
  
    // Validate schedule data
    validate() {
      const { error } = ScheduleModel.validationSchema.validate({
        employeeId: this.employeeId,
        employeeName: this.employeeName,
        date: this.date,
        startTime: this.startTime,
        endTime: this.endTime,
        status: this.status,
        notes: this.notes
      });
      
      if (error) {
        throw new Error(error.details[0].message);
      }
      return true;
    }
  
    // Convert to Firestore format
    toFirestore() {
      const data = {
        employeeId: this.employeeId,
        employeeName: this.employeeName,
        date: this.date,
        startTime: this.startTime,
        endTime: this.endTime,
        status: this.status,
        createdAt: this.createdAt ? Timestamp.fromDate(new Date(this.createdAt)) : Timestamp.now(),
        updatedAt: Timestamp.now(),
        notes: this.notes || ''
      };
  
      // Remove null values
      Object.keys(data).forEach(key => {
        if (data[key] === null || data[key] === undefined) {
          delete data[key];
        }
      });
  
      return data;
    }
  
    // Create new schedule
    async save() {
      try {
        this.validate();
        const schedulesCollectionRef = collection(db, 'schedule');
        
        // Check if schedule already exists for this employee on this date
        const existingQuery = query(
          schedulesCollectionRef, 
          where('employeeId', '==', this.employeeId),
          where('date', '==', this.date)
        );
        const existingSnapshot = await getDocs(existingQuery);
        
        if (!existingSnapshot.empty && !this._id) {
          // Check if employee has already checked in for this date
          const checkinsCollectionRef = collection(db, 'employee_checkins');
          const checkinQuery = query(
            checkinsCollectionRef,
            where('employeeId', '==', this.employeeId),
            where('date', '==', this.date),
            where('checkinType', '==', 'checkin')
          );
          const checkinSnapshot = await getDocs(checkinQuery);
          
          if (!checkinSnapshot.empty) {
            throw new Error('Nhân viên đã có lịch làm việc và đã checkin trong ngày này. Không thể tạo lịch mới.');
          } else {
            // Employee has schedule but hasn't checked in yet, allow updating
            const existingDoc = existingSnapshot.docs[0];
            this._id = existingDoc.id;
            // Update existing schedule instead of creating new one
            const scheduleDocRef = doc(db, 'schedule', this._id);
            const updateData = this.toFirestore();
            await updateDoc(scheduleDocRef, updateData);
            return this._id;
          }
        }
  
        if (this._id) {
          // Update existing schedule
          const scheduleDocRef = doc(db, 'schedule', this._id);
          const updateData = this.toFirestore();
          await updateDoc(scheduleDocRef, updateData);
          return this._id;
        } else {
          // Create new schedule
          const docRef = await addDoc(schedulesCollectionRef, this.toFirestore());
          this._id = docRef.id;
          return docRef.id;
        }
      } catch (error) {
        console.error('Error saving schedule:', error);
        throw error;
      }
    }
  
    // Get schedule by ID
    static async getById(id) {
      try {
        const scheduleDocRef = doc(db, 'schedule', id);
        const docSnap = await getDoc(scheduleDocRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Convert Timestamps back to dates
          Object.keys(data).forEach(field => {
            if (data[field] instanceof Timestamp) {
              data[field] = data[field].toDate();
            }
          });
          
          return new ScheduleModel({ _id: docSnap.id, ...data });
        } else {
          throw new Error('Không tìm thấy lịch làm việc');
        }
      } catch (error) {
        console.error('Error getting schedule:', error);
        throw error;
      }
    }
  
    // Get schedules by date
    static async getByDate(date) {
      try {
        const schedulesCollectionRef = collection(db, 'schedule');
        const q = query(
          schedulesCollectionRef, 
          where('date', '==', date), 
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
        console.error('Error getting schedules by date:', error);
        throw error;
      }
    }
  
    // Get schedules by employee
    static async getByEmployee(employeeId, limit = 30, startAfterDoc = null) {
      try {
        const schedulesCollectionRef = collection(db, 'schedule');
        const queryConstraints = [
          where('employeeId', '==', employeeId),
          orderBy('date', 'desc'),
          fsLimit(limit)
        ];
  
        if (startAfterDoc) {
          queryConstraints.push(fsStartAfter(startAfterDoc));
        }
  
        const q = query(schedulesCollectionRef, ...queryConstraints);
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
  
        const lastDoc = querySnapshot.docs.length > 0
          ? querySnapshot.docs[querySnapshot.docs.length - 1]
          : null;
  
        const hasMore = querySnapshot.docs.length === limit;
  
        return { schedules, lastDoc, hasMore };
      } catch (error) {
        console.error('Error getting schedules by employee:', error);
        throw error;
      }
    }
  
    // Delete schedule
    static async delete(id) {
      try {
        // Get schedule data first
        const scheduleDocRef = doc(db, 'schedule', id);
        const scheduleSnapshot = await getDoc(scheduleDocRef);
        
        if (!scheduleSnapshot.exists()) {
          throw new Error('Không tìm thấy lịch làm việc');
        }
        
        const scheduleData = scheduleSnapshot.data();
        const employeeId = scheduleData.employeeId;
        const scheduleDate = scheduleData.date;
        
        // Check if employee has checked in for this date
        const checkinsCollectionRef = collection(db, 'employee_checkins');
        const checkinQuery = query(
          checkinsCollectionRef,
          where('employeeId', '==', employeeId),
          where('date', '==', scheduleDate),
          where('checkinType', '==', 'checkin')
        );
        const checkinSnapshot = await getDocs(checkinQuery);
        
        if (!checkinSnapshot.empty) {
          throw new Error('Không thể xóa lịch làm việc! Nhân viên đã check-in hôm nay.');
        }
        
        // Safe to delete - no check-in found
        await deleteDoc(scheduleDocRef);
        return true;
      } catch (error) {
        console.error('Error deleting schedule:', error);
        throw error;
      }
    }
  
    // Get schedule statistics
    static async getStats(date) {
      try {
        const schedulesCollectionRef = collection(db, 'schedule');
        const q = query(
          schedulesCollectionRef, 
          where('date', '==', date),
          where('status', '==', 'active')
        );
        const querySnapshot = await getDocs(q);
  
        const stats = {
          totalSchedules: querySnapshot.size,
          schedulesByTime: {},
          totalHours: 0
        };
  
        querySnapshot.forEach(docSnap => {
          const data = docSnap.data();
          const timeSlot = `${data.startTime}-${data.endTime}`;
          
          if (!stats.schedulesByTime[timeSlot]) {
            stats.schedulesByTime[timeSlot] = 0;
          }
          stats.schedulesByTime[timeSlot]++;
  
          // Calculate total hours
          const start = new Date(`2000-01-01T${data.startTime}:00`);
          const end = new Date(`2000-01-01T${data.endTime}:00`);
          const hours = (end - start) / (1000 * 60 * 60);
          stats.totalHours += hours;
        });
  
        return stats;
      } catch (error) {
        console.error('Error getting schedule stats:', error);
        return {
          totalSchedules: 0,
          schedulesByTime: {},
          totalHours: 0
        };
      }
    }
  }
  
  export default ScheduleModel;
  