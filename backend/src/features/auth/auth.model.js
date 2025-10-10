import admin from "firebase-admin";
import Joi from "joi";  // npm i joi

/**
 * Schema validation với Joi
 */
const userSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ.',
    'any.required': 'Email là bắt buộc.'
  }),
  role: Joi.string().valid("user", "admin", "manager", "client").required().messages({
    'any.only': 'Role phải là user, admin, manager hoặc client.',
  }),
  isActive: Joi.boolean().default(true),
});

/**
 * Class AuthUser cho Firestore
 */
export class AuthUser {
  constructor({
    id = "",
    email = "",
    role = "user",
    isActive = true,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id;  // UID từ Firebase Auth
    this.email = email;
    this.role = role;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static get collection() {
    return admin.firestore().collection("auth_users");
  }

  /**
   * Validate data trước khi save
   */
  static validate(data) {
    const { error, value } = userSchema.validate(data, { abortEarly: false });
    if (error) {
      const messages = error.details.map(d => d.message).join(', ');
      throw new Error(`Lỗi validation: ${messages}`);
    }
    return value;
  }

  /**
   * Tạo user mới
   */
  async save() {
    const validatedData = AuthUser.validate({ email: this.email, role: this.role, isActive: this.isActive });
    const docRef = AuthUser.collection.doc(this.id);
    await docRef.set({
      id: this.id,
      email: validatedData.email,
      role: validatedData.role,
      isActive: validatedData.isActive,
      createdAt: this.createdAt || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    Object.assign(this, validatedData);  // Update instance
    return this;
  }

  /**
   * Lấy user theo id
   */
  static async getById(id) {
    const docRef = AuthUser.collection.doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    const data = docSnap.data();
    return new AuthUser({
      id: docSnap.id,
      email: data.email,
      role: data.role,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * Cập nhật user (validate trước)
   */
  static async update(id, updateData) {
    const validatedData = AuthUser.validate(updateData);
    const docRef = AuthUser.collection.doc(id);
    await docRef.update({
      ...validatedData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
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