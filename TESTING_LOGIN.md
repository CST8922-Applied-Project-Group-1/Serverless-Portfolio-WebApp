# Testing the Login Function

## Quick Start Testing Guide

### Prerequisites

1. **Database Setup** - Run the authentication schema first:
   ```bash
   # Connect to your Azure SQL Database and execute:
   # functions/sql-auth-schema.sql
   ```

2. **Install Dependencies**:
   ```bash
   cd functions
   npm install
   ```

3. **Configure Local Settings** (`functions/local.settings.json`):
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "SQL_CONNECTION_STRING": "Server=your-server.database.windows.net;Database=your-db;User Id=sqladmin;Password=your-password;Encrypt=true",
       "JWT_SECRET": "your-super-secret-key-at-least-32-characters-long"
     }
   }
   ```

## Method 1: Test with React Frontend (Recommended)

### Step 1: Start the Functions Backend

```bash
cd functions
func start
```

You should see:
```
Functions:
    Login: [POST] http://localhost:7071/api/auth/login
    Register: [POST] http://localhost:7071/api/auth/register
```

### Step 2: Start the React Frontend

Open a new terminal:
```bash
cd ..  # Back to project root
npm install  # If you haven't already
npm start
```

### Step 3: Test the Flow

1. Browser opens at http://localhost:3000
2. Click **"Sign up"** to create a new account
3. Fill in the registration form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
4. Click **"Create Account"**
5. You should be automatically logged in and redirected to the dashboard

### Step 4: Test Login

1. Click **"Logout"** in the dashboard
2. You'll be redirected to the login page
3. Enter your credentials:
   - Email: test@example.com
   - Password: password123
4. Click **"Sign In"**
5. You should be redirected to the dashboard

## Method 2: Test with cURL

### Step 1: Create a Test User (Register)

```bash
curl -X POST http://localhost:7071/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### Step 2: Test Login

```bash
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### Step 3: Test with Invalid Credentials

```bash
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }'
```

**Expected Response:**
```json
{
  "error": "Invalid credentials"
}
```

### Step 4: Use the Token (Test Protected Endpoint)

Save the token from the login response and use it:

```bash
# Replace YOUR_TOKEN with the actual token from login response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:7071/api/profile/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Method 3: Test with Postman

### Step 1: Import Collection

Create a new collection in Postman with these requests:

#### 1. Register User
- **Method:** POST
- **URL:** `http://localhost:7071/api/auth/register`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }
  ```

#### 2. Login
- **Method:** POST
- **URL:** `http://localhost:7071/api/auth/login`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```

#### 3. Test Protected Endpoint
- **Method:** GET
- **URL:** `http://localhost:7071/api/profile/1`
- **Headers:**
  - `Authorization: Bearer {{token}}`

### Step 2: Set Up Environment Variable

1. In Postman, go to the "Tests" tab of the Login request
2. Add this script to automatically save the token:
   ```javascript
   var jsonData = pm.response.json();
   pm.environment.set("token", jsonData.token);
   ```

## Method 4: Test with Thunder Client (VS Code Extension)

If you use VS Code, install Thunder Client extension:

1. Install Thunder Client from VS Code Extensions
2. Create a new request:
   - Method: POST
   - URL: `http://localhost:7071/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body:
     ```json
     {
       "email": "test@example.com",
       "password": "password123"
     }
     ```
3. Click Send

## Method 5: Automated Testing Script

Create a test script for quick testing:

```bash
# Save as functions/test-auth.sh
#!/bin/bash

BASE_URL="http://localhost:7071/api"

echo "🧪 Testing Authentication System"
echo "================================"

# Test 1: Register
echo -e "\n📝 Test 1: Register New User"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test'$(date +%s)'@example.com",
    "password": "password123"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ]; then
    echo "✅ Registration successful! Token received."
else
    echo "❌ Registration failed!"
    exit 1
fi

# Test 2: Login with correct credentials
echo -e "\n🔐 Test 2: Login with Correct Credentials"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ]; then
    echo "✅ Login successful!"
else
    echo "❌ Login failed!"
fi

# Test 3: Login with wrong password
echo -e "\n🚫 Test 3: Login with Wrong Password"
WRONG_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }')

echo "$WRONG_LOGIN" | jq '.'

ERROR=$(echo "$WRONG_LOGIN" | jq -r '.error')

if [ "$ERROR" == "Invalid credentials" ]; then
    echo "✅ Correctly rejected wrong password"
else
    echo "❌ Should have rejected wrong password"
fi

# Test 4: Use token to access protected endpoint
echo -e "\n🔒 Test 4: Access Protected Endpoint with Token"
PROTECTED=$(curl -s "$BASE_URL/profile/1" \
  -H "Authorization: Bearer $TOKEN")

echo "$PROTECTED" | jq '.'

echo -e "\n✅ All tests completed!"
```

Make it executable and run:
```bash
chmod +x functions/test-auth.sh
./functions/test-auth.sh
```

## Common Test Scenarios

### ✅ Valid Login
```bash
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```
**Expected:** Status 200, returns token and user object

### ❌ Invalid Email
```bash
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com","password":"password123"}'
```
**Expected:** Status 401, error: "Invalid credentials"

### ❌ Wrong Password
```bash
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'
```
**Expected:** Status 401, error: "Invalid credentials"

### ❌ Missing Fields
```bash
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```
**Expected:** Status 400, error: "Email and password are required"

### ❌ Empty Password
```bash
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":""}'
```
**Expected:** Status 400, error: "Email and password are required"

## Troubleshooting

### Issue: "Cannot connect to SQL Server"

**Solution:**
1. Check your SQL connection string in `local.settings.json`
2. Verify firewall rules allow your IP
3. Test connection:
   ```bash
   # From Azure Portal, get connection string
   # Test with sqlcmd or Azure Data Studio
   ```

### Issue: "func: command not found"

**Solution:**
Install Azure Functions Core Tools:
```bash
# macOS
brew tap azure/functions
brew install azure-functions-core-tools@4

# Or with npm
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

### Issue: "Table 'Users' doesn't exist"

**Solution:**
Run the authentication schema:
```bash
# Connect to your database and execute:
# functions/sql-auth-schema.sql
```

### Issue: Token validation fails

**Solution:**
Make sure `JWT_SECRET` is set and matches between requests:
```json
{
  "Values": {
    "JWT_SECRET": "your-super-secret-key-at-least-32-characters-long"
  }
}
```

### Issue: CORS errors in browser

**Solution:**
The functions already have CORS enabled. If you still see errors, check:
1. Function is running on port 7071
2. React app is running on port 3000
3. No browser extensions blocking requests

## Monitoring & Debugging

### View Function Logs

The function logs show authentication attempts:
```bash
cd functions
func start
# Watch the console for log output
```

### Check Database

Verify user was created:
```sql
SELECT * FROM Users WHERE Email = 'test@example.com';
```

### Decode JWT Token (for debugging)

Use jwt.io or:
```javascript
// In browser console or Node.js
const token = "eyJhbGc...";
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

## Performance Testing

Test with multiple concurrent requests:
```bash
# Install Apache Bench
brew install httpd  # macOS

# Test login endpoint
ab -n 100 -c 10 -p login-payload.json -T application/json \
  http://localhost:7071/api/auth/login

# Where login-payload.json contains:
# {"email":"test@example.com","password":"password123"}
```

## Next Steps After Testing

Once login works:
1. Test the full user flow (register → login → access protected pages)
2. Deploy to Azure and test with production URLs
3. Add more test users
4. Test token expiration (after 24 hours)
5. Implement refresh tokens if needed
6. Add email verification
7. Add password reset functionality

## Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create new user account |
| `/api/auth/login` | POST | Authenticate and get token |
| `/api/profile/{id}` | GET | Protected endpoint example |

**Required Headers:**
- `Content-Type: application/json` (for POST requests)
- `Authorization: Bearer {token}` (for protected endpoints)

## Testing Checklist

- [ ] Database schema is created
- [ ] Functions are running (`func start`)
- [ ] Can register a new user
- [ ] Can login with correct credentials
- [ ] Login fails with wrong password
- [ ] Login fails with non-existent email
- [ ] Received JWT token is valid
- [ ] Can access protected endpoints with token
- [ ] Cannot access protected endpoints without token
- [ ] Token expires after 24 hours
- [ ] React frontend can login successfully
- [ ] User is redirected after login
- [ ] Protected routes work correctly
