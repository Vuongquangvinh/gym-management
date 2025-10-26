/**
 * ================================================
 * EXAMPLE: TƯƠNG TÁC GIỮA USER VÀ PACKAGE
 * ================================================
 *
 * File này minh họa cách User tương tác với Package
 * trong hệ thống quản lý phòng gym
 */

import { PackageModel } from "../firebase/lib/features/package/packages.model.js";
import UserModel from "../firebase/lib/features/user/user.model.js";

// ==========================================
// EXAMPLE 1: ADMIN TẠO GÓI TẬP MỚI
// ==========================================
async function exampleCreatePackage() {
  try {
    const packageData = {
      PackageId: "", // Sẽ tự động tạo
      PackageName: "Gói 3 Tháng Premium",
      PackageType: "time", // "time" hoặc "session"
      Description: "Gói tập 3 tháng không giới hạn",
      Duration: 90, // 90 ngày
      Price: 2000000, // 2 triệu VNĐ
      Status: "active",
      NumberOfSession: null, // Null vì là gói theo thời gian
      Discount: 10, // Giảm 10%
      StartDayDiscount: new Date("2025-01-01"),
      EndDayDiscount: new Date("2025-01-31"),
      UsageCondition: "Tập không giới hạn trong 90 ngày",
    };

    const newPackage = await PackageModel.create(packageData);
    console.log("✅ Tạo gói tập thành công:", newPackage);
    return newPackage;
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ==========================================
// EXAMPLE 2: ADMIN TẠO GÓI THEO BUỔI
// ==========================================
async function exampleCreateSessionPackage() {
  try {
    const packageData = {
      PackageId: "",
      PackageName: "Gói 20 Buổi",
      PackageType: "session",
      Description: "Gói 20 buổi tập, không giới hạn thời gian",
      Duration: 365, // Có thể dùng trong 1 năm
      Price: 1500000,
      Status: "active",
      NumberOfSession: 20,
      Discount: 0,
      UsageCondition: "Tập 20 buổi trong vòng 1 năm",
    };

    const newPackage = await PackageModel.create(packageData);
    console.log("✅ Tạo gói tập theo buổi thành công:", newPackage);
    return newPackage;
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ==========================================
// EXAMPLE 3: XEM DANH SÁCH GÓI TẬP
// ==========================================
async function exampleGetAllPackages() {
  try {
    // Lấy tất cả gói tập đang active
    const activePackages = await PackageModel.getAll({ status: "active" });
    console.log("📦 Danh sách gói tập active:", activePackages);

    // Lấy tất cả gói tập (không lọc)
    const allPackages = await PackageModel.getAll();
    console.log("📦 Tất cả gói tập:", allPackages);

    return activePackages;
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ==========================================
// EXAMPLE 4: USER ĐĂNG KÝ GÓI TẬP
// ==========================================
async function exampleUserRegisterPackage() {
  try {
    // 1. Lấy thông tin user
    const user = await UserModel.getByPhoneNumber("0987654321");
    if (!user) {
      console.log("❌ Không tìm thấy user");
      return;
    }

    // 2. Lấy danh sách gói tập active
    const packages = await PackageModel.getAll({ status: "active" });
    console.log("📦 Các gói tập khả dụng:", packages);

    // 3. Chọn gói tập (ví dụ: gói đầu tiên)
    const selectedPackage = packages[0];
    console.log("🎁 Gói tập được chọn:", selectedPackage.PackageName);

    // 4. Đăng ký gói tập cho user
    const result = await user.registerPackage(selectedPackage.PackageId);
    console.log("✅ Đăng ký thành công:", result);

    // 5. Kiểm tra thông tin user sau khi đăng ký
    const updatedUser = await UserModel.getById(user._id);
    console.log("👤 Thông tin user sau khi đăng ký:", {
      name: updatedUser.full_name,
      package_id: updatedUser.current_package_id,
      package_end_date: updatedUser.package_end_date,
      remaining_sessions: updatedUser.remaining_sessions,
      membership_status: updatedUser.membership_status,
    });

    return result;
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ==========================================
// EXAMPLE 5: XEM THÔNG TIN GÓI TẬP CỦA USER
// ==========================================
async function exampleGetUserPackageInfo() {
  try {
    const user = await UserModel.getByPhoneNumber("0987654321");
    if (!user) {
      console.log("❌ Không tìm thấy user");
      return;
    }

    // Lấy thông tin gói tập hiện tại
    const currentPackage = await user.getCurrentPackage();
    console.log("🎁 Gói tập hiện tại:", currentPackage);

    // Kiểm tra gói tập còn hiệu lực không
    const isActive = user.isPackageActive();
    console.log("✅ Gói tập còn hiệu lực:", isActive);

    // Số ngày còn lại
    const daysRemaining = user.getDaysRemaining();
    console.log("📅 Số ngày còn lại:", daysRemaining);

    // Giá cuối cùng (sau discount)
    if (currentPackage) {
      const finalPrice = currentPackage.getFinalPrice();
      console.log("💰 Giá gói tập:", {
        original: currentPackage.Price,
        final: finalPrice,
        discount: currentPackage.Discount,
      });
    }

    return {
      package: currentPackage,
      isActive,
      daysRemaining,
    };
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ==========================================
// EXAMPLE 6: GIA HẠN GÓI TẬP
// ==========================================
async function exampleRenewPackage() {
  try {
    const user = await UserModel.getByPhoneNumber("0987654321");
    if (!user) {
      console.log("❌ Không tìm thấy user");
      return;
    }

    console.log("📅 Ngày hết hạn cũ:", user.package_end_date);

    const result = await user.renewPackage();
    console.log("✅ Gia hạn thành công:", result);

    console.log("📅 Ngày hết hạn mới:", result.endDate);

    return result;
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ==========================================
// EXAMPLE 7: SỬ DỤNG BUỔI TẬP (GÓI THEO BUỔI)
// ==========================================
async function exampleUseSession() {
  try {
    const user = await UserModel.getByPhoneNumber("0987654321");
    if (!user) {
      console.log("❌ Không tìm thấy user");
      return;
    }

    console.log("🏋️ Số buổi tập còn lại trước:", user.remaining_sessions);

    const result = await user.useSession();
    console.log("✅ Check-in thành công:", result);

    console.log("🏋️ Số buổi tập còn lại sau:", result.remainingSessions);

    return result;
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ==========================================
// EXAMPLE 8: CẬP NHẬT GÓI TẬP
// ==========================================
async function exampleUpdatePackage(packageId) {
  try {
    const updateData = {
      Price: 2500000,
      Discount: 15,
      Status: "active",
    };

    await PackageModel.update(packageId, updateData);
    console.log("✅ Cập nhật gói tập thành công");

    const updatedPackage = await PackageModel.getById(packageId);
    console.log("📦 Thông tin gói tập sau khi cập nhật:", updatedPackage);

    return updatedPackage;
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

// ==========================================
// EXAMPLE 9: WORKFLOW HOÀN CHỈNH
// ==========================================
async function exampleCompleteWorkflow() {
  console.log("\n========== BẮT ĐẦU WORKFLOW ==========\n");

  // Bước 1: Admin tạo gói tập
  console.log("📝 Bước 1: Admin tạo gói tập");
  await exampleCreatePackage();

  // Bước 2: User xem danh sách gói tập
  console.log("\n📝 Bước 2: User xem danh sách gói tập");
  await exampleGetAllPackages();

  // Bước 3: User đăng ký gói tập
  console.log("\n📝 Bước 3: User đăng ký gói tập");
  await exampleUserRegisterPackage();

  // Bước 4: Xem thông tin gói tập của user
  console.log("\n📝 Bước 4: Xem thông tin gói tập của user");
  await exampleGetUserPackageInfo();

  // Bước 5: User check-in (nếu là gói theo buổi)
  console.log("\n📝 Bước 5: User check-in");
  // await exampleUseSession(); // Chỉ dùng cho gói theo buổi

  // Bước 6: Gia hạn gói tập
  console.log("\n📝 Bước 6: Gia hạn gói tập");
  // await exampleRenewPackage();

  console.log("\n========== KẾT THÚC WORKFLOW ==========\n");
}

// Export các function
export {
  exampleCreatePackage,
  exampleCreateSessionPackage,
  exampleGetAllPackages,
  exampleUserRegisterPackage,
  exampleGetUserPackageInfo,
  exampleRenewPackage,
  exampleUseSession,
  exampleUpdatePackage,
  exampleCompleteWorkflow,
};

/**
 * ================================================
 * CẤU TRÚC FIRESTORE
 * ================================================
 *
 * packages/
 *   └── {packageId}/
 *       ├── PackageId: string (auto-generated)
 *       ├── PackageName: string
 *       ├── PackageType: "time" | "session"
 *       ├── Description: string
 *       ├── Duration: number (ngày)
 *       ├── Price: number
 *       ├── Status: "active" | "inactive"
 *       ├── NumberOfSession: number | null
 *       ├── Discount: number (%)
 *       ├── StartDayDiscount: timestamp
 *       ├── EndDayDiscount: timestamp
 *       ├── UsageCondition: string
 *       ├── CreatedAt: timestamp
 *       └── UpdatedAt: timestamp
 *
 * users/
 *   └── {userId}/
 *       ├── _id: string
 *       ├── full_name: string
 *       ├── current_package_id: string (references packages/{packageId})
 *       ├── package_end_date: timestamp
 *       ├── remaining_sessions: number | null
 *       ├── membership_status: "Active" | "Expired" | "Frozen" | "Trial"
 *       └── ...
 */
