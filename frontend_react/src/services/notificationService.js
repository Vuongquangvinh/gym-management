import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase/lib/config/firebase";

/**
 * Service để lắng nghe notification real-time cho PT từ Firestore
 * Không cần FCM token, sử dụng Firestore real-time listener
 */

class NotificationService {
  constructor() {
    this.unsubscribe = null;
    this.notificationCallback = null;
  }

  /**
   * Bắt đầu lắng nghe notifications cho PT
   * @param {string} ptId - ID của PT (employee ID)
   * @param {function} callback - Hàm callback khi có notification mới
   */
  startListening(ptId, callback) {
    if (this.unsubscribe) {
      console.warn("Already listening to notifications");
      return;
    }

    this.notificationCallback = callback;

    // Lắng nghe collection notifications của PT
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("recipientId", "==", ptId),
      where("read", "==", false),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    console.log("Starting to listen for notifications for PT:", ptId);

    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const notification = {
              id: change.doc.id,
              ...change.doc.data(),
            };

            console.log("New notification received:", notification);

            // Hiển thị browser notification nếu được phép
            this.showBrowserNotification(notification);

            // Gọi callback để UI có thể cập nhật
            if (this.notificationCallback) {
              this.notificationCallback(notification);
            }
          }
        });
      },
      (error) => {
        console.error("Error listening to notifications:", error);
      }
    );
  }

  /**
   * Hiển thị browser notification (không cần FCM)
   */
  showBrowserNotification(notification) {
    if ("Notification" in window && Notification.permission === "granted") {
      const title = notification.title || "Thông báo mới";
      const options = {
        body: notification.body || notification.message,
        icon: "/logo.png",
        badge: "/badge.png",
        tag: notification.id,
        requireInteraction: true,
        data: notification,
      };

      const browserNotification = new Notification(title, options);

      browserNotification.onclick = () => {
        window.focus();
        // Đánh dấu đã đọc
        this.markAsRead(notification.id);
        browserNotification.close();
      };
    }
  }

  /**
   * Đánh dấu notification đã đọc
   */
  async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: new Date(),
      });
      console.log("Notification marked as read:", notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  /**
   * Dừng lắng nghe notifications
   */
  stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.notificationCallback = null;
      console.log("Stopped listening to notifications");
    }
  }

  /**
   * Yêu cầu quyền notification từ browser
   */
  async requestPermission() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      console.log("Notification permission:", permission);
      return permission === "granted";
    }
    return false;
  }
}

export default new NotificationService();
