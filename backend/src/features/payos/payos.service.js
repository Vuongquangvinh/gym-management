import { PayOS } from "@payos/node";
import dotenv from "dotenv";
import crypto from "crypto";
import { admin } from "../../config/firebase.js";

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

    // 🔥 SAVE ORDER INFO TO FIRESTORE
    try {
      const orderInfo = {
        orderCode: Number(orderCode),
        userId: metadata.userId,
        userName: buyerInfo.name,
        userEmail: buyerInfo.email,
        amount: amount,
        status: "PENDING",
        paymentType: metadata.paymentType || "gym_package",
      };

      // 🔥 Add fields based on payment type
      if (metadata.paymentType === "pt_package") {
        // PT Package specific fields
        orderInfo.ptPackageId = metadata.ptPackageId;
        orderInfo.ptPackageName = metadata.ptPackageName;
        orderInfo.ptId = metadata.ptId;
        orderInfo.contractId = metadata.contractId;
      } else {
        // Gym Package specific fields
        orderInfo.packageId = metadata.packageId;
        orderInfo.packageName = metadata.packageName;
        orderInfo.packageDuration = metadata.packageDuration;
      }

      await saveOrderInfo(orderInfo);
    } catch (saveError) {
      console.error(
        "⚠️ Warning: Failed to save order to Firestore:",
        saveError.message
      );
      console.error(
        "Payment link created but order not saved. Webhook will still work."
      );
      // Don't throw error - payment link is still valid
    }

    // 🔍 LOG QR CODE INFORMATION
    console.log("🔍 Checking QR Code data:");
    console.log("  - result.qrCode:", result.qrCode);
    console.log("  - Has qrCode:", !!result.qrCode);

    // Tạo QR code URL từ VietQR
    const qrCodeUrl =
      result.qrCode ||
      `https://img.vietqr.io/image/970436-113366668888-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
        description
      )}`;

    console.log("  - Final qrCode URL:", qrCodeUrl);

    // Trả về thông tin payment
    const responseData = {
      success: true,
      checkoutUrl: result.checkoutUrl,
      paymentLinkId: result.paymentLinkId,
      orderCode: result.orderCode,
      qrCode: qrCodeUrl,
      amount: amount,
      description: description,
      // Thêm thông tin để Flutter tự tạo QR nếu cần
      bankCode: "970436", // Mã ngân hàng (ví dụ: Vietcombank)
      accountNumber: "113366668888", // Số tài khoản nhận tiền
      accountName: "GYM MANAGEMENT", // Tên tài khoản
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString(),
      },
    };

    console.log("📤 Returning response data:");
    console.log(JSON.stringify(responseData, null, 2));

    return responseData;
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

/**
 * 🔐 Verify webhook signature from PayOS
 */
export function verifyWebhookData(webhookBody) {
  try {
    const { data, signature } = webhookBody;

    if (!data || !signature) {
      console.error("❌ Missing data or signature in webhook");
      return null;
    }

    // Sort data keys and create signature string
    const sortedDataStr = sortObjDataByKey(data);

    // Create HMAC signature using checksum key
    const checksumKey =
      process.env.PAYOS_CHECKSUM_KEY ||
      "58375fd73a9c560b9f599de64c5341c68f41cc5e7193aa4272baea14133a2fcf";

    const calculatedSignature = crypto
      .createHmac("sha256", checksumKey)
      .update(sortedDataStr)
      .digest("hex");

    // Verify signature
    if (calculatedSignature !== signature) {
      console.error("❌ Invalid webhook signature");
      console.error("Expected:", calculatedSignature);
      console.error("Received:", signature);
      return null;
    }

    console.log("✅ Webhook signature verified");
    return webhookBody;
  } catch (error) {
    console.error("❌ Verify webhook error:", error);
    return null;
  }
}

/**
 * 📝 Sort object keys recursively for signature verification
 */
function sortObjDataByKey(object) {
  const orderedObject = Object.keys(object)
    .sort()
    .reduce((obj, key) => {
      obj[key] = object[key];
      return obj;
    }, {});
  return JSON.stringify(orderedObject);
}

/**
 * 💾 Save order info to Firestore
 */
export async function saveOrderInfo(orderData) {
  try {
    console.log(
      "📝 Attempting to save order to Firestore:",
      orderData.orderCode
    );

    console.log(
      "📦 Full orderData before cleaning:",
      JSON.stringify(orderData, null, 2)
    );

    // Check if admin is initialized
    if (!admin.apps || admin.apps.length === 0) {
      throw new Error("Firebase Admin SDK is not initialized");
    }

    const db = admin.firestore();
    console.log("✅ Firestore instance obtained");

    const orderRef = db
      .collection("payment_orders")
      .doc(orderData.orderCode.toString());

    // 🔥 Loại bỏ các field undefined trước khi lưu vào Firestore
    const cleanOrderData = {};
    Object.keys(orderData).forEach((key) => {
      if (orderData[key] !== undefined) {
        cleanOrderData[key] = orderData[key];
      } else {
        console.warn(`⚠️ Skipping undefined field: ${key}`);
      }
    });

    console.log(
      "✅ Cleaned orderData:",
      JSON.stringify(cleanOrderData, null, 2)
    );

    await orderRef.set({
      ...cleanOrderData,
      status: "PENDING",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(
      "✅ Order saved to Firestore successfully:",
      orderData.orderCode
    );
    return true;
  } catch (error) {
    console.error("❌ Save order error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * 🔍 Get order by order code from Firestore
 */
export async function getOrderByCode(orderCode) {
  try {
    const db = admin.firestore();
    const orderDoc = await db
      .collection("payment_orders")
      .doc(orderCode.toString())
      .get();

    if (!orderDoc.exists) {
      console.log("❌ Order not found:", orderCode);
      return null;
    }

    const data = orderDoc.data();
    console.log("✅ Order found:", orderCode);
    return { id: orderDoc.id, ...data };
  } catch (error) {
    console.error("❌ Get order error:", error);
    throw error;
  }
}

/**
 * 🔄 Update order status in Firestore
 */
export async function updateOrderStatus(orderCode, updateData) {
  try {
    const db = admin.firestore();
    await db
      .collection("payment_orders")
      .doc(orderCode.toString())
      .update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log("✅ Order status updated:", orderCode, updateData.status);
    return true;
  } catch (error) {
    console.error("❌ Update order error:", error);
    throw error;
  }
}
