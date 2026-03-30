# Frontend-Backend Integration Guide

## ✅ Connection Status: FULLY INTEGRATED

Your React frontend is now connected to your Azure Functions backend!

## 🔗 Configuration

### Backend (Azure Function App)
- **URL**: `https://portfolio-dev-func-se9pa3.azurewebsites.net`
- **CORS**: Enabled for all origins
- **Status**: ✅ Deployed and operational

### Frontend (.env)
```
REACT_APP_API_URL=https://portfolio-dev-func-se9pa3.azurewebsites.net/api
```

## 🧪 Testing Results

All endpoints tested and working:

| Test | Status | Details |
|------|--------|---------|
| Register | ✅ PASS | Creates new users successfully |
| Login | ✅ PASS | Returns JWT tokens |
| Protected Routes | ✅ PASS | JWT authentication working |

## 🚀 How to Use

### Start the React App

```bash
npm start
```

The app will open at `http://localhost:3000`

### Test Login Flow

1. **Open Browser**: Navigate to `http://localhost:3000`
2. **You'll see the login page** with options to Sign In or Sign Up
3. **Try logging in with existing user**:
   - Email: `test@example.com`
   - Password: `password123`
4. **Or create a new account** by clicking "Sign up"

### What Happens Behind the Scenes

1. **Login Form Submission** → React component calls `login()` from AuthContext
2. **API Request** → `POST https://portfolio-dev-func-se9pa3.azurewebsites.net/api/auth/login`
3. **Backend Verification** → Azure Function validates credentials against SQL Database
4. **JWT Generation** → Backend creates and returns JWT token
5. **Frontend Storage** → Token saved to localStorage
6. **Redirect** → User navigated to Dashboard
7. **Protected Routes** → Token automatically included in all API requests

## 📱 User Flow

```
┌─────────────┐
│ Login Page  │  (/)
└──────┬──────┘
       │
       ├─ Sign In ──────> Validate credentials
       │                        │
       │                        ├─ ✅ Success → Dashboard
       │                        └─ ❌ Error → Show error message
       │
       └─ Sign Up ──────> Create new account
                                │
                                ├─ ✅ Success → Dashboard  
                                └─ ❌ Error → Show error message
```

## 🎨 UI Components

### Login Component (`src/components/Login.js`)
- Toggle between Login/Register modes
- Form validation
- Error handling
- Loading states
- Responsive design

### Dashboard Component (`src/components/Dashboard.js`)
- Shows logged-in user info
- Logout functionality
- Protected by authentication

### Auth Context (`src/context/AuthContext.js`)
- Manages authentication state
- Handles API calls
- Stores JWT tokens
- Provides login/register/logout functions

## 🔐 Security Features

- ✅ Passwords hashed with bcrypt (backend)
- ✅ JWT tokens for stateless auth
- ✅ Tokens stored in localStorage
- ✅ Automatic token inclusion in API requests
- ✅ Protected routes redirect to login if not authenticated
- ✅ HTTPS enforced in production

## 📋 Available API Endpoints

The frontend can now call:

### Public Endpoints
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in

### Protected Endpoints (Require JWT)
- `GET /api/profile/{userId}` - Get user profile
- `POST /api/profile` - Create profile
- `GET /api/connections/{userId}` - Get connections
- `POST /api/messages` - Send message
- `POST /api/upload` - Upload file

## 🧪 Manual Testing Commands

### Test Registration (cURL)
```bash
curl -X POST https://portfolio-dev-func-se9pa3.azurewebsites.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "newuser@example.com", "password": "password123"}'
```

### Test Login (cURL)
```bash
curl -X POST https://portfolio-dev-func-se9pa3.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### Test with Script
```bash
./test-frontend-connection.sh
```

## 🔧 Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
1. Check Azure Function App CORS settings
2. Verify frontend URL is in allowed origins
3. Ensure requests include proper headers

### Login Fails
1. Check browser console for error messages
2. Verify `.env` file has correct API URL
3. Test backend directly with cURL
4. Check Application Insights logs in Azure

### Token Issues
1. Clear localStorage: `localStorage.clear()`
2. Try logging in again
3. Check token expiration (24 hours default)
4. Verify JWT_SECRET is set in Azure

## 📊 What's Next

Now that frontend is connected:

1. **Enhance UI**: Add more features to Dashboard
2. **Add Profile Page**: Let users edit their profiles
3. **Messaging UI**: Build messaging interface
4. **File Upload**: Add profile image upload
5. **Real-time Updates**: Integrate Web PubSub for live notifications

## ✅ Ready to Push to GitHub

Your app is now fully integrated and ready to be pushed to GitHub:

```bash
git add .
git commit -m "Add complete serverless portfolio application with Azure backend"
git push origin main
```

---

**Status**: ✅ Frontend connected to production backend
**Last Tested**: March 30, 2026
**Connection**: `React → Azure Functions → SQL Database`
