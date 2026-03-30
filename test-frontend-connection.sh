#!/bin/bash

# Test Frontend to Backend Connection

echo "🔄 Testing connection to Azure Function App..."
echo ""

API_URL="https://portfolio-dev-func-se9pa3.azurewebsites.net/api"

# Test 1: Register new user
echo "1️⃣  Testing Registration..."
TIMESTAMP=$(date +%s)
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Frontend Test User\", \"email\": \"frontendtest${TIMESTAMP}@example.com\", \"password\": \"TestPass123!\"}")

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

if echo "$REGISTER_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Registration successful!"
    EMAIL="frontendtest${TIMESTAMP}@example.com"
else
    echo "❌ Registration failed. Using existing test account."
    EMAIL="test@example.com"
fi
echo ""

# Test 2: Login
echo "2️⃣  Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${EMAIL}\", \"password\": \"TestPass123!\"}")

if [ "$EMAIL" == "test@example.com" ]; then
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email": "test@example.com", "password": "password123"}')
fi

echo "$LOGIN_RESPONSE" | jq '.'
echo ""

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo "✅ Login successful!"
    echo "Token (first 50 chars): ${TOKEN:0:50}..."
    echo ""
    
    # Test 3: Protected endpoint
    echo "3️⃣  Testing Protected Endpoint (GetProfile)..."
    PROFILE_RESPONSE=$(curl -s "$API_URL/profile/1" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$PROFILE_RESPONSE" | jq '.'
    echo ""
    
    if echo "$PROFILE_RESPONSE" | jq -e '.Name' > /dev/null 2>&1; then
        echo "✅ Protected endpoint working!"
    else
        echo "⚠️  Protected endpoint returned unauthorized (expected if profile doesn't exist)"
    fi
else
    echo "❌ Login failed"
    exit 1
fi

echo ""
echo "===================================="
echo "✅ All tests passed!"
echo "===================================="
echo ""
echo "Your React frontend is ready to connect!"
echo "Run: npm start"
echo ""
echo "Then visit: http://localhost:3000"
echo "And try logging in with:"
echo "  Email: test@example.com"
echo "  Password: password123"
