#!/bin/bash

# Deploy Chat Feature to Firebase
# Script để deploy Firestore rules và indexes cho chat feature

echo "🚀 Deploying Chat Feature to Firebase..."
echo ""

# Di chuyển vào thư mục backend
cd backend || { echo "❌ Error: backend folder not found"; exit 1; }

echo "📝 Step 1: Deploying Firestore Rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Firestore rules deployed successfully!"
else
    echo "❌ Failed to deploy Firestore rules"
    exit 1
fi

echo ""
echo "📊 Step 2: Deploying Firestore Indexes..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo "✅ Firestore indexes deployed successfully!"
else
    echo "❌ Failed to deploy Firestore indexes"
    exit 1
fi

echo ""
echo "🎉 Chat Feature deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Test chat functionality in the React app"
echo "2. Verify indexes are created in Firebase Console"
echo "3. Check Firestore rules in Firebase Console > Firestore > Rules"
echo ""
echo "📖 Documentation:"
echo "- CHAT_USAGE_GUIDE.md - Hướng dẫn sử dụng"
echo "- CHAT_FIRESTORE_SETUP.md - Chi tiết setup"
