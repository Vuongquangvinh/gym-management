import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/lib/config/firebase";

/**
 * Chat Service - Quản lý tin nhắn giữa PT và Client
 */
export class ChatService {
  /**
   * Tạo hoặc lấy chat giữa PT và Client
   */
  static async getOrCreateChat(ptId, clientId) {
    try {
      console.log("🔍 Getting chat for PT:", ptId, "Client:", clientId);

      const chatId = `${ptId}_${clientId}`;
      console.log("📝 Chat ID:", chatId);

      const chatRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        console.log("✅ Chat exists");
        return { id: chatDoc.id, ...chatDoc.data() };
      }

      // Tạo chat mới
      console.log("📝 Creating new chat...");
      const newChat = {
        pt_id: ptId,
        client_id: clientId,
        participants: [ptId, clientId],
        last_message: null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      await setDoc(chatRef, newChat);
      console.log("✅ Chat created successfully");
      return { id: chatId, ...newChat };
    } catch (error) {
      console.error("❌ Error getting or creating chat:", error);
      throw error;
    }
  }

  /**
   * Lấy danh sách chat của PT
   */
  static async getPTChats(ptId) {
    try {
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", ptId),
        orderBy("updated_at", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting PT chats:", error);
      throw error;
    }
  }

  /**
   * Subscribe real-time to PT chats (REALTIME với onSnapshot)
   */
  static subscribeToPTChats(ptId, callback) {
    try {
      console.log("👂 🔥 REALTIME: Listening to chats for PT:", ptId);

      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", ptId),
        orderBy("updated_at", "desc")
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const chats = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("💬 🔥 REALTIME: Chats updated:", chats.length);
          callback(chats);
        },
        (error) => {
          console.error("Error subscribing to chats:", error);
        }
      );
    } catch (error) {
      console.error("Error setting up chat subscription:", error);
      throw error;
    }
  }

  /**
   * Gửi tin nhắn
   */
  static async sendMessage(chatId, senderId, text, imageUrl = null) {
    try {
      console.log("📤 Sending message to chat:", chatId);
      if (imageUrl) {
        console.log("🖼️ Message includes image:", imageUrl);
      }

      const messagesRef = collection(db, "chats", chatId, "messages");
      const message = {
        sender_id: senderId,
        text: text,
        timestamp: serverTimestamp(),
        is_read: false,
      };

      // Thêm image_url nếu có
      if (imageUrl) {
        message.image_url = imageUrl;
      }

      await addDoc(messagesRef, message);

      // Cập nhật lastMessage trong chat document
      // Dùng setDoc với merge: true để tránh lỗi "No document to update"
      const chatRef = doc(db, "chats", chatId);
      const lastMessageData = {
        text: text,
        sender_id: senderId,
        timestamp: serverTimestamp(),
        is_read: false,
      };

      if (imageUrl) {
        lastMessageData.image_url = imageUrl;
      }

      await setDoc(
        chatRef,
        {
          last_message: lastMessageData,
          updated_at: serverTimestamp(),
        },
        { merge: true } // ← Quan trọng: merge vào document hiện có
      );

      // Gửi notification qua backend API
      await this.sendNotification(chatId, senderId, text, imageUrl);

      console.log("✅ Message sent successfully");
    } catch (error) {
      console.error("❌ Error sending message:", error);
      throw error;
    }
  }

  /**
   * Gửi notification qua backend API
   */
  static async sendNotification(
    chatId,
    senderId,
    messageText,
    imageUrl = null
  ) {
    try {
      // Parse chatId để lấy receiverId
      // chatId format: "ptId_clientId" hoặc "clientId_ptId"
      const participants = chatId.split("_");
      const receiverId = participants.find((id) => id !== senderId);

      if (!receiverId) {
        console.warn("⚠️ Could not determine receiver from chatId:", chatId);
        return;
      }

      const response = await fetch(
        "http://localhost:3000/api/chat/notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatId,
            senderId,
            receiverId,
            messageText,
            imageUrl: imageUrl || undefined,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log("✅ Notification sent:", result.message);
      } else {
        console.warn("⚠️ Notification failed:", result.message);
      }
    } catch (error) {
      console.error("❌ Error sending notification:", error);
      // Don't throw - notification failure shouldn't block message sending
    }
  }

  /**
   * Subscribe real-time to messages (REALTIME với onSnapshot)
   */
  static subscribeToMessages(chatId, callback) {
    try {
      console.log("👂 🔥 REALTIME: Listening to messages for chat:", chatId);

      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "asc"));

      return onSnapshot(
        q,
        (snapshot) => {
          const messages = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              sender_id: data.sender_id,
              text: data.text,
              timestamp: data.timestamp,
              is_read: data.is_read || false,
              image_url: data.image_url || null, // ← Thêm field này
            };
          });
          console.log("📨 🔥 REALTIME: Messages updated:", messages.length);
          callback(messages);
        },
        (error) => {
          console.error("❌ Error subscribing to messages:", error);
        }
      );
    } catch (error) {
      console.error("❌ Error setting up message subscription:", error);
      throw error;
    }
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  static async markMessagesAsRead(chatId, userId) {
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(
        messagesRef,
        where("sender_id", "!=", userId),
        where("is_read", "==", false)
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { is_read: true })
      );

      await Promise.all(updatePromises);

      // Cập nhật lastMessage isRead nếu cần
      const chatRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        if (
          chatData.last_message &&
          chatData.last_message.sender_id !== userId
        ) {
          await updateDoc(chatRef, {
            "last_message.is_read": true,
          });
        }
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  }

  /**
   * Lấy số lượng tin nhắn chưa đọc
   */
  static async getUnreadCount(chatId, userId) {
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(
        messagesRef,
        where("sender_id", "!=", userId),
        where("is_read", "==", false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  /**
   * Lấy tin nhắn gần nhất
   */
  static async getRecentMessages(chatId, limitCount = 50) {
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(
        messagesRef,
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        chatId: chatId,
        ...doc.data(),
      }));

      return messages.reverse(); // Đảo ngược để hiển thị từ cũ đến mới
    } catch (error) {
      console.error("Error getting recent messages:", error);
      throw error;
    }
  }
}
