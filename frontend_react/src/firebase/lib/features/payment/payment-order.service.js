import { PaymentOrderModel, PaymentStatus } from "./payment-order.model.js";

/**
 * 💳 Payment Order Service
 * Service layer để xử lý các thao tác với payment orders
 */
export class PaymentOrderService {
  /**
   * 💾 Create new payment order
   */
  static async createOrder(orderData) {
    try {
      const order = new PaymentOrderModel(orderData);
      await order.save();
      return order;
    } catch (error) {
      console.error("❌ Create order error:", error);
      throw error;
    }
  }

  /**
   * 🔍 Get order by order code
   */
  static async getOrder(orderCode) {
    try {
      return await PaymentOrderModel.getByOrderCode(orderCode);
    } catch (error) {
      console.error("❌ Get order error:", error);
      throw error;
    }
  }

  /**
   * 📋 Get orders by user ID
   */
  static async getUserOrders(userId, options = {}) {
    try {
      return await PaymentOrderModel.getByUserId(userId, options);
    } catch (error) {
      console.error("❌ Get user orders error:", error);
      throw error;
    }
  }

  /**
   * 📋 Get pending orders
   */
  static async getPendingOrders(options = {}) {
    try {
      return await PaymentOrderModel.getByStatus(
        PaymentStatus.PENDING,
        options
      );
    } catch (error) {
      console.error("❌ Get pending orders error:", error);
      throw error;
    }
  }

  /**
   * 📋 Get paid orders
   */
  static async getPaidOrders(options = {}) {
    try {
      return await PaymentOrderModel.getByStatus(PaymentStatus.PAID, options);
    } catch (error) {
      console.error("❌ Get paid orders error:", error);
      throw error;
    }
  }

  /**
   * 📋 Get all orders with pagination
   */
  static async getAllOrders(options = {}) {
    try {
      return await PaymentOrderModel.getAll(options);
    } catch (error) {
      console.error("❌ Get all orders error:", error);
      throw error;
    }
  }

  /**
   * ✅ Confirm payment manually (Admin only)
   */
  static async confirmPaymentManually(orderCode, transactionId = null) {
    try {
      const order = await PaymentOrderModel.getByOrderCode(orderCode);
      if (!order) {
        throw new Error("Order not found");
      }

      await order.confirmManually(transactionId);
      console.log("✅ Payment confirmed manually:", orderCode);
      return order;
    } catch (error) {
      console.error("❌ Confirm payment manually error:", error);
      throw error;
    }
  }

  /**
   * 🔄 Update order status
   */
  static async updateOrderStatus(orderCode, newStatus, additionalData = {}) {
    try {
      const order = await PaymentOrderModel.getByOrderCode(orderCode);
      if (!order) {
        throw new Error("Order not found");
      }

      await order.updateStatus(newStatus, additionalData);
      return order;
    } catch (error) {
      console.error("❌ Update order status error:", error);
      throw error;
    }
  }

  /**
   * ❌ Cancel order
   */
  static async cancelOrder(orderCode, reason = "") {
    try {
      return await this.updateOrderStatus(orderCode, PaymentStatus.CANCELLED, {
        cancelReason: reason,
      });
    } catch (error) {
      console.error("❌ Cancel order error:", error);
      throw error;
    }
  }

  /**
   * 🗑️ Delete order
   */
  static async deleteOrder(orderCode) {
    try {
      const order = await PaymentOrderModel.getByOrderCode(orderCode);
      if (!order) {
        throw new Error("Order not found");
      }

      await order.delete();
      console.log("✅ Order deleted:", orderCode);
      return true;
    } catch (error) {
      console.error("❌ Delete order error:", error);
      throw error;
    }
  }

  /**
   * 📊 Get order statistics
   */
  static async getOrderStatistics(userId = null) {
    try {
      const orders = userId
        ? await PaymentOrderModel.getByUserId(userId, { limit: 1000 })
        : (await PaymentOrderModel.getAll({ limit: 1000 })).orders;

      const stats = {
        total: orders.length,
        pending: 0,
        paid: 0,
        cancelled: 0,
        failed: 0,
        expired: 0,
        totalAmount: 0,
        paidAmount: 0,
        manualConfirmations: 0,
        payosVerified: 0,
      };

      orders.forEach((order) => {
        // Count by status
        if (order.isPending()) stats.pending++;
        if (order.isPaid()) stats.paid++;
        if (order.isCancelled()) stats.cancelled++;
        if (order.status === PaymentStatus.FAILED) stats.failed++;
        if (order.isExpired()) stats.expired++;

        // Sum amounts
        stats.totalAmount += order.amount;
        if (order.isPaid()) {
          stats.paidAmount += order.amount;
        }

        // Count verification types
        if (order.isManuallyConfirmed()) stats.manualConfirmations++;
        if (order.isVerifiedWithPayOS()) stats.payosVerified++;
      });

      return stats;
    } catch (error) {
      console.error("❌ Get order statistics error:", error);
      throw error;
    }
  }

  /**
   * 🔍 Search orders by user name or email
   */
  static async searchOrders(searchTerm) {
    try {
      const allOrders = (await PaymentOrderModel.getAll({ limit: 1000 }))
        .orders;

      const searchLower = searchTerm.toLowerCase();
      const filtered = allOrders.filter(
        (order) =>
          order.userName.toLowerCase().includes(searchLower) ||
          order.userEmail.toLowerCase().includes(searchLower) ||
          order.orderCode.toString().includes(searchTerm)
      );

      return filtered;
    } catch (error) {
      console.error("❌ Search orders error:", error);
      throw error;
    }
  }

  
}

export { PaymentStatus };
