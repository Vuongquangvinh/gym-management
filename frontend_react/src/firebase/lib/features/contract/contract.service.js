import ContractModel from "./contract.model.js";

export class ContractService {
  /**
   * Tạo contract mới
   */
  static async createContract(contractData) {
    try {
      const contractId = await ContractModel.createContract(contractData);
      return {
        success: true,
        data: contractId,
        message: "Tạo hợp đồng thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lỗi tạo hợp đồng",
      };
    }
  }

  /**
   * Lấy tất cả contracts của một user
   */
  static async getContractsByUserId(userId) {
    try {
      const contracts = await ContractModel.getContractsByUserId(userId);
      return {
        success: true,
        data: contracts,
        message: "Lấy danh sách hợp đồng thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lỗi lấy danh sách hợp đồng",
      };
    }
  }

  /**
   * Lấy tất cả contracts của một PT
   */
  static async getContractsByPtId(ptId) {
    try {
      const contracts = await ContractModel.getContractsByPtId(ptId);
      return {
        success: true,
        data: contracts,
        message: "Lấy danh sách hợp đồng thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lỗi lấy danh sách hợp đồng",
      };
    }
  }

  /**
   * Lấy contract theo ID
   */
  static async getContractById(contractId) {
    try {
      const contract = await ContractModel.getContractById(contractId);
      return {
        success: true,
        data: contract,
        message: "Lấy thông tin hợp đồng thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Không tìm thấy hợp đồng",
      };
    }
  }

  /**
   * Cập nhật trạng thái contract
   */
  static async updateContractStatus(data) {
    try {
      await ContractModel.updateContractStatus(data);
      return {
        success: true,
        message: "Cập nhật trạng thái hợp đồng thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lỗi cập nhật trạng thái hợp đồng",
      };
    }
  }

  /**
   * Cập nhật thông tin thanh toán
   */
  static async updatePaymentInfo(data) {
    try {
      await ContractModel.updatePaymentInfo(data);
      return {
        success: true,
        message: "Cập nhật thông tin thanh toán thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lỗi cập nhật thông tin thanh toán",
      };
    }
  }

  /**
   * Cập nhật lịch tập
   */
  static async updateWeeklySchedule(data) {
    try {
      await ContractModel.updateWeeklySchedule(data);
      return {
        success: true,
        message: "Cập nhật lịch tập thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lỗi cập nhật lịch tập",
      };
    }
  }

  /**
   * Lấy thông tin học viên và contracts của PT (Phiên bản cải tiến)
   * @param {string} ptId - ID của PT (employee ID)
   * @returns {Promise<{success: boolean, data: Array, message: string}>}
   */
  static async getPTClientsWithContracts(ptId) {
    try {
      // 1. Lấy tất cả contracts của PT này
      const contracts = await ContractModel.getContractsByPtId(ptId);

      console.log("📋 Contracts found:", contracts.length);

      if (!contracts || contracts.length === 0) {
        return {
          success: true,
          data: [],
          message: "Chưa có học viên nào",
        };
      }

      // 2. Import Firebase để query trực tiếp
      const { collection, query, where, getDocs } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../../config/firebase.js");

      // Lấy unique userIds và packageIds
      const userIds = [...new Set(contracts.map((c) => c.userId))];
      const packageIds = [...new Set(contracts.map((c) => c.ptPackageId))];

      console.log("👥 UserIds to fetch:", userIds);
      console.log("📦 PackageIds to fetch:", packageIds);

      // Fetch users trực tiếp từ Firestore
      const usersMap = {};
      for (const userId of userIds) {
        try {
          const userQuery = query(
            collection(db, "users"),
            where("__name__", "==", userId)
          );
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();
            usersMap[userDoc.id] = {
              ...userData,
              // QUAN TRỌNG: Dùng document ID làm client ID (thống nhất với Flutter)
              // Contract lưu userId = document ID, không phải field _id
              _id: userDoc.id, // ← Dùng document ID làm _id để chat khớp
              id: userDoc.id,
            };
            console.log(
              "✅ Fetched user:",
              userDoc.id,
              "- Using document ID as _id for chat compatibility"
            );
          } else {
            console.log("❌ User not found:", userId);
          }
        } catch (error) {
          console.error("Error fetching user:", userId, error);
        }
      }

      // Fetch packages trực tiếp từ Firestore
      const packagesMap = {};
      for (const packageId of packageIds) {
        try {
          const packageQuery = query(
            collection(db, "ptPackages"),
            where("__name__", "==", packageId)
          );
          const packageSnapshot = await getDocs(packageQuery);

          if (!packageSnapshot.empty) {
            const packageDoc = packageSnapshot.docs[0];
            const packageData = packageDoc.data();
            packagesMap[packageDoc.id] = {
              id: packageDoc.id,
              ...packageData,
            };
            console.log("✅ Fetched package:", packageDoc.id, packageData);
          } else {
            console.log("❌ Package not found:", packageId);
          }
        } catch (error) {
          console.error("Error fetching package:", packageId, error);
        }
      }

      // 3. Kết hợp thông tin
      const clientsData = contracts.map((contract) => {
        const user = usersMap[contract.userId];
        const ptPackage = packagesMap[contract.ptPackageId];

        console.log("🔗 Mapping contract:", {
          contractId: contract.id,
          userId: contract.userId,
          user: user,
          packageId: contract.ptPackageId,
          package: ptPackage,
        });

        return {
          contractId: contract.id,
          contract: contract,
          user: user || null,
          package: ptPackage || null,

          // Thông tin hiển thị
          userName: user?.full_name || user?.name || "N/A",
          userEmail: user?.email || "N/A",
          userPhone: user?.phone_number || user?.phoneNumber || "N/A",
          packageName: ptPackage?.name || "N/A",
          packageType: ptPackage?.packageType || ptPackage?.type || "N/A",
          sessionsTotal: ptPackage?.sessions || ptPackage?.totalSessions || 0,
          sessionsRemaining:
            ptPackage?.sessions || ptPackage?.totalSessions || 0, // TODO: Tính từ checkins
          status: contract.status,
          paymentStatus: contract.paymentStatus,
          startDate: contract.startDate,
          endDate: contract.endDate,
          createdAt: contract.createdAt,
          weeklySchedule: contract.weeklySchedule,
        };
      });

      console.log("✨ Final clients data:", clientsData);

      return {
        success: true,
        data: clientsData,
        message: "Lấy danh sách học viên thành công",
      };
    } catch (error) {
      console.error("Error getting PT clients with contracts:", error);
      return {
        success: false,
        error: error.message,
        message: "Lỗi lấy danh sách học viên",
      };
    }
  }

  /**
   * Lấy thống kê contract của PT
   */
  static async getPTContractStats(ptId) {
    try {
      const contracts = await ContractModel.getContractsByPtId(ptId);

      const stats = {
        total: contracts.length,
        pending: contracts.filter((c) => c.status === "pending_payment").length,
        paid: contracts.filter((c) => c.status === "paid").length,
        active: contracts.filter((c) => c.status === "active").length,
        completed: contracts.filter((c) => c.status === "completed").length,
        cancelled: contracts.filter((c) => c.status === "cancelled").length,
      };

      return {
        success: true,
        data: stats,
        message: "Lấy thống kê thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Lỗi lấy thống kê",
      };
    }
  }
}

export default ContractService;
