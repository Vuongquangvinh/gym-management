import {
  createGymPackagePayment,
  verifyPaymentWebhook,
  getPaymentInfo,
  cancelPayment,
  verifyWebhookData,
  getOrderByCode,
  updateOrderStatus,
} from "./payos.service.js";
import admin from "../../config/firebase.js";

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
    console.log("📨 Webhook received from PayOS");
    console.log("Webhook body:", JSON.stringify(req.body, null, 2));

    const webhookData = req.body;

    // ✅ 1. Verify webhook signature
    const verifiedData = verifyWebhookData(webhookData);

    if (!verifiedData) {
      console.error("❌ Invalid webhook signature");
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const { code, data, desc } = verifiedData;

    // ✅ 2. Check if payment was successful
    if (code !== "00") {
      console.log("❌ Payment failed with code:", code, desc);
      return res.json({
        success: false,
        message: "Payment not successful",
        code,
        description: desc,
      });
    }

    // ✅ 3. Extract payment info
    const {
      orderCode,
      amount,
      description,
      accountNumber,
      reference,
      transactionDateTime,
    } = data;

    console.log("💰 Payment successful for order:", orderCode);

    // ✅ 4. Get order details from Firestore
    let orderInfo = await getOrderByCode(orderCode);

    if (!orderInfo) {
      console.log(
        "⚠️ Order not found in database, will extract from payment description"
      );

      // Try to parse package info from description
      // Description format: "Goi tap PKG001" or "Thanh toan goi tap ..."
      // We need to get full payment info from PayOS API
      try {
        const paymentInfo = await getPaymentInfo(orderCode);
        console.log("📋 Payment info from PayOS:", paymentInfo);

        // Since we don't have order in DB, we cannot update user
        // Return success but log warning
        console.error(
          "❌ Cannot update user: Order info not found in database"
        );
        console.error(
          "This means Firebase Admin SDK failed when creating payment"
        );
        console.error("Please fix Firebase authentication and try again");

        return res.json({
          success: true,
          message:
            "Payment received but cannot update user (order not in database)",
          warning: "Firebase Admin SDK authentication failed",
          orderCode: orderCode,
        });
      } catch (getPaymentError) {
        console.error("❌ Error getting payment info:", getPaymentError);
        return res.status(404).json({
          success: false,
          message: "Order not found and cannot retrieve payment info",
        });
      }
    }

    console.log("📦 Order info:", orderInfo);

    // ✅ 5. Check if already processed (prevent duplicate)
    if (orderInfo.status === "PAID") {
      console.log("⚠️ Order already processed, skipping update");
      return res.json({
        success: true,
        message: "Order already processed",
      });
    }

    // 🔥 6. UPDATE USER PACKAGE INFO IN FIRESTORE
    const { userId, packageId, packageDuration } = orderInfo;

    console.log("🔄 Updating user package:", {
      userId,
      packageId,
      packageDuration,
    });

    // Get package details to retrieve NumberOfSession
    const db = admin.firestore();

    console.log("🔍 Searching for package with PackageId field:", packageId);
    const packageQuery = await db
      .collection("packages")
      .where("PackageId", "==", packageId)
      .limit(1)
      .get();

    let packageDetails = null;
    let packageDocId = null; // Document ID của package

    if (!packageQuery.empty) {
      const packageDoc = packageQuery.docs[0];
      packageDetails = packageDoc.data();
      packageDocId = packageDoc.id; // Lưu document ID

      console.log("📦 Package details:", {
        firestoreDocId: packageDocId,
        PackageId: packageDetails.PackageId,
        PackageName: packageDetails.PackageName,
        NumberOfSession: packageDetails.NumberOfSession,
      });
    } else {
      console.warn("⚠️ Package not found with PackageId:", packageId);
    }

    // ✅ 7. Get user first to calculate extension dates
    // 🔥 FIX: Tìm user theo cả Firestore Document ID VÀ field _id
    console.log("🔍 Searching for user with ID:", userId);

    // Thử tìm theo Document ID trước
    let userDocRef = db.collection("users").doc(userId);
    let userDoc = await userDocRef.get();

    // Nếu không tìm thấy, thử tìm theo field _id
    if (!userDoc.exists) {
      console.log("⚠️ Not found by Document ID, trying field _id...");
      const userQuery = await db
        .collection("users")
        .where("_id", "==", userId)
        .limit(1)
        .get();

      if (!userQuery.empty) {
        userDoc = userQuery.docs[0];
        userDocRef = userDoc.ref;
        console.log("✅ Found user by field _id, Document ID:", userDoc.id);
      }
    } else {
      console.log("✅ Found user by Document ID");
    }

    if (!userDoc.exists) {
      console.error("❌ User not found in database:", userId);

      // 🔍 DEBUG: List first user to check structure
      console.log("🔍 Listing first user to debug...");
      const firstUserSnapshot = await db.collection("users").limit(1).get();
      if (!firstUserSnapshot.empty) {
        const doc = firstUserSnapshot.docs[0];
        console.log("  Sample User doc:", {
          firestoreId: doc.id,
          _id: doc.data()._id,
          email: doc.data().email,
          name: doc.data().name,
        });
      }

      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    const userDocId = userDoc.id;
    const currentUserData = userDoc.data();

    console.log("📋 Current user data BEFORE update (webhook):", {
      _id: currentUserData._id,
      current_package_id: currentUserData.current_package_id,
      package_end_date: currentUserData.package_end_date,
      membership_status: currentUserData.membership_status,
    });

    // 🔥 CALCULATE NEW END DATE - GIA HẠN từ ngày hết hạn cũ
    let startDate, endDate;

    if (currentUserData.package_end_date) {
      // Có gói cũ → Gia hạn từ ngày hết hạn cũ
      const currentEndDate = currentUserData.package_end_date.toDate();
      const now = new Date();

      if (currentEndDate > now) {
        // Gói cũ còn hạn → Gia hạn từ ngày hết hạn cũ
        startDate = currentEndDate;
        endDate = new Date(currentEndDate);
        endDate.setDate(endDate.getDate() + packageDuration);
        console.log("📅 Gia hạn từ ngày hết hạn cũ (gói còn hạn)");
      } else {
        // Gói cũ hết hạn → Tính từ hôm nay
        startDate = now;
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + packageDuration);
        console.log("📅 Gói cũ đã hết hạn, tính từ hôm nay");
      }
    } else {
      // Chưa có gói → Tính từ hôm nay
      startDate = new Date();
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + packageDuration);
      console.log("📅 Gói mới, tính từ hôm nay");
    }

    console.log("📅 Package calculation:", {
      old_end_date:
        currentUserData.package_end_date?.toDate()?.toISOString() || "none",
      new_start_date: startDate.toISOString(),
      new_end_date: endDate.toISOString(),
      duration: packageDuration,
      total_days_added: Math.floor(
        (endDate - (currentUserData.package_end_date?.toDate() || new Date())) /
          (1000 * 60 * 60 * 24)
      ),
    });

    // Prepare update data
    // 🔥 Sử dụng packageId (field "PackageId" như "PK3") thay vì document ID
    const userUpdateData = {
      current_package_id: packageId, // Giữ nguyên packageId từ request
      membership_status: "Active",
      package_start_date: admin.firestore.Timestamp.fromDate(startDate),
      package_end_date: admin.firestore.Timestamp.fromDate(endDate),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log("📝 Setting current_package_id to:", packageId);
    console.log("  - packageId (PackageId field, e.g. PK3):", packageId);
    console.log("  - packageDocId (Firestore Doc ID):", packageDocId);

    // Add remaining_sessions
    if (packageDetails && packageDetails.NumberOfSession) {
      // Nếu gia hạn cùng gói → Cộng thêm sessions
      const isSamePackage = currentUserData.current_package_id === packageId;

      if (isSamePackage && currentUserData.remaining_sessions) {
        userUpdateData.remaining_sessions =
          currentUserData.remaining_sessions + packageDetails.NumberOfSession;
        console.log("🔢 Cộng thêm sessions:", {
          old: currentUserData.remaining_sessions,
          new: packageDetails.NumberOfSession,
          total: userUpdateData.remaining_sessions,
        });
      } else {
        // Đổi gói khác → Set lại sessions
        userUpdateData.remaining_sessions = packageDetails.NumberOfSession;
        console.log("🔢 Set sessions mới:", packageDetails.NumberOfSession);
      }
    } else {
      userUpdateData.remaining_sessions = null;
    }

    console.log("📝 Applying update:", userUpdateData);

    await db.collection("users").doc(userDocId).update(userUpdateData);

    // Verify update
    const updatedUserDoc = await db.collection("users").doc(userDocId).get();
    const updatedUserData = updatedUserDoc.data();

    console.log("📋 User data AFTER update (webhook):", {
      _id: updatedUserData._id,
      current_package_id: updatedUserData.current_package_id,
      package_end_date: updatedUserData.package_end_date,
      package_start_date: updatedUserData.package_start_date,
      remaining_sessions: updatedUserData.remaining_sessions,
      membership_status: updatedUserData.membership_status,
    });

    console.log("✅ User package updated successfully:", {
      userId,
      docId: userDocId,
      packageId,
      endDate: endDate.toISOString(),
    });

    // ✅ 8. Update order status to PAID
    await updateOrderStatus(orderCode, {
      status: "PAID",
      paymentTime: transactionDateTime,
      transactionId: reference,
      amount: amount,
      accountNumber: accountNumber,
    });

    console.log("✅ Order status updated to PAID:", orderCode);
    console.log("🎉 Payment webhook processed successfully!");

    // ✅ 9. Send success response to PayOS
    return res.json({
      success: true,
      message: "Payment processed and user package updated successfully",
      data: {
        orderCode,
        userId,
        packageId,
        transactionId: reference,
      },
    });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
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

export async function confirmPaymentManual(req, res) {
  try {
    const { orderCode } = req.body;

    console.log("🔔 Manual payment confirmation requested");
    console.log("Order code:", orderCode);

    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: "Missing orderCode",
      });
    }

    // ✅ 1. Get order from Firestore
    const orderInfo = await getOrderByCode(orderCode);

    if (!orderInfo) {
      return res.status(404).json({
        success: false,
        message: "Order not found in database",
      });
    }

    console.log("📦 Order info:", orderInfo);

    // ✅ 2. Check if already processed
    if (orderInfo.status === "PAID") {
      console.log("⚠️ Order already processed");
      return res.json({
        success: true,
        message: "Order already processed",
        alreadyProcessed: true,
      });
    }

    // ✅ 3. Verify payment with PayOS API (OPTIONAL - Skip for local dev)
    console.log("🔍 Verifying payment with PayOS...");

    let paymentInfo = null;
    try {
      paymentInfo = await getPaymentInfo(orderCode);
      console.log("💳 Payment info from PayOS:", paymentInfo);

      // Check payment status - but don't block if not PAID yet (PayOS delay)
      if (paymentInfo.status !== "PAID") {
        console.log("⚠️ PayOS status not PAID yet:", paymentInfo.status);
        console.log(
          "⚠️ But proceeding anyway (LOCAL DEV MODE - user confirmed payment)"
        );
      } else {
        console.log("✅ Payment verified as PAID");
      }
    } catch (verifyError) {
      console.log("⚠️ Could not verify with PayOS:", verifyError.message);
      console.log("⚠️ Proceeding anyway (LOCAL DEV MODE)");
    }

    // ✅ 4. Update user package
    const { userId, packageId, packageDuration } = orderInfo;

    console.log("🔄 Updating user package:", {
      userId,
      packageId,
      packageDuration,
    });

    const db = admin.firestore();

    // Get package details
    console.log("🔍 Searching for package with PackageId field:", packageId);
    const packageQuery = await db
      .collection("packages")
      .where("PackageId", "==", packageId)
      .limit(1)
      .get();

    let packageDetails = null;
    let packageDocId = null; // Document ID của package

    if (!packageQuery.empty) {
      const packageDoc = packageQuery.docs[0];
      packageDetails = packageDoc.data();
      packageDocId = packageDoc.id; // Lưu document ID

      console.log("📦 Package details:", {
        firestoreDocId: packageDocId,
        PackageId: packageDetails.PackageId,
        PackageName: packageDetails.PackageName,
        NumberOfSession: packageDetails.NumberOfSession,
      });
    } else {
      console.warn("⚠️ Package not found with PackageId:", packageId);
    }

    // Get user first
    // 🔥 FIX: Tìm user theo cả Firestore Document ID VÀ field _id
    console.log("🔍 Searching for user with ID:", userId);

    // Thử tìm theo Document ID trước
    let userDocRef = db.collection("users").doc(userId);
    let userDoc = await userDocRef.get();

    // Nếu không tìm thấy, thử tìm theo field _id
    if (!userDoc.exists) {
      console.log("⚠️ Not found by Document ID, trying field _id...");
      const userQuery = await db
        .collection("users")
        .where("_id", "==", userId)
        .limit(1)
        .get();

      if (!userQuery.empty) {
        userDoc = userQuery.docs[0];
        userDocRef = userDoc.ref;
        console.log("✅ Found user by field _id, Document ID:", userDoc.id);
      }
    } else {
      console.log("✅ Found user by Document ID");
    }

    if (!userDoc.exists) {
      console.error("❌ User not found in database:", userId);

      // 🔍 DEBUG: List first user to check structure
      console.log("🔍 Listing first user to debug...");
      const firstUserSnapshot = await db.collection("users").limit(1).get();
      if (!firstUserSnapshot.empty) {
        const doc = firstUserSnapshot.docs[0];
        console.log("  Sample User doc:", {
          firestoreId: doc.id,
          _id: doc.data()._id,
          email: doc.data().email,
          name: doc.data().name,
        });
      }

      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    const userDocId = userDoc.id;
    const currentUserData = userDoc.data();

    console.log("📋 Current user data BEFORE update:", {
      _id: currentUserData._id,
      current_package_id: currentUserData.current_package_id,
      package_end_date: currentUserData.package_end_date,
      membership_status: currentUserData.membership_status,
    });

    // 🔥 CALCULATE NEW END DATE - GIA HẠN
    let startDate, endDate;

    if (currentUserData.package_end_date) {
      const currentEndDate = currentUserData.package_end_date.toDate();
      const now = new Date();

      if (currentEndDate > now) {
        startDate = currentEndDate;
        endDate = new Date(currentEndDate);
        endDate.setDate(endDate.getDate() + packageDuration);
        console.log("📅 Gia hạn từ ngày hết hạn cũ");
      } else {
        startDate = now;
        endDate = new Date(now);
        endDate.setDate(endDate.getDate() + packageDuration);
        console.log("📅 Gói hết hạn, tính từ hôm nay");
      }
    } else {
      startDate = new Date();
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + packageDuration);
      console.log("📅 Gói mới");
    }

    console.log("📅 Calculation:", {
      old_end:
        currentUserData.package_end_date?.toDate()?.toISOString() || "none",
      new_start: startDate.toISOString(),
      new_end: endDate.toISOString(),
      added_days: packageDuration,
    });

    // 🔥 Sử dụng packageId (field "PackageId" như "PK3") thay vì document ID
    const userUpdateData = {
      current_package_id: packageId, // Giữ nguyên packageId từ order
      membership_status: "Active",
      package_start_date: admin.firestore.Timestamp.fromDate(startDate),
      package_end_date: admin.firestore.Timestamp.fromDate(endDate),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log("📝 Setting current_package_id to:", packageId);

    if (packageDetails && packageDetails.NumberOfSession) {
      const isSamePackage = currentUserData.current_package_id === packageId;

      if (isSamePackage && currentUserData.remaining_sessions) {
        userUpdateData.remaining_sessions =
          currentUserData.remaining_sessions + packageDetails.NumberOfSession;
      } else {
        userUpdateData.remaining_sessions = packageDetails.NumberOfSession;
      }
    } else {
      userUpdateData.remaining_sessions = null;
    }

    console.log("📝 Update data:", userUpdateData);

    // Update user
    await db.collection("users").doc(userDocId).update(userUpdateData);

    // Verify update
    const updatedUserDoc = await db.collection("users").doc(userDocId).get();
    const updatedUserData = updatedUserDoc.data();

    console.log("📋 User data AFTER update:", {
      _id: updatedUserData._id,
      current_package_id: updatedUserData.current_package_id,
      package_end_date: updatedUserData.package_end_date,
      package_start_date: updatedUserData.package_start_date,
      remaining_sessions: updatedUserData.remaining_sessions,
      membership_status: updatedUserData.membership_status,
    });

    console.log("✅ User package updated successfully");

    // ✅ 5. Update order status
    await updateOrderStatus(orderCode, {
      status: "PAID",
      paymentTime: paymentInfo?.createdAt || new Date().toISOString(),
      transactionId: paymentInfo?.reference || `MANUAL_${orderCode}`,
      amount: paymentInfo?.amount || orderInfo.amount,
      confirmedManually: true,
      verifiedWithPayOS: !!paymentInfo && paymentInfo.status === "PAID",
    });

    console.log("✅ Order status updated to PAID");
    console.log("🎉 Manual confirmation completed!");

    return res.json({
      success: true,
      message: "Payment confirmed and user package updated successfully",
      data: {
        orderCode,
        userId,
        packageId,
        packageEndDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error in manual confirmation:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm payment",
    });
  }
}
