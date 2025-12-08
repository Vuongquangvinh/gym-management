import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase.js";

/**
 * 💰 Commission Service - Quản lý hoa hồng PT
 * Service đơn giản để tính hoa hồng từ contracts
 */
export class CommissionService {
  /**
   * Lấy tất cả contracts đã paid của PT trong tháng
   * @param {string} ptId - ID của PT
   * @param {number} month - Tháng (1-12)
   * @param {number} year - Năm
   * @returns {Promise<Array>} Danh sách contracts
   */
  static async getPTContractsByMonth(ptId, month, year) {
    try {
      console.log(`🔍 Getting PT contracts for ${month}/${year}`);

      const q = query(
        collection(db, "contracts"),
        where("ptId", "==", ptId),
        where("status", "==", "paid")
      );

      const snapshot = await getDocs(q);
      const contracts = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const paidDate = data.paidAt?.toDate();

        // Filter by month/year
        if (
          paidDate &&
          paidDate.getMonth() + 1 === month &&
          paidDate.getFullYear() === year
        ) {
          contracts.push({
            id: doc.id,
            ...data,
            paidAt: paidDate,
          });
        }
      });

      console.log(`✅ Found ${contracts.length} contracts`);
      return contracts;
    } catch (error) {
      console.error("❌ Error getting PT contracts:", error);
      return [];
    }
  }

  /**
   * Tính tổng hoa hồng của PT trong tháng
   * @param {string} ptId - ID của PT
   * @param {number} month - Tháng (1-12)
   * @param {number} year - Năm
   * @returns {Promise<Object>} { total, count, contracts }
   */
  static async calculateMonthlyCommission(ptId, month, year) {
    try {
      console.log(
        `💰 Calculating commission for PT ${ptId} in ${month}/${year}`
      );

      const contracts = await this.getPTContractsByMonth(ptId, month, year);

      // Lọc những contract chưa trả hoa hồng
      const unpaidContracts = contracts.filter((c) => !c.commissionPaid);

      const totalCommission = unpaidContracts.reduce((sum, contract) => {
        return sum + (contract.commissionAmount || 0);
      }, 0);

      const result = {
        total: totalCommission,
        count: unpaidContracts.length,
        contracts: unpaidContracts.map((c) => ({
          id: c.id,
          packageName: c.packageName || "Gói PT",
          amount: c.commissionAmount || 0,
          rate: c.commissionRate || 0,
          paidAt: c.paidAt,
        })),
      };

      console.log(
        `✅ Total commission: ${totalCommission} VND from ${unpaidContracts.length} contracts`
      );
      return result;
    } catch (error) {
      console.error("❌ Error calculating monthly commission:", error);
      return { total: 0, count: 0, contracts: [] };
    }
  }

  /**
   * Đánh dấu hoa hồng đã trả
   * @param {Array<string>} contractIds - Danh sách contract IDs
   * @param {string} payrollId - ID của payroll
   */
  static async markCommissionAsPaid(contractIds, payrollId) {
    try {
      console.log(`✅ Marking ${contractIds.length} commissions as paid`);

      const updates = contractIds.map((contractId) =>
        updateDoc(doc(db, "contracts", contractId), {
          commissionPaid: true,
          commissionPaidDate: Timestamp.now(),
          commissionPaidInPayrollId: payrollId,
        })
      );

      await Promise.all(updates);
      console.log("✅ All commissions marked as paid");
    } catch (error) {
      console.error("❌ Error marking commissions as paid:", error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử hoa hồng đã trả của PT
   * @param {string} ptId - ID của PT
   * @param {number} limit - Số lượng records tối đa
   * @returns {Promise<Array>} Danh sách lịch sử
   */
  static async getPaidCommissionHistory(ptId, limit = 10) {
    try {
      const q = query(
        collection(db, "contracts"),
        where("ptId", "==", ptId),
        where("commissionPaid", "==", true)
      );

      const snapshot = await getDocs(q);
      const history = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          commissionAmount: data.commissionAmount || 0,
          commissionRate: data.commissionRate || 0,
          paidDate: data.commissionPaidDate?.toDate(),
          payrollId: data.commissionPaidInPayrollId,
          packageName: data.packageName || "N/A",
        });
      });

      // Sort by paid date (newest first)
      history.sort((a, b) => b.paidDate - a.paidDate);

      console.log(`✅ Found ${history.length} paid commissions`);
      return history.slice(0, limit);
    } catch (error) {
      console.error("❌ Error getting paid commission history:", error);
      return [];
    }
  }

  /**
   * Lấy tổng hoa hồng đã trả trong năm
   * @param {string} ptId - ID của PT
   * @param {number} year - Năm
   * @returns {Promise<Object>} Thống kê theo tháng
   */
  static async getYearlyCommissionStats(ptId, year) {
    try {
      const q = query(
        collection(db, "contracts"),
        where("ptId", "==", ptId),
        where("status", "==", "paid")
      );

      const snapshot = await getDocs(q);
      const monthlyStats = Array(12)
        .fill(0)
        .map((_, i) => ({
          month: i + 1,
          total: 0,
          count: 0,
        }));

      snapshot.forEach((doc) => {
        const data = doc.data();
        const paidDate = data.paidAt?.toDate();

        if (paidDate && paidDate.getFullYear() === year) {
          const month = paidDate.getMonth();
          monthlyStats[month].total += data.commissionAmount || 0;
          monthlyStats[month].count += 1;
        }
      });

      return {
        year,
        monthlyStats,
        totalYear: monthlyStats.reduce((sum, m) => sum + m.total, 0),
        totalContracts: monthlyStats.reduce((sum, m) => sum + m.count, 0),
      };
    } catch (error) {
      console.error("❌ Error getting yearly stats:", error);
      return null;
    }
  }
}

export default CommissionService;
