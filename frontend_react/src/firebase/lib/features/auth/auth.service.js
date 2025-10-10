import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../../config/firebase.js"; // Import instance `auth` từ file config

/**
 * Hàm đăng nhập bằng email và mật khẩu.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export const signIn = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
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
