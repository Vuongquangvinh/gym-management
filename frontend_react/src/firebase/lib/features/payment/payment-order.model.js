import Joi from "joi";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit as fsLimit,
  startAfter as fsStartAfter,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";

// Payment Order Status
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
};

// Schema validation với Joi
const paymentOrderSchema = Joi.object({
  orderCode: Joi.number().required(),
  userId: Joi.string().required(),
  userName: Joi.string().required(),
  userEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .allow("")
    .optional(),
  userPhone: Joi.string().allow("").optional(),
  packageId: Joi.string().required(),
  packageName: Joi.string().required(),
  packageDuration: Joi.number().required(),
  amount: Joi.number().min(1000).required(),
  status: Joi.string()
    .valid(...Object.values(PAYMENT_STATUS))
    .default(PAYMENT_STATUS.PENDING),
  paymentMethod: Joi.string().allow("").optional(),
  transactionId: Joi.string().allow("").optional(),
  paymentTime: Joi.string().allow("").optional(),
  confirmedManually: Joi.boolean().optional(),
  verifiedWithPayOS: Joi.boolean().optional(),
  paymentLinkId: Joi.string().allow("").optional(),
  checkoutUrl: Joi.string().allow("").optional(),
  qrCode: Joi.string().allow("").optional(),
  description: Joi.string().allow("").optional(),
  returnUrl: Joi.string().allow("").optional(),
  cancelUrl: Joi.string().allow("").optional(),
  metadata: Joi.object().optional(),
  createdAt: Joi.any().optional(),
  updatedAt: Joi.any().optional(),
  paidAt: Joi.any().optional(),
  cancelledAt: Joi.any().optional(),
});

/**
 * 💳 Payment Order Model for Firestore
 * Quản lý các đơn hàng thanh toán gói tập gym
 */
export class PaymentOrderModel {
  constructor({
    orderCode = 0,
    userId = "",
    userName = "",
    userEmail = "",
    userPhone = "",
    packageId = "",
    packageName = "",
    packageDuration = 0,
    amount = 0,
    status = PAYMENT_STATUS.PENDING,
    paymentMethod = "",
    transactionId = "",
    paymentTime = "",
    confirmedManually = false,
    verifiedWithPayOS = false,
    paymentLinkId = "",
    checkoutUrl = "",
    qrCode = "",
    description = "",
    returnUrl = "",
    cancelUrl = "",
    metadata = {},
    createdAt = null,
    updatedAt = null,
    paidAt = null,
    cancelledAt = null,
  } = {}) {
    this.orderCode = orderCode;
    this.userId = userId;
    this.userName = userName;
    this.userEmail = userEmail;
    this.userPhone = userPhone;
    this.packageId = packageId;
    this.packageName = packageName;
    this.packageDuration = packageDuration;
    this.amount = amount;
    this.status = status;
    this.paymentMethod = paymentMethod;
    this.transactionId = transactionId;
    this.paymentTime = paymentTime;
    this.confirmedManually = confirmedManually;
    this.verifiedWithPayOS = verifiedWithPayOS;
    this.paymentLinkId = paymentLinkId;
    this.checkoutUrl = checkoutUrl;
    this.qrCode = qrCode;
    this.description = description;
    this.returnUrl = returnUrl;
    this.cancelUrl = cancelUrl;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.paidAt = paidAt;
    this.cancelledAt = cancelledAt;
  }

  /**
   * 📚 Collection reference
   */
  static collectionRef() {
    return collection(db, "payment_orders");
  }

  /**
   * 📄 Document reference
   */
  static docRef(orderCode) {
    return doc(db, "payment_orders", orderCode.toString());
  }

  /**
   * ✅ Validate dữ liệu
   */
  validate() {
    const { error } = paymentOrderSchema.validate(this, { abortEarly: false });
    if (error) {
      throw new Error(
        `Validation error: ${error.details.map((d) => d.message).join(", ")}`
      );
    }
    return true;
  }

  /**
   * 🔁 Chuyển instance thành dữ liệu tương thích Firestore
   */
  toFirestore() {
    const data = { ...this };

    // Convert dates to Firestore Timestamp
    if (data.createdAt instanceof Date) {
      data.createdAt = Timestamp.fromDate(data.createdAt);
    }
    if (data.updatedAt instanceof Date) {
      data.updatedAt = Timestamp.fromDate(data.updatedAt);
    }
    if (data.paidAt instanceof Date) {
      data.paidAt = Timestamp.fromDate(data.paidAt);
    }
    if (data.cancelledAt instanceof Date) {
      data.cancelledAt = Timestamp.fromDate(data.cancelledAt);
    }

    // Remove undefined fields
    Object.keys(data).forEach((key) => {
      if (data[key] === undefined || data[key] === null) {
        delete data[key];
      }
    });

    return data;
  }

  /**
   * 🔁 Chuyển Firestore data thành instance
   */
  static fromFirestore(docSnapshot) {
    if (!docSnapshot.exists()) {
      return null;
    }

    const data = docSnapshot.data();

    // Convert Timestamps to Date
    if (data.createdAt instanceof Timestamp) {
      data.createdAt = data.createdAt.toDate();
    }
    if (data.updatedAt instanceof Timestamp) {
      data.updatedAt = data.updatedAt.toDate();
    }
    if (data.paidAt instanceof Timestamp) {
      data.paidAt = data.paidAt.toDate();
    }
    if (data.cancelledAt instanceof Timestamp) {
      data.cancelledAt = data.cancelledAt.toDate();
    }

    return new PaymentOrderModel(data);
  }

  /**
   * 💾 Save payment order to Firestore
   */
  async save() {
    try {
      this.validate();

      const orderRef = PaymentOrderModel.docRef(this.orderCode);
      const firestoreData = this.toFirestore();

      // Add timestamps if not exist
      if (!firestoreData.createdAt) {
        firestoreData.createdAt = serverTimestamp();
      }
      firestoreData.updatedAt = serverTimestamp();

      await setDoc(orderRef, firestoreData, { merge: true });

      console.log("✅ Payment order saved:", this.orderCode);
      return this;
    } catch (error) {
      console.error("❌ Save payment order error:", error);
      throw error;
    }
  }

  /**
   * 🔍 Get payment order by order code
   */
  static async getByOrderCode(orderCode) {
    try {
      const orderRef = PaymentOrderModel.docRef(orderCode);
      const docSnap = await getDoc(orderRef);

      if (!docSnap.exists()) {
        console.log("❌ Order not found:", orderCode);
        return null;
      }

      return PaymentOrderModel.fromFirestore(docSnap);
    } catch (error) {
      console.error("❌ Get payment order error:", error);
      throw error;
    }
  }

  /**
   * 📋 Get all payment orders by user ID
   */
  static async getByUserId(userId, options = {}) {
    try {
      const {
        limit = 50,
        orderByField = "createdAt",
        orderDirection = "desc",
      } = options;

      const q = query(
        PaymentOrderModel.collectionRef(),
        where("userId", "==", userId),
        orderBy(orderByField, orderDirection),
        fsLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const orders = [];

      querySnapshot.forEach((doc) => {
        const order = PaymentOrderModel.fromFirestore(doc);
        if (order) orders.push(order);
      });

      console.log(`✅ Found ${orders.length} orders for user:`, userId);
      return orders;
    } catch (error) {
      console.error("❌ Get orders by user error:", error);
      throw error;
    }
  }

  /**
   * 📋 Get all payment orders by status
   */
  static async getByStatus(status, options = {}) {
    try {
      const {
        limit = 100,
        orderByField = "createdAt",
        orderDirection = "desc",
      } = options;

      const q = query(
        PaymentOrderModel.collectionRef(),
        where("status", "==", status),
        orderBy(orderByField, orderDirection),
        fsLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const orders = [];

      querySnapshot.forEach((doc) => {
        const order = PaymentOrderModel.fromFirestore(doc);
        if (order) orders.push(order);
      });

      console.log(`✅ Found ${orders.length} orders with status:`, status);
      return orders;
    } catch (error) {
      console.error("❌ Get orders by status error:", error);
      throw error;
    }
  }

  /**
   * 📋 Get all payment orders (with pagination)
   */
  static async getAll(options = {}) {
    try {
      const {
        limit = 50,
        orderByField = "createdAt",
        orderDirection = "desc",
        startAfterDoc = null,
      } = options;

      let q = query(
        PaymentOrderModel.collectionRef(),
        orderBy(orderByField, orderDirection),
        fsLimit(limit)
      );

      if (startAfterDoc) {
        q = query(q, fsStartAfter(startAfterDoc));
      }

      const querySnapshot = await getDocs(q);
      const orders = [];

      querySnapshot.forEach((doc) => {
        const order = PaymentOrderModel.fromFirestore(doc);
        if (order) orders.push(order);
      });

      console.log(`✅ Found ${orders.length} payment orders`);
      return {
        orders,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === limit,
      };
    } catch (error) {
      console.error("❌ Get all orders error:", error);
      throw error;
    }
  }

  /**
   * 🔄 Update payment order status
   */
  async updateStatus(newStatus, additionalData = {}) {
    try {
      if (!Object.values(PAYMENT_STATUS).includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}`);
      }

      const orderRef = PaymentOrderModel.docRef(this.orderCode);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...additionalData,
      };

      // Add timestamp for specific statuses
      if (newStatus === PAYMENT_STATUS.PAID && !this.paidAt) {
        updateData.paidAt = serverTimestamp();
      }
      if (newStatus === PAYMENT_STATUS.PAID && !this.paymentTime) {
        updateData.paymentTime = new Date().toISOString();
      }
      if (newStatus === PAYMENT_STATUS.CANCELLED && !this.cancelledAt) {
        updateData.cancelledAt = serverTimestamp();
      }

      await updateDoc(orderRef, updateData);

      // Update local instance
      this.status = newStatus;
      this.updatedAt = new Date();
      Object.assign(this, additionalData);

      console.log("✅ Order status updated:", this.orderCode, newStatus);
      return this;
    } catch (error) {
      console.error("❌ Update order status error:", error);
      throw error;
    }
  }

  /**
   * 🔄 Update payment order
   */
  async update(updateData) {
    try {
      const orderRef = PaymentOrderModel.docRef(this.orderCode);

      const data = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      // Remove undefined fields
      Object.keys(data).forEach((key) => {
        if (data[key] === undefined) {
          delete data[key];
        }
      });

      await updateDoc(orderRef, data);

      // Update local instance
      Object.assign(this, updateData);
      this.updatedAt = new Date();

      console.log("✅ Order updated:", this.orderCode);
      return this;
    } catch (error) {
      console.error("❌ Update order error:", error);
      throw error;
    }
  }

  /**
   * ✅ Confirm payment manually (for admin)
   */
  async confirmManually(transactionId = null) {
    try {
      const updateData = {
        status: PAYMENT_STATUS.PAID,
        confirmedManually: true,
        verifiedWithPayOS: false,
        paymentTime: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      };

      if (transactionId) {
        updateData.transactionId = transactionId;
      } else {
        updateData.transactionId = `MANUAL_${this.orderCode}`;
      }

      const orderRef = PaymentOrderModel.docRef(this.orderCode);
      await updateDoc(orderRef, updateData);

      // Update local instance
      Object.assign(this, updateData);
      this.updatedAt = new Date();

      console.log("✅ Order confirmed manually:", this.orderCode);
      return this;
    } catch (error) {
      console.error("❌ Confirm order manually error:", error);
      throw error;
    }
  }

  /**
   * 🗑️ Delete payment order
   */
  async delete() {
    try {
      const orderRef = PaymentOrderModel.docRef(this.orderCode);
      await deleteDoc(orderRef);

      console.log("✅ Order deleted:", this.orderCode);
      return true;
    } catch (error) {
      console.error("❌ Delete order error:", error);
      throw error;
    }
  }

  /**
   * ✅ Check if payment is successful
   */
  isPaid() {
    return this.status === PAYMENT_STATUS.PAID;
  }

  /**
   * ⏳ Check if payment is pending
   */
  isPending() {
    return this.status === PAYMENT_STATUS.PENDING;
  }

  /**
   * ❌ Check if payment is cancelled or failed
   */
  isCancelled() {
    return (
      this.status === PAYMENT_STATUS.CANCELLED ||
      this.status === PAYMENT_STATUS.FAILED
    );
  }

  /**
   * ⏰ Check if payment is expired
   */
  isExpired() {
    return this.status === PAYMENT_STATUS.EXPIRED;
  }

  /**
   * 🔍 Check if payment was confirmed manually
   */
  isManuallyConfirmed() {
    return this.confirmedManually === true;
  }

  /**
   * 🔍 Check if payment was verified with PayOS
   */
  isVerifiedWithPayOS() {
    return this.verifiedWithPayOS === true;
  }

  /**
   * 🎨 Get status color for UI
   */
  getStatusColor() {
    const colors = {
      [PAYMENT_STATUS.PENDING]: "warning",
      [PAYMENT_STATUS.PAID]: "success",
      [PAYMENT_STATUS.CANCELLED]: "error",
      [PAYMENT_STATUS.FAILED]: "error",
      [PAYMENT_STATUS.EXPIRED]: "default",
    };
    return colors[this.status] || "default";
  }

  /**
   * 🎨 Get status label for UI
   */
  getStatusLabel() {
    const labels = {
      [PAYMENT_STATUS.PENDING]: "Đang chờ",
      [PAYMENT_STATUS.PAID]: "Đã thanh toán",
      [PAYMENT_STATUS.CANCELLED]: "Đã hủy",
      [PAYMENT_STATUS.FAILED]: "Thất bại",
      [PAYMENT_STATUS.EXPIRED]: "Hết hạn",
    };
    return labels[this.status] || this.status;
  }

  /**
   * 🏷️ Get verification badge text
   */
  getVerificationBadge() {
    if (this.verifiedWithPayOS) {
      return "PayOS Verified";
    }
    if (this.confirmedManually) {
      return "Manual Confirmation";
    }
    return "";
  }

  /**
   * 📊 Get payment summary
   */
  getSummary() {
    return {
      orderCode: this.orderCode,
      userName: this.userName,
      packageName: this.packageName,
      amount: this.amount,
      status: this.getStatusLabel(),
      createdAt: this.createdAt,
      paymentTime: this.paymentTime,
      confirmedManually: this.confirmedManually,
      verifiedWithPayOS: this.verifiedWithPayOS,
    };
  }

  /**
   * 💰 Format amount to VND
   */
  getFormattedAmount() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.amount);
  }

  /**
   * 📅 Format date
   */
  getFormattedDate(field = "createdAt") {
    const date = this[field];
    if (!date) return "N/A";

    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date instanceof Date ? date : new Date(date));
  }

  /**
   * 📅 Format payment time
   */
  getFormattedPaymentTime() {
    if (!this.paymentTime) return "N/A";

    try {
      const date = new Date(this.paymentTime);
      return new Intl.DateTimeFormat("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return this.paymentTime;
    }
  }
}

// Export constants
export { PAYMENT_STATUS as PaymentStatus };
