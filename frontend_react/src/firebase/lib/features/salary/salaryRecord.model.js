import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";

/**
 * SalaryRecordModel - Bảng lương thực tế hàng tháng của nhân viên
 * Collection: salary_records
 */
export class SalaryRecordModel {
  constructor({
    _id = null,
    employeeId = "",
    employeeName = "",
    position = "",
    month = new Date().getMonth() + 1,
    year = new Date().getFullYear(),

    // Lương cơ bản và cấu trúc
    baseSalary = 0,
    salaryType = "MONTHLY", // MONTHLY, HOURLY, COMMISSION

    // Phụ cấp
    allowances = {
      housing: 0,
      transport: 0,
      meal: 0,
      phone: 0,
      other: 0,
    },

    // Khấu trừ
    deductions = {
      insurance: 0,
      tax: 0,
      advance: 0, // Tạm ứng
      other: 0,
    },

    // Thông tin làm việc thực tế
    standardWorkDays = 26, // Số ngày công chuẩn
    actualWorkDays = 0, // Số ngày công thực tế
    absentDays = 0, // Số ngày nghỉ không lương
    lateDays = 0, // Số ngày đi muộn

    // Làm thêm giờ
    overtimeHours = 0,
    overtimeRate = 1.5, // Hệ số tăng ca (1.5x, 2x)
    overtimePay = 0,

    // Thưởng và phạt
    bonuses = 0,
    penalties = 0,
    bonusNotes = "",
    penaltyNotes = "",

    // Hoa hồng (cho PT)
    commission = 0,
    commissionRate = 0,

    // Tổng lương
    grossSalary = 0, // Tổng lương trước thuế
    netSalary = 0, // Lương thực nhận

    // Trạng thái
    status = "PENDING", // PENDING, APPROVED, PAID
    approvedBy = null,
    approvedAt = null,
    paidAt = null,

    // Ghi chú
    notes = "",

    createdAt = new Date(),
    updatedAt = new Date(),
  } = {}) {
    this._id = _id;
    this.employeeId = employeeId;
    this.employeeName = employeeName;
    this.position = position;
    this.month = month;
    this.year = year;

    this.baseSalary = baseSalary;
    this.salaryType = salaryType;

    this.allowances = allowances;
    this.deductions = deductions;

    this.standardWorkDays = standardWorkDays;
    this.actualWorkDays = actualWorkDays;
    this.absentDays = absentDays;
    this.lateDays = lateDays;

    this.overtimeHours = overtimeHours;
    this.overtimeRate = overtimeRate;
    this.overtimePay = overtimePay;

    this.bonuses = bonuses;
    this.penalties = penalties;
    this.bonusNotes = bonusNotes;
    this.penaltyNotes = penaltyNotes;

    this.commission = commission;
    this.commissionRate = commissionRate;

    this.grossSalary = grossSalary;
    this.netSalary = netSalary;

    this.status = status;
    this.approvedBy = approvedBy;
    this.approvedAt = approvedAt;
    this.paidAt = paidAt;

    this.notes = notes;

    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Tính toán lương tự động
   */
  calculate() {
    // 1. Tính lương cơ bản theo số ngày công
    let calculatedBaseSalary = this.baseSalary;

    if (
      this.salaryType === "MONTHLY" &&
      this.actualWorkDays < this.standardWorkDays
    ) {
      // Trừ lương theo ngày nghỉ
      calculatedBaseSalary =
        (this.baseSalary / this.standardWorkDays) * this.actualWorkDays;
    }

    // 2. Tính lương tăng ca
    if (this.salaryType === "MONTHLY" && this.overtimeHours > 0) {
      const hourlyRate = this.baseSalary / this.standardWorkDays / 8; // 8 giờ/ngày
      this.overtimePay = hourlyRate * this.overtimeHours * this.overtimeRate;
    } else if (this.salaryType === "HOURLY") {
      this.overtimePay =
        this.baseSalary * this.overtimeHours * this.overtimeRate;
    }

    // 3. Tổng phụ cấp
    const totalAllowances = Object.values(this.allowances).reduce(
      (sum, val) => sum + (val || 0),
      0
    );

    // 4. Tổng khấu trừ
    const totalDeductions = Object.values(this.deductions).reduce(
      (sum, val) => sum + (val || 0),
      0
    );

    // 5. Tính tổng lương
    this.grossSalary =
      calculatedBaseSalary +
      this.overtimePay +
      totalAllowances +
      this.bonuses +
      this.commission;

    this.netSalary = this.grossSalary - totalDeductions - this.penalties;

    // Đảm bảo không âm
    this.netSalary = Math.max(0, this.netSalary);

    return {
      calculatedBaseSalary,
      overtimePay: this.overtimePay,
      totalAllowances,
      totalDeductions,
      grossSalary: this.grossSalary,
      netSalary: this.netSalary,
    };
  }

  /**
   * Validate dữ liệu
   */
  validate() {
    if (!this.employeeId) {
      throw new Error("Thiếu thông tin nhân viên");
    }

    if (!this.month || this.month < 1 || this.month > 12) {
      throw new Error("Tháng không hợp lệ");
    }

    if (!this.year || this.year < 2020) {
      throw new Error("Năm không hợp lệ");
    }

    if (this.baseSalary < 0) {
      throw new Error("Lương cơ bản không được âm");
    }

    if (this.actualWorkDays < 0 || this.actualWorkDays > 31) {
      throw new Error("Số ngày công không hợp lệ");
    }

    return true;
  }

  /**
   * Convert to Firestore format
   */
  toFirestore() {
    // Tính toán trước khi lưu
    this.calculate();

    return {
      employeeId: this.employeeId,
      employeeName: this.employeeName,
      position: this.position,
      month: this.month,
      year: this.year,

      baseSalary: this.baseSalary,
      salaryType: this.salaryType,

      allowances: this.allowances,
      deductions: this.deductions,

      standardWorkDays: this.standardWorkDays,
      actualWorkDays: this.actualWorkDays,
      absentDays: this.absentDays,
      lateDays: this.lateDays,

      overtimeHours: this.overtimeHours,
      overtimeRate: this.overtimeRate,
      overtimePay: this.overtimePay,

      bonuses: this.bonuses,
      penalties: this.penalties,
      bonusNotes: this.bonusNotes,
      penaltyNotes: this.penaltyNotes,

      commission: this.commission,
      commissionRate: this.commissionRate,

      grossSalary: this.grossSalary,
      netSalary: this.netSalary,

      status: this.status,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt
        ? Timestamp.fromDate(new Date(this.approvedAt))
        : null,
      paidAt: this.paidAt ? Timestamp.fromDate(new Date(this.paidAt)) : null,

      notes: this.notes,

      createdAt: this.createdAt
        ? Timestamp.fromDate(new Date(this.createdAt))
        : Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  }

  /**
   * Lưu salary record
   */
  async save() {
    try {
      this.validate();

      const salaryRecordsRef = collection(db, "salary_records");

      if (this._id) {
        // Update existing record
        const docRef = doc(db, "salary_records", this._id);
        await updateDoc(docRef, this.toFirestore());
        return this._id;
      } else {
        // Check if record exists for this employee + month + year
        const existingQuery = query(
          salaryRecordsRef,
          where("employeeId", "==", this.employeeId),
          where("month", "==", this.month),
          where("year", "==", this.year)
        );

        const existingSnapshot = await getDocs(existingQuery);

        if (!existingSnapshot.empty) {
          throw new Error(
            `Bảng lương tháng ${this.month}/${this.year} của nhân viên này đã tồn tại`
          );
        }

        // Create new record
        const docRef = await addDoc(salaryRecordsRef, this.toFirestore());
        this._id = docRef.id;
        return docRef.id;
      }
    } catch (error) {
      console.error("Error saving salary record:", error);
      throw error;
    }
  }

  /**
   * Get salary record by ID
   */
  static async getById(id) {
    try {
      const docRef = doc(db, "salary_records", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Convert Timestamps
        if (data.approvedAt instanceof Timestamp) {
          data.approvedAt = data.approvedAt.toDate();
        }
        if (data.paidAt instanceof Timestamp) {
          data.paidAt = data.paidAt.toDate();
        }
        if (data.createdAt instanceof Timestamp) {
          data.createdAt = data.createdAt.toDate();
        }
        if (data.updatedAt instanceof Timestamp) {
          data.updatedAt = data.updatedAt.toDate();
        }

        return new SalaryRecordModel({ _id: docSnap.id, ...data });
      } else {
        throw new Error("Không tìm thấy bảng lương");
      }
    } catch (error) {
      console.error("Error getting salary record:", error);
      throw error;
    }
  }

  /**
   * Get salary records by month/year
   */
  static async getByMonthYear(month, year) {
    try {
      const q = query(
        collection(db, "salary_records"),
        where("month", "==", month),
        where("year", "==", year),
        orderBy("employeeName")
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        // Convert Timestamps
        if (data.approvedAt instanceof Timestamp) {
          data.approvedAt = data.approvedAt.toDate();
        }
        if (data.paidAt instanceof Timestamp) {
          data.paidAt = data.paidAt.toDate();
        }
        if (data.createdAt instanceof Timestamp) {
          data.createdAt = data.createdAt.toDate();
        }
        if (data.updatedAt instanceof Timestamp) {
          data.updatedAt = data.updatedAt.toDate();
        }

        return new SalaryRecordModel({ _id: docSnap.id, ...data });
      });
    } catch (error) {
      console.error("Error getting salary records:", error);
      throw error;
    }
  }

  /**
   * Get salary records by employee
   */
  static async getByEmployee(employeeId, limit = 12) {
    try {
      const q = query(
        collection(db, "salary_records"),
        where("employeeId", "==", employeeId),
        orderBy("year", "desc"),
        orderBy("month", "desc")
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.slice(0, limit).map((docSnap) => {
        const data = docSnap.data();

        // Convert Timestamps
        if (data.approvedAt instanceof Timestamp) {
          data.approvedAt = data.approvedAt.toDate();
        }
        if (data.paidAt instanceof Timestamp) {
          data.paidAt = data.paidAt.toDate();
        }
        if (data.createdAt instanceof Timestamp) {
          data.createdAt = data.createdAt.toDate();
        }
        if (data.updatedAt instanceof Timestamp) {
          data.updatedAt = data.updatedAt.toDate();
        }

        return new SalaryRecordModel({ _id: docSnap.id, ...data });
      });
    } catch (error) {
      console.error("Error getting employee salary records:", error);
      throw error;
    }
  }

  /**
   * Approve salary record
   */
  async approve(approvedBy) {
    try {
      this.status = "APPROVED";
      this.approvedBy = approvedBy;
      this.approvedAt = new Date();

      if (this._id) {
        const docRef = doc(db, "salary_records", this._id);
        await updateDoc(docRef, {
          status: this.status,
          approvedBy: this.approvedBy,
          approvedAt: Timestamp.fromDate(this.approvedAt),
          updatedAt: Timestamp.now(),
        });
      }

      return true;
    } catch (error) {
      console.error("Error approving salary record:", error);
      throw error;
    }
  }

  /**
   * Mark as paid
   */
  async markAsPaid() {
    try {
      this.status = "PAID";
      this.paidAt = new Date();

      if (this._id) {
        const docRef = doc(db, "salary_records", this._id);
        await updateDoc(docRef, {
          status: this.status,
          paidAt: Timestamp.fromDate(this.paidAt),
          updatedAt: Timestamp.now(),
        });
      }

      return true;
    } catch (error) {
      console.error("Error marking salary as paid:", error);
      throw error;
    }
  }

  /**
   * Delete salary record
   */
  static async delete(id) {
    try {
      const docRef = doc(db, "salary_records", id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting salary record:", error);
      throw error;
    }
  }
}

export default SalaryRecordModel;
