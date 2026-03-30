# Authentication Setup Guide

## Complete Authentication System

This portfolio website now includes a full authentication system with:

✅ **JWT-based authentication** (no external dependencies)
✅ **Login & Registration** forms
✅ **Protected routes** in React
✅ **Secure password hashing** with bcrypt
✅ **Token validation** middleware
✅ **User session management**

## Database Setup

1. **Run the authentication schema:**
   ```bash
   # Connect to your Azure SQL Database
   # Then run: functions/sql-auth-schema.sql
   ```

   This creates:
   - `Users` table for authentication
   - Links to existing `Profiles` table
   - Indexes for performance

## Backend Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

New packages added:
- `jsonwebtoken` - JWT token generation/validation
- `bcryptjs` - Password hashing

### 2. Configure JWT Secret

In `local.settings.json` (for local development):
```json
{
  "Values": {
    "JWT_SECRET": "your-super-secret-key-change-this-in-production",
    ...
  }
}
```

In Azure (for production):
```bash
FUNCTION_APP_NAME=$(cd ../terraform && terraform output -raw function_app_name)

az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group portfolio-dev-rg \
  --settings "JWT_SECRET=your-super-secret-key"
```

### 3. Deploy Functions

```bash
func azure functionapp publish $FUNCTION_APP_NAME
```

## Frontend Setup

### 1. Install Dependencies

```bash
npm install
```

New package added:
- `axios` - HTTP client for API calls

### 2. Configure API URL

Create `.env` file:
```bash
cp .env.example .env
```

For local development (default):
```
REACT_APP_API_URL=http://localhost:7071/api
```

For production:
```
REACT_APP_API_URL=https://your-function-app.azurewebsites.net/api
```

### 3. Start Development Server

```bash
npm start
```

## Testing the Authentication

### 1. Start Function App (Backend)
```bash
cd functions
func start
```

### 2. Start React App (Frontend)
```bash
# In another terminal
cd ..
npm start
```

### 3. Test Registration

1. Go to http://localhost:3000
2. Click "Sign up"
3. Fill in:
   - Name: John Doe
   - Email: john@example.com
   - Password: password123
   - Confirm Password: password123
4. Click "Create Account"

### 4. Test Login

1. Use the credentials you just created
2. You should be redirected to the dashboard
3. Your user info should be displayed

### 5. Test Protected Routes

1. Try accessing `/dashboard` without logging in
2. You should be redirected to `/login`
3. After login, you can access protected pages

## API Endpoints

### Authentication

**Register User**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response: {
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "userId": 1,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

**Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: {
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "userId": 1,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

## Using Authentication in Other Functions

To protect any function, use the auth middleware:

```javascript
const { validateToken, unauthorizedResponse } = require('../shared/auth');

module.exports = async function (context, req) {
    // Validate token
    const authResult = validateToken(req);
    
    if (!authResult.valid) {
        context.res = unauthorizedResponse(authResult.error);
        return;
    }

    // Access authenticated user
    const user = authResult.user;
    context.log('Authenticated user:', user.userId);
    
    // Your function logic here...
};
```

## Security Best Practices

### Production Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Enable HTTPS only (automatically done in Azure)
- [ ] Set password minimum length (currently 8 characters)
- [ ] Enable rate limiting on login/register endpoints
- [ ] Add email verification
- [ ] Implement password reset functionality
- [ ] Configure CORS to specific domains only
- [ ] Enable Azure AD B2C for enterprise SSO (optional)
- [ ] Add 2FA/MFA (optional)
- [ ] Implement account lockout after failed attempts

### Current Security Features

✅ Password hashing with bcrypt (10 salt rounds)
✅ JWT tokens with 24-hour expiration
✅ SQL injection protection (parameterized queries)
✅ Email validation
✅ Password strength requirements (8+ characters)
✅ CORS enabled (configure for production)
✅ Secure token storage in localStorage

## Troubleshooting

### "Login failed" error

1. Check database connection
2. Verify Users table exists
3. Check JWT_SECRET is set
4. View function logs: `func azure functionapp logstream $FUNCTION_APP_NAME`

### CORS errors

In Azure Portal:
1. Go to Function App
2. Navigate to CORS settings
3. Add your frontend URL (e.g., https://yourportfolio.z20.web.core.windows.net)

### Token expired

Tokens expire after 24 hours. User needs to login again.

## Optional: Azure AD B2C Setup

If you want enterprise SSO (Microsoft, Google, Facebook login):

1. Create Azure AD B2C tenant in Azure Portal
2. Register your application
3. Configure user flows
4. Update `terraform/auth-variables.tf` with your tenant details
5. Install `@azure/msal-react` in your React app
6. Follow Microsoft's MSAL documentation

## File Structure

```
functions/
├── Login/              # Login endpoint
├── Register/           # Registration endpoint
├── shared/
│   └── auth.js        # JWT validation middleware
└── sql-auth-schema.sql # Database schema

src/
├── context/
│   └── AuthContext.js  # Authentication state management
├── components/
│   ├── Login.js        # Login/Register form
│   ├── Login.css       # Styling
│   ├── Dashboard.js    # Protected dashboard
│   ├── Dashboard.css   # Dashboard styling
│   └── ProtectedRoute.js # Route protection wrapper
└── App.js              # Routes configuration
```

## Next Steps

1. **Add Email Verification**
   - Send verification email on registration
   - Create VerifyEmail function
   - Update Users table with IsEmailVerified

2. **Password Reset**
   - ForgotPassword function
   - ResetPassword function
   - Email with reset token

3. **User Profile Management**
   - UpdateProfile function
   - ChangePassword function
   - DeleteAccount function

4. **Social Login** (Optional)
   - Azure AD B2C setup
   - Google OAuth
   - Microsoft Account

5. **Admin Panel** (Optional)
   - User management
   - Analytics dashboard
   - Content moderation
