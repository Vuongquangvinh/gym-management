import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";
import Joi from "joi"; // npm i joi cho validation

// Schema validation với Joi
const checkinSchema = Joi.object({
  checkedAt: Joi.date().required(),
  locationId: Joi.string().allow(""),
  memberId: Joi.string().required(),
  memberName: Joi.string().required(),
  packageId: Joi.string().allow(""),
  source: Joi.string().valid("QR", "manual").required(),
});

/**
 * Class CheckinModel cho Firestore (client-side)
 */
export class CheckinModel {
  constructor({
    id = "",
    checkedAt = new Date().toISOString(),
    locationId = "",
    memberId = "",
    memberName = "",
    packageId = "",
    source = "manual",
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id;
    this.checkedAt = checkedAt;
    this.locationId = locationId;
    this.memberId = memberId;
    this.memberName = memberName;
    this.packageId = packageId;
    this.source = source;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Validate dữ liệu
  static validate(data) {
    const { error, value } = checkinSchema.validate(data, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      throw new Error(`Lỗi validation: ${messages}`);
    }
    return value;
  }

  // Chuẩn bị payload để lưu vào Firestore
  static prepare(data) {
    return {
      ...data,
      checkedAt: data.checkedAt || new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
  }

  // Tạo check-in mới
  static async create(data) {
    const validated = this.validate(data);
    const prepared = this.prepare(validated);
    const col = collection(db, "checkins");
    const docRef = await addDoc(col, prepared);
    return new CheckinModel({ id: docRef.id, ...prepared });
  }

  // Lấy check-in theo ID
  static async getById(id) {
    const docRef = doc(db, "checkins", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return new CheckinModel({ id: docSnap.id, ...docSnap.data() });
  }

  // Lấy tất cả check-ins
  static async getAll({ limit = 10 } = {}) {
    const q = query(collection(db, "checkins"), orderBy("checkedAt", "desc"), limit(limit));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (docSnap) => new CheckinModel({ id: docSnap.id, ...docSnap.data() })
    );
  }

  // Cập nhật check-in
  static async update(id, updateData) {
    const validated = this.validate(updateData);
    const docRef = doc(db, "checkins", id);
    await updateDoc(docRef, {
      ...validated,
      updatedAt: serverTimestamp(),
    });
  }

  // Xóa check-in
  static async delete(id) {
    const docRef = doc(db, "checkins", id);
    await deleteDoc(docRef);
  }

  /**
   * Chuẩn hóa dữ liệu check-in từ Firestore
   * @param {object} data
   * @returns {object}
   */
  static normalizeCheckin(data) {
    return {
      id: data.id || "",
      checkedAt: data.checkedAt || new Date().toISOString(),
      locationId: data.locationId || "",
      memberId: data.memberId || "",
      memberName: data.memberName || "",
      packageId: data.packageId || "",
      source: data.source || "manual",
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    };
  }
}

export default CheckinModel;
