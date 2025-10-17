import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  where,
  limit as limitFn,
  startAfter,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";
import Joi from "joi"; // npm i joi cho validation
// Schema validation với Joi
const checkinSchema = Joi.object({
  checkedAt: Joi.alternatives()
    .try(Joi.date(), Joi.string().isoDate())
    .required(),
  locationId: Joi.string().allow(""),
  memberId: Joi.string().required(),
  memberName: Joi.string().required(),
  memberPhone: Joi.string().allow(""),
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
    memberPhone = "",
    packageId = "",
    source = "manual",
    createdAt = null,
    updatedAt = null,
    searchTokens = [],
  } = {}) {
    this.id = id;
    this.checkedAt = checkedAt;
    this.locationId = locationId;
    this.memberId = memberId;
    this.memberName = memberName;
    this.memberPhone = memberPhone;
    this.packageId = packageId;
    this.source = source;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.searchTokens = searchTokens;

    // Generate search tokens nếu chưa có - với Vietnamese normalization
    if (this.searchTokens.length === 0 && this.memberName) {
      // Normalize Vietnamese text
      const normalizedName = this.memberName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");

      const nameParts = normalizedName.split(" ");
      const tokens = [
        normalizedName, // full normalized name
        ...nameParts, // individual normalized words
      ];

      // Add name prefixes for partial search
      nameParts.forEach((word) => {
        if (word.length > 0) {
          for (let i = 1; i <= word.length; i++) {
            tokens.push(word.substring(0, i));
          }
        }
      });

      if (this.memberId) {
        tokens.push(this.memberId.toLowerCase());
      }

      if (this.memberPhone) {
        tokens.push(this.memberPhone); // full phone

        // Add phone prefixes
        const phoneStr = this.memberPhone.toString();
        for (let i = 1; i <= phoneStr.length; i++) {
          tokens.push(phoneStr.substring(0, i));
        }
      }

      this.searchTokens = [...new Set(tokens.filter(Boolean))];
    }
  }

  // Validate dữ liệu
  static validate(data) {
    const { error, value } = checkinSchema.validate(data, {
      abortEarly: false,
    });
    if (error) {
      const messages = error.details.map((d) => d.message).join(", ");
      throw new Error(`Lỗi validation: ${messages}`);
    }
    return value;
  }

  // Chuẩn bị payload để lưu vào Firestore
  static prepare(data) {
    // Chuẩn hóa checkedAt
    let checkedAtValue;
    if (data.checkedAt instanceof Date) {
      checkedAtValue = data.checkedAt.toISOString();
    } else if (typeof data.checkedAt === "string") {
      checkedAtValue = data.checkedAt;
    } else {
      checkedAtValue = new Date().toISOString();
    }

    // Generate search tokens với Vietnamese normalization và prefix support
    const normalizedName = data.memberName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

    const nameParts = normalizedName.split(" ");
    const searchTokens = [
      normalizedName, // full normalized name
      ...nameParts, // individual normalized words
      data.memberId.toLowerCase(),
    ];

    // Thêm name prefixes cho mỗi từ để support tìm kiếm partial
    nameParts.forEach((word) => {
      if (word.length > 0) {
        // Tạo prefixes: "vinh" -> ["v", "vi", "vin", "vinh"]
        for (let i = 1; i <= word.length; i++) {
          searchTokens.push(word.substring(0, i));
        }
      }
    });

    // Thêm memberPhone và phone prefixes vào search tokens
    if (data.memberPhone) {
      searchTokens.push(data.memberPhone); // full phone

      // Tạo phone prefixes: "0912345678" -> ["0", "09", "091", "0912", "09123", ...]
      const phoneStr = data.memberPhone.toString();
      for (let i = 1; i <= phoneStr.length; i++) {
        searchTokens.push(phoneStr.substring(0, i));
      }
    }

    return {
      ...data,
      checkedAt: checkedAtValue,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      searchTokens: [...new Set(searchTokens.filter(Boolean))], // Remove duplicates
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

  // Lấy tất cả check-ins với bộ lọc (server-side search + lazy loading)
  static async getAll(filters = {}, limit = 10, startAfterDoc = null) {
    try {
      const checkinRef = collection(db, "checkins");
      let queryConstraints = [];

      // Xử lý search query - server-side search như member
      const searchTerm = filters.searchQuery?.trim() || filters.search?.trim();

      // Ưu tiên 1: Server-side search với searchTokens
      if (searchTerm) {
        let searchValue = searchTerm;

        // Chỉ normalize nếu KHÔNG phải số điện thoại
        if (!/^\d+$/.test(searchTerm)) {
          searchValue = searchTerm
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d");
        }

        // Dùng array-contains để search trong searchTokens
        try {
          queryConstraints.push(
            where("searchTokens", "array-contains", searchValue)
          );
        } catch {
          // Fallback về search đơn giản nếu lỗi index
        }
      }

      // Filter theo date (có thể combine với search)
      if (filters.date) {
        // Database lưu Firestore Timestamp, tạo range theo local time
        const selectedDate = new Date(filters.date);

        // Tạo start và end theo local time
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Convert JavaScript Date sang Firestore Timestamp để so sánh
        const startTimestamp = Timestamp.fromDate(startOfDay);
        const endTimestamp = Timestamp.fromDate(endOfDay);

        queryConstraints.push(where("checkedAt", ">=", startTimestamp));
        queryConstraints.push(where("checkedAt", "<=", endTimestamp));
      }

      // Filter theo source (có thể combine với search và date)
      if (filters.source) {
        queryConstraints.push(where("source", "==", filters.source));
      }

      // Luôn sort theo thời gian
      queryConstraints.push(orderBy("checkedAt", "desc"));

      // Thêm pagination
      queryConstraints.push(limitFn(limit));
      if (startAfterDoc) {
        queryConstraints.push(startAfter(startAfterDoc));
      }

      // Tạo và thực thi truy vấn
      const q = query(checkinRef, ...queryConstraints);
      const snapshot = await getDocs(q);

      const checkins = snapshot.docs.map((doc) => {
        const data = { id: doc.id, ...doc.data() };
        return this.normalizeCheckin(data);
      });

      // Tự động update searchTokens cho documents thiếu (thầm lặng)
      if (searchTerm && checkins.length === 0) {
        // Kiểm tra xem có documents nào thiếu searchTokens không
        this.updateMissingSearchTokens().catch(() => {
          // Silent fail, không làm gián đoạn user experience
        });
      }

      // Server-side search results
      let finalCheckins = checkins;

      // Pagination logic
      const lastDoc =
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : null;
      const hasMore = snapshot.docs.length === limit;

      return {
        checkins: finalCheckins,
        lastDoc,
        hasMore,
      };
    } catch (err) {
      console.error("Error getting checkins:", err);
      throw err;
    }
  }

  // Cập nhật check-in
  static async update(id, updateData) {
    // Chỉ validate những field có trong updateData
    const allowedFields = [
      "checkedAt",
      "locationId",
      "memberId",
      "memberName",
      "memberPhone",
      "packageId",
      "source",
    ];
    const filteredData = {};

    // Lọc chỉ những field được phép và có trong updateData
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    // Validate riêng từng field thay vì validate toàn bộ object
    if (filteredData.checkedAt !== undefined) {
      if (!filteredData.checkedAt || isNaN(new Date(filteredData.checkedAt))) {
        throw new Error("checkedAt phải là một ngày hợp lệ");
      }
    }

    const docRef = doc(db, "checkins", id);
    await updateDoc(docRef, {
      ...filteredData,
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
    // Xử lý checkedAt - có thể là Timestamp hoặc string
    let normalizedCheckedAt;
    if (data.checkedAt && data.checkedAt.toDate) {
      // Nếu là Firestore Timestamp
      normalizedCheckedAt = data.checkedAt.toDate().toISOString();
    } else if (typeof data.checkedAt === "string") {
      // Nếu đã là string, giữ nguyên
      normalizedCheckedAt = data.checkedAt;
    } else {
      // Fallback
      normalizedCheckedAt = new Date().toISOString();
    }

    return {
      id: data.id || "",
      checkedAt: normalizedCheckedAt,
      locationId: data.locationId || "",
      memberId: data.memberId || "",
      memberName: data.memberName || "",
      memberPhone: data.memberPhone || "",
      packageId: data.packageId || "",
      source: data.source || "manual",
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
      searchTokens: data.searchTokens || [],
    };
  }

  /**
   * Cập nhật searchTokens với prefix support cho tất cả documents
   * @returns {Promise<{total: number, updated: number}>}
   */
  static async updateAllSearchTokensWithPrefix() {
    try {
      const checkinRef = collection(db, "checkins");
      const snapshot = await getDocs(checkinRef);

      console.log(
        `Found ${snapshot.docs.length} documents to update with prefix support`
      );

      let updated = 0;
      const batch = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        if (data.memberName) {
          // Generate search tokens với prefix support
          const memberName = data.memberName.toLowerCase();
          const nameParts = memberName.split(" ");
          const searchTokens = [
            memberName, // full name
            ...nameParts, // individual words
          ];

          if (data.memberId) {
            searchTokens.push(data.memberId.toLowerCase());
          }

          // Thêm prefixes cho mỗi từ để support tìm kiếm partial
          nameParts.forEach((word) => {
            if (word.length > 1) {
              // Tạo prefixes: "vương" -> ["vu", "vuo", "vuon", "vuong"]
              for (let i = 2; i <= word.length; i++) {
                searchTokens.push(word.substring(0, i));
              }
            }
          });

          // Remove duplicates
          const uniqueTokens = [...new Set(searchTokens.filter(Boolean))];

          // Add to batch
          const docRef = doc(db, "checkins", docSnap.id);
          batch.push({
            ref: docRef,
            tokens: uniqueTokens,
          });
        }
      }

      console.log(
        `Preparing to update ${batch.length} documents with prefix support`
      );

      // Process in smaller batches to avoid hitting limits
      const BATCH_SIZE = 500;
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const currentBatch = batch.slice(i, i + BATCH_SIZE);
        await Promise.all(
          currentBatch.map((item) =>
            updateDoc(item.ref, {
              searchTokens: item.tokens,
              updatedAt: serverTimestamp(),
            })
          )
        );
        updated += currentBatch.length;
        console.log(`Updated ${updated}/${batch.length} documents`);
      }

      return {
        total: snapshot.docs.length,
        updated,
      };
    } catch (error) {
      console.error("Error updating search tokens with prefix support:", error);
      throw error;
    }
  }

  /**
   * Cập nhật searchTokens cho tất cả documents
   * @returns {Promise<{total: number, updated: number}>}
   */
  static async updateAllSearchTokens() {
    try {
      const checkinRef = collection(db, "checkins");
      const snapshot = await getDocs(checkinRef);

      console.log(`Found ${snapshot.docs.length} documents to update`);

      let updated = 0;
      const batch = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Chỉ cập nhật nếu chưa có searchTokens
        if (!data.searchTokens || data.searchTokens.length === 0) {
          // Generate search tokens
          const nameParts = data.memberName.toLowerCase().split(" ");
          const searchTokens = [data.memberName.toLowerCase(), ...nameParts];

          if (data.memberId) {
            searchTokens.push(data.memberId.toLowerCase());
          }

          // Remove duplicates
          const uniqueTokens = [...new Set(searchTokens.filter(Boolean))];

          // Add to batch
          const docRef = doc(db, "checkins", docSnap.id);
          batch.push({
            ref: docRef,
            tokens: uniqueTokens,
          });
        }
      }

      console.log(`Preparing to update ${batch.length} documents`);

      // Process in smaller batches to avoid hitting limits
      const BATCH_SIZE = 500;
      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const currentBatch = batch.slice(i, i + BATCH_SIZE);
        await Promise.all(
          currentBatch.map((item) =>
            updateDoc(item.ref, {
              searchTokens: item.tokens,
              updatedAt: serverTimestamp(),
            })
          )
        );
        updated += currentBatch.length;
        console.log(`Updated ${updated}/${batch.length} documents`);
      }

      return {
        total: snapshot.docs.length,
        updated,
      };
    } catch (error) {
      console.error("Error updating search tokens:", error);
      throw error;
    }
  }

  /**
   * Tự động update searchTokens cho documents thiếu (chạy thầm lặng)
   */
  static async updateMissingSearchTokens() {
    try {
      const checkinRef = collection(db, "checkins");
      const snapshot = await getDocs(query(checkinRef, limitFn(50))); // Chỉ check 50 docs gần nhất

      const toUpdate = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        // Kiểm tra nếu thiếu searchTokens hoặc searchTokens ít
        if (!data.searchTokens || data.searchTokens.length < 5) {
          if (data.memberName) {
            toUpdate.push(docSnap.id);
          }
        }
      }

      // Update từng document một cách thầm lặng
      if (toUpdate.length > 0) {
        const promises = toUpdate.slice(0, 5).map(async (docId) => {
          // Chỉ update 5 docs mỗi lần
          try {
            const docSnap = await getDoc(doc(db, "checkins", docId));
            if (docSnap.exists()) {
              const data = docSnap.data();

              // Generate searchTokens mới
              const normalizedName = data.memberName
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d");

              const nameParts = normalizedName.split(" ");
              const searchTokens = [
                normalizedName,
                ...nameParts,
                (data.memberId || "").toLowerCase(),
              ];

              // Add prefixes
              nameParts.forEach((word) => {
                if (word.length > 0) {
                  for (let i = 1; i <= word.length; i++) {
                    searchTokens.push(word.substring(0, i));
                  }
                }
              });

              // Add phone prefixes
              if (data.memberPhone) {
                searchTokens.push(data.memberPhone);
                const phoneStr = data.memberPhone.toString();
                for (let i = 1; i <= phoneStr.length; i++) {
                  searchTokens.push(phoneStr.substring(0, i));
                }
              }

              const uniqueTokens = [...new Set(searchTokens.filter(Boolean))];

              await updateDoc(doc(db, "checkins", docId), {
                searchTokens: uniqueTokens,
              });
            }
          } catch {
            // Silent fail per document
          }
        });

        await Promise.allSettled(promises);
      }
    } catch {
      // Silent fail - không throw error để không gián đoạn UX
    }
  }

  /**
   * Debug function để kiểm tra searchTokens của documents
   */
  static async debugSearchTokens() {
    try {
      const checkinRef = collection(db, "checkins");
      const snapshot = await getDocs(query(checkinRef, limitFn(5)));

      console.log("=== DEBUG SEARCH TOKENS ===");
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log(`Document ${doc.id}:`, {
          memberName: data.memberName,
          memberPhone: data.memberPhone,
          searchTokens: data.searchTokens || "MISSING",
        });
      });
      console.log("=== END DEBUG ===");

      return snapshot.docs.length;
    } catch (error) {
      console.error("Error debugging search tokens:", error);
      throw error;
    }
  }

  /**
   * Update searchTokens với phone support cho tất cả documents
   * @returns {Promise<{total: number, updated: number}>}
   */
  static async updateSearchTokensWithPhone() {
    try {
      const checkinRef = collection(db, "checkins");
      const snapshot = await getDocs(checkinRef);

      console.log(
        `Found ${snapshot.docs.length} checkin documents to update with phone support`
      );

      let updated = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        if (data.memberName) {
          // Generate search tokens với new logic
          const normalizedName = data.memberName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d");

          const nameParts = normalizedName.split(" ");
          const searchTokens = [
            normalizedName, // full normalized name
            ...nameParts, // individual normalized words
            (data.memberId || "").toLowerCase(),
          ];

          // Add name prefixes
          nameParts.forEach((word) => {
            if (word.length > 0) {
              for (let i = 1; i <= word.length; i++) {
                searchTokens.push(word.substring(0, i));
              }
            }
          });

          // Add phone and phone prefixes
          if (data.memberPhone) {
            searchTokens.push(data.memberPhone); // full phone

            const phoneStr = data.memberPhone.toString();
            for (let i = 1; i <= phoneStr.length; i++) {
              searchTokens.push(phoneStr.substring(0, i));
            }
          }

          const uniqueTokens = [...new Set(searchTokens.filter(Boolean))];

          // Update document
          const docRef = doc(db, "checkins", docSnap.id);
          await updateDoc(docRef, {
            searchTokens: uniqueTokens,
            updatedAt: serverTimestamp(),
          });

          updated++;
          console.log(
            `Updated document ${docSnap.id} with ${uniqueTokens.length} search tokens`
          );
        }
      }

      console.log(`Successfully updated ${updated} checkin documents`);
      return { total: snapshot.docs.length, updated };
    } catch (error) {
      console.error("Error updating checkin search tokens with phone:", error);
      throw error;
    }
  }
}

export default CheckinModel;
