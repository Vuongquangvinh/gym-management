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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import Joi from 'joi';

/**
 * Model quản lý các gói giá PT
 */
export class PTPackageModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.ptId = data.ptId || '';
    this.packageType = data.packageType || 'single';
    this.name = data.name || '';
    this.sessions = data.sessions || 1;
    this.duration = data.duration || 1;
    this.price = data.price || 0;
    this.originalPrice = data.originalPrice || 0;
    this.discount = data.discount || 0;
    this.description = data.description || '';
    this.features = data.features || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.isPopular = data.isPopular || false;
    
    // Thêm quản lý khung giờ tập linh hoạt
    this.availableTimeSlots = data.availableTimeSlots || []; // Khung giờ tự định nghĩa
    this.sessionDuration = data.sessionDuration || 60; // Thời lượng mỗi buổi (phút)
    this.maxClientsPerSlot = data.maxClientsPerSlot || 1; // Số khách tối đa mỗi slot
    this.requiresAdvanceBooking = data.requiresAdvanceBooking || true; // Yêu cầu đặt trước
    this.advanceBookingHours = data.advanceBookingHours || 24; // Số giờ phải đặt trước tối thiểu
    this.customTimeSlots = data.customTimeSlots || []; // Khung giờ custom (không theo lịch cố định)
    
    // Loại tính phí: 'session' (theo buổi) hoặc 'monthly' (theo tháng)
    this.billingType = data.billingType || 'session';
    this.months = data.months || 1; // Số tháng cho gói theo tháng (1, 3, 6, 9, 12)
    
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Schema validation cho PT Package
   */
  static getValidationSchema() {
    return Joi.object({
      ptId: Joi.string().required().messages({
        'string.empty': 'PT ID không được để trống',
        'any.required': 'PT ID là bắt buộc'
      }),
      packageType: Joi.string().valid('single', 'weekly', 'monthly', 'package').required().messages({
        'any.only': 'Loại gói phải là: single, weekly, monthly, hoặc package',
        'any.required': 'Loại gói là bắt buộc'
      }),
      name: Joi.string().min(3).max(100).required().messages({
        'string.min': 'Tên gói phải có ít nhất 3 ký tự',
        'string.max': 'Tên gói không được quá 100 ký tự',
        'any.required': 'Tên gói là bắt buộc'
      }),
      sessions: Joi.number().integer().min(1).max(100).required().messages({
        'number.min': 'Số buổi tập phải lớn hơn 0',
        'number.max': 'Số buổi tập không được quá 100',
        'any.required': 'Số buổi tập là bắt buộc'
      }),
      duration: Joi.number().integer().min(1).max(365).required().messages({
        'number.min': 'Thời hạn phải lớn hơn 0 ngày',
        'number.max': 'Thời hạn không được quá 365 ngày',
        'any.required': 'Thời hạn là bắt buộc'
      }),
      price: Joi.number().min(0).required().messages({
        'number.min': 'Giá gói phải lớn hơn hoặc bằng 0',
        'any.required': 'Giá gói là bắt buộc'
      }),
      originalPrice: Joi.number().min(0).optional(),
      discount: Joi.number().min(0).max(100).optional(),
      description: Joi.string().max(500).allow('').optional(),
      features: Joi.array().items(Joi.string().max(100)).max(10).optional(),
      isActive: Joi.boolean().optional(),
      isPopular: Joi.boolean().optional(),
      
      // Validation cho time slots linh hoạt
      availableTimeSlots: Joi.array().items(
        Joi.object({
          id: Joi.string().optional(), // ID để quản lý
          dayOfWeek: Joi.number().min(0).max(6).required(), // 0=CN, 1=T2, 2=T3...
          startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(), // HH:MM
          endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(), // HH:MM
          isActive: Joi.boolean().default(true).optional(), // Có thể tạm tắt slot
          isChoosen: Joi.boolean().default(false).optional(), // Trạng thái được chọn
          note: Joi.string().max(100).allow('').optional() // Ghi chú cho slot
        })
      ).optional(),
      customTimeSlots: Joi.array().items(
        Joi.object({
          id: Joi.string().optional(),
          title: Joi.string().max(50).required(), // Tên tự đặt: "Buổi sáng", "Lịch đặc biệt"
          description: Joi.string().max(200).allow('').optional(),
          startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          availableDays: Joi.array().items(Joi.number().min(0).max(6)).optional(), // Những ngày có thể đặt
          isActive: Joi.boolean().default(true).optional(),
          priority: Joi.number().min(1).max(10).default(5).optional() // Độ ưu tiên hiển thị
        })
      ).optional(),
      sessionDuration: Joi.number().min(30).max(180).optional(),
      maxClientsPerSlot: Joi.number().min(1).max(10).optional(),
      requiresAdvanceBooking: Joi.boolean().optional(),
      advanceBookingHours: Joi.number().min(1).max(168).optional(),
      billingType: Joi.string().valid('session', 'monthly').default('session').optional(),
      months: Joi.number().valid(1, 3, 6, 9, 12).default(1).optional()
    }).options({ 
      allowUnknown: false, // Không cho phép field không được định nghĩa trong schema
      stripUnknown: true   // Tự động loại bỏ field không được định nghĩa
    });
  }

  /**
   * Validate dữ liệu PT Package
   */
  validate() {
    const schema = PTPackageModel.getValidationSchema();
    const dataToValidate = this.toObject();
    
    // Debug log để kiểm tra data structure
    console.log('🔍 PTPackageModel: Data to validate:', JSON.stringify(dataToValidate, null, 2));
    
    const { error, value } = schema.validate(dataToValidate, { abortEarly: false });
    
    if (error) {
      console.log('❌ PTPackageModel: Validation errors:', error.details);
      const errors = {};
      error.details.forEach(detail => {
        errors[detail.path[0]] = detail.message;
      });
      return { isValid: false, errors };
    }

    return { isValid: true, data: value };
  }

  /**
   * Convert instance to plain object
   */
  toObject() {
    return {
      ptId: this.ptId,
      packageType: this.packageType,
      name: this.name,
      sessions: this.sessions,
      duration: this.duration,
      price: this.price,
      originalPrice: this.originalPrice,
      discount: this.discount,
      description: this.description,
      features: this.features,
      isActive: this.isActive,
      isPopular: this.isPopular,
      availableTimeSlots: this.availableTimeSlots,
      customTimeSlots: this.customTimeSlots,
      sessionDuration: this.sessionDuration,
      maxClientsPerSlot: this.maxClientsPerSlot,
      requiresAdvanceBooking: this.requiresAdvanceBooking,
      advanceBookingHours: this.advanceBookingHours,
      billingType: this.billingType,
      months: this.months
    };
  }

  /**
   * Convert to Firestore format
   */
  toFirestore() {
    return {
      ptId: this.ptId,
      packageType: this.packageType,
      name: this.name,
      sessions: this.sessions,
      duration: this.duration,
      price: this.price,
      originalPrice: this.originalPrice || this.price,
      discount: this.discount,
      description: this.description,
      features: this.features,
      isActive: this.isActive,
      isPopular: this.isPopular,
      availableTimeSlots: this.availableTimeSlots,
      customTimeSlots: this.customTimeSlots,
      sessionDuration: this.sessionDuration,
      maxClientsPerSlot: this.maxClientsPerSlot,
      requiresAdvanceBooking: this.requiresAdvanceBooking,
      advanceBookingHours: this.advanceBookingHours,
      billingType: this.billingType,
      months: this.months,
      createdAt: this.createdAt instanceof Date ? Timestamp.fromDate(this.createdAt) : this.createdAt,
      updatedAt: Timestamp.fromDate(new Date())
    };
  }

  /**
   * Tính toán giảm giá tự động
   */
  calculateDiscount() {
    if (this.originalPrice > 0 && this.price < this.originalPrice) {
      this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return this.discount;
  }

  /**
   * Lấy danh sách khung giờ theo ngày trong tuần
   */
  getTimeSlotsByDay(dayOfWeek) {
    return this.availableTimeSlots.filter(slot => slot.dayOfWeek === dayOfWeek && slot.isActive !== false);
  }

  /**
   * Lấy custom time slots có thể đặt trong ngày
   */
  getCustomTimeSlotsByDay(dayOfWeek) {
    return this.customTimeSlots.filter(slot => 
      slot.isActive !== false && 
      (slot.availableDays?.includes(dayOfWeek) || !slot.availableDays?.length)
    );
  }

  /**
   * Lấy tất cả khung giờ có thể đặt (cả regular và custom)
   */
  getAllAvailableTimeSlots(dayOfWeek = null) {
    const regularSlots = dayOfWeek !== null 
      ? this.getTimeSlotsByDay(dayOfWeek)
      : this.availableTimeSlots.filter(slot => slot.isActive !== false);
    
    const customSlots = dayOfWeek !== null
      ? this.getCustomTimeSlotsByDay(dayOfWeek)
      : this.customTimeSlots.filter(slot => slot.isActive !== false);
    
    return {
      regular: regularSlots,
      custom: customSlots.sort((a, b) => (b.priority || 5) - (a.priority || 5)) // Sort by priority
    };
  }

  /**
   * Kiểm tra xem có khung giờ nào trong ngày không
   */
  hasAvailableTimeOnDay(dayOfWeek) {
    const regularHasSlots = this.availableTimeSlots.some(
      slot => slot.dayOfWeek === dayOfWeek && slot.isActive !== false
    );
    
    const customHasSlots = this.customTimeSlots.some(
      slot => slot.isActive !== false && 
      (slot.availableDays?.includes(dayOfWeek) || !slot.availableDays?.length)
    );
    
    return regularHasSlots || customHasSlots;
  }

  /**
   * Lấy tất cả khung giờ được format đẹp
   */
  getFormattedTimeSlots() {
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    
    const regularSlots = this.availableTimeSlots
      .filter(slot => slot.isActive !== false)
      .map(slot => ({
        ...slot,
        type: 'regular',
        dayName: dayNames[slot.dayOfWeek],
        timeRange: `${slot.startTime} - ${slot.endTime}`,
        displayName: `${dayNames[slot.dayOfWeek]}: ${slot.startTime} - ${slot.endTime}`
      }));

    const customSlots = this.customTimeSlots
      .filter(slot => slot.isActive !== false)
      .map(slot => ({
        ...slot,
        type: 'custom',
        timeRange: `${slot.startTime} - ${slot.endTime}`,
        displayName: `${slot.title}: ${slot.startTime} - ${slot.endTime}`,
        availableDaysNames: slot.availableDays?.map(day => dayNames[day]) || ['Tất cả ngày']
      }));

    return { regular: regularSlots, custom: customSlots };
  }

  /**
   * Thêm utility method để tạo ID cho time slots
   */
  static generateTimeSlotId() {
    return 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Kiểm tra xem có thể đặt lịch không (dựa trên advance booking)
   */
  canBookSession(requestedDateTime) {
    if (!this.requiresAdvanceBooking) return true;
    
    const now = new Date();
    const advanceTime = this.advanceBookingHours * 60 * 60 * 1000; // Convert to milliseconds
    const minBookingTime = new Date(now.getTime() + advanceTime);
    
    return requestedDateTime >= minBookingTime;
  }

  /**
   * Lấy packages của một PT
   */
  static async getPackagesByPTId(ptId) {
    try {
      const packagesRef = collection(db, 'ptPackages');
      const q = query(
        packagesRef,
        where('ptId', '==', ptId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const packages = [];
      
      querySnapshot.forEach((doc) => {
        const packageData = { id: doc.id, ...doc.data() };
        
        if (packageData.createdAt?.toDate) {
          packageData.createdAt = packageData.createdAt.toDate();
        }
        if (packageData.updatedAt?.toDate) {
          packageData.updatedAt = packageData.updatedAt.toDate();
        }
        packages.push(new PTPackageModel(packageData));
      });

      return packages;
    } catch (error) {
      console.error('Lỗi khi lấy PT packages:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả packages active
   */
  static async getAllActivePTPackages() {
    try {
      const packagesRef = collection(db, 'ptPackages');
      const q = query(
        packagesRef,
        where('isActive', '==', true),
        orderBy('ptId'),
        orderBy('price')
      );
      
      const querySnapshot = await getDocs(q);
      const packages = [];
      
      querySnapshot.forEach((doc) => {
        const packageData = { id: doc.id, ...doc.data() };
        
        if (packageData.createdAt?.toDate) {
          packageData.createdAt = packageData.createdAt.toDate();
        }
        if (packageData.updatedAt?.toDate) {
          packageData.updatedAt = packageData.updatedAt.toDate();
        }
        packages.push(new PTPackageModel(packageData));
      });

      return packages;
    } catch (error) {
      console.error('Lỗi khi lấy tất cả PT packages:', error);
      throw error;
    }
  }

  /**
   * Tạo package mới
   */
  static async create(packageData) {
    try {
      const ptPackage = new PTPackageModel(packageData);
      
      const validation = ptPackage.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
      }

      ptPackage.calculateDiscount();

      // Kiểm tra PT có tồn tại
      const employeeRef = doc(db, 'employees', ptPackage.ptId);
      const employeeDoc = await getDoc(employeeRef);
      
      if (!employeeDoc.exists()) {
        throw new Error('PT không tồn tại trong hệ thống');
      }

      const employee = employeeDoc.data();
      if (employee.position !== 'PT' || employee.role !== 'pt') {
        throw new Error('Nhân viên này không phải là PT');
      }

      const packagesRef = collection(db, 'ptPackages');
      const firestoreData = ptPackage.toFirestore();
      
      const docRef = await addDoc(packagesRef, firestoreData);
      ptPackage.id = docRef.id;
      
      return ptPackage;
    } catch (error) {
      console.error('Lỗi khi tạo PT package:', error);
      throw error;
    }
  }

  /**
   * Cập nhật package
   */
  static async update(packageId, updateData) {
    try {
      const packageRef = doc(db, 'ptPackages', packageId);
      const packageDoc = await getDoc(packageRef);
      
      if (!packageDoc.exists()) {
        throw new Error('Package không tồn tại');
      }

      // Merge dữ liệu cũ với dữ liệu mới
      const existingData = packageDoc.data();
      
      if (existingData.createdAt?.toDate) {
        existingData.createdAt = existingData.createdAt.toDate();
      }
      if (existingData.updatedAt?.toDate) {
        existingData.updatedAt = existingData.updatedAt.toDate();
      }
      
      const mergedData = { ...existingData, ...updateData };
      const ptPackage = new PTPackageModel(mergedData);

      const validation = ptPackage.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
      }

      ptPackage.calculateDiscount();

      await updateDoc(packageRef, {
        ...ptPackage.toFirestore(),
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      ptPackage.id = packageId;
      return ptPackage;
    } catch (error) {
      console.error('Lỗi khi cập nhật PT package:', error);
      throw error;
    }
  }

  /**
   * Xóa vĩnh viễn khỏi database
   */
  static async delete(packageId) {
    try {
      const packageRef = doc(db, 'ptPackages', packageId);
      const packageDoc = await getDoc(packageRef);
      
      if (!packageDoc.exists()) {
        throw new Error('Package không tồn tại');
      }

      await deleteDoc(packageRef);
      return true;
    } catch (error) {
      console.error('Lỗi khi xóa PT package:', error);
      throw error;
    }
  }

  /**
   * Vô hiệu hóa package
   */
  static async disable(packageId) {
    try {
      const packageRef = doc(db, 'ptPackages', packageId);
      const packageDoc = await getDoc(packageRef);
      
      if (!packageDoc.exists()) {
        throw new Error('Package không tồn tại');
      }

      await updateDoc(packageRef, {
        isActive: false,
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      return true;
    } catch (error) {
      console.error('Lỗi khi vô hiệu hóa PT package:', error);
      throw error;
    }
  }

  /**
   * Kích hoạt lại package
   */
  static async enable(packageId) {
    try {
      const packageRef = doc(db, 'ptPackages', packageId);
      const packageDoc = await getDoc(packageRef);
      
      if (!packageDoc.exists()) {
        throw new Error('Package không tồn tại');
      }

      await updateDoc(packageRef, {
        isActive: true,
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      return true;
    } catch (error) {
      console.error('Lỗi khi kích hoạt PT package:', error);
      throw error;
    }
  }

  /**
   * Lấy package theo ID
   */
  static async getById(packageId) {
    try {
      const packageRef = doc(db, 'ptPackages', packageId);
      const packageDoc = await getDoc(packageRef);
      
      if (!packageDoc.exists()) {
        return null;
      }

      const packageData = { id: packageDoc.id, ...packageDoc.data() };
      
      if (packageData.createdAt?.toDate) {
        packageData.createdAt = packageData.createdAt.toDate();
      }
      if (packageData.updatedAt?.toDate) {
        packageData.updatedAt = packageData.updatedAt.toDate();
      }
      
      return new PTPackageModel(packageData);
    } catch (error) {
      console.error('Lỗi khi lấy PT package:', error);
      throw error;
    }
  }

  /**
   * Tìm kiếm packages với filters
   */
  static async search(filters = {}) {
    try {
      let q = collection(db, 'ptPackages');
      const conditions = [];
      
      if (filters.ptId) {
        conditions.push(where('ptId', '==', filters.ptId));
      }
      
      if (filters.packageType) {
        conditions.push(where('packageType', '==', filters.packageType));
      }
      
      if (filters.isActive !== undefined) {
        conditions.push(where('isActive', '==', filters.isActive));
      }
      
      if (filters.isPopular !== undefined) {
        conditions.push(where('isPopular', '==', filters.isPopular));
      }
      
      if (filters.minPrice !== undefined) {
        conditions.push(where('price', '>=', filters.minPrice));
      }
      
      if (filters.maxPrice !== undefined) {
        conditions.push(where('price', '<=', filters.maxPrice));
      }
      
      const orderByField = filters.orderBy || 'createdAt';
      const orderDirection = filters.orderDirection || 'desc';
      
      if (conditions.length > 0) {
        q = query(q, ...conditions, orderBy(orderByField, orderDirection));
      } else {
        q = query(q, orderBy(orderByField, orderDirection));
      }
      
      if (filters.limit) {
        q = query(q, fsLimit(filters.limit));
      }
      
      const querySnapshot = await getDocs(q);
      const packages = [];
      
      querySnapshot.forEach((doc) => {
        const packageData = { id: doc.id, ...doc.data() };
        
        if (packageData.createdAt?.toDate) {
          packageData.createdAt = packageData.createdAt.toDate();
        }
        if (packageData.updatedAt?.toDate) {
          packageData.updatedAt = packageData.updatedAt.toDate();
        }
        packages.push(new PTPackageModel(packageData));
      });

      return packages;
    } catch (error) {
      console.error('Lỗi khi tìm kiếm PT packages:', error);
      throw error;
    }
  }

  /**
   * Set package as popular (chỉ 1 package popular per PT)
   */
  static async setPopular(packageId, ptId) {
    try {
      // Unset tất cả packages popular của PT này
      const existingPopularQuery = query(
        collection(db, 'ptPackages'),
        where('ptId', '==', ptId),
        where('isPopular', '==', true)
      );
      
      const existingPopularSnapshot = await getDocs(existingPopularQuery);
      
      const updatePromises = [];
      existingPopularSnapshot.forEach((docSnapshot) => {
        const docRef = doc(db, 'ptPackages', docSnapshot.id);
        updatePromises.push(updateDoc(docRef, { 
          isPopular: false, 
          updatedAt: Timestamp.fromDate(new Date()) 
        }));
      });
      
      // Set package mới làm popular
      const packageRef = doc(db, 'ptPackages', packageId);
      updatePromises.push(updateDoc(packageRef, { 
        isPopular: true, 
        updatedAt: Timestamp.fromDate(new Date()) 
      }));
      
      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Lỗi khi set popular package:', error);
      throw error;
    }
  }
}

export default PTPackageModel;