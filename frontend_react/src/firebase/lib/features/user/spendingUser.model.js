// src/firebase/lib/features/user/spendingUser.model.js
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
  serverTimestamp,
  Timestamp,
  limit as fsLimit,
  startAfter as fsStartAfter,
  orderBy,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";
import Joi from "joi";

// Schema validation cho spending_users (không có password)
const spendingUserSchema = Joi.object({
  _id: Joi.string().required(),
  full_name: Joi.string().min(2).required(),
  phone_number: Joi.string().required(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .allow("")
    .optional(),
  avatar_url: Joi.string().uri().allow("").optional(),
  date_of_birth: Joi.date().required(),
  gender: Joi.string().valid("male", "female", "other").required(),
  membership_status: Joi.string()
    .valid("Active", "Expired", "Frozen", "Trial")
    .required(),
  current_package_id: Joi.string().required(),
  package_end_date: Joi.date().required(),
  remaining_sessions: Joi.number().allow(null).optional(),
  frozen_history: Joi.array()
    .items(
      Joi.object({
        start: Joi.date().required(),
        end: Joi.date().required(),
      })
    )
    .optional(),
  join_date: Joi.date().required(),
  assigned_staff_id: Joi.string().allow("").optional(),
  last_checkin_time: Joi.date().allow(null).optional(),
  lead_source: Joi.string().allow("").optional(),
  fitness_goal: Joi.array().items(Joi.string()).optional(),
  medical_conditions: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
  initial_measurements: Joi.object().optional(),
  createdAt: Joi.any().optional(),
  updatedAt: Joi.any().optional(),
  // Trường đặc biệt để đánh dấu đã được chuyển đổi
  isTransferred: Joi.boolean().optional(),
});

/**
 * Class SpendingUserModel cho collection spending_users
 * Dành cho việc admin tạo tài khoản trước khi user đăng nhập lần đầu
 */
export class SpendingUserModel {
  constructor({
    _id = "",
    full_name = "",
    phone_number = "",
    email = "",
    avatar_url = "",
    date_of_birth = null,
    gender = "other",
    membership_status = "Active",
    current_package_id = "",
    package_end_date = null,
    remaining_sessions = null,
    frozen_history = [],
    join_date = null,
    assigned_staff_id = "",
    last_checkin_time = null,
    lead_source = "",
    fitness_goal = [],
    medical_conditions = [],
    initial_measurements = {},
    isActive = true,
    isTransferred = false,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this._id = _id;
    this.full_name = full_name;
    this.phone_number = phone_number;
    this.email = email;
    this.avatar_url = avatar_url;
    this.date_of_birth = date_of_birth;
    this.gender = gender;
    this.membership_status = membership_status;
    this.current_package_id = current_package_id;
    this.package_end_date = package_end_date;
    this.remaining_sessions = remaining_sessions;
    this.frozen_history = frozen_history;
    this.join_date = join_date;
    this.assigned_staff_id = assigned_staff_id;
    this.last_checkin_time = last_checkin_time;
    this.lead_source = lead_source;
    this.fitness_goal = fitness_goal;
    this.medical_conditions = medical_conditions;
    this.initial_measurements = initial_measurements;
    this.isActive = isActive;
    this.isTransferred = isTransferred;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Chuyển đổi instance thành plain object để lưu vào Firestore
  toFirestore() {
    const data = { ...this };
    Object.keys(data).forEach((key) => {
      if (data[key] instanceof Date) {
        data[key] = Timestamp.fromDate(data[key]);
      }
    });
    if (Array.isArray(data.frozen_history)) {
      data.frozen_history = data.frozen_history.map((item) => ({
        start:
          item.start instanceof Date
            ? Timestamp.fromDate(item.start)
            : item.start,
        end: item.end instanceof Date ? Timestamp.fromDate(item.end) : item.end,
      }));
    }
    if (
      data.initial_measurements &&
      data.initial_measurements.date instanceof Date
    ) {
      data.initial_measurements.date = Timestamp.fromDate(
        data.initial_measurements.date
      );
    }
    return data;
  }

  static validate(data) {
    // Tạo một bản sao của data để tránh thay đổi đối tượng gốc
    const dataToValidate = { ...data };

    // Xóa các thuộc tính không cần validate khỏi bản sao
    delete dataToValidate.createdAt;
    delete dataToValidate.updatedAt;

    // Tiến hành validate trên đối tượng đã được làm sạch
    const { error, value } = spendingUserSchema.validate(dataToValidate, {
      abortEarly: false,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      throw new Error(`Lỗi validation: ${messages}`);
    }
    return value;
  }

  // Tạo spending user mới (admin tạo trước khi user đăng nhập)
  static async create(userData) {
    try {
      console.log(
        "🔵 SpendingUserModel.create() - userData nhận được:",
        userData
      );

      // 1. Kiểm tra xem số điện thoại đã tồn tại trong spending_users chưa
      const existingSpendingUserQuery = query(
        collection(db, "spending_users"),
        where("phone_number", "==", userData.phone_number)
      );
      const existingSpendingUserSnapshot = await getDocs(
        existingSpendingUserQuery
      );

      if (!existingSpendingUserSnapshot.empty) {
        console.log("❌ Số điện thoại đã tồn tại trong spending_users");
        throw new Error("Số điện thoại này đã được tạo trong hệ thống.");
      }

      // 2. Kiểm tra xem số điện thoại đã tồn tại trong users chưa
      const existingUserQuery = query(
        collection(db, "users"),
        where("phone_number", "==", userData.phone_number)
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);

      if (!existingUserSnapshot.empty) {
        console.log("❌ Số điện thoại đã tồn tại trong users");
        throw new Error(
          "Số điện thoại này đã được sử dụng bởi người dùng khác."
        );
      }

      // 3. Tạo ID tự động cho spending user
      const spendingUserId = doc(collection(db, "spending_users")).id;
      console.log("🆔 Generated spendingUserId:", spendingUserId);

      // 4. Gán _id và validate dữ liệu
      const dataToSave = {
        ...userData,
        _id: spendingUserId,
        isTransferred: false,
      };

      console.log("📝 dataToSave trước khi validate:", dataToSave);

      const validatedData = SpendingUserModel.validate(dataToSave);
      console.log("✅ Validation thành công, validatedData:", validatedData);

      // 5. Tạo instance và lưu vào Firestore
      const newSpendingUser = new SpendingUserModel({
        ...validatedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const docRef = doc(db, "spending_users", spendingUserId);
      const firestoreData = newSpendingUser.toFirestore();

      console.log("💾 firestoreData sẽ được lưu:", firestoreData);
      console.log(
        "📍 Đang lưu vào Firestore collection: spending_users, doc:",
        spendingUserId
      );

      await setDoc(docRef, firestoreData);
      console.log("✅ Đã lưu thành công vào Firestore!");

      // 6. Trả về instance đã tạo
      newSpendingUser._id = spendingUserId;
      return newSpendingUser;
    } catch (error) {
      console.error("❌ Lỗi khi tạo spending user:", error);
      console.error("❌ Error stack:", error.stack);
      throw new Error(`Không thể tạo thông tin người dùng: ${error.message}`);
    }
  }

  // Lấy spending user theo số điện thoại
  static async getByPhoneNumber(phoneNumber) {
    try {
      const spendingUserQuery = query(
        collection(db, "spending_users"),
        where("phone_number", "==", phoneNumber),
        where("isTransferred", "==", false)
      );
      const spendingUserSnapshot = await getDocs(spendingUserQuery);

      if (spendingUserSnapshot.empty) {
        return null;
      }

      const spendingUserDoc = spendingUserSnapshot.docs[0];
      const spendingUserData = spendingUserDoc.data();

      // Chuyển đổi Timestamp về JS Date
      Object.keys(spendingUserData).forEach((key) => {
        if (spendingUserData[key] instanceof Timestamp) {
          spendingUserData[key] = spendingUserData[key].toDate();
        }
      });

      if (Array.isArray(spendingUserData.frozen_history)) {
        spendingUserData.frozen_history = spendingUserData.frozen_history.map(
          (item) => ({
            start:
              item.start instanceof Timestamp
                ? item.start.toDate()
                : item.start,
            end: item.end instanceof Timestamp ? item.end.toDate() : item.end,
          })
        );
      }

      if (
        spendingUserData.initial_measurements &&
        spendingUserData.initial_measurements.date instanceof Timestamp
      ) {
        spendingUserData.initial_measurements.date =
          spendingUserData.initial_measurements.date.toDate();
      }

      return new SpendingUserModel({
        _id: spendingUserDoc.id,
        ...spendingUserData,
      });
    } catch (error) {
      console.error("Lỗi khi lấy spending user:", error);
      throw error;
    }
  }

  // Lấy spending user theo ID
  static async getById(id) {
    const docRef = doc(db, "spending_users", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    // Chuyển đổi Timestamp về JS Date
    Object.keys(data).forEach((key) => {
      if (data[key] instanceof Timestamp) {
        data[key] = data[key].toDate();
      }
    });
    // Xử lý initial_measurements.date
    if (
      data.initial_measurements &&
      data.initial_measurements.date instanceof Timestamp
    ) {
      data.initial_measurements.date = data.initial_measurements.date.toDate();
    }
    return new SpendingUserModel({ _id: docSnap.id, ...data });
  }

  // Cập nhật một phần dữ liệu cho spending user
  static async update(id, updateData) {
    const docRef = doc(db, "spending_users", id);
    const dataToUpdate = { ...updateData };

    // Danh sách các trường ngày tháng cần chuyển đổi
    const dateFields = [
      "date_of_birth",
      "package_end_date",
      "join_date",
      "last_checkin_time",
      "createdAt",
      "updatedAt",
    ];

    dateFields.forEach((field) => {
      if (dataToUpdate[field]) {
        // Nếu là string thì chuyển sang Date
        if (typeof dataToUpdate[field] === "string") {
          dataToUpdate[field] = new Date(dataToUpdate[field]);
        }
        // Nếu là Timestamp (Firestore) thì chuyển sang Date
        if (dataToUpdate[field]?.toDate) {
          dataToUpdate[field] = dataToUpdate[field].toDate();
        }
      }
    });

    if (Array.isArray(dataToUpdate.frozen_history)) {
      dataToUpdate.frozen_history = dataToUpdate.frozen_history.map((item) => {
        let start = item.start;
        let end = item.end;
        if (typeof start === "string") start = new Date(start);
        if (start?.toDate) start = start.toDate();
        if (typeof end === "string") end = new Date(end);
        if (end?.toDate) end = end.toDate();
        return { start, end };
      });
    }

    if (
      dataToUpdate.initial_measurements &&
      dataToUpdate.initial_measurements.date
    ) {
      if (typeof dataToUpdate.initial_measurements.date === "string") {
        dataToUpdate.initial_measurements.date = new Date(
          dataToUpdate.initial_measurements.date
        );
      }
      if (dataToUpdate.initial_measurements.date?.toDate) {
        dataToUpdate.initial_measurements.date =
          dataToUpdate.initial_measurements.date.toDate();
      }
    }

    Object.keys(dataToUpdate).forEach((key) => {
      if (dataToUpdate[key] instanceof Date) {
        dataToUpdate[key] = Timestamp.fromDate(dataToUpdate[key]);
      }
    });

    await updateDoc(docRef, {
      ...dataToUpdate,
      updatedAt: serverTimestamp(),
    });
  }

  // Đánh dấu spending user đã được chuyển đổi
  static async markAsTransferred(id) {
    const docRef = doc(db, "spending_users", id);
    await updateDoc(docRef, {
      isTransferred: true,
      updatedAt: serverTimestamp(),
    });
  }

  // Xóa spending user (sau khi đã chuyển thành công)
  static async delete(id) {
    const docRef = doc(db, "spending_users", id);
    await deleteDoc(docRef);
  }

  /**
   * Lấy danh sách spending users với phân trang
   * @param {Object} filters - bộ lọc
   * @param {number} limit - số lượng user mỗi lần lấy
   * @param {any} startAfterDoc - docSnapshot để bắt đầu sau (hoặc null)
   * @returns {Object} { users, lastDoc, hasMore }
   */
  static async getAll(filters = {}, limit = 10, startAfterDoc = null) {
    const spendingUsersCollectionRef = collection(db, "spending_users");
    let queryConstraints = [];

    // Chỉ lấy những user chưa được chuyển đổi
    queryConstraints.push(where("isTransferred", "==", false));

    if (filters.status === "about-to-expire") {
      const today = new Date();
      const aWeekFromNow = new Date();
      aWeekFromNow.setDate(today.getDate() + 7);

      queryConstraints.push(where("package_end_date", ">=", today));
      queryConstraints.push(where("package_end_date", "<=", aWeekFromNow));
      queryConstraints.push(orderBy("package_end_date"));
    } else if (filters.status) {
      queryConstraints.push(where("membership_status", "==", filters.status));
    } else if (filters.searchQuery && !filters.status) {
      const searchQuery = filters.searchQuery.trim();

      if (/^\d+$/.test(searchQuery)) {
        queryConstraints.push(where("phone_number", "==", searchQuery));
      } else {
        queryConstraints.push(where("full_name", ">=", searchQuery));
        queryConstraints.push(where("full_name", "<=", searchQuery + "\uf8ff"));
        queryConstraints.push(orderBy("full_name"));
      }
    } else {
      queryConstraints.push(orderBy("createdAt", "desc"));
    }

    // Thêm phân trang
    queryConstraints.push(fsLimit(limit));
    if (startAfterDoc) {
      queryConstraints.push(fsStartAfter(startAfterDoc));
    }

    const finalQuery = query(spendingUsersCollectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(finalQuery);

    const users = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      Object.keys(data).forEach((field) => {
        if (data[field] instanceof Timestamp) {
          data[field] = data[field].toDate();
        }
      });
      if (Array.isArray(data.frozen_history)) {
        data.frozen_history = data.frozen_history.map((item) => ({
          start:
            item.start instanceof Timestamp ? item.start.toDate() : item.start,
          end: item.end instanceof Timestamp ? item.end.toDate() : item.end,
        }));
      }
      if (
        data.initial_measurements &&
        data.initial_measurements.date instanceof Timestamp
      ) {
        data.initial_measurements.date =
          data.initial_measurements.date.toDate();
      }
      return new SpendingUserModel({ _id: docSnap.id, ...data });
    });

    const lastDoc =
      querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;
    const hasMore = querySnapshot.docs.length === limit;

    return { users, lastDoc, hasMore };
  }

  // Số liệu thống kê cho spending users
  static async getDashboardStats() {
    try {
      const spendingUsersCollectionRef = collection(db, "spending_users");

      const totalQuery = query(
        spendingUsersCollectionRef,
        where("isTransferred", "==", false)
      );

      const activeQuery = query(
        spendingUsersCollectionRef,
        where("membership_status", "==", "Active"),
        where("isTransferred", "==", false)
      );

      const today = new Date();
      const aWeekFromNow = new Date();
      aWeekFromNow.setDate(today.getDate() + 7);

      const expiringQuery = query(
        spendingUsersCollectionRef,
        where("package_end_date", ">=", today),
        where("package_end_date", "<=", aWeekFromNow),
        where("isTransferred", "==", false)
      );

      const [totalSnapshot, activeSnapshot, expiringSnapshot] =
        await Promise.all([
          getCountFromServer(totalQuery),
          getCountFromServer(activeQuery),
          getCountFromServer(expiringQuery),
        ]);

      return {
        total: totalSnapshot.data().count,
        active: activeSnapshot.data().count,
        expiring: expiringSnapshot.data().count,
      };
    } catch (error) {
      console.error("Lỗi khi lấy số liệu thống kê spending users:", error);
      return { total: 0, active: 0, expiring: 0 };
    }
  }
}

export default SpendingUserModel;
