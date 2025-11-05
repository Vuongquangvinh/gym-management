/**
 * Notification Model
 * 
 * Firestore collection: 'notifications'
 */

export class NotificationModel {
  constructor(data) {
    this.id = data.id || null;
    this.recipientId = data.recipientId;
    this.recipientRole = data.recipientRole; // 'admin' or 'pt'
    this.type = data.type;
    this.title = data.title;
    this.message = data.message;
    this.relatedId = data.relatedId; // pendingRequestId
    this.relatedType = data.relatedType;
    this.read = data.read || false;
    this.createdAt = data.createdAt;
    this.readAt = data.readAt || null;
    this.senderName = data.senderName || null;
    this.senderAvatar = data.senderAvatar || null;
  }

  toFirestore() {
    return {
      recipientId: this.recipientId,
      recipientRole: this.recipientRole,
      type: this.type,
      title: this.title,
      message: this.message,
      relatedId: this.relatedId,
      relatedType: this.relatedType,
      read: this.read,
      createdAt: this.createdAt,
      readAt: this.readAt,
      senderName: this.senderName,
      senderAvatar: this.senderAvatar
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new NotificationModel({
      id: doc.id,
      ...data
    });
  }

  getIcon() {
    switch (this.type) {
      case 'request_submitted':
        return '📝';
      case 'request_approved':
        return '✅';
      case 'request_rejected':
        return '❌';
      case 'request_cancelled':
        return '🚫';
      default:
        return '🔔';
    }
  }

  getColor() {
    switch (this.type) {
      case 'request_submitted':
        return '#2196F3';
      case 'request_approved':
        return '#4CAF50';
      case 'request_rejected':
        return '#F44336';
      case 'request_cancelled':
        return '#FF9800';
      default:
        return '#757575';
    }
  }
}

