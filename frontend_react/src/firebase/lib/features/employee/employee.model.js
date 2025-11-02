import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  getCountFromServer,
  query, 
  where, 
  orderBy, 
  limit as fsLimit, 
  startAfter as fsStartAfter,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import Joi from 'joi';

export class EmployeeModel {
  constructor({
    _id = null,
    fullName = '',
    gender = 'male',
    dateOfBirth = null,
    phone = '',
    email = '',
    address = '',
    position = '',
    startDate = null,
    status = 'active',
    shift = '',
    uid = null,
    role = 'employee',
    createdAt = new Date(),
    updatedAt = new Date(),
    salary = 0,
    commissionRate = 0,
    totalClients = 0,
    avatarUrl = '',
    idCard = '',
    notes = '',
    ptInfo = null,
    faceRegistered = false
  } = {}) {
    this._id = _id;
    this.fullName = fullName;
    this.gender = gender;
    this.dateOfBirth = dateOfBirth;
    this.phone = phone;
    this.email = email;
    this.address = address;
    this.position = position;
    this.startDate = startDate;
    this.status = status;
    this.shift = shift;
    this.uid = uid;
    this.role = role;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.salary = salary;
    this.commissionRate = commissionRate;
    this.totalClients = totalClients;
    this.avatarUrl = avatarUrl;
    this.idCard = idCard;
    this.notes = notes;
    this.faceRegistered = faceRegistered;
    
    // PT-specific information (only for PT position)
    this.ptInfo = ptInfo || (position === 'PT' ? {
      specialties: [], // ["Giảm cân", "Tăng cơ", "Yoga", "Cardio", "Phục hồi chấn thương"]
      experience: 0, // Số năm kinh nghiệm
      rating: 0, // Đánh giá trung bình (0-5)
      totalRatings: 0, // Tổng số lượt đánh giá
      bio: '', // Mô tả bản thân PT
      certificates: [], // Các chứng chỉ ["CPT", "Yoga Instructor", "Nutrition Specialist"]
      availableHours: [], // Khung giờ có thể làm việc ["06:00-08:00", "18:00-20:00"]
      maxClientsPerDay: 8, // Số lượng khách hàng tối đa trong ngày
      isAcceptingNewClients: true, // Có nhận khách hàng mới không
      languages: ['vi'], // Ngôn ngữ ["vi", "en"]
      achievements: [], // Thành tích ["Trainer of the Year 2023"]
      socialMedia: { // Mạng xã hội
        facebook: '',
        instagram: '',
        youtube: '',
        tiktok: ''
      }
    } : null);
  }

  // Validation schema
  static validationSchema = Joi.object({
    fullName: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'Họ tên không được để trống',
      'string.min': 'Họ tên phải có ít nhất 2 ký tự',
      'string.max': 'Họ tên không được quá 100 ký tự'
    }),
    gender: Joi.string().valid('male', 'female', 'other').required().messages({
      'any.only': 'Giới tính phải là male, female hoặc other'
    }),
    dateOfBirth: Joi.date().max('now').required().messages({
      'date.max': 'Ngày sinh không được lớn hơn ngày hiện tại'
    }),
    phone: Joi.string().pattern(/^[0-9]{10,11}$/).required().messages({
      'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email không hợp lệ'
    }),
    address: Joi.string().max(200).required().messages({
      'string.max': 'Địa chỉ không được quá 200 ký tự'
    }),
    position: Joi.string().valid('PT', 'Lễ tân', 'Quản lý', 'Kế toán', 'Bảo vệ', 'Vệ sinh', 'Khác').required().messages({
      'any.only': 'Vị trí làm việc không hợp lệ'
    }),
    startDate: Joi.date().max('now').required().messages({
      'date.max': 'Ngày bắt đầu không được lớn hơn ngày hiện tại'
    }),
    status: Joi.string().valid('active', 'inactive', 'resigned', 'suspended').default('active'),
    shift: Joi.string().valid('fulltime', 'parttime').required(),
    role: Joi.string().valid('employee', 'pt', 'manager', 'admin').default('employee'),
    salary: Joi.number().min(0).required().messages({
      'number.min': 'Lương không được âm'
    }),
    commissionRate: Joi.number().min(0).max(100).default(0).messages({
      'number.min': 'Tỷ lệ hoa hồng không được âm',
      'number.max': 'Tỷ lệ hoa hồng không được quá 100%'
    }),
    totalClients: Joi.number().min(0).default(0),
    avatarUrl: Joi.string().allow('', null).optional(),
    idCard: Joi.string().pattern(/^(?:\d{9}|\d{12})$/).required().messages({
      'string.pattern.base': 'Căn cước công dân phải có 9 hoặc 12 chữ số'
    }),
    notes: Joi.string().max(500).allow('').optional().messages({
      'string.max': 'Ghi chú không được quá 500 ký tự'
    }),
    uid: Joi.string().allow(null).optional(),
    faceRegistered: Joi.boolean().default(false).optional(),
    
    // PT Info validation (chỉ validate khi position = 'PT')
    ptInfo: Joi.when('position', {
      is: 'PT',
      then: Joi.object({
        specialties: Joi.array().items(
          Joi.string().valid('Giảm cân', 'Tăng cơ', 'Yoga', 'Cardio', 'Phục hồi chấn thương', 'Powerlifting', 'CrossFit', 'Pilates', 'Boxing', 'Khác')
        ).max(5).optional(),
        experience: Joi.number().min(0).max(50).optional().messages({
          'number.min': 'Kinh nghiệm không được âm',
          'number.max': 'Kinh nghiệm không được quá 50 năm'
        }),
        rating: Joi.number().min(0).max(5).optional(),
        totalRatings: Joi.number().min(0).optional(),
        bio: Joi.string().max(1000).allow('').optional().messages({
          'string.max': 'Mô tả không được quá 1000 ký tự'
        }),
        certificates: Joi.array().items(
          Joi.alternatives().try(
            Joi.string().max(100), // Legacy format
            Joi.object({
              id: Joi.string().required(),
              text: Joi.string().max(100).required(),
              images: Joi.array().items(
                Joi.object({
                  id: Joi.string().required(),
                  url: Joi.string().required(),
                  path: Joi.string().optional(),
                  fileName: Joi.string().optional(),
                  name: Joi.string().optional(),
                  size: Joi.number().optional(),
                  uploadedAt: Joi.date().optional()
                })
              ).optional().default([])
            }).required() // New format
          )
        ).max(10).optional(),
        availableHours: Joi.array().items(
          Joi.string().pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
        ).max(10).optional().messages({
          'string.pattern.base': 'Khung giờ phải có định dạng HH:MM-HH:MM'
        }),
        maxClientsPerDay: Joi.number().min(1).max(20).default(8).optional(),
        isAcceptingNewClients: Joi.boolean().default(true).optional(),
        languages: Joi.array().items(
          Joi.string().valid('vi', 'en', 'ja', 'ko', 'zh')
        ).default(['vi']).optional(),
        achievements: Joi.array().items(
          Joi.alternatives().try(
            Joi.string().max(200), // Legacy format  
            Joi.object({
              id: Joi.string().required(),
              text: Joi.string().max(200).required(),
              images: Joi.array().items(
                Joi.object({
                  id: Joi.string().required(),
                  url: Joi.string().required(),
                  path: Joi.string().optional(),
                  fileName: Joi.string().optional(),
                  name: Joi.string().optional(),
                  size: Joi.number().optional(),
                  uploadedAt: Joi.date().optional()
                })
              ).optional().default([])
            }).required() // New format
          )
        ).max(20).optional(),
        socialMedia: Joi.object({
          facebook: Joi.string().allow('').optional(),
          instagram: Joi.string().allow('').optional(),
          youtube: Joi.string().allow('').optional(),
          tiktok: Joi.string().allow('').optional()
        }).optional()
      }).optional(),
      otherwise: Joi.optional()
    })
  });

  // Normalize shift values to new format
  static normalizeShift(shift) {
    const shiftMap = {
      'full-time': 'fulltime',
      'part-time': 'parttime',
      'morning': 'parttime',
      'afternoon': 'parttime', 
      'evening': 'parttime'
    };
    return shiftMap[shift] || shift;
  }

  // Validate employee data
  validate() {
    // Normalize shift before validation
    const normalizedShift = EmployeeModel.normalizeShift(this.shift);
    
    const { error } = EmployeeModel.validationSchema.validate({
      fullName: this.fullName,
      gender: this.gender,
      dateOfBirth: this.dateOfBirth,
      phone: this.phone,
      email: this.email,
      address: this.address,
      position: this.position,
      startDate: this.startDate,
      status: this.status,
      shift: normalizedShift,
      role: this.role,
      salary: this.salary,
      commissionRate: this.commissionRate,
      totalClients: this.totalClients,
      avatarUrl: this.avatarUrl,
      idCard: this.idCard,
      notes: this.notes,
      uid: this.uid,
      ptInfo: this.ptInfo
    });
    
    if (error) {
      throw new Error(error.details[0].message);
    }
    
    // Update shift to normalized value
    this.shift = normalizedShift;
    return true;
  }

  // Convert to Firestore format
  toFirestore() {
    const data = {
      fullName: this.fullName,
      gender: this.gender,
      dateOfBirth: this.dateOfBirth ? Timestamp.fromDate(new Date(this.dateOfBirth)) : null,
      phone: this.phone,
      email: this.email,
      address: this.address,
      position: this.position,
      startDate: this.startDate ? Timestamp.fromDate(new Date(this.startDate)) : null,
      status: this.status,
      shift: this.shift,
      uid: this.uid,
      role: this.role,
      createdAt: this.createdAt ? Timestamp.fromDate(new Date(this.createdAt)) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      salary: this.salary,
      commissionRate: this.commissionRate,
      totalClients: this.totalClients,
      avatarUrl: this.avatarUrl || '',
      idCard: this.idCard || '',
      notes: this.notes || '',
      faceRegistered: this.faceRegistered || false
    };

    // Chỉ thêm ptInfo nếu là PT
    if (this.position === 'PT' && this.ptInfo) {
      data.ptInfo = this.ptInfo;
    }

    // Remove null values
    Object.keys(data).forEach(key => {
      if (data[key] === null || data[key] === undefined) {
        delete data[key];
      }
    });

    return data;
  }

  // Create new employee
  async save() {
    try {
      this.validate();
      const employeesCollectionRef = collection(db, 'employees');
      
      // Check if email already exists
      const emailQuery = query(employeesCollectionRef, where('email', '==', this.email));
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty && (!this._id || emailSnapshot.docs[0].id !== this._id)) {
        throw new Error('Email đã tồn tại trong hệ thống');
      }

      // Check if phone already exists  
      const phoneQuery = query(employeesCollectionRef, where('phone', '==', this.phone));
      const phoneSnapshot = await getDocs(phoneQuery);
      
      if (!phoneSnapshot.empty && (!this._id || phoneSnapshot.docs[0].id !== this._id)) {
        throw new Error('Số điện thoại đã tồn tại trong hệ thống');
      }

      if (this._id) {
        // Update existing employee
        const employeeDocRef = doc(db, 'employees', this._id);
        const updateData = this.toFirestore();
        await updateDoc(employeeDocRef, updateData);
        return this._id;
      } else {
        // Create new employee
        const docRef = await addDoc(employeesCollectionRef, this.toFirestore());
        this._id = docRef.id;
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      throw error;
    }
  }

  // Get employee by ID
  static async getById(id) {
    try {
      const employeeDocRef = doc(db, 'employees', id);
      const docSnap = await getDoc(employeeDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Convert Timestamps back to dates
        Object.keys(data).forEach(field => {
          if (data[field] instanceof Timestamp) {
            data[field] = data[field].toDate();
          }
        });
        
        return new EmployeeModel({ _id: docSnap.id, ...data });
      } else {
        throw new Error('Không tìm thấy nhân viên');
      }
    } catch (error) {
      console.error('Error getting employee:', error);
      throw error;
    }
  }

  // Get all employees with filters and pagination
  static async getAll(filters = {}, limit = 10, startAfterDoc = null) {
    try {
      const employeesCollectionRef = collection(db, 'employees');
      const queryConstraints = [];

      // Add filters
      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status));
      }

      if (filters.position) {
        queryConstraints.push(where('position', '==', filters.position));
      }

      if (filters.role) {
        queryConstraints.push(where('role', '==', filters.role));
      }

      if (filters.searchQuery && !filters.status && !filters.position && !filters.role) {
        // For search, we'll get all and filter client-side (similar to user search)
        const effectiveLimit = Math.max(limit, 50);
        queryConstraints.push(orderBy('fullName'));
        queryConstraints.push(fsLimit(effectiveLimit));
      } else {
        queryConstraints.push(orderBy('createdAt', 'desc'));
        queryConstraints.push(fsLimit(limit));
      }

      if (startAfterDoc) {
        queryConstraints.push(fsStartAfter(startAfterDoc));
      }

      const finalQuery = query(employeesCollectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(finalQuery);

      let employees = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        
        // Convert Timestamps to dates
        Object.keys(data).forEach(field => {
          if (data[field] instanceof Timestamp) {
            data[field] = data[field].toDate();
          }
        });
        
        return new EmployeeModel({ _id: docSnap.id, ...data });
      });

      // Client-side search filter
      if (filters.searchQuery && !filters.status && !filters.position && !filters.role) {
        const searchQuery = filters.searchQuery.trim().toLowerCase();
        employees = employees.filter(emp => 
          (emp.fullName && emp.fullName.toLowerCase().includes(searchQuery)) ||
          (emp.email && emp.email.toLowerCase().includes(searchQuery)) ||
          (emp.phone && emp.phone.includes(searchQuery))
        );
        employees = employees.slice(0, limit);
      }

      const lastDoc = querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;

      const hasMore = filters.searchQuery 
        ? employees.length === limit
        : querySnapshot.docs.length === limit;

      return { employees, lastDoc, hasMore };
    } catch (error) {
      console.error('Error getting employees:', error);
      throw error;
    }
  }

  // Delete employee
  static async delete(id) {
    try {
      const employeeDocRef = doc(db, 'employees', id);
      await deleteDoc(employeeDocRef);
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Get dashboard stats
  static async getDashboardStats() {
    try {
      const employeesCollectionRef = collection(db, 'employees');

      // Total employees
      const totalQuery = query(employeesCollectionRef);

      // Active employees
      const activeQuery = query(employeesCollectionRef, where('status', '==', 'active'));

      // PT employees
      const ptQuery = query(employeesCollectionRef, where('position', '==', 'PT'));

      // Recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentQuery = query(
        employeesCollectionRef, 
        where('startDate', '>=', Timestamp.fromDate(thirtyDaysAgo))
      );

      // Execute all queries in parallel using getCountFromServer for better performance and permissions
      const [totalSnapshot, activeSnapshot, ptSnapshot, recentSnapshot] = await Promise.all([
        getCountFromServer(totalQuery),
        getCountFromServer(activeQuery),
        getCountFromServer(ptQuery),
        getCountFromServer(recentQuery)
      ]);

      return {
        total: totalSnapshot.data().count,
        active: activeSnapshot.data().count,
        pt: ptSnapshot.data().count,
        recentHires: recentSnapshot.data().count
      };
    } catch (error) {
      console.error('Error getting employee stats:', error);
      return {
        total: 0,
        active: 0,
        pt: 0,
        recentHires: 0
      };
    }
  }

  // Update client count for PT
  static async updateClientCount(employeeId, clientCount) {
    try {
      const employeeDocRef = doc(db, 'employees', employeeId);
      await updateDoc(employeeDocRef, {
        totalClients: clientCount,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating client count:', error);
      throw error;
    }
  }

  static async existsByIdCard(idCard, excludeId = null) {
    try {
      console.log('🔍 EmployeeModel.existsByIdCard - Checking:', { idCard, excludeId });
      
      const q = query(
        collection(db, 'employees'),
        where('idCard', '==', idCard)
      );
      
      const querySnapshot = await getDocs(q);
      
      // If no documents found, ID card doesn't exist
      if (querySnapshot.empty) {
        return false;
      }
      
      // If excludeId is provided, check if found document is different from excluded one
      if (excludeId) {
        const foundDoc = querySnapshot.docs[0];
        const foundId = foundDoc.id;
        const isDifferent = foundId !== excludeId;
        console.log('🔍 Found document:', { foundId, excludeId, isDifferent });
        return isDifferent;
      }
      
      // ID card exists
      console.log('❌ ID card exists and no excludeId provided');
      return true;
    } catch (error) {
      console.error('Error checking ID card existence:', error);
      throw error;
    }
  }
}

export default EmployeeModel;