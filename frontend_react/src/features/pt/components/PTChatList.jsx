import React, { useState, useEffect } from 'react';
import { ChatService } from '../services/ChatService';
import { auth, db } from '../../../firebase/lib/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import PTChat from './PTChat';
import styles from './PTChatList.module.css';

export default function PTChatList({ onClose }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) {
      console.log('⚠️ No authenticated user');
      setLoading(false);
      return;
    }

    console.log('📥 Loading chats for PT:', currentUserId);

    // Subscribe to PT chats realtime
    const unsubscribe = ChatService.subscribeToPTChats(currentUserId, async (chatsList) => {
      console.log('📬 Received', chatsList.length, 'chat(s)');

      // Load client info for each chat
      const chatsWithClientInfo = await Promise.all(
        chatsList.map(async (chat) => {
          try {
            const clientId = chat.client_id;
            const clientDoc = await getDoc(doc(db, 'users', clientId));
            
            let clientName = `Client ${clientId?.substring(0, 8) || 'Unknown'}...`;
            let clientAvatar = null;

            if (clientDoc.exists()) {
              const clientData = clientDoc.data();
              clientName = clientData.fullName || clientData.full_name || clientName;
              clientAvatar = clientData.avatarUrl || clientData.avatar_url;
            }

            return {
              id: chat.id,
              clientId: clientId,
              clientName: clientName,
              clientAvatar: clientAvatar,
              lastMessage: chat.last_message?.text || 'Chưa có tin nhắn',
              timestamp: chat.last_message?.timestamp || chat.updated_at,
              unread: !chat.last_message?.is_read && chat.last_message?.sender_id !== currentUserId
            };
          } catch (error) {
            console.error('❌ Error loading client info:', error);
            return {
              id: chat.id,
              clientId: chat.client_id,
              clientName: `Client ${chat.client_id?.substring(0, 8) || 'Unknown'}...`,
              clientAvatar: null,
              lastMessage: chat.last_message?.text || 'Chưa có tin nhắn',
              timestamp: chat.last_message?.timestamp || chat.updated_at,
              unread: false
            };
          }
        })
      );

      setChats(chatsWithClientInfo);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUserId]);

  const handleChatClick = (chat) => {
    setSelectedClient({
      id: chat.clientId,
      name: chat.clientName,
      avatar: chat.clientAvatar
    });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) return 'Vừa xong';
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} phút trước`;
    }
    
    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} giờ trước`;
    }
    
    // Show date
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (selectedClient) {
    return (
      <PTChat 
        initialClient={selectedClient} 
        onClose={() => setSelectedClient(null)} 
      />
    );
  }

  return (
    <div className={styles.chatListContainer}>
      <div className={styles.header}>
        <h2>Tin nhắn</h2>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải...</p>
        </div>
      ) : chats.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💬</div>
          <p>Chưa có tin nhắn nào</p>
          <small>Tin nhắn từ clients sẽ hiển thị ở đây</small>
        </div>
      ) : (
        <div className={styles.chatList}>
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              className={`${styles.chatItem} ${chat.unread ? styles.unread : ''}`}
              onClick={() => handleChatClick(chat)}
            >
              <div className={styles.avatar}>
                {chat.clientAvatar ? (
                  <img src={chat.clientAvatar} alt={chat.clientName} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {chat.clientName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className={styles.chatInfo}>
                <div className={styles.chatHeader}>
                  <h3>{chat.clientName}</h3>
                  <span className={styles.timestamp}>
                    {formatTimestamp(chat.timestamp)}
                  </span>
                </div>
                <div className={styles.lastMessage}>
                  <p>{chat.lastMessage}</p>
                  {chat.unread && <span className={styles.unreadBadge}></span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
