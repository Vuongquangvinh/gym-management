import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "../../config/firebase.js"; // Import instance `auth` từ file config

export const verifyResetCode = (oobCode) => {
  return verifyPasswordResetCode(auth, oobCode);
};

// Đặt lại mật khẩu mới
export const confirmResetPassword = (oobCode, newPassword) => {
  return confirmPasswordReset(auth, oobCode, newPassword);
};
/**
 * Hàm đăng nhập bằng email và mật khẩu.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export const signIn = (email, password) => {
  // 1. Thực hiện đăng nhập
  return signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      const idToken = await user.getIdToken(/* forceRefresh */ true);
      return {
        user: user,
        token: idToken,
      };
    })
    .catch((error) => {
      // 5. Xử lý lỗi đăng nhập (ví dụ: email sai, mật khẩu sai)
      console.error("Đăng nhập thất bại:", error.code, error.message);
      // Rút ngắn mã lỗi để dễ xử lý hơn ở UI
      throw new Error(error.code);
    });
};

/**
 * Hàm đăng xuất người dùng hiện tại.
 * @returns {Promise<void>}
 */
export const signOutUser = () => {
  return signOut(auth);
};

/**
 * Lắng nghe và theo dõi sự thay đổi trạng thái xác thực của người dùng.
 * @param {function} callback - Hàm sẽ được gọi mỗi khi trạng thái auth thay đổi.
 * @returns {Unsubscribe} - Một hàm để hủy lắng nghe.
 */
export const onAuthObserver = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const forgotPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};

export const changePassword = async (currentPassword, newPassword) => {
  console.log(
    "🚀 ~ changePassword ~ currentPassword, newPassword:",
    currentPassword,
    newPassword
  );
  const user = auth.currentUser;
  console.log("🚀 ~ changePassword ~ user:", user.email);

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  return updatePassword(user, newPassword);
};
