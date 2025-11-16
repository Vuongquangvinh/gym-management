# Firestore Security Rules for Chat Feature

## Cấu trúc dữ liệu:

```
chats (collection)
├── {ptId}_{clientId} (document)
│   ├── pt_id: string
│   ├── client_id: string
│   ├── participants: [ptId, clientId]
│   ├── last_message: {
│   │     text: string,
│   │     sender_id: string,
│   │     timestamp: timestamp,
│   │     is_read: boolean
│   │   }
│   ├── created_at: timestamp
│   ├── updated_at: timestamp
│   └── messages (subcollection)
│       └── {messageId} (document)
│           ├── sender_id: string
│           ├── text: string
│           ├── timestamp: timestamp
│           └── is_read: boolean
```

## Firestore Rules (Thêm vào firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Chat rules
    match /chats/{chatId} {
      // Cho phép đọc nếu user là một trong các participants
      allow read: if request.auth != null && 
                    request.auth.uid in resource.data.participants;
      
      // Cho phép tạo chat mới nếu user là PT hoặc client trong chat đó
      allow create: if request.auth != null && 
                      request.auth.uid in request.resource.data.participants;
      
      // Cho phép update nếu user là participant (để cập nhật lastMessage)
      allow update: if request.auth != null && 
                      request.auth.uid in resource.data.participants;
      
      // Messages subcollection
      match /messages/{messageId} {
        // Cho phép đọc tin nhắn nếu user là participant của chat
        allow read: if request.auth != null && 
                      request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        
        // Cho phép tạo tin nhắn nếu sender_id là current user và user là participant
        allow create: if request.auth != null && 
                        request.resource.data.sender_id == request.auth.uid &&
                        request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        
        // Cho phép update tin nhắn (để đánh dấu đã đọc)
        allow update: if request.auth != null && 
                        request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
  }
}
```

## Firestore Indexes (Thêm vào firestore.indexes.json):

```json
{
  "indexes": [
    {
      "collectionGroup": "chats",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "participants", "arrayConfig": "CONTAINS" },
        { "fieldPath": "updated_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sender_id", "order": "ASCENDING" },
        { "fieldPath": "is_read", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## Cách deploy:

### 1. Cập nhật firestore.rules:
```bash
cd backend
firebase deploy --only firestore:rules
```

### 2. Tạo indexes (nếu chưa có):
```bash
firebase deploy --only firestore:indexes
```

## Lưu ý:

1. **Security**: Chỉ PT và Client trong cuộc trò chuyện mới có quyền đọc/ghi
2. **Validation**: Sender phải là current user
3. **Indexes**: Cần tạo composite indexes để query hiệu quả
4. **participants array**: Sử dụng array-contains để query chats của một user

## Test Rules:

Có thể test rules tại Firebase Console > Firestore > Rules > Rules Playground
