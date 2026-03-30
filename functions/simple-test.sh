#!/bin/bash

# Simple Login Test - No Database Required
# This tests the login endpoint is responding

BASE_URL="http://localhost:7071/api"

echo "🔍 Checking if Functions are running..."
echo ""

# Test if functions endpoint is accessible
if curl -s -f http://localhost:7071 > /dev/null 2>&1; then
    echo "✅ Functions are running on http://localhost:7071"
else
    echo "❌ Functions not running!"
    echo ""
    echo "Start functions with:"
    echo "  cd functions"
    echo "  func start"
    exit 1
fi

echo ""
echo "📡 Testing Login Endpoint..."
echo ""

# Test login endpoint (will fail without database, but we can see if endpoint exists)
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

echo "Response Code: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

echo ""
if [ "$HTTP_CODE" == "401" ] || [ "$HTTP_CODE" == "500" ]; then
    echo "✅ Login endpoint is working! (Endpoint exists and is responding)"
    echo "Note: Error is expected if database is not set up yet"
elif [ "$HTTP_CODE" == "000" ]; then
    echo "❌ Cannot reach endpoint - make sure functions are running"
else
    echo "ℹ️  Got HTTP $HTTP_CODE"
fi
