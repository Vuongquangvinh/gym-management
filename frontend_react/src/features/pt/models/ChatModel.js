/**
 * Chat Model - Quản lý cuộc trò chuyện giữa PT và Client
 * Firestore structure:
 * - Collection: chats
 *   - Document ID: {ptId}_{clientId}
 *     - participants: [ptId, clientId]
 *     - lastMessage: {...}
 *     - updatedAt: timestamp
 *     - Subcollection: messages
 *       - Document ID: auto-generated
 *         - senderId, text, timestamp, isRead
 */

export class ChatModel {
  constructor(data = {}) {
    this.id = data.id || null; // {ptId}_{clientId}
    this.ptId = data.ptId || null;
    this.clientId = data.clientId || null;
    this.participants = data.participants || [];
    this.lastMessage = data.lastMessage || null;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new ChatModel({
      id: doc.id,
      ptId: data.pt_id,
      clientId: data.client_id,
      participants: data.participants || [],
      lastMessage: data.last_message
        ? {
            text: data.last_message.text,
            senderId: data.last_message.sender_id,
            timestamp: data.last_message.timestamp,
            isRead: data.last_message.is_read || false,
          }
        : null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  toFirestore() {
    return {
      pt_id: this.ptId,
      client_id: this.clientId,
      participants: this.participants,
      last_message: this.lastMessage
        ? {
            text: this.lastMessage.text,
            sender_id: this.lastMessage.senderId,
            timestamp: this.lastMessage.timestamp,
            is_read: this.lastMessage.isRead || false,
          }
        : null,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  static generateChatId(ptId, clientId) {
    return `${ptId}_${clientId}`;
  }
}

export class MessageModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.chatId = data.chatId || null;
    this.senderId = data.senderId || null;
    this.text = data.text || "";
    this.timestamp = data.timestamp || null;
    this.isRead = data.isRead || false;
    this.isFromPT = data.isFromPT || false;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new MessageModel({
      id: doc.id,
      senderId: data.sender_id,
      text: data.text,
      timestamp: data.timestamp,
      isRead: data.is_read || false,
    });
  }

  toFirestore() {
    return {
      sender_id: this.senderId,
      text: this.text,
      timestamp: this.timestamp,
      is_read: this.isRead,
    };
  }
}
