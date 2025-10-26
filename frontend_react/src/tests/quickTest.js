/**
 * ================================================
 * QUICK TEST SCRIPT
 * ================================================
 * File này để test nhanh các tính năng Package-User
 * Chạy: node src/tests/quickTest.js (sau khi build)
 */

import { PackageModel } from "../firebase/lib/features/package/packages.model.js";
import UserModel from "../firebase/lib/features/user/user.model.js";

async function quickTest() {
  console.log("🧪 BẮT ĐẦU QUICK TEST\n");

  try {
    // Test 1: Tạo package
    console.log("📝 Test 1: Tạo package mới...");
    const packageData = {
      PackageId: "",
      PackageName: "Gói Test 3 Tháng",
      PackageType: "time",
      Description: "Gói test 3 tháng không giới hạn",
      Duration: 90,
      Price: 2000000,
      Status: "active",
      Discount: 10,
      StartDayDiscount: new Date("2025-01-01"),
      EndDayDiscount: new Date("2025-12-31"),
      UsageCondition: "Tập không giới hạn",
    };

    const newPackage = await PackageModel.create(packageData);
    console.log("✅ Package created:", newPackage.id);

    // Test 2: Lấy package vừa tạo
    console.log("\n📝 Test 2: Lấy package vừa tạo...");
    const retrievedPackage = await PackageModel.getById(newPackage.id);
    console.log("✅ Package retrieved:", retrievedPackage.PackageName);

    // Test 3: Tính giá sau discount
    console.log("\n📝 Test 3: Tính giá sau discount...");
    const finalPrice = retrievedPackage.getFinalPrice();
    console.log("Giá gốc:", retrievedPackage.Price);
    console.log("Discount:", retrievedPackage.Discount + "%");
    console.log("✅ Giá cuối:", finalPrice);

    // Test 4: Tính ngày hết hạn
    console.log("\n📝 Test 4: Tính ngày hết hạn...");
    const endDate = retrievedPackage.calculateEndDate(new Date());
    console.log("✅ Ngày hết hạn:", endDate.toLocaleDateString("vi-VN"));

    // Test 5: Lấy tất cả packages
    console.log("\n📝 Test 5: Lấy danh sách packages...");
    const allPackages = await PackageModel.getAll({ status: "active" });
    console.log("✅ Tổng số packages active:", allPackages.length);

    // Test 6: User đăng ký package (cần có user trong DB)
    console.log(
      "\n📝 Test 6: Test user registration (skip nếu chưa có user)..."
    );
    // const testUser = await UserModel.getByPhoneNumber("0987654321");
    // if (testUser) {
    //   const result = await testUser.registerPackage(newPackage.id);
    //   console.log("✅ Registration result:", result.message);
    //   console.log("Package end date:", result.endDate);
    // } else {
    //   console.log("⚠️ Skip - Chưa có user test");
    // }

    console.log("\n🎉 TẤT CẢ TEST PASSED!");
    console.log("\n📊 Tóm tắt:");
    console.log("- Package ID:", newPackage.id);
    console.log("- Package Name:", retrievedPackage.PackageName);
    console.log("- Duration:", retrievedPackage.Duration, "ngày");
    console.log("- Final Price:", finalPrice.toLocaleString("vi-VN"), "₫");
    console.log("- End Date:", endDate.toLocaleDateString("vi-VN"));

    return {
      success: true,
      packageId: newPackage.id,
    };
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.message);
    console.error(error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run test (for browser environment)
if (typeof window !== "undefined") {
  // Running in browser
  quickTest().then((result) => {
    if (result.success) {
      console.log("\n✅ QUICK TEST HOÀN TẤT");
    } else {
      console.log("\n❌ QUICK TEST THẤT BẠI");
    }
  });
}

export default quickTest;
