// HƯỚNG DẪN SỬ DỤNG HỆ THỐNG MỚI
// =================================

/**
 * HỆ THỐNG CŨ:
 * 1. Admin/User đăng ký bằng email + password
 * 2. Lưu trực tiếp vào collection 'users'
 * 3. Đăng nhập bằng email + password
 */

/**
 * HỆ THỐNG MỚI:
 * 1. Admin tạo tài khoản bằng số điện thoại (không cần password)
 * 2. Lưu vào collection 'spending_users'
 * 3. User đăng nhập lần đầu bằng số điện thoại
 * 4. Hệ thống tự động chuyển từ 'spending_users' sang 'users'
 * 5. Lần đăng nhập tiếp theo sẽ từ collection 'users'
 */

import AuthService from "../firebase/lib/features/auth/authService.js";
import SpendingUserModel from "../firebase/lib/features/user/spendingUser.model.js";
import UserModel from "../firebase/lib/features/user/user.model.js";

// EXAMPLE 1: ADMIN TẠO TÀI KHOẢN CHO USER
async function exampleAdminCreateUser() {
  const userData = {
    full_name: "Nguyễn Văn A",
    phone_number: "0987654321",
    email: "nguyenvana@example.com",
    avatar_url: "",
    date_of_birth: new Date("1990-01-01"),
    gender: "male",
    membership_status: "Active",
    current_package_id: "package123",
    package_end_date: new Date("2024-12-31"),
    join_date: new Date(),
    assigned_staff_id: "staff456",
    fitness_goal: ["Giảm cân", "Tăng cơ"],
    medical_conditions: [],
    initial_measurements: {
      weight: 70,
      height: 175,
    },
  };

  try {
    // Admin tạo tài khoản (lưu vào spending_users)
    const spendingUser = await AuthService.createUserByAdmin(userData);
    console.log("✅ Admin đã tạo tài khoản:", spendingUser);

    // Hoặc sử dụng trực tiếp SpendingUserModel
    // const spendingUser = await SpendingUserModel.create(userData);
  } catch (error) {
    console.error("❌ Lỗi khi tạo tài khoản:", error.message);
  }
}

// EXAMPLE 2: USER ĐĂNG NHẬP LẦN ĐẦU TIÊN
async function exampleUserFirstLogin() {
  const phoneNumber = "0987654321";

  try {
    // Kiểm tra trạng thái số điện thoại
    const phoneCheck = await AuthService.checkPhoneNumber(phoneNumber);
    console.log("📱 Trạng thái số điện thoại:", phoneCheck);
    // Output: { exists: true, isInUsers: false, isInSpendingUsers: true }

    // User đăng nhập lần đầu (không cần password)
    const loginResult = await AuthService.login(phoneNumber);
    console.log("🎉 Đăng nhập thành công:", loginResult);
    // Output: { user: UserModel, isFirstTime: true }

    if (loginResult.isFirstTime) {
      console.log("🆕 Đây là lần đăng nhập đầu tiên!");
      console.log("📝 Tài khoản đã được chuyển từ spending_users sang users");
    }
  } catch (error) {
    console.error("❌ Lỗi đăng nhập:", error.message);
  }
}

// EXAMPLE 3: USER ĐĂNG NHẬP LẦN TIẾP THEO (cần password)
async function exampleUserRegularLogin() {
  const phoneNumber = "0987654321";
  const password = "userpassword123"; // User sẽ cần đặt password sau lần đăng nhập đầu

  try {
    // Kiểm tra trạng thái số điện thoại
    const phoneCheck = await AuthService.checkPhoneNumber(phoneNumber);
    console.log("📱 Trạng thái số điện thoại:", phoneCheck);
    // Output: { exists: true, isInUsers: true, isInSpendingUsers: false }

    // User đăng nhập với password
    const loginResult = await AuthService.login(phoneNumber, password);
    console.log("✅ Đăng nhập thành công:", loginResult);
    // Output: { user: UserModel, isFirstTime: false }
  } catch (error) {
    console.error("❌ Lỗi đăng nhập:", error.message);
  }
}

// EXAMPLE 4: ADMIN XEM DANH SÁCH SPENDING USERS
async function exampleAdminViewSpendingUsers() {
  try {
    // Lấy danh sách spending users (chưa được kích hoạt)
    const result = await SpendingUserModel.getAll({}, 10);
    console.log("📋 Danh sách spending users:", result);

    // Lấy thống kê
    const stats = await SpendingUserModel.getDashboardStats();
    console.log("📊 Thống kê spending users:", stats);
  } catch (error) {
    console.error("❌ Lỗi khi lấy dữ liệu:", error.message);
  }
}

// EXAMPLE 5: KIỂM TRA USER TỒN TẠI
async function exampleCheckUserExists() {
  const phoneNumber = "0987654321";

  try {
    // Tìm user trong cả hai collection
    const userInfo = await AuthService.getUserByPhoneNumber(phoneNumber);

    if (userInfo) {
      console.log(`👤 User tồn tại trong collection: ${userInfo.source}`);
      console.log("📄 Thông tin user:", userInfo.user);
    } else {
      console.log("❌ Không tìm thấy user");
    }
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra user:", error.message);
  }
}

// CÁC COLLECTION TRONG FIRESTORE:
// ===============================

/**
 * Collection: spending_users
 * - Chứa tài khoản được admin tạo nhưng chưa được user kích hoạt
 * - Không có password
 * - Có trường isTransferred để đánh dấu đã chuyển
 *
 * Collection: users
 * - Chứa tài khoản đã được user kích hoạt (đăng nhập lần đầu)
 * - Có password (nếu user đặt)
 * - Được chuyển từ spending_users
 */

// FIRESTORE STRUCTURE:
/**
 * spending_users/
 *   └── {documentId}/
 *       ├── _id: string
 *       ├── full_name: string
 *       ├── phone_number: string
 *       ├── email: string (optional)
 *       ├── date_of_birth: timestamp
 *       ├── gender: "male" | "female" | "other"
 *       ├── membership_status: "Active" | "Expired" | "Frozen" | "Trial"
 *       ├── current_package_id: string
 *       ├── package_end_date: timestamp
 *       ├── join_date: timestamp
 *       ├── initial_measurements: object
 *       ├── isTransferred: boolean (false by default)
 *       ├── createdAt: timestamp
 *       └── updatedAt: timestamp
 *
 * users/
 *   └── {documentId}/
 *       ├── _id: string
 *       ├── full_name: string
 *       ├── phone_number: string
 *       ├── password: string (hashed, optional)
 *       ├── email: string (optional)
 *       ├── date_of_birth: timestamp
 *       ├── gender: "male" | "female" | "other"
 *       ├── membership_status: "Active" | "Expired" | "Frozen" | "Trial"
 *       ├── current_package_id: string
 *       ├── package_end_date: timestamp
 *       ├── join_date: timestamp
 *       ├── initial_measurements: object
 *       ├── createdAt: timestamp
 *       └── updatedAt: timestamp
 */

export {
  exampleAdminCreateUser,
  exampleUserFirstLogin,
  exampleUserRegularLogin,
  exampleAdminViewSpendingUsers,
  exampleCheckUserExists,
};
