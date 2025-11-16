import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatService } from '../services/ChatService';
import { auth } from '../../../firebase/lib/config/firebase';
import './PTChat.css';

export default function PTChat({ initialClient, onClose }) {
  const [selectedClient, setSelectedClient] = useState(initialClient || null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [clients, setClients] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const unsubscribeMessages = useRef(null);
  const unsubscribeChats = useRef(null);

  const currentUserId = auth.currentUser?.uid;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages for a specific client
  const loadMessagesForClient = useCallback(async (clientId) => {
    if (!currentUserId) {
      console.log('⚠️ No current user');
      return;
    }

    try {
      setLoading(true);
      console.log('📥 Loading chat for client:', clientId);
      console.log('🔐 Current PT (currentUserId):', currentUserId);
      
      // Get or create chat
      const chat = await ChatService.getOrCreateChat(currentUserId, clientId);
      setCurrentChatId(chat.id);
      console.log('🔑 Expected format:', `${currentUserId}_${clientId}`);

      // Unsubscribe from previous messages
      if (unsubscribeMessages.current) {
        unsubscribeMessages.current();
      }

      // Subscribe to messages
      unsubscribeMessages.current = ChatService.subscribeToMessages(chat.id, (msgs) => {
        const formattedMessages = msgs.map(msg => ({
          ...msg,
          isFromPT: msg.sender_id === currentUserId
        }));
        setMessages(formattedMessages);
        setTimeout(scrollToBottom, 100);
      });
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      alert('Không thể tải tin nhắn. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Load chats for PT (when no initialClient)
  useEffect(() => {
    if (!currentUserId) {
      console.log('⚠️ No authenticated user');
      return;
    }

    if (initialClient) {
      // Direct chat with specific client
      console.log('📱 Opening chat with client:', initialClient);
      setSelectedClient(initialClient);
      loadMessagesForClient(initialClient.id);
    } else {
      // Load all chats for PT
      if (unsubscribeChats.current) {
        unsubscribeChats.current();
      }

      unsubscribeChats.current = ChatService.subscribeToPTChats(currentUserId, async (chats) => {
        // Transform chats to client format
        const clientList = chats.map((chat) => {
          const clientId = chat.client_id;
          return {
            id: clientId,
            name: `Client ${clientId?.substring(0, 8) || 'Unknown'}...`,
            lastMessage: chat.last_message?.text || 'Chưa có tin nhắn',
            timestamp: chat.last_message?.timestamp || chat.updated_at,
            unread: !chat.last_message?.is_read && chat.last_message?.sender_id !== currentUserId
          };
        });
        setClients(clientList);
      });
    }

    // Cleanup subscriptions
    return () => {
      if (unsubscribeMessages.current) {
        unsubscribeMessages.current();
      }
      if (unsubscribeChats.current) {
        unsubscribeChats.current();
      }
    };
  }, [initialClient, currentUserId, loadMessagesForClient]);

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    loadMessagesForClient(client.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClient || !currentChatId || !currentUserId) return;

    try {
      await ChatService.sendMessage(currentChatId, currentUserId, newMessage.trim());
      setNewMessage('');
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').slice(-1)[0].substr(0, 2).toUpperCase();
  };

  return (
    <div className="pt-chat-container">
      <div className="pt-chat-header">
        <h3>💬 Tin nhắn với khách hàng</h3>
        {onClose && <button className="pt-chat-close" onClick={onClose}>×</button>}
      </div>

      <div className="pt-chat-body">
        {/* Sidebar - Client List (Horizontal) */}
        {!initialClient && (
          <div className="pt-chat-sidebar">
            <div className="sidebar-header">
              <span>Khách hàng gần đây</span>
            </div>
            <div className="client-list">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className={`client-item ${selectedClient?.id === client.id ? 'active' : ''}`}
                  onClick={() => handleClientSelect(client)}
                >
                  <div className="client-avatar">{getInitials(client.name)}</div>
                  <div className="client-info">
                    <div className="client-name">{client.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="pt-chat-main">
          {selectedClient ? (
            <>
              <div className="chat-header">
                <div className="chat-client-avatar">{getInitials(selectedClient.name)}</div>
                <div className="chat-client-name">{selectedClient.name}</div>
              </div>

              <div className="chat-messages">
                {loading ? (
                  <div className="chat-loading">
                    <div className="loading-spinner"></div>
                    <div>Đang tải tin nhắn...</div>
                  </div>
                ) : messages.length > 0 ? (
                  <>
                    {messages.map((msg) => (
                      <div key={msg.id} className={`message ${msg.isFromPT ? 'message-pt' : 'message-client'}`}>
                        <div className="message-bubble">
                          <div className="message-text">{msg.text}</div>
                          <div className="message-time">{formatTime(msg.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="chat-empty-messages">
                    <div className="empty-icon">💭</div>
                    <div className="empty-text">Chưa có tin nhắn nào</div>
                  </div>
                )}
              </div>

              <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="chat-send-btn">
                  <span>➤</span>
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty">
              <div className="empty-icon">💬</div>
              <div className="empty-text">Chọn một khách hàng để bắt đầu trò chuyện</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
