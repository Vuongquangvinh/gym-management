// src/services/userModel.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
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
import bcrypt from "bcryptjs";

// Schema validation với Joi (chuẩn hóa theo yêu cầu)
// Chú ý: branch_id đang required, nếu chưa có thì có thể để optional()
const userSchema = Joi.object({
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
  // branch_id: Joi.string().required(), // Nếu chưa có collection branch thì tạm thời comment lại
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
});

/**
 * Class UserModel cho Firestore (client-side)
 */
export class UserModel {
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
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Chuyển đổi instance thành plain object để lưu vào Firestore
  toFirestore() {
    const data = { ...this };
    // Chuyển đổi tất cả các trường Date sang Firestore Timestamp
    Object.keys(data).forEach((key) => {
      if (data[key] instanceof Date) {
        data[key] = Timestamp.fromDate(data[key]);
      }
    });
    // Xử lý mảng frozen_history
    if (Array.isArray(data.frozen_history)) {
      data.frozen_history = data.frozen_history.map((item) => ({
        start:
          item.start instanceof Date
            ? Timestamp.fromDate(item.start)
            : item.start,
        end: item.end instanceof Date ? Timestamp.fromDate(item.end) : item.end,
      }));
    }
    // Xử lý initial_measurements.date
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
    const { error, value } = userSchema.validate(dataToValidate, {
      abortEarly: false,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      throw new Error(`Lỗi validation: ${messages}`);
    }
    return value;
  }
  // Tạo user mới (không dùng Firebase Auth)
  static async create(userData, password) {
    try {
      // 1. Kiểm tra xem số điện thoại đã tồn tại chưa
      const existingUserQuery = query(
        collection(db, "users"),
        where("phone_number", "==", userData.phone_number)
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);

      if (!existingUserSnapshot.empty) {
        throw new Error("Số điện thoại này đã được sử dụng.");
      }

      // 2. Hash password trước khi lưu
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 3. Tạo ID tự động cho user
      const userId = doc(collection(db, "users")).id;

      // 4. Gán _id và validate dữ liệu
      const dataToSave = {
        ...userData,
        _id: userId,
      };

      const validatedData = UserModel.validate(dataToSave);

      // 5. Tạo instance và lưu vào Firestore
      const newUser = new UserModel({
        ...validatedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const docRef = doc(db, "users", userId);
      const firestoreData = newUser.toFirestore();

      // Thêm hashed password vào dữ liệu lưu vào Firestore
      await setDoc(docRef, {
        ...firestoreData,
        password: hashedPassword,
      });

      // 5. Trả về instance đã tạo (không có password)
      newUser._id = userId;
      return newUser;
    } catch (error) {
      console.error("Lỗi khi tạo người dùng:", error);

      // Xử lý các lỗi phổ biến
      if (error.message.includes("Số điện thoại này đã được sử dụng")) {
        throw error;
      }
      if (password && password.length < 6) {
        throw new Error("Mật khẩu quá yếu, cần ít nhất 6 ký tự.");
      }
      throw new Error(`Không thể tạo người dùng: ${error.message}`);
    }
  }

  // Đăng nhập bằng số điện thoại và password
  static async login(phoneNumber, password) {
    try {
      const userQuery = query(
        collection(db, "users"),
        where("phone_number", "==", phoneNumber)
      );
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        throw new Error("Số điện thoại không tồn tại.");
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      // Kiểm tra password bằng bcrypt
      const isPasswordValid = await bcrypt.compare(password, userData.password);
      if (!isPasswordValid) {
        throw new Error("Mật khẩu không đúng.");
      }

      // Chuyển đổi Timestamp về JS Date
      Object.keys(userData).forEach((key) => {
        if (userData[key] instanceof Timestamp) {
          userData[key] = userData[key].toDate();
        }
      });

      if (Array.isArray(userData.frozen_history)) {
        userData.frozen_history = userData.frozen_history.map((item) => ({
          start:
            item.start instanceof Timestamp ? item.start.toDate() : item.start,
          end: item.end instanceof Timestamp ? item.end.toDate() : item.end,
        }));
      }

      if (
        userData.initial_measurements &&
        userData.initial_measurements.date instanceof Timestamp
      ) {
        userData.initial_measurements.date =
          userData.initial_measurements.date.toDate();
      }

      // Trả về user instance (không có password)
      const { password: _, ...userDataWithoutPassword } = userData;
      return new UserModel({ _id: userDoc.id, ...userDataWithoutPassword });
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
      throw error;
    }
  }

  // // Đổi mật khẩu ( ví dụ khi )
  // static async changePassword(userId, oldPassword, newPassword) {
  //   try {
  //     const docRef = doc(db, "users", userId);
  //     const docSnap = await getDoc(docRef);

  //     if (!docSnap.exists()) {
  //       throw new Error("Người dùng không tồn tại.");
  //     }

  //     const userData = docSnap.data();

  //     // Kiểm tra mật khẩu cũ bằng bcrypt
  //     const isOldPasswordValid = await bcrypt.compare(
  //       oldPassword,
  //       userData.password
  //     );
  //     if (!isOldPasswordValid) {
  //       throw new Error("Mật khẩu cũ không đúng.");
  //     }

  //     // Kiểm tra độ mạnh của mật khẩu mới
  //     if (newPassword.length < 6) {
  //       throw new Error("Mật khẩu mới quá yếu, cần ít nhất 6 ký tự.");
  //     }

  //     // Hash mật khẩu mới trước khi cập nhật
  //     const saltRounds = 10;
  //     const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  //     // Cập nhật mật khẩu mới
  //     await updateDoc(docRef, {
  //       password: hashedNewPassword,
  //       updatedAt: serverTimestamp(),
  //     });

  //     return true;
  //   } catch (error) {
  //     console.error("Lỗi khi đổi mật khẩu:", error);
  //     throw error;
  //   }
  // }

  // Lưu hoặc Cập nhật  Firestore
  async save() {
    const data = { ...this };
    // Validate trước khi lưu
    const validatedData = UserModel.validate(data);

    const docRef = doc(db, "users", this._id);
    const dataToSave = new UserModel(validatedData).toFirestore();

    await setDoc(
      docRef,
      {
        ...dataToSave,
        updatedAt: serverTimestamp(),
        // Giữ lại createdAt nếu đã tồn tại, nếu không thì tạo mới
        createdAt: this.createdAt ? dataToSave.createdAt : serverTimestamp(),
      },
      { merge: true } // Dùng merge để không ghi đè mất các trường không có trong model
    );
    return this;
  }

  // Cập nhật một phần dữ liệu cho user
  static async update(id, updateData) {
    const docRef = doc(db, "users", id);
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

  // Lấy user theo ID
  static async getById(id) {
    const docRef = doc(db, "users", id);
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
    return new UserModel({ _id: docSnap.id, ...data });
  }

  /**
   * @param {Object} filters - bộ lọc
   * @param {number} limit - số lượng user mỗi lần lấy
   * @param {any} startAfterDoc - docSnapshot để bắt đầu sau (hoặc null)
   * @returns {Object} { users, lastDoc, hasMore }
   */
  static async getAll(filters = {}, limit = 10, startAfterDoc = null) {
    const usersCollectionRef = collection(db, "users");
    let queryConstraints = [];

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

    // 4. Thêm phân trang
    queryConstraints.push(fsLimit(limit));
    if (startAfterDoc) {
      queryConstraints.push(fsStartAfter(startAfterDoc));
    }

    const finalQuery = query(usersCollectionRef, ...queryConstraints);
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
      return new UserModel({ _id: docSnap.id, ...data });
    });

    const lastDoc =
      querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;
    const hasMore = querySnapshot.docs.length === limit;

    return { users, lastDoc, hasMore };
  }

  // số liệu cho card ở member
  static async getDashboardStats() {
    try {
      const usersCollectionRef = collection(db, "users");

      const totalQuery = query(usersCollectionRef);

      const activeQuery = query(
        usersCollectionRef,
        where("membership_status", "==", "Active")
      );

      const today = new Date();
      const aWeekFromNow = new Date();
      aWeekFromNow.setDate(today.getDate() + 7);

      const expiringQuery = query(
        usersCollectionRef,
        where("package_end_date", ">=", today),
        where("package_end_date", "<=", aWeekFromNow)
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
      console.error("Lỗi khi lấy số liệu thống kê:", error);
      return { total: 0, active: 0, expiring: 0 };
    }
  }
}

export default UserModel;
