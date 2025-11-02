import Joi from "joi";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  limit as fsLimit,
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
   * Temporary: Load all and filter client-side while index is building
   */
  static async getByUserId(userId, options = {}) {
    try {
      const { limit = 50 } = options;

      console.log("🔍 getByUserId called with:", { userId, limit });
      console.log("⏳ Using temporary client-side filter (no index needed)...");

      // Load all orders (no orderBy to avoid index requirement)
      const q = query(
        PaymentOrderModel.collectionRef(),
        where("userId", "==", userId),
        fsLimit(limit * 2) // Get more to ensure we have enough after sorting
      );

      console.log("📡 Executing Firestore query...");
      const querySnapshot = await getDocs(q);
      console.log("📦 Query returned", querySnapshot.size, "documents");

      const orders = [];

      querySnapshot.forEach((doc) => {
        console.log("📄 Processing document:", doc.id, doc.data());
        const order = PaymentOrderModel.fromFirestore(doc);
        if (order) orders.push(order);
      });

      console.log("🔄 Sorting", orders.length, "orders...");
      // Sort client-side by createdAt descending
      orders.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(0);
        return dateB - dateA;
      });

      // Limit results
      const limitedOrders = orders.slice(0, limit);

      console.log(
        `✅ Returning ${limitedOrders.length} orders for user:`,
        userId
      );
      return limitedOrders;
    } catch (error) {
      console.error("❌ Get orders by user error:", error);
      throw error;
    }
  }

  /**
   * 📋 Get all payment orders by status
   * Temporary: Client-side sort while index is building
   */
  static async getByStatus(status, options = {}) {
    try {
      const { limit = 100 } = options;

      console.log("⏳ Using temporary client-side filter for status query...");

      const q = query(
        PaymentOrderModel.collectionRef(),
        where("status", "==", status),
        fsLimit(limit * 2)
      );

      const querySnapshot = await getDocs(q);
      const orders = [];

      querySnapshot.forEach((doc) => {
        const order = PaymentOrderModel.fromFirestore(doc);
        if (order) orders.push(order);
      });

      // Sort client-side
      orders.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(0);
        return dateB - dateA;
      });

      const limitedOrders = orders.slice(0, limit);

      console.log(
        `✅ Found ${limitedOrders.length} orders with status:`,
        status
      );
      return limitedOrders;
    } catch (error) {
      console.error("❌ Get orders by status error:", error);
      throw error;
    }
  }

  /**
   * 📋 Get all payment orders (with pagination)
   * Temporary: Client-side sort while index is building
   */
  static async getAll(options = {}) {
    try {
      const { limit = 50 } = options;

      console.log("🔍 getAll called with limit:", limit);
      console.log("⏳ Using temporary client-side sort (no index needed)...");

      const q = query(PaymentOrderModel.collectionRef(), fsLimit(limit * 2));

      console.log("📡 Executing Firestore query for all orders...");
      const querySnapshot = await getDocs(q);
      console.log("📦 Query returned", querySnapshot.size, "documents");

      const orders = [];

      querySnapshot.forEach((doc) => {
        console.log("📄 Processing document:", doc.id);
        const order = PaymentOrderModel.fromFirestore(doc);
        if (order) orders.push(order);
      });

      console.log("🔄 Sorting", orders.length, "orders...");
      // Sort client-side
      orders.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(0);
        return dateB - dateA;
      });

      const limitedOrders = orders.slice(0, limit);

      console.log(`✅ Returning ${limitedOrders.length} payment orders`);
      return {
        orders: limitedOrders,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === limit,
      };
    } catch (error) {
      console.error("❌ Get all orders error:", error);
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

  /**
   * 📊 Instance method: Check if this order contributes to revenue on a specific date
   */
  getRevenueByDate(date) {
    if (!this.isPaid()) {
      return 0;
    }
    const paidDate = this.paidAt instanceof Date ? this.paidAt : new Date(0);
    if (
      paidDate.getFullYear() === date.getFullYear() &&
      paidDate.getMonth() === date.getMonth() &&
      paidDate.getDate() === date.getDate()
    ) {
      return this.amount;
    }
    return 0;
  }

  /**
   * 📈 Static method: Get revenue data for chart (by day)
   * @param {Date} startDate - Ngày bắt đầu
   * @param {Date} endDate - Ngày kết thúc
   * @returns {Array} - [{date: "2025-10-01", revenue: 1000000, orders: 3}, ...]
   */
  static async getRevenueByDay(startDate, endDate) {
    try {
      // Load all orders
      const result = await PaymentOrderModel.getAll({ limit: 1000 });
      const allOrders = result.orders;

      // Tạo map để nhóm theo ngày
      const revenueMap = new Map();

      // Duyệt qua tất cả orders
      allOrders.forEach((order) => {
        if (!order.isPaid()) return;

        // SỬA: Dùng createdAt thay vì paidAt vì field paidAt không tồn tại
        const orderDate =
          order.createdAt instanceof Date
            ? order.createdAt
            : new Date(order.createdAt);

        // Check nếu trong khoảng thời gian
        if (orderDate >= startDate && orderDate <= endDate) {
          // Format ngày: YYYY-MM-DD
          const dateKey = orderDate.toISOString().split("T")[0];

          if (!revenueMap.has(dateKey)) {
            revenueMap.set(dateKey, { date: dateKey, revenue: 0, orders: 0 });
          }

          const dayData = revenueMap.get(dateKey);
          dayData.revenue += order.amount;
          dayData.orders += 1;
        }
      });

      // Chuyển Map thành Array và sort theo ngày
      const revenueData = Array.from(revenueMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      console.log(`✅ Revenue data: ${revenueData.length} days`);
      return revenueData;
    } catch (error) {
      console.error("❌ Get revenue by day error:", error);
      throw error;
    }
  }

  /**
   * 📈 Static method: Get revenue data by month
   * @param {number} year - Năm
   * @returns {Array} - [{month: "2025-01", revenue: 10000000, orders: 30}, ...]
   */
  static async getRevenueByMonth(year) {
    try {
      const result = await PaymentOrderModel.getAll({ limit: 1000 });
      const allOrders = result.orders;

      const revenueMap = new Map();

      allOrders.forEach((order) => {
        if (!order.isPaid()) return;

        // SỬA: Dùng createdAt thay vì paidAt
        const orderDate =
          order.createdAt instanceof Date
            ? order.createdAt
            : new Date(order.createdAt);

        if (orderDate.getFullYear() === year) {
          // Format: YYYY-MM
          const monthKey = `${orderDate.getFullYear()}-${String(
            orderDate.getMonth() + 1
          ).padStart(2, "0")}`;

          if (!revenueMap.has(monthKey)) {
            revenueMap.set(monthKey, {
              month: monthKey,
              revenue: 0,
              orders: 0,
            });
          }

          const monthData = revenueMap.get(monthKey);
          monthData.revenue += order.amount;
          monthData.orders += 1;
        }
      });

      const revenueData = Array.from(revenueMap.values()).sort((a, b) =>
        a.month.localeCompare(b.month)
      );

      console.log(`✅ Revenue data: ${revenueData.length} months`);
      return revenueData;
    } catch (error) {
      console.error("❌ Get revenue by month error:", error);
      throw error;
    }
  }

  /**
   * 👥 Static method: Get revenue by each user
   * Lấy danh sách người dùng kèm theo tổng doanh thu của họ
   * @returns {Array} - [{userId, userName, userEmail, userPhone, avatar_url, revenue, orders, packages}, ...]
   */
  static async getRevenueByEachUser() {
    try {
      console.log("🔍 Getting revenue by each user...");

      const result = await PaymentOrderModel.getAll({ limit: 1000 });
      const allOrders = result.orders;

      console.log(`📦 Processing ${allOrders.length} orders...`);

      // Tạo map để nhóm theo userId
      const revenueMap = new Map();

      allOrders.forEach((order) => {
        // Chỉ tính các đơn đã thanh toán
        if (!order.isPaid()) return;

        const userId = order.userId;

        if (!revenueMap.has(userId)) {
          // Khởi tạo dữ liệu người dùng tạm thời (sẽ được cập nhật sau)
          revenueMap.set(userId, {
            userId: userId,
            userName: order.userName || "Unknown User",
            userEmail: order.userEmail || "",
            userPhone: "",
            avatar_url: "",
            membership_status: "",
            current_package_id: "",
            revenue: 0,
            orders: 0,
            packages: [], // Danh sách các gói đã mua
          });
        }

        const userData = revenueMap.get(userId);
        userData.revenue += order.amount;
        userData.orders += 1;

        // Thêm thông tin gói vào danh sách (tránh trùng lặp)
        if (!userData.packages.includes(order.packageName)) {
          userData.packages.push(order.packageName);
        }
      });

      console.log(
        `📊 Found ${revenueMap.size} unique users, fetching full user data...`
      );

      // Lấy thông tin đầy đủ từ collection users
      const usersCollectionRef = collection(db, "users");
      const revenueData = [];

      for (const [userId, revenueInfo] of revenueMap.entries()) {
        try {
          // Query user từ collection users bằng _id
          const userQuery = query(
            usersCollectionRef,
            where("_id", "==", userId)
          );
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();

            // Merge thông tin user từ users collection với revenue data
            revenueData.push({
              userId: userId,
              userName: userData.full_name || revenueInfo.userName,
              userEmail: userData.email || revenueInfo.userEmail,
              userPhone: userData.phone_number || "",
              avatar_url: userData.avatar_url || "",
              membership_status: userData.membership_status || "",
              current_package_id: userData.current_package_id || "",
              package_end_date: userData.package_end_date
                ? userData.package_end_date instanceof Timestamp
                  ? userData.package_end_date.toDate()
                  : userData.package_end_date
                : null,
              revenue: revenueInfo.revenue,
              orders: revenueInfo.orders,
              packages: revenueInfo.packages,
            });

            console.log(`✅ Fetched user data for: ${userData.full_name}`);
          } else {
            // Nếu không tìm thấy user trong collection users, dùng dữ liệu từ payment_orders
            console.warn(
              `⚠️ User ${userId} not found in users collection, using order data`
            );
            revenueData.push(revenueInfo);
          }
        } catch (userError) {
          console.error(`❌ Error fetching user ${userId}:`, userError);
          // Fallback: dùng dữ liệu từ payment_orders
          revenueData.push(revenueInfo);
        }
      }

      // Sắp xếp theo doanh thu giảm dần
      revenueData.sort((a, b) => b.revenue - a.revenue);

      console.log(
        `✅ Completed! Total users with revenue: ${revenueData.length}`
      );
      console.log(
        "📊 Top 3 users:",
        revenueData.slice(0, 3).map((u) => ({
          name: u.userName,
          revenue: u.revenue,
          orders: u.orders,
        }))
      );

      return revenueData;
    } catch (error) {
      console.error("❌ Get revenue by each user error:", error);
      throw error;
    }
  }
}

// Export constants
export { PAYMENT_STATUS as PaymentStatus };
