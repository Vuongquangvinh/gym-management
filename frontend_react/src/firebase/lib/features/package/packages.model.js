import Joi from "joi";
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";

export const PackageSchema = Joi.object({
  PackageId: Joi.string().required(),
  PackageName: Joi.string().required(),
  PackageType: Joi.string().required(),
  Description: Joi.string().optional(),
  Duration: Joi.number().required(),
  Price: Joi.number().required(),
  Descriptions: Joi.array().items(Joi.string()).optional(),
  Status: Joi.string().valid("active", "inactive").required(),
  CreatedAt: Joi.date().default(Date.now),
  UpdatedAt: Joi.date().default(Date.now),
  NumberOfSession: Joi.number().optional(),
  Discount: Joi.number().optional(),
  StartDayDiscount: Joi.date().optional(),
  EndDayDiscount: Joi.date().optional(),
  UsageCondition: Joi.string().optional(),
});

export class PackageModel {
  /**
   * 📖 Lấy gói tập theo Firestore document ID
   */

  constructor({
    PackageId,
    PackageName,
    PackageType,
    Duration,
    Price,
    Description,
    Status,
    CreatedAt = new Date(),
    UpdatedAt = new Date(),
    NumberOfSession,
    Discount,
    StartDayDiscount,
    EndDayDiscount,
    UsageCondition,
  } = {}) {
    this.PackageId = PackageId;
    this.PackageName = PackageName;
    this.PackageType = PackageType;
    this.Description = Description;
    this.Duration = Duration;
    this.Price = Price;
    this.Status = Status;
    this.CreatedAt = CreatedAt;
    this.UpdatedAt = UpdatedAt;
    this.NumberOfSession = NumberOfSession;
    this.Discount = Discount;
    this.StartDayDiscount = StartDayDiscount;
    this.EndDayDiscount = EndDayDiscount;
    this.UsageCondition = UsageCondition;
  }

  static collectionRef() {
    return collection(db, "packages");
  }

  /**
   * 🔁 Chuyển instance thành dữ liệu tương thích Firestore
   */
  toFirestore() {
    const data = { ...this };

    // ✅ Chuyển các trường Date → Timestamp
    Object.keys(data).forEach((key) => {
      if (data[key] instanceof Date) {
        data[key] = Timestamp.fromDate(data[key]);
      }
    });

    // ✅ Đảm bảo Descriptions là mảng string
    if (Array.isArray(data.Descriptions)) {
      data.Descriptions = data.Descriptions.map((item) => String(item));
    }

    // ✅ Xóa field undefined (Firestore không chấp nhận)
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );

    return cleanData;
  }

  /**
   * 🧩 Tạo gói tập mới trên Firestore
   */
  static async create(data) {
    try {
      // ✅ 1. Làm sạch dữ liệu đầu vào - loại bỏ các trường rỗng
      const cleanedData = {};
      Object.keys(data).forEach((key) => {
        const value = data[key];
        // Chỉ thêm field nếu có giá trị (không phải empty string, null, undefined)
        if (value !== "" && value !== null && value !== undefined) {
          cleanedData[key] = value;
        }
      });

      // ✅ 2. Chuyển đổi các trường number từ string sang number
      if (cleanedData.Duration)
        cleanedData.Duration = Number(cleanedData.Duration);
      if (cleanedData.Price) cleanedData.Price = Number(cleanedData.Price);
      if (cleanedData.NumberOfSession)
        cleanedData.NumberOfSession = Number(cleanedData.NumberOfSession);
      if (cleanedData.Discount)
        cleanedData.Discount = Number(cleanedData.Discount);

      // ✅ 3. Chuyển đổi date strings sang Date objects nếu có
      if (cleanedData.StartDayDiscount) {
        cleanedData.StartDayDiscount = new Date(cleanedData.StartDayDiscount);
      }
      if (cleanedData.EndDayDiscount) {
        cleanedData.EndDayDiscount = new Date(cleanedData.EndDayDiscount);
      }

      // ✅ 4. Kiểm tra dữ liệu với schema
      const { error, value } = PackageSchema.validate(cleanedData, {
        abortEarly: false,
        stripUnknown: true, // Loại bỏ các field không có trong schema
      });

      if (error) {
        throw new Error(
          "Dữ liệu không hợp lệ: " +
            error.details.map((d) => d.message).join(", ")
        );
      }

      // ✅ 5. Tạo instance model
      const pkg = new PackageModel(value);

      // ✅ 6. Chuyển về định dạng Firestore
      const firestoreData = pkg.toFirestore();

      // ✅ 7. Lưu vào Firestore
      const docRef = await addDoc(PackageModel.collectionRef(), firestoreData);

      console.log("✅ Package created with ID:", docRef.id);

      // ✅ 8. Trả về object kết quả
      return { id: docRef.id, ...firestoreData };
    } catch (error) {
      console.error("❌ Error creating package:", error);
      throw error;
    }
  }

  /**
   * 📖 Lấy gói tập theo PackageId (user-defined ID)
   */
  static async getByPackageId(packageId) {
    try {
      const q = query(
        PackageModel.collectionRef(),
        where("PackageId", "==", packageId)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;

      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();

      // Chuyển đổi Timestamp về JS Date
      Object.keys(data).forEach((key) => {
        if (data[key] instanceof Timestamp) {
          data[key] = data[key].toDate();
        }
      });

      // Tạo instance
      const packageInstance = new PackageModel(data);
      // Thêm Firestore document ID
      packageInstance._firestoreId = docSnap.id;

      return packageInstance;
    } catch (error) {
      console.error("Lỗi khi lấy package theo PackageId:", error);
      throw error;
    }
  }

  /**
   * 📋 Lấy tất cả gói tập (có thể lọc theo status)
   */
  static async getAll(filters = {}) {
    try {
      const packagesRef = collection(db, "packages");
      const queryConstraints = [];

      // Lọc theo status nếu có
      if (filters.status) {
        queryConstraints.push(where("Status", "==", filters.status));
        // Không thêm orderBy khi có where để tránh cần composite index
      } else {
        // Chỉ orderBy khi không có where filter
        queryConstraints.push(orderBy("CreatedAt", "desc"));
      }

      const q =
        queryConstraints.length > 0
          ? query(packagesRef, ...queryConstraints)
          : packagesRef;

      const querySnapshot = await getDocs(q);

      const packages = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        // Chuyển đổi Timestamp về JS Date
        Object.keys(data).forEach((key) => {
          if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate();
          }
        });

        // Tạo instance với data từ Firestore
        const packageInstance = new PackageModel(data);
        // Thêm Firestore document ID vào instance
        packageInstance._firestoreId = docSnap.id;

        return packageInstance;
      });

      return packages;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách packages:", error);
      throw error;
    }
  }

  /**
   * 🔄 Cập nhật gói tập
   */
  static async update(packageId, updateData) {
    try {
      console.log("🔄 Updating package:", packageId);
      console.log("📝 Update data:", updateData);

      // ✅ 1. Làm sạch dữ liệu - loại bỏ các trường rỗng
      const cleanedData = {};
      Object.keys(updateData).forEach((key) => {
        const value = updateData[key];
        // Chỉ thêm field nếu có giá trị (không phải empty string, undefined)
        // null được giữ lại để xóa field trong Firestore
        if (value !== "" && value !== undefined) {
          cleanedData[key] = value;
        }
      });

      // ✅ 2. Chuyển đổi các trường number từ string sang number (nếu cần)
      if (cleanedData.Duration && typeof cleanedData.Duration === "string") {
        cleanedData.Duration = Number(cleanedData.Duration);
      }
      if (cleanedData.Price && typeof cleanedData.Price === "string") {
        cleanedData.Price = Number(cleanedData.Price);
      }
      if (
        cleanedData.NumberOfSession &&
        typeof cleanedData.NumberOfSession === "string"
      ) {
        cleanedData.NumberOfSession = Number(cleanedData.NumberOfSession);
      }
      if (cleanedData.Discount && typeof cleanedData.Discount === "string") {
        cleanedData.Discount = Number(cleanedData.Discount);
      }

      // ✅ 3. Chuyển đổi Date objects sang Timestamp
      const dataToUpdate = { ...cleanedData };
      Object.keys(dataToUpdate).forEach((key) => {
        if (dataToUpdate[key] instanceof Date) {
          dataToUpdate[key] = Timestamp.fromDate(dataToUpdate[key]);
        }
      });

      // ✅ 4. Thêm UpdatedAt timestamp
      dataToUpdate.UpdatedAt = serverTimestamp();

      console.log("✅ Cleaned data to update:", dataToUpdate);

      // ✅ 5. Thực hiện update trong Firestore
      const docRef = doc(db, "packages", packageId);
      await updateDoc(docRef, dataToUpdate);

      console.log("✅ Package updated successfully:", packageId);
      return {
        success: true,
        packageId,
        updatedFields: Object.keys(dataToUpdate),
      };
    } catch (error) {
      console.error("❌ Error updating package:", error);
      throw error;
    }
  }

  /**
   * 🗑️ Xóa gói tập
   */
  static async delete(packageId) {
    try {
      const docRef = doc(db, "packages", packageId);
      await deleteDoc(docRef);
      console.log("✅ Package deleted:", packageId);
    } catch (error) {
      console.error("Lỗi khi xóa package:", error);
      throw error;
    }
  }

  /**
   * 💰 Tính giá cuối cùng sau discount
   */
  getFinalPrice() {
    if (!this.Discount || this.Discount <= 0) {
      return this.Price;
    }

    const now = new Date();
    const isDiscountActive =
      this.StartDayDiscount &&
      this.EndDayDiscount &&
      now >= this.StartDayDiscount &&
      now <= this.EndDayDiscount;

    if (isDiscountActive) {
      return this.Price - (this.Price * this.Discount) / 100;
    }

    return this.Price;
  }

  /**
   * 📅 Tính ngày hết hạn dựa trên ngày bắt đầu và Duration (tính bằng ngày)
   */
  calculateEndDate(startDate = new Date()) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + this.Duration);
    return endDate;
  }
}

// Export default để có thể import theo cả 2 cách
export default PackageModel;
