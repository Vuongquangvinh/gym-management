import {
  createGymPackagePayment,
  verifyPaymentWebhook,
  getPaymentInfo,
  cancelPayment,
} from "./payos.service.js";

/**
 * Controller: Tạo payment link cho gói tập gym
 */
export async function createGymPayment(req, res) {
  try {
    const {
      packageId,
      packageName,
      packagePrice,
      packageDuration,
      userId,
      userName,
      userEmail,
      userPhone,
      returnUrl,
      cancelUrl,
    } = req.body;

    // Validate required fields
    if (!packageId || !packageName || !packagePrice) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin gói tập (packageId, packageName, packagePrice)",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin người dùng (userId)",
      });
    }

    // Tạo orderCode unique (timestamp + random)
    const orderCode = Date.now();

    // Tạo description (max 25 ký tự theo quy định PayOS)
    // Cắt packageId nếu quá dài để đảm bảo tổng không quá 25 ký tự
    const maxIdLength = 16; // "Goi tap " = 8 ký tự, còn 17 ký tự cho ID
    const shortPackageId =
      packageId.length > maxIdLength
        ? packageId.substring(0, maxIdLength)
        : packageId;
    const description = `Goi tap ${shortPackageId}`.substring(0, 25);

    // Tạo return URL mặc định nếu không có
    const defaultReturnUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/payment/success`;
    const defaultCancelUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/payment/cancel`;

    // Metadata để lưu thông tin gói tập
    const metadata = {
      packageId,
      packageName,
      packageDuration,
      userId,
      paymentType: "gym_package",
    };

    // Thông tin người mua
    const buyerInfo = {
      name: userName,
      email: userEmail,
      phone: userPhone,
    };

    const result = await createGymPackagePayment({
      amount: packagePrice,
      description,
      returnUrl: returnUrl || defaultReturnUrl,
      cancelUrl: cancelUrl || defaultCancelUrl,
      orderCode,
      buyerInfo,
      metadata,
    });

    res.json({
      success: true,
      message: "Tạo link thanh toán thành công",
      data: result,
    });
  } catch (error) {
    console.error("Error in createGymPayment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi tạo link thanh toán",
      error: error,
    });
  }
}

/**
 * Controller: Xử lý webhook từ PayOS
 */
export async function handlePaymentWebhook(req, res) {
  try {
    const webhookData = req.body;

    // Verify webhook
    const result = await verifyPaymentWebhook(webhookData);

    if (result.success) {
      // TODO: Xử lý cập nhật database khi thanh toán thành công
      // - Cập nhật trạng thái gói tập của user
      // - Gửi email xác nhận
      // - Tạo invoice
      console.log("✅ Payment webhook verified:", result.data);

      res.json({
        success: true,
        message: "Webhook processed successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid webhook data",
      });
    }
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).json({
      success: false,
      message: "Error processing webhook",
      error: error.message,
    });
  }
}

/**
 * Controller: Lấy thông tin thanh toán
 */
export async function getPaymentStatus(req, res) {
  try {
    const { orderCode } = req.params;

    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã đơn hàng",
      });
    }

    const result = await getPaymentInfo(orderCode);

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error getting payment status:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Không thể lấy thông tin thanh toán",
    });
  }
}

/**
 * Controller: Hủy thanh toán
 */
export async function cancelGymPayment(req, res) {
  try {
    const { orderCode } = req.params;
    const { reason } = req.body;

    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã đơn hàng",
      });
    }

    const result = await cancelPayment(
      orderCode,
      reason || "Người dùng hủy thanh toán"
    );

    res.json({
      success: true,
      message: "Đã hủy thanh toán thành công",
      data: result.data,
    });
  } catch (error) {
    console.error("Error canceling payment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Không thể hủy thanh toán",
    });
  }
}
