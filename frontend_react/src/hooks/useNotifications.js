import { useEffect, useState } from "react";
import notificationService from "../services/notificationService";

/**
 * Hook để sử dụng notification service trong component
 * @param {string} ptId - ID của PT
 * @returns {object} - { notifications, unreadCount }
 */
export const useNotifications = (ptId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!ptId) return;

    console.log("Starting notification listener for PT:", ptId);

    // Callback khi có notification mới
    const handleNewNotification = (notification) => {
      console.log("New notification in hook:", notification);

      // Thêm notification vào đầu list
      setNotifications((prev) => {
        // Kiểm tra trùng lặp
        if (prev.some((n) => n.id === notification.id)) {
          return prev;
        }
        return [notification, ...prev];
      });

      // Tăng unread count
      setUnreadCount((prev) => prev + 1);
    };

    // Bắt đầu lắng nghe
    notificationService.startListening(ptId, handleNewNotification);

    // Cleanup khi component unmount
    return () => {
      notificationService.stopListening();
    };
  }, [ptId]);

  // Hàm đánh dấu đã đọc
  const markAsRead = async (notificationId) => {
    await notificationService.markAsRead(notificationId);

    // Cập nhật state
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );

    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
  };
};
