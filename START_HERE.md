# 🚀 How to Start and Test Your Login

## ✅ Backend Integration Complete!

Your existing Login and Register pages are now connected to the Azure Functions backend!

## 🎯 Start the App

### In a New Terminal Window:

```bash
cd /Users/taofeekat/Code/Serverless-Portfolio-WebApp
npm start
```

Wait for it to compile (10-30 seconds), then it will open `http://localhost:3000` automatically.

## 🧪 Test the Login

### Option 1: Use Existing Test Account

On the login page, enter:
- **Email/Username**: `test@example.com`
- **Password**: `password123`
- Click "Sign In"

### Option 2: Create New Account

1. Click "Register" link
2. Fill in the form:
   - First Name: Your name
   - Last Name: Your lastname
   - Email: your@email.com
   - Username: yourusername
   - Password: yourpassword (min 6 characters)
3. Click "Submit"

## ✅ What Should Happen

1. **Login/Register** → Makes API call to Azure Functions
2. **Backend validates** → Checks database
3. **Returns JWT token** → Stored in localStorage
4. **Redirects to Dashboard** → Shows your user info
5. **Dashboard displays**:
   - Your name
   - Your email
   - Your user ID from the database

## 🔧 If It Doesn't Work

### Check Browser Console (F12)

Look for error messages like:
- `Network Error` → Backend might be down
- `CORS Error` → Backend CORS issue
- `401 Unauthorized` → Invalid credentials

### Test Backend Directly

In another terminal:
```bash
curl -X POST https://portfolio-dev-func-se9pa3.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

Should return JSON with `"success": true`

### Common Issues

**Port 3000 in use:**
```bash
lsof -ti:3000 | xargs kill -9
npm start
```

**Dependencies missing:**
```bash
npm install
npm start
```

**Backend not responding:**
- Check Azure Portal for Function App status
- Verify `.env` file has correct API_URL

## 📝 What Changed in Your Code

I only modified YOUR existing files:

### `src/components/Login.jsx`
- ✅ Kept your UI exactly the same
- ✅ Added `axios` for API calls
- ✅ Replaced mock authentication with real Azure backend call
- ✅ Added loading state

### `src/components/Register.jsx`
- ✅ Kept your UI exactly the same
- ✅ Added `axios` for API calls
- ✅ Connects to Azure Functions `/auth/register` endpoint
- ✅ Stores JWT token and user data
- ✅ Added loading state

### `src/App.jsx`
- ✅ Updated Dashboard to show real user data from backend
- ✅ No changes to routing

### New File: `.env`
```
REACT_APP_API_URL=https://portfolio-dev-func-se9pa3.azurewebsites.net/api
```

## 🎉 You're Ready!

Your existing login/register UI now talks to your live Azure backend and database!

Just run `npm start` and try logging in with:
- Email: `test@example.com`
- Password: `password123`

---

**Created**: March 30, 2026
