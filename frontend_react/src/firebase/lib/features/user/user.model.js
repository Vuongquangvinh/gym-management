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
import { SpendingUserModel } from "./spendingUser.model.js";
import { PackageModel } from "../package/packages.model.js";

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

  // Lấy danh sách user đã đăng ký gói tập theo packageId
  static async getUsersByPackageId(packageId) {
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("current_package_id", "==", packageId)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        // Chuyển đổi Timestamp về JS Date nếu cần
        Object.keys(data).forEach((key) => {
          if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate();
          }
        });
        return new UserModel({ _id: doc.id, ...data });
      });
      return users;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách user theo packageId:", error);
      throw error;
    }
  }

  // Tính tổng doanh thu của packageId dựa trên trường Price của từng user
  static async calculatePackageRevenue(packageId) {
    try {
      console.log("🔍 Tính doanh thu cho packageId:", packageId);
      // 1. Lấy danh sách user đã đăng ký gói này
      const users = await UserModel.getUsersByPackageId(packageId);
      console.log(`📊 Có ${users.length} user đã đăng ký gói ${packageId}`);
      // 2. Lấy thông tin package để lấy giá
      const packageInfo = await PackageModel.getByPackageId(packageId);
      console.log("📦 Thông tin gói tập:", packageInfo);
      let price = 0;
      // Tùy vào cấu trúc package, lấy trường giá phù hợp
      if (packageInfo) {
        price = packageInfo.Price || 0;
      }
      // 3. Tính doanh thu: số lượng user * giá package
      const totalRevenue = users.length * Number(price);
      return totalRevenue;
    } catch (error) {
      console.error("Lỗi khi tính doanh thu package:", error);
      throw error;
    }
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
    const { error, value } = userSchema.validate(dataToValidate, {
      abortEarly: false,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      throw new Error(`Lỗi validation: ${messages}`);
    }
    return value;
  }

  // Tạo user mới (không dùng Firebase Auth) - deprecated, sử dụng SpendingUserModel.create thay thế
  static async create(userData, password = null) {
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

      // 2. Hash password trước khi lưu (nếu có)
      let hashedPassword = null;
      if (password) {
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(password, saltRounds);
      }

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

      // Thêm hashed password vào dữ liệu lưu vào Firestore (nếu có)
      const dataToSaveInFirestore = { ...firestoreData };
      if (hashedPassword) {
        dataToSaveInFirestore.password = hashedPassword;
      }

      await setDoc(docRef, dataToSaveInFirestore);

      // 6. Trả về instance đã tạo (không có password)
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

  // Đăng nhập lần đầu bằng số điện thoại (chuyển từ spending_users sang users)
  static async firstTimeLogin(phoneNumber) {
    try {
      // 1. Kiểm tra xem user đã tồn tại trong users chưa
      const existingUserQuery = query(
        collection(db, "users"),
        where("phone_number", "==", phoneNumber)
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);

      if (!existingUserSnapshot.empty) {
        throw new Error("Người dùng đã được kích hoạt trước đó.");
      }

      // 2. Tìm thông tin trong spending_users
      const spendingUser = await SpendingUserModel.getByPhoneNumber(
        phoneNumber
      );
      if (!spendingUser) {
        throw new Error("Số điện thoại chưa được đăng ký bởi admin.");
      }

      // 3. Tạo ID mới cho user trong collection users
      const userId = doc(collection(db, "users")).id;

      // 4. Chuyển đổi dữ liệu từ spending_user sang user
      const userData = {
        _id: userId,
        full_name: spendingUser.full_name,
        phone_number: spendingUser.phone_number,
        email: spendingUser.email,
        avatar_url: spendingUser.avatar_url,
        date_of_birth: spendingUser.date_of_birth,
        gender: spendingUser.gender,
        membership_status: spendingUser.membership_status,
        current_package_id: spendingUser.current_package_id,
        package_end_date: spendingUser.package_end_date,
        remaining_sessions: spendingUser.remaining_sessions,
        frozen_history: spendingUser.frozen_history,
        join_date: spendingUser.join_date,
        assigned_staff_id: spendingUser.assigned_staff_id,
        last_checkin_time: spendingUser.last_checkin_time,
        lead_source: spendingUser.lead_source,
        fitness_goal: spendingUser.fitness_goal,
        medical_conditions: spendingUser.medical_conditions,
        initial_measurements: spendingUser.initial_measurements,
        isActive: spendingUser.isActive,
      };

      // 5. Validate dữ liệu
      const validatedData = UserModel.validate(userData);

      // 6. Tạo user mới trong collection users
      const newUser = new UserModel({
        ...validatedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const docRef = doc(db, "users", userId);
      const firestoreData = newUser.toFirestore();

      await setDoc(docRef, firestoreData);

      // 7. Đánh dấu spending_user đã được chuyển đổi
      await SpendingUserModel.markAsTransferred(spendingUser._id);

      // 8. Trả về user đã tạo
      newUser._id = userId;
      return newUser;
    } catch (error) {
      console.error("Lỗi khi đăng nhập lần đầu:", error);
      throw error;
    }
  }

  // Kiểm tra số điện thoại có tồn tại trong spending_users không
  static async checkPhoneInSpendingUsers(phoneNumber) {
    try {
      const spendingUser = await SpendingUserModel.getByPhoneNumber(
        phoneNumber
      );
      return spendingUser !== null;
    } catch (error) {
      console.error("Lỗi khi kiểm tra số điện thoại:", error);
      return false;
    }
  }

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
    // Nếu id truyền vào là _id (không phải docId Firestore), tự động tìm docId Firestore
    let docId = id;

    // Thử kiểm tra xem ID có phải là Firestore docId hay không
    try {
      const testDocRef = doc(db, "users", id);
      const testDocSnap = await getDoc(testDocRef);

      if (!testDocSnap.exists()) {
        // Không tồn tại, thử tìm bằng _id
        const userQuery = query(
          collection(db, "users"),
          where("_id", "==", id)
        );
        const userSnapshot = await getDocs(userQuery);
        if (!userSnapshot.empty) {
          docId = userSnapshot.docs[0].id;
        } else {
          throw new Error("Không tìm thấy user với ID: " + id);
        }
      }
    } catch {
      // Nếu có lỗi khi getDoc, thử tìm bằng _id
      const userQuery = query(collection(db, "users"), where("_id", "==", id));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        docId = userSnapshot.docs[0].id;
      } else {
        throw new Error("Không tìm thấy user với ID: " + id);
      }
    }
    const docRef = doc(db, "users", docId);
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

  // Lấy user theo số điện thoại
  static async getByPhoneNumber(phoneNumber) {
    try {
      const userQuery = query(
        collection(db, "users"),
        where("phone_number", "==", phoneNumber)
      );
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        return null;
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

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

      return new UserModel({ _id: userDoc.id, ...userData });
    } catch (error) {
      console.error("Lỗi khi lấy user theo số điện thoại:", error);
      return null;
    }
  }

  /**
   * @param {Object} filters - bộ lọc
   * @param {number} limit - số lượng user mỗi lần lấy
   * @param {any} startAfterDoc - docSnapshot để bắt đầu sau (hoặc null)
   * @returns {Object} { users, lastDoc, hasMore }
   */
  static async getAll(filters = {}, limit = 10, startAfterDoc = null) {
    const usersCollectionRef = collection(db, "users");
    const queryConstraints = [];

    // Tăng limit khi có search query để đảm bảo tìm đủ kết quả
    const effectiveLimit =
      filters.searchQuery && !filters.status ? Math.max(limit, 100) : limit;

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
      // Không thêm where cho search query, sẽ filter ở client-side
      queryConstraints.push(orderBy("createdAt", "desc"));
    } else {
      queryConstraints.push(orderBy("createdAt", "desc"));
    }

    // 4. Thêm phân trang
    queryConstraints.push(fsLimit(effectiveLimit));
    if (startAfterDoc) {
      queryConstraints.push(fsStartAfter(startAfterDoc));
    }

    const finalQuery = query(usersCollectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(finalQuery);

    let users = querySnapshot.docs.map((docSnap) => {
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

    // Filter case-insensitive search trên client nếu có searchQuery
    if (filters.searchQuery && !filters.status) {
      const searchQuery = filters.searchQuery.trim();
      console.log("🔍 Searching for:", searchQuery);
      console.log("📊 Total users before filter:", users.length);

      // Kiểm tra xem có phải tìm kiếm số điện thoại không
      const isPhoneSearch = /^\+?\d+$/.test(searchQuery);

      if (isPhoneSearch) {
        let searchVariants = [];

        // ✅ Nếu người dùng nhập số bắt đầu bằng "0"
        if (searchQuery.startsWith("0")) {
          const intlFormat = searchQuery.replace(/^0/, "+84"); // đổi 0 -> +84
          searchVariants = [searchQuery, intlFormat];
        }
        // ✅ Nếu người dùng nhập số bắt đầu bằng "+84"
        else if (searchQuery.startsWith("+84")) {
          const localFormat = searchQuery.replace(/^\+84/, "0"); // đổi +84 -> 0
          searchVariants = [searchQuery, localFormat];
        }
        // ✅ Nếu người dùng nhập 84 (không có +)
        else if (searchQuery.startsWith("84")) {
          searchVariants = ["+" + searchQuery, searchQuery.replace(/^84/, "0")];
        }
        // ✅ Các trường hợp còn lại
        else {
          searchVariants = [searchQuery];
        }

        console.log("📱 Phone search variants:", searchVariants);

        users = users.filter((user) => {
          const hasMatch = searchVariants.some(
            (variant) => user.phone_number === variant
          );
          if (hasMatch) {
            console.log("✅ Match found:", user.phone_number, user.full_name);
          }
          return hasMatch;
        });
      }
    }

    const lastDoc =
      querySnapshot.docs.length > 0
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;

    // Cập nhật logic hasMore cho search
    const hasMore =
      filters.searchQuery && !filters.status
        ? users.length === limit
        : querySnapshot.docs.length === effectiveLimit;

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

  // ========== PACKAGE INTERACTION METHODS ==========

  /**
   * 🎁 Lấy thông tin gói tập hiện tại của user
   */
  async getCurrentPackage() {
    try {
      if (!this.current_package_id) {
        return null;
      }
      return await PackageModel.getById(this.current_package_id);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin gói tập:", error);
      return null;
    }
  }

  /**
   * 📝 Đăng ký gói tập mới cho user
   * @param {string} packageId - ID của gói tập
   * @param {Date} startDate - Ngày bắt đầu (mặc định là hôm nay)
   */
  async registerPackage(packageId, startDate = new Date()) {
    try {
      // 1. Kiểm tra package có tồn tại không
      const packageInfo = await PackageModel.getById(packageId);
      if (!packageInfo) {
        throw new Error("Gói tập không tồn tại");
      }

      // 2. Kiểm tra package có active không
      if (packageInfo.Status !== "active") {
        throw new Error("Gói tập này hiện không khả dụng");
      }

      // 3. Tính ngày hết hạn dựa trên Duration của package
      const endDate = packageInfo.calculateEndDate(startDate);

      // 4. Cập nhật thông tin user
      const updateData = {
        current_package_id: packageId,
        package_end_date: endDate,
        membership_status: "Active",
      };

      // Nếu là gói theo buổi, cập nhật số buổi còn lại
      if (
        packageInfo.PackageType === "session" &&
        packageInfo.NumberOfSession
      ) {
        updateData.remaining_sessions = packageInfo.NumberOfSession;
      } else {
        updateData.remaining_sessions = null;
      }

      await UserModel.update(this._id, updateData);

      // 5. Cập nhật instance hiện tại
      this.current_package_id = packageId;
      this.package_end_date = endDate;
      this.membership_status = "Active";
      this.remaining_sessions = updateData.remaining_sessions;

      return {
        success: true,
        package: packageInfo,
        endDate,
        message: "Đăng ký gói tập thành công",
      };
    } catch (error) {
      console.error("Lỗi khi đăng ký gói tập:", error);
      throw error;
    }
  }

  /**
   * 🔄 Gia hạn gói tập hiện tại
   */
  async renewPackage() {
    try {
      if (!this.current_package_id) {
        throw new Error("Người dùng chưa có gói tập nào");
      }

      const packageInfo = await PackageModel.getById(this.current_package_id);
      if (!packageInfo) {
        throw new Error("Gói tập không tồn tại");
      }

      // Tính ngày bắt đầu mới (từ ngày hết hạn cũ hoặc hôm nay)
      const today = new Date();
      const startDate =
        this.package_end_date > today ? this.package_end_date : today;

      const newEndDate = packageInfo.calculateEndDate(startDate);

      await UserModel.update(this._id, {
        package_end_date: newEndDate,
        membership_status: "Active",
      });

      this.package_end_date = newEndDate;
      this.membership_status = "Active";

      return {
        success: true,
        endDate: newEndDate,
        message: "Gia hạn gói tập thành công",
      };
    } catch (error) {
      console.error("Lỗi khi gia hạn gói tập:", error);
      throw error;
    }
  }

  async getUserByPackageid(packageId) {
    try {
      console.log("🔍 Fetching users for package:", packageId);

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("current_package_id", "==", packageId));

      const querySnapshot = await getDocs(q);

      const users = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          name: userData.name || userData.fullName || "N/A",
          email: userData.email || "",
          phone: userData.phone || userData.phoneNumber || "",
          joinedDate: userData.package_start_date || userData.createdAt || null,
          endDate: userData.package_end_date || null,
          ...userData, // Giữ toàn bộ data gốc
        });
      });

      console.log(`✅ Found ${users.length} users for package ${packageId}`);
      return users;
    } catch (error) {
      console.error("❌ Error fetching users by package:", error);
      throw error;
    }
  }

  /**
   * ✅ Kiểm tra gói tập có còn hiệu lực không
   */
  isPackageActive() {
    if (!this.package_end_date) return false;
    return new Date() <= this.package_end_date;
  }

  /**
   * ⏰ Lấy số ngày còn lại của gói tập
   */
  getDaysRemaining() {
    if (!this.package_end_date) return 0;
    const today = new Date();
    const endDate = new Date(this.package_end_date);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * 🏋️ Sử dụng 1 buổi tập (cho gói theo buổi)
   */
  async useSession() {
    try {
      if (!this.remaining_sessions || this.remaining_sessions <= 0) {
        throw new Error("Không còn buổi tập nào");
      }

      const newRemainingSession = this.remaining_sessions - 1;

      await UserModel.update(this._id, {
        remaining_sessions: newRemainingSession,
        last_checkin_time: new Date(),
      });

      this.remaining_sessions = newRemainingSession;
      this.last_checkin_time = new Date();

      // Nếu hết buổi tập, đổi status thành Expired
      if (newRemainingSession === 0) {
        await UserModel.update(this._id, {
          membership_status: "Expired",
        });
        this.membership_status = "Expired";
      }

      return {
        success: true,
        remainingSessions: newRemainingSession,
      };
    } catch (error) {
      console.error("Lỗi khi sử dụng buổi tập:", error);
      throw error;
    }
  }

  /**
   * 📊 Phân tích nâng cao cho gói tập
   */
  static async getAdvancedAnalytics(packageId) {
    try {
      const users = await UserModel.getUsersByPackageId(packageId);
      const now = new Date();

      // Phân loại thành viên
      let activeCount = 0;
      let expiredCount = 0;
      let expiringCount = 0; // Sắp hết hạn trong 7 ngày
      let renewalCount = 0; // Đã gia hạn
      let canceledCount = 0;
      let totalDaysUsed = 0;
      let renewalUsers = 0;

      users.forEach((user) => {
        let status = null;
        // Ưu tiên membership_status nếu có
        if (user.membership_status === "Active") {
          status = "active";
        } else if (user.membership_status === "Expired") {
          status = "expired";
        } else {
          // Nếu không có membership_status, xác định theo ngày hết hạn
          const packageEndDate = user.package_end_date
            ? new Date(user.package_end_date)
            : null;
          if (packageEndDate) {
            const daysRemaining = Math.ceil(
              (packageEndDate - now) / (1000 * 60 * 60 * 24)
            );
            if (daysRemaining > 7) {
              status = "active";
            } else if (daysRemaining > 0 && daysRemaining <= 7) {
              status = "expiring";
            } else {
              status = "expired";
            }
          }
        }

        // Đếm trạng thái duy nhất cho user
        if (status === "active") activeCount++;
        else if (status === "expired") expiredCount++;
        else if (status === "expiring") expiringCount++;

        // Tính thời gian đã sử dụng
        const joinDate = user.join_date ? new Date(user.join_date) : null;
        if (joinDate) {
          const daysUsed = Math.ceil((now - joinDate) / (1000 * 60 * 60 * 24));
          totalDaysUsed += daysUsed;
        }

        // Đếm số người đã hủy (isActive = false)
        if (user.isActive === false) {
          canceledCount++;
        }
      });

      const totalUsers = users.length;
      const avgDaysUsed =
        totalUsers > 0 ? Math.round(totalDaysUsed / totalUsers) : 0;

      // Tính tỷ lệ
      const renewalRate =
        totalUsers > 0 ? ((renewalUsers / totalUsers) * 100).toFixed(1) : 0;
      const cancelRate =
        totalUsers > 0 ? ((canceledCount / totalUsers) * 100).toFixed(1) : 0;
      const activeRate =
        totalUsers > 0 ? ((activeCount / totalUsers) * 100).toFixed(1) : 0;
      const expiringRate =
        totalUsers > 0 ? ((expiringCount / totalUsers) * 100).toFixed(1) : 0;

      // Lấy thông tin package để tính doanh thu
      const packageInfo = await PackageModel.getByPackageId(packageId);
      let price = 0;
      if (packageInfo) {
        price = packageInfo.Price || 0;
      }

      const currentRevenue = totalUsers * Number(price);
      const projectedRevenue = activeCount * Number(price);

      return {
        totalUsers,
        activeCount,
        expiredCount,
        expiringCount,
        renewalCount,
        canceledCount,
        renewalRate: parseFloat(renewalRate),
        cancelRate: parseFloat(cancelRate),
        activeRate: parseFloat(activeRate),
        expiringRate: parseFloat(expiringRate),
        avgDaysUsed,
        currentRevenue,
        projectedRevenue,
        price: Number(price),
      };
    } catch (error) {
      console.error("Lỗi khi phân tích nâng cao:", error);
      throw error;
    }
  }

  /**
   * 📈 So sánh với các gói khác
   */
  static async compareWithOtherPackages(packageId) {
    try {
      const allPackages = await PackageModel.getAll();
      const comparisons = [];

      for (const pkg of allPackages) {
        if (pkg.id === packageId) continue;

        const analytics = await UserModel.getAdvancedAnalytics(pkg.id);
        comparisons.push({
          packageId: pkg.id,
          packageName: pkg.Name || pkg.name,
          totalUsers: analytics.totalUsers,
          revenue: analytics.currentRevenue,
          activeRate: analytics.activeRate,
        });
      }

      // Sắp xếp theo doanh thu
      comparisons.sort((a, b) => b.revenue - a.revenue);

      return comparisons.slice(0, 5); // Top 5 gói
    } catch (error) {
      console.error("Lỗi khi so sánh với các gói khác:", error);
      return [];
    }
  }
}

export default UserModel;
