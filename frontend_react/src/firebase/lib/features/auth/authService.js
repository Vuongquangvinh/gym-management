// src/firebase/lib/features/auth/authService.js
import { UserModel } from "../user/user.model.js";
import { SpendingUserModel } from "../user/spendingUser.model.js";

/**
 * Service xử lý authentication với logic mới:
 * 1. Admin tạo tài khoản trong spending_users
 * 2. User đăng nhập lần đầu -> chuyển từ spending_users sang users
 * 3. User đăng nhập bình thường từ users
 */
export class AuthService {
  /**
   * Đăng nhập cho user - kiểm tra cả spending_users và users
   * @param {string} phoneNumber - Số điện thoại
   * @param {string} password - Mật khẩu (có thể null cho lần đầu)
   * @returns {Object} { user, isFirstTime }
   */
  static async login(phoneNumber, password = null) {
    try {
      // 1. Kiểm tra xem user đã tồn tại trong users chưa
      const existingUser = await UserModel.getByPhoneNumber(phoneNumber);

      if (existingUser) {
        // User đã tồn tại - đăng nhập bình thường
        if (!password) {
          throw new Error("Vui lòng nhập mật khẩu.");
        }

        const user = await UserModel.login(phoneNumber, password);
        return { user, isFirstTime: false };
      }

      // 2. Kiểm tra trong spending_users
      const spendingUser = await SpendingUserModel.getByPhoneNumber(
        phoneNumber
      );

      if (!spendingUser) {
        throw new Error("Số điện thoại chưa được đăng ký.");
      }

      // 3. Đây là lần đăng nhập đầu tiên - chuyển từ spending_users sang users
      const newUser = await UserModel.firstTimeLogin(phoneNumber);
      return { user: newUser, isFirstTime: true };
    } catch (error) {
      console.error("Lỗi trong AuthService.login:", error);
      throw error;
    }
  }

  /**
   * Kiểm tra số điện thoại có tồn tại trong hệ thống không
   * @param {string} phoneNumber - Số điện thoại
   * @returns {Object} { exists, isInUsers, isInSpendingUsers }
   */
  static async checkPhoneNumber(phoneNumber) {
    try {
      const [userExists, spendingUserExists] = await Promise.all([
        UserModel.getByPhoneNumber(phoneNumber),
        SpendingUserModel.getByPhoneNumber(phoneNumber),
      ]);

      return {
        exists: !!(userExists || spendingUserExists),
        isInUsers: !!userExists,
        isInSpendingUsers: !!spendingUserExists,
      };
    } catch (error) {
      console.error("Lỗi khi kiểm tra số điện thoại:", error);
      return {
        exists: false,
        isInUsers: false,
        isInSpendingUsers: false,
      };
    }
  }

  /**
   * Tạo tài khoản mới bởi admin (lưu vào spending_users)
   * @param {Object} userData - Dữ liệu user
   * @returns {SpendingUserModel} spending user đã tạo
   */
  static async createUserByAdmin(userData) {
    try {
      // Kiểm tra số điện thoại đã tồn tại chưa
      const phoneCheck = await AuthService.checkPhoneNumber(
        userData.phone_number
      );

      if (phoneCheck.exists) {
        throw new Error("Số điện thoại này đã được sử dụng.");
      }

      // Tạo trong spending_users
      const spendingUser = await SpendingUserModel.create(userData);
      return spendingUser;
    } catch (error) {
      console.error("Lỗi khi tạo user bởi admin:", error);
      throw error;
    }
  }

  /**
   * Xóa spending user (dùng khi payment fail)
   * @param {string} userId - ID của spending user
   */
  static async deleteSpendingUser(userId) {
    try {
      await SpendingUserModel.delete(userId);
      console.log("✅ Đã xóa spending user:", userId);
    } catch (error) {
      console.error("❌ Lỗi khi xóa spending user:", error);
      throw error;
    }
  }

  /**
   * Lấy thông tin user từ cả hai collection
   * @param {string} phoneNumber - Số điện thoại
   * @returns {Object|null} thông tin user hoặc null
   */
  static async getUserByPhoneNumber(phoneNumber) {
    try {
      // Kiểm tra trong users trước
      const user = await UserModel.getByPhoneNumber(phoneNumber);
      if (user) {
        return { user, source: "users" };
      }

      // Sau đó kiểm tra trong spending_users
      const spendingUser = await SpendingUserModel.getByPhoneNumber(
        phoneNumber
      );
      if (spendingUser) {
        return { user: spendingUser, source: "spending_users" };
      }

      return null;
    } catch (error) {
      console.error("Lỗi khi lấy thông tin user:", error);
      return null;
    }
  }
}

export default AuthService;
