import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";

/**
 * Model cho khung giờ được chọn trong contract
 */
export class SelectedTimeSlot {
  constructor({
    timeSlotId = "",
    dayOfWeek = 0,
    startTime = "",
    endTime = "",
    note = "",
  } = {}) {
    this.timeSlotId = timeSlotId; // ID từ availableTimeSlots trong PTPackage
    this.dayOfWeek = dayOfWeek; // 0-6 (0 = Chủ nhật, 1 = Thứ 2, ...)
    this.startTime = startTime; // Format: "HH:mm"
    this.endTime = endTime; // Format: "HH:mm"
    this.note = note; // Ghi chú nếu có
  }

  static fromMap(map) {
    return new SelectedTimeSlot({
      timeSlotId: map.timeSlotId || "",
      dayOfWeek: map.dayOfWeek || 0,
      startTime: map.startTime || "",
      endTime: map.endTime || "",
      note: map.note || "",
    });
  }

  toMap() {
    return {
      timeSlotId: this.timeSlotId,
      dayOfWeek: this.dayOfWeek,
      startTime: this.startTime,
      endTime: this.endTime,
      note: this.note,
    };
  }
}

/**
 * Model cho lịch tập hàng tuần (7 ngày) - dùng cho gói tháng
 */
export class WeeklySchedule {
  constructor(schedule = {}) {
    this.schedule = schedule; // Map<dayOfWeek (1-7), SelectedTimeSlot>
  }

  static fromMap(map) {
    const scheduleMap = {};
    Object.entries(map).forEach(([key, value]) => {
      const dayOfWeek = parseInt(key);
      scheduleMap[dayOfWeek] = SelectedTimeSlot.fromMap(value);
    });
    return new WeeklySchedule(scheduleMap);
  }

  toMap() {
    const map = {};
    Object.entries(this.schedule).forEach(([dayOfWeek, slot]) => {
      map[dayOfWeek] = slot.toMap();
    });
    return map;
  }

  isComplete() {
    return Object.keys(this.schedule).length === 7;
  }

  getMissingDays() {
    const dayNames = [
      "",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
      "Chủ nhật",
    ];
    const missing = [];
    for (let i = 1; i <= 7; i++) {
      if (!this.schedule[i]) {
        missing.push(dayNames[i]);
      }
    }
    return missing;
  }
}

/**
 * Model chính cho Contract
 */
export class ContractModel {
  constructor({
    id = "",
    userId = "",
    ptId = "",
    ptPackageId = "",
    weeklySchedule = new WeeklySchedule(),
    status = "pending_payment",
    paymentOrderCode = null,
    paymentAmount = null,
    paymentStatus = null,
    paidAt = null,
    createdAt = Timestamp.now(),
    updatedAt = null,
    startDate = null,
    endDate = null,
  } = {}) {
    this.id = id; // Document ID trong Firestore
    this.userId = userId; // ID của user (member)
    this.ptId = ptId; // ID của PT
    this.ptPackageId = ptPackageId; // ID của PT Package
    this.weeklySchedule = weeklySchedule; // Lịch tập hàng tuần
    this.status = status; // 'pending_payment', 'paid', 'active', 'completed', 'cancelled'
    this.paymentOrderCode = paymentOrderCode; // Mã đơn hàng PayOS
    this.paymentAmount = paymentAmount; // Số tiền thanh toán
    this.paymentStatus = paymentStatus; // 'PENDING', 'PAID', 'CANCELLED'
    this.paidAt = paidAt; // Thời gian thanh toán thành công
    this.createdAt = createdAt; // Thời gian tạo contract
    this.updatedAt = updatedAt; // Thời gian cập nhật
    this.startDate = startDate; // Ngày bắt đầu contract
    this.endDate = endDate; // Ngày kết thúc contract

    // ⭐ Commission fields
    this.commissionAmount = 0; // Số tiền hoa hồng cho PT
    this.commissionRate = 0; // % hoa hồng (lưu để tham khảo)
    this.commissionPaid = false; // Đã trả hoa hồng chưa
    this.commissionPaidDate = null; // Ngày trả
    this.commissionPaidInPayrollId = null; // ID của payroll đã trả
  }

  /**
   * Computed property để lấy danh sách time slots (cho backward compatibility)
   */
  get selectedTimeSlots() {
    return Object.values(this.weeklySchedule.schedule).sort(
      (a, b) => a.dayOfWeek - b.dayOfWeek
    );
  }

  static fromMap(map, id = "") {
    // Xử lý weeklySchedule - ưu tiên weeklySchedule, fallback về selectedTimeSlots nếu có
    let schedule;

    if (map.weeklySchedule) {
      // Có weeklySchedule - dùng luôn
      schedule = WeeklySchedule.fromMap(map.weeklySchedule);
    } else if (map.selectedTimeSlots) {
      // Không có weeklySchedule nhưng có selectedTimeSlots (data cũ)
      // Convert selectedTimeSlots thành weeklySchedule
      const slots = map.selectedTimeSlots.map((slot) =>
        SelectedTimeSlot.fromMap(slot)
      );
      const scheduleMap = {};
      slots.forEach((slot) => {
        scheduleMap[slot.dayOfWeek] = slot;
      });
      schedule = new WeeklySchedule(scheduleMap);
    } else {
      // Không có gì - tạo schedule rỗng
      schedule = new WeeklySchedule({});
    }

    const contract = new ContractModel({
      id: id,
      userId: map.userId || "",
      ptId: map.ptId || "",
      ptPackageId: map.ptPackageId || "",
      weeklySchedule: schedule,
      status: map.status || "pending_payment",
      paymentOrderCode: map.paymentOrderCode || null,
      paymentAmount: map.paymentAmount || null,
      paymentStatus: map.paymentStatus || null,
      paidAt: map.paidAt || null,
      createdAt: map.createdAt || Timestamp.now(),
      updatedAt: map.updatedAt || null,
      startDate: map.startDate || null,
      endDate: map.endDate || null,
    });

    // ⭐ Map commission fields
    contract.commissionAmount = map.commissionAmount || 0;
    contract.commissionRate = map.commissionRate || 0;
    contract.commissionPaid = map.commissionPaid || false;
    contract.commissionPaidDate = map.commissionPaidDate || null;
    contract.commissionPaidInPayrollId = map.commissionPaidInPayrollId || null;

    return contract;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return ContractModel.fromMap(data, doc.id);
  }

  toMap() {
    return {
      userId: this.userId,
      ptId: this.ptId,
      ptPackageId: this.ptPackageId,
      weeklySchedule: this.weeklySchedule.toMap(),
      status: this.status,
      paymentOrderCode: this.paymentOrderCode,
      paymentAmount: this.paymentAmount,
      paymentStatus: this.paymentStatus,
      paidAt: this.paidAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      startDate: this.startDate,
      endDate: this.endDate,

      // ⭐ Commission fields
      commissionAmount: this.commissionAmount,
      commissionRate: this.commissionRate,
      commissionPaid: this.commissionPaid,
      commissionPaidDate: this.commissionPaidDate,
      commissionPaidInPayrollId: this.commissionPaidInPayrollId,
    };
  }

  /**
   * Tạo contract mới
   */
  static async createContract({
    userId,
    ptId,
    ptPackageId,
    weeklySchedule,
    paymentOrderCode = null,
    paymentAmount = null,
    startDate = null,
    endDate = null,
  }) {
    try {
      const contractData = {
        userId,
        ptId,
        ptPackageId,
        weeklySchedule: weeklySchedule.toMap(),
        status: "pending_payment",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (paymentOrderCode) contractData.paymentOrderCode = paymentOrderCode;
      if (paymentAmount) contractData.paymentAmount = paymentAmount;
      if (startDate) contractData.startDate = startDate;
      if (endDate) contractData.endDate = endDate;

      const docRef = await addDoc(collection(db, "contracts"), contractData);
      console.log("Contract created successfully with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating contract:", error);
      throw error;
    }
  }

  /**
   * Lấy contract theo userId
   */
  static async getContractsByUserId(userId) {
    try {
      const q = query(
        collection(db, "contracts"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ContractModel.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching contracts by userId:", error);
      throw error;
    }
  }

  /**
   * Lấy contract theo ptId
   */
  static async getContractsByPtId(ptId) {
    try {
      const q = query(
        collection(db, "contracts"),
        where("ptId", "==", ptId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ContractModel.fromFirestore(doc));
    } catch (error) {
      console.error("Error fetching contracts by ptId:", error);
      throw error;
    }
  }

  /**
   * Lấy contract theo ID
   */
  static async getContractById(contractId) {
    try {
      const docRef = doc(db, "contracts", contractId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return ContractModel.fromFirestore(docSnap);
      } else {
        throw new Error("Contract not found");
      }
    } catch (error) {
      console.error("Error fetching contract by ID:", error);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái contract
   */
  static async updateContractStatus({
    contractId,
    status,
    startDate = null,
    endDate = null,
  }) {
    try {
      const updateData = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (startDate) updateData.startDate = startDate;
      if (endDate) updateData.endDate = endDate;

      const docRef = doc(db, "contracts", contractId);
      await updateDoc(docRef, updateData);

      console.log("Contract status updated successfully");
    } catch (error) {
      console.error("Error updating contract status:", error);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin thanh toán
   */
  static async updatePaymentInfo({
    contractId,
    paymentOrderCode,
    paymentAmount,
    paymentStatus,
    paidAt = null,
  }) {
    try {
      await updateDoc(doc(db, "contracts", contractId), {
        paymentOrderCode,
        paymentAmount,
        paymentStatus,
        paidAt: paidAt || Timestamp.now(),
        status: paymentStatus === "PAID" ? "paid" : "pending_payment",
        updatedAt: Timestamp.now(),
      });

      console.log("Payment info updated successfully");

      // ⭐ Tính và lưu hoa hồng khi payment thành công
      if (paymentStatus === "PAID") {
        try {
          await this.calculateAndSaveCommission(contractId);
          console.log("✅ Commission calculated and saved");
        } catch (error) {
          console.error(
            "⚠️ Error calculating commission (non-blocking):",
            error
          );
          // Không throw error để không block payment flow
        }
      }
    } catch (error) {
      console.error("Error updating payment info:", error);
      throw error;
    }
  }

  /**
   * Cập nhật lịch tập (weekly schedule) của contract
   */
  static async updateWeeklySchedule({ contractId, weeklySchedule }) {
    try {
      await updateDoc(doc(db, "contracts", contractId), {
        weeklySchedule: weeklySchedule.toMap(),
        updatedAt: Timestamp.now(),
      });

      console.log("Contract weekly schedule updated successfully");
    } catch (error) {
      console.error("Error updating contract weekly schedule:", error);
      throw error;
    }
  }

  copyWith({
    id,
    userId,
    ptId,
    ptPackageId,
    weeklySchedule,
    status,
    paymentOrderCode,
    paymentAmount,
    paymentStatus,
    paidAt,
    createdAt,
    updatedAt,
    startDate,
    endDate,
  } = {}) {
    return new ContractModel({
      id: id !== undefined ? id : this.id,
      userId: userId !== undefined ? userId : this.userId,
      ptId: ptId !== undefined ? ptId : this.ptId,
      ptPackageId: ptPackageId !== undefined ? ptPackageId : this.ptPackageId,
      weeklySchedule:
        weeklySchedule !== undefined ? weeklySchedule : this.weeklySchedule,
      status: status !== undefined ? status : this.status,
      paymentOrderCode:
        paymentOrderCode !== undefined
          ? paymentOrderCode
          : this.paymentOrderCode,
      paymentAmount:
        paymentAmount !== undefined ? paymentAmount : this.paymentAmount,
      paymentStatus:
        paymentStatus !== undefined ? paymentStatus : this.paymentStatus,
      paidAt: paidAt !== undefined ? paidAt : this.paidAt,
      createdAt: createdAt !== undefined ? createdAt : this.createdAt,
      updatedAt: updatedAt !== undefined ? updatedAt : this.updatedAt,
      startDate: startDate !== undefined ? startDate : this.startDate,
      endDate: endDate !== undefined ? endDate : this.endDate,
    });
  }

  /**
   * ⭐ Tính và lưu hoa hồng khi contract được paid
   */
  static async calculateAndSaveCommission(contractId) {
    try {
      console.log("🔄 Calculating commission for contract:", contractId);

      // 1. Get contract
      const contract = await this.getContractById(contractId);
      if (!contract) {
        console.error("❌ Contract not found");
        return null;
      }

      if (contract.status !== "paid") {
        console.log("⚠️ Contract not paid yet, skipping commission");
        return null;
      }

      // 2. Get package info
      const PTPackageModel = (await import("../pt/pt-package.model.js"))
        .default;
      const ptPackage = await PTPackageModel.getById(contract.ptPackageId);

      if (!ptPackage) {
        console.error("❌ PT Package not found");
        return null;
      }

      // 3. Tính hoa hồng
      const commissionRate = ptPackage.commissionRate || 15;
      const commissionAmount = ptPackage.price * (commissionRate / 100);

      console.log("💰 Commission calculated:", {
        packagePrice: ptPackage.price,
        commissionRate: commissionRate + "%",
        commissionAmount,
      });

      // 4. Lưu vào contract
      const contractRef = doc(db, "contracts", contractId);
      await updateDoc(contractRef, {
        commissionAmount,
        commissionRate,
        updatedAt: Timestamp.now(),
      });

      console.log("✅ Commission saved to contract");
      return commissionAmount;
    } catch (error) {
      console.error("❌ Error calculating commission:", error);
      throw error;
    }
  }
}

export default ContractModel;
