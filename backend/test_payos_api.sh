#!/usr/bin/env bash

# Script test PayOS API
# Chạy: bash test_payos_api.sh <ORDER_CODE>

API_BASE="http://192.168.1.71:3000/api/payos"

echo "🧪 Testing PayOS API..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test 1: Create Payment
echo ""
echo "📝 Test 1: Create Payment Link"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

curl -X POST "$API_BASE/create-gym-payment" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "test-package-001",
    "packageName": "Gói Premium",
    "packagePrice": 500000,
    "packageDuration": 30,
    "userId": "test-user-001",
    "userName": "Nguyễn Văn A",
    "userEmail": "test@example.com",
    "userPhone": "0123456789"
  }' | json_pp

# Lấy orderCode từ response (cần jq)
ORDER_CODE=$(curl -s -X POST "$API_BASE/create-gym-payment" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "test-package-001",
    "packageName": "Gói Premium",
    "packagePrice": 500000,
    "packageDuration": 30,
    "userId": "test-user-001",
    "userName": "Nguyễn Văn A"
  }' | jq -r '.data.orderCode')

echo ""
echo "✅ Order Code: $ORDER_CODE"

# Test 2: Get Payment Status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test 2: Get Payment Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -z "$1" ]; then
  echo "⚠️  Không có orderCode. Sử dụng orderCode vừa tạo: $ORDER_CODE"
  TEST_ORDER_CODE=$ORDER_CODE
else
  TEST_ORDER_CODE=$1
  echo "✅ Sử dụng orderCode từ tham số: $TEST_ORDER_CODE"
fi

curl -X GET "$API_BASE/payment/$TEST_ORDER_CODE" | json_pp

# Test 3: Cancel Payment (Optional)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "❌ Test 3: Cancel Payment (Commented - Uncomment to test)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Uncomment để test cancel
# curl -X POST "$API_BASE/cancel/$TEST_ORDER_CODE" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "reason": "Test cancel payment"
#   }' | json_pp

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test hoàn tất!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
