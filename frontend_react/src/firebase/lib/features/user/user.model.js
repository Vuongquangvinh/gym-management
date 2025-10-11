// src/services/userModel.js
// Model User cho React + Firebase (client-side Firestore)
// Sử dụng Firebase SDK để CRUD users, không cần Node.js backend

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../config/firebase.js"; // Import Firestore và Auth
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import Joi from "joi"; // npm i joi cho validation

// Schema validation với Joi
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).required(),
  dob: Joi.date().optional(),
  phone: Joi.string().optional(),
  role: Joi.string().valid("client", "admin", "manager").required(),
  gymId: Joi.string().optional(), // Ref đến gyms
  packageId: Joi.string().optional(), // Ref đến packages
  expiryDate: Joi.date().optional(),
  isActive: Joi.boolean().default(true),
});

/**
 * Class UserModel cho Firestore (client-side)
 */
export class UserModel {
  constructor({
    id = "",
    email = "",
    name = "",
    phone = "",
    role = "client",
    packageId = "",
    expiryDate = null,
    isActive = true,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id; // UID từ Firebase Auth
    this.email = email;
    this.name = name;
    this.phone = phone;
    this.role = role;
    this.packageId = packageId;
    this.expiryDate = expiryDate;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Validate data
  static validate(data) {
    const { error, value } = userSchema.validate(data, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      throw new Error(`Lỗi validation: ${messages}`);
    }
    return value;
  }

  // Tạo user mới (tạo Auth + Firestore doc)
  static async create(userData, password) {
    const validated = this.validate(userData);
    try {
      // Tạo Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        validated.email,
        password
      );
      const uid = userCredential.user.uid;

      // Lưu Firestore
      const newUser = new UserModel({
        id: uid,
        ...validated,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await newUser.save();

      // Gửi verify email
      await sendEmailVerification(userCredential.user);
      return newUser;
    } catch (error) {
      console.error("Lỗi tạo user:", error);
      throw new Error(`Lỗi tạo user: ${error.message}`);
    }
  }

  // Lưu/Cập nhật Firestore doc
  async save() {
    let validated = UserModel.validate({
      email: this.email,
      name: this.name,
      phone: this.phone,
      role: this.role,
      gymId: this.gymId,
      packageId: this.packageId,
      expiryDate: this.expiryDate,
      isActive: this.isActive,
    });
    // Loại bỏ các field undefined
    Object.keys(validated).forEach((key) => {
      if (validated[key] === undefined) {
        delete validated[key];
      }
    });
    const docRef = doc(db, "users", this.id);
    await setDoc(
      docRef,
      {
        ...validated,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ); // Merge nếu update
    return this;
  }

  // Lấy user theo ID
  static async getById(id) {
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return new UserModel({
      id: docSnap.id,
      ...data,
    });
  }

  // Lấy user theo email (query)
  static async getByEmail(email) {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    return new UserModel({
      id: docSnap.id,
      ...data,
    });
  }

  // Lấy tất cả users (hoặc filter role/gymId)
  static async getAll({ role = null, gymId = null, limit = 10 } = {}) {
    let q = query(
      collection(db, "users"),
      orderBy("createdAt", "desc"),
      limit(limit)
    );
    if (role) q = query(q, where("role", "==", role));
    if (gymId) q = query(q, where("gymId", "==", gymId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (docSnap) => new UserModel({ id: docSnap.id, ...docSnap.data() })
    );
  }

  // Cập nhật user
  static async update(id, updateData) {
    const validated = UserModel.validate(updateData);
    const docRef = doc(db, "users", id);
    await updateDoc(docRef, {
      ...validated,
      updatedAt: serverTimestamp(),
    });
  }

  // Xóa user (xóa Auth + Firestore)
  static async delete(id) {
    // Xóa Firestore trước
    const docRef = doc(db, "users", id);
    await deleteDoc(docRef);

    // Xóa Firebase Auth
    const user = auth.currentUser;
    if (user && user.uid === id) {
      await auth.signOut(); // Nếu là user hiện tại
    }
    await auth.deleteUser(id); // Cần re-auth nếu không phải current user
  }
}

export default UserModel;
