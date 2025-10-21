import { PayOS } from "@payos/node";
import dotenv from "dotenv";
dotenv.config();

// Khởi tạo PayOS với cú pháp mới (v2.0.3)
const payos = new PayOS({
  clientId:
    process.env.PAYOS_CLIENT_ID || "b1b21a16-5702-4a8e-8edc-5d522e01fbaa",
  apiKey: process.env.PAYOS_API_KEY || "82b21927-188b-4cd6-8e2d-f73395520f90",
  checksumKey:
    process.env.PAYOS_CHECKSUM_KEY ||
    "58375fd73a9c560b9f599de64c5341c68f41cc5e7193aa4272baea14133a2fcf",
});

/**
 * Tạo payment link cho gói tập gym
 * @param {Object} paymentData - Dữ liệu thanh toán
 * @param {number} paymentData.amount - Số tiền thanh toán
 * @param {string} paymentData.description - Mô tả thanh toán
 * @param {string} paymentData.returnUrl - URL chuyển hướng sau thanh toán
 * @param {string} paymentData.cancelUrl - URL chuyển hướng khi hủy
 * @param {number} paymentData.orderCode - Mã đơn hàng (unique)
 * @param {Object} paymentData.buyerInfo - Thông tin người mua
 * @param {Object} paymentData.metadata - Metadata bổ sung
 */
export async function createGymPackagePayment({
  amount,
  description,
  returnUrl,
  cancelUrl,
  orderCode,
  buyerInfo = {},
  metadata = {},
}) {
  try {
    // Validate dữ liệu đầu vào
    if (!amount || amount < 1000) {
      throw new Error("Số tiền phải lớn hơn hoặc bằng 1,000 VNĐ");
    }

    if (!description) {
      throw new Error("Mô tả thanh toán không được để trống");
    }

    if (!returnUrl) {
      throw new Error("Return URL không được để trống");
    }

    if (!orderCode) {
      throw new Error("Mã đơn hàng không được để trống");
    }

    // Tạo body request
    const paymentBody = {
      orderCode: Number(orderCode),
      amount: Number(amount),
      description: description,
      returnUrl: returnUrl,
      cancelUrl: cancelUrl || returnUrl,
    };

    // Thêm thông tin người mua nếu có
    if (buyerInfo.name || buyerInfo.email || buyerInfo.phone) {
      paymentBody.buyerName = buyerInfo.name;
      paymentBody.buyerEmail = buyerInfo.email;
      paymentBody.buyerPhone = buyerInfo.phone;
    }

    console.log("Creating payment with data:", paymentBody);

    // Tạo payment link với PayOS
    const result = await payos.paymentRequests.create(paymentBody);

    console.log("✅ Payment link created successfully:", result);

    // Trả về thông tin payment
    return {
      success: true,
      checkoutUrl: result.checkoutUrl,
      paymentLinkId: result.paymentLinkId,
      orderCode: result.orderCode,
      qrCode: result.qrCode,
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("❌ Error creating PayOS payment link:", error);
    throw {
      success: false,
      message: error.message || "Lỗi khi tạo link thanh toán",
      code: error.code || "PAYMENT_ERROR",
    };
  }
}

/**
 * Xác thực webhook từ PayOS
 */
export async function verifyPaymentWebhook(webhookData) {
  try {
    const result = await payos.webhooks.verify(webhookData);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ Error verifying webhook:", error);
    throw {
      success: false,
      message: "Webhook verification failed",
      error: error.message,
    };
  }
}

/**
 * Lấy thông tin thanh toán theo orderCode
 */
export async function getPaymentInfo(orderCode) {
  try {
    const result = await payos.paymentRequests.get(orderCode);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ Error getting payment info:", error);
    throw {
      success: false,
      message: "Không thể lấy thông tin thanh toán",
      error: error.message,
    };
  }
}

/**
 * Hủy thanh toán
 */
export async function cancelPayment(orderCode, cancellationReason) {
  try {
    const result = await payos.paymentRequests.cancel(
      orderCode,
      cancellationReason
    );
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ Error canceling payment:", error);
    throw {
      success: false,
      message: "Không thể hủy thanh toán",
      error: error.message,
    };
  }
}
