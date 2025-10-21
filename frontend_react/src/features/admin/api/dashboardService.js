import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../../../firebase/lib/config/firebase";

/**
 * Lấy số lượng members đang active
 */
async function getActiveMembers() {
  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("membership_status", "==", "Active"),
      where("isActive", "==", true)
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error getting active members:", error);
    return 0;
  }
}

/**
 * Lấy số lượng check-ins hôm nay
 */
async function getTodayCheckins() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkinsRef = collection(db, "checkins");
    const q = query(
      checkinsRef,
      where("checkedAt", ">=", Timestamp.fromDate(today)),
      where("checkedAt", "<", Timestamp.fromDate(tomorrow))
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error getting today checkins:", error);
    return 0;
  }
}

/**
 * Lấy số lượng gói đang active
 */
async function getActivePackages() {
  try {
    const packagesRef = collection(db, "packages");
    const q = query(packagesRef, where("Status", "==", "active"));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error getting active packages:", error);
    return 0;
  }
}

/**
 * Tính tổng doanh thu từ các users đang active
 */
async function getTotalRevenue() {
  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("membership_status", "==", "Active"),
      where("isActive", "==", true)
    );
    const snapshot = await getDocs(q);

    let totalRevenue = 0;
    const packageCache = new Map();

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const packageId = userData.current_package_id;

      if (packageId) {
        // Lấy giá package từ cache hoặc query
        if (!packageCache.has(packageId)) {
          const packagesRef = collection(db, "packages");
          const packageQuery = query(
            packagesRef,
            where("PackageId", "==", packageId),
            limit(1)
          );
          const packageSnapshot = await getDocs(packageQuery);

          if (!packageSnapshot.empty) {
            const packageData = packageSnapshot.docs[0].data();
            packageCache.set(packageId, packageData.Price || 0);
          } else {
            packageCache.set(packageId, 0);
          }
        }

        totalRevenue += packageCache.get(packageId);
      }
    }

    // Trả về doanh thu tính bằng triệu
    return Math.round(totalRevenue / 1000000);
  } catch (error) {
    console.error("Error calculating revenue:", error);
    return 0;
  }
}

/**
 * Lấy danh sách check-ins gần đây
 */
async function getRecentCheckins() {
  try {
    const checkinsRef = collection(db, "checkins");
    const q = query(checkinsRef, orderBy("checkedAt", "desc"), limit(5));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const checkedAt = data.checkedAt?.toDate();
      const timeAgo = getTimeAgo(checkedAt);
      const memberName = data.memberName || "Unknown";
      return `${memberName} đã check-in — ${timeAgo}`;
    });
  } catch (error) {
    console.error("Error getting recent checkins:", error);
    return [];
  }
}

/**
 * Lấy series data cho chart (check-ins 7 ngày gần đây)
 */
async function getCheckinSeries() {
  try {
    const series = [];
    const checkinsRef = collection(db, "checkins");

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const q = query(
        checkinsRef,
        where("checkedAt", ">=", Timestamp.fromDate(date)),
        where("checkedAt", "<", Timestamp.fromDate(nextDate))
      );

      const snapshot = await getCountFromServer(q);
      series.push(snapshot.data().count);
    }

    return series;
  } catch (error) {
    console.error("Error getting checkin series:", error);
    return [0, 0, 0, 0, 0, 0, 0];
  }
}

/**
 * Helper function để format thời gian
 */
function getTimeAgo(date) {
  if (!date) return "không rõ";

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${diffDays} ngày trước`;
}

/**
 * Fetch tất cả dữ liệu dashboard
 */
export async function fetchDashboard() {
  try {
    const [
      activeMembers,
      todayCheckins,
      openPackages,
      revenueM,
      recent,
      series,
    ] = await Promise.all([
      getActiveMembers(),
      getTodayCheckins(),
      getActivePackages(),
      getTotalRevenue(),
      getRecentCheckins(),
      getCheckinSeries(),
    ]);

    return {
      activeMembers,
      todayCheckins,
      openPackages,
      revenueM,
      recent,
      series,
    };
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    throw error;
  }
}
