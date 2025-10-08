import admin from "firebase-admin";

/**
 * Class AuthUser cho Firestore
 */
export class AuthUser {
  constructor({
    id = "",
    email = "",
    passwordHash = "",
    role = "user",
    isActive = true,
  } = {}) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.isActive = isActive;
  }

  static get collection() {
    return admin.firestore().collection("auth_users");
  }

  /**
   * Tạo user mới
   */
  async save() {
    const docRef = AuthUser.collection.doc(this.id);
    await docRef.set({
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      role: this.role,
      isActive: this.isActive,
    });
    return this;
  }

  /**
   * Lấy user theo id
   */
  static async getById(id) {
    const docRef = AuthUser.collection.doc(id);
    const docSnap = await docRef.get();
    return docSnap.exists ? new AuthUser(docSnap.data()) : null;
  }

  /**
   * Cập nhật user
   */
  static async update(id, updateData) {
    const docRef = AuthUser.collection.doc(id);
    await docRef.update(updateData);
  }

  /**
   * Xóa user
   */
  static async delete(id) {
    const docRef = AuthUser.collection.doc(id);
    await docRef.delete();
  }
}

export default AuthUser;