# Portfolio Azure Functions

This directory contains Azure Functions for the Portfolio Website backend, deployed to the `portfolio-dev-func-se9pa3` Azure Function App.

## Functions Overview

### Authentication Functions

1. **Register** - `POST /api/register`
   - Creates a new user account with bcrypt password hashing
   - Creates a default profile in `dbo.Profiles`
   - Returns JWT token on success
   - Request body: `{ name, email, password }`

2. **Login** - `POST /api/login`
   - Authenticates user with email and password
   - Updates `LastLoginAt` timestamp
   - Returns JWT token (24-hour expiry)
   - Request body: `{ email, password }`

### Profile Functions

3. **CreateProfile** - `POST /api/profile`
   - Creates a new user profile (requires auth)
   - Request body: `{ name, email, bio, skills[], experience, profileImageUrl }`

4. **GetProfile** - `GET /api/profile/{userId}`
   - Retrieves a user profile by user ID

5. **GetMyProfile** - `GET /api/profile/me`
   - Retrieves the authenticated user's own profile (requires auth)

6. **UpdateProfile** - `PUT /api/profile`
   - Updates profile fields: Name, Bio, Skills, Experience (requires auth)
   - Request body: `{ name, bio, skills, experience }`

7. **GetUserProfileById** - `GET /api/users/{userId}/profile`
   - Retrieves a user's full profile by user ID (requires auth)

8. **SearchUsers** - `GET /api/users/search?query=`
   - Searches users by name, email, skills, or experience (requires auth)
   - Excludes the authenticated user from results
   - Includes connection status with each result

### Connection Functions

9. **CreateConnection** - `POST /api/connections`
    - Sends a connection request between two users (requires auth)
    - Request body: `{ userId2 }`

10. **GetConnections** - `GET /api/connections/user/{userId}`
    - Retrieves a user's connections

11. **GetConnectionsSummary** - `GET /api/connections/manage`
    - Returns incoming, outgoing, and accepted connections (requires auth)
    - Includes profile info for each connected user

12. **RespondToConnection** - `POST /api/connections/respond`
    - Accepts or rejects a connection request (requires auth)
    - Request body: `{ connectionId, status }` (status: `accepted` or `rejected`)

### Messaging Functions

13. **SendMessage** - `POST /api/messages`
    - Sends a message between users (requires auth)
    - Triggers Service Bus queue for async processing
    - Request body: `{ toUserId, content }`

14. **GetMessages** - `GET /api/messages/{otherUserId}`
    - Retrieves conversation messages with another user (requires auth)
    - Marks unread messages as read

15. **GetConversations** - `GET /api/messages/conversations/{userId}`
    - Lists all conversations with last message preview (requires auth)

### Infrastructure Functions

16. **UploadFile** - `POST /api/upload`
    - Uploads files to Azure Blob Storage
    - Returns public URL of uploaded file

17. **NegotiateWebPubSub** - `GET/POST /api/negotiate`
    - Returns Web PubSub connection URL for WebSocket connections
    - Requires `x-user-id` header

18. **ProcessMessage** - Service Bus Queue Trigger
    - Triggered when a message is added to `messages-queue`
    - Sends real-time notification via Web PubSub

## Database Schema

### Tables

The application uses four tables in Azure SQL Database (`portfolio-dev-sqldb`):

```sql
-- Users Table: stores authentication credentials
CREATE TABLE dbo.Users (
    UserId       INT            NOT NULL  PRIMARY KEY IDENTITY(1,1),
    Email        NVARCHAR(255)  NOT NULL  UNIQUE,
    PasswordHash NVARCHAR(255)  NOT NULL,
    Name         NVARCHAR(255)  NOT NULL,
    CreatedAt    DATETIME       NOT NULL  DEFAULT GETDATE(),
    LastLoginAt  DATETIME       NULL,
    IsActive     BIT            NOT NULL  DEFAULT 1,
    IsEmailVerified BIT         NOT NULL  DEFAULT 0
);

-- Profiles Table: stores user profile information
-- NOTE: UserId is NOT an identity column. It is a foreign key to Users.UserId.
CREATE TABLE dbo.Profiles (
    UserId          INT            NOT NULL  PRIMARY KEY,
    Name            NVARCHAR(255)  NOT NULL,
    Email           NVARCHAR(255)  NOT NULL  UNIQUE,
    Bio             NVARCHAR(MAX)  NULL,
    Skills          NVARCHAR(MAX)  NULL,
    Experience      NVARCHAR(MAX)  NULL,
    ProfileImageUrl NVARCHAR(512)  NULL,
    CreatedAt       DATETIME       NOT NULL  DEFAULT GETDATE(),
    UpdatedAt       DATETIME       NOT NULL  DEFAULT GETDATE(),
    IsActive        BIT            NOT NULL  DEFAULT 1,
    CONSTRAINT FK_Profiles_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId)
);

CREATE INDEX IX_Profiles_Email    ON dbo.Profiles (Email);
CREATE INDEX IX_Profiles_IsActive ON dbo.Profiles (IsActive);

-- Connections Table: stores user-to-user connection requests
CREATE TABLE dbo.Connections (
    ConnectionId INT            NOT NULL  PRIMARY KEY IDENTITY(1,1),
    UserId1      INT            NOT NULL,
    UserId2      INT            NOT NULL,
    ConnectedAt  DATETIME       NOT NULL  DEFAULT GETDATE(),
    Status       NVARCHAR(50)   NOT NULL  DEFAULT 'pending',
    RequestedBy  INT            NOT NULL,
    CONSTRAINT FK_Connections_User1       FOREIGN KEY (UserId1)     REFERENCES dbo.Profiles(UserId),
    CONSTRAINT FK_Connections_User2       FOREIGN KEY (UserId2)     REFERENCES dbo.Profiles(UserId),
    CONSTRAINT FK_Connections_RequestedBy FOREIGN KEY (RequestedBy) REFERENCES dbo.Profiles(UserId)
);

-- Messages Table: stores direct messages between users
CREATE TABLE dbo.Messages (
    MessageId  INT            NOT NULL  PRIMARY KEY IDENTITY(1,1),
    FromUserId INT            NOT NULL,
    ToUserId   INT            NOT NULL,
    Content    NVARCHAR(MAX)  NOT NULL,
    SentAt     DATETIME       NOT NULL  DEFAULT GETDATE(),
    IsRead     BIT            NOT NULL  DEFAULT 0,
    ReadAt     DATETIME       NULL,
    IsDeleted  BIT            NOT NULL  DEFAULT 0,
    DeletedAt  DATETIME       NULL,
    CONSTRAINT FK_Messages_FromUser FOREIGN KEY (FromUserId) REFERENCES dbo.Profiles(UserId),
    CONSTRAINT FK_Messages_ToUser   FOREIGN KEY (ToUserId)   REFERENCES dbo.Profiles(UserId)
);

CREATE INDEX IX_Messages_ToUserId   ON dbo.Messages (ToUserId);
CREATE INDEX IX_Messages_FromUserId ON dbo.Messages (FromUserId);
```

### Schema Corrections Applied

The original database schema had issues that were discovered during deployment. The following corrections were applied to the live Azure SQL Database:

**1. Added missing `Experience` column to Profiles**

The `Experience` column was referenced in the application code (Register, SearchUsers, UpdateProfile, GetUserProfileById) but did not exist in the database, causing `Invalid column name 'Experience'` errors.

```sql
ALTER TABLE dbo.Profiles ADD Experience NVARCHAR(MAX) NULL;
```

**2. Removed IDENTITY property from `Profiles.UserId`**

The `Profiles.UserId` column was originally created with `IDENTITY(1,1)`, making it auto-incrementing. However, the Register function inserts an explicit `UserId` value (the foreign key from `dbo.Users`), which caused: `Cannot insert explicit value for identity column in table 'Profiles' when IDENTITY_INSERT is set to OFF.`

The fix required recreating the table because SQL Server does not allow removing the IDENTITY property from an existing column:

```sql
-- 1. Create replacement table without IDENTITY on UserId
CREATE TABLE dbo.Profiles_New (
    UserId          INT            NOT NULL  PRIMARY KEY,
    Name            NVARCHAR(255)  NOT NULL,
    Email           NVARCHAR(255)  NOT NULL  UNIQUE,
    Bio             NVARCHAR(MAX)  NULL,
    Skills          NVARCHAR(MAX)  NULL,
    Experience      NVARCHAR(MAX)  NULL,
    ProfileImageUrl NVARCHAR(512)  NULL,
    CreatedAt       DATETIME       NOT NULL  DEFAULT GETDATE(),
    UpdatedAt       DATETIME       NOT NULL  DEFAULT GETDATE(),
    IsActive        BIT            NOT NULL  DEFAULT 1
);

-- 2. Copy existing data
INSERT INTO dbo.Profiles_New
    (UserId, Name, Email, Bio, Skills, Experience, ProfileImageUrl, CreatedAt, UpdatedAt, IsActive)
SELECT UserId, Name, Email, Bio, Skills, Experience, ProfileImageUrl, CreatedAt, UpdatedAt, IsActive
FROM dbo.Profiles;

-- 3. Drop foreign keys referencing Profiles
ALTER TABLE dbo.Connections DROP CONSTRAINT FK_Connections_User1;
ALTER TABLE dbo.Connections DROP CONSTRAINT FK_Connections_User2;
ALTER TABLE dbo.Connections DROP CONSTRAINT FK_Connections_RequestedBy;
ALTER TABLE dbo.Messages    DROP CONSTRAINT FK_Messages_FromUser;
ALTER TABLE dbo.Messages    DROP CONSTRAINT FK_Messages_ToUser;

-- 4. Swap tables
DROP TABLE dbo.Profiles;
EXEC sp_rename 'dbo.Profiles_New', 'Profiles';

-- 5. Re-create indexes
CREATE INDEX IX_Profiles_Email    ON dbo.Profiles (Email);
CREATE INDEX IX_Profiles_IsActive ON dbo.Profiles (IsActive);

-- 6. Re-create all foreign keys
ALTER TABLE dbo.Profiles    ADD CONSTRAINT FK_Profiles_Users          FOREIGN KEY (UserId)     REFERENCES dbo.Users(UserId);
ALTER TABLE dbo.Connections ADD CONSTRAINT FK_Connections_User1       FOREIGN KEY (UserId1)     REFERENCES dbo.Profiles(UserId);
ALTER TABLE dbo.Connections ADD CONSTRAINT FK_Connections_User2       FOREIGN KEY (UserId2)     REFERENCES dbo.Profiles(UserId);
ALTER TABLE dbo.Connections ADD CONSTRAINT FK_Connections_RequestedBy FOREIGN KEY (RequestedBy) REFERENCES dbo.Profiles(UserId);
ALTER TABLE dbo.Messages    ADD CONSTRAINT FK_Messages_FromUser       FOREIGN KEY (FromUserId) REFERENCES dbo.Profiles(UserId);
ALTER TABLE dbo.Messages    ADD CONSTRAINT FK_Messages_ToUser         FOREIGN KEY (ToUserId)   REFERENCES dbo.Profiles(UserId);
```

**3. Updated CORS headers in all functions**

All 14 function files had `Access-Control-Allow-Origin` hardcoded to `http://localhost:3000`. This blocked requests from the deployed frontend at `https://portfolio-webapp-frontend.azurewebsites.net`. Updated all files to use `Access-Control-Allow-Origin: *` (Azure-level CORS settings still restrict allowed origins).

## Deployment to Azure

### Azure Resources

| Resource | Name | Region |
|----------|------|--------|
| Function App | `portfolio-dev-func-se9pa3` | West US 3 |
| SQL Database | `portfolio-dev-sqldb` | West US 3 |
| SQL Server | `portfolio-dev-sql-se9pa3.database.windows.net` | West US 3 |
| Resource Group | `portfolio-dev-rg` | West US 3 |

### Prerequisites

- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local) v4+
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) logged in (`az login`)
- Node.js 18+

### Deploy

Install dependencies locally, then deploy with remote build:

```bash
cd functions
npm install
func azure functionapp publish portfolio-dev-func-se9pa3 --build remote
```

The `--build remote` flag is critical -- it runs `npm install` on the Azure server to install all Node.js dependencies (`mssql`, `bcryptjs`, `jsonwebtoken`, `@azure/storage-blob`, etc.). Without it, only the source code (~52 KB) is uploaded without `node_modules`, and all functions will return 500 errors.

### Verify Deployment

After deployment, verify all 18 functions are listed:

```bash
func azure functionapp publish portfolio-dev-func-se9pa3 --build remote
# Output should show all 18 functions with their invoke URLs
```

Test key endpoints:

```bash
BASE_URL="https://portfolio-dev-func-se9pa3.azurewebsites.net/api"

# Test registration
curl -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123"}'

# Test login
curl -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# Test authenticated endpoint (use token from login response)
curl "$BASE_URL/profile/me" \
  -H "Authorization: Bearer <TOKEN>"

# Test search
curl "$BASE_URL/users/search?query=test" \
  -H "Authorization: Bearer <TOKEN>"
```

### Environment Variables

The following app settings must be configured on the Azure Function App:

| Variable | Description |
|----------|-------------|
| `SQL_CONNECTION_STRING` | Azure SQL Database connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `STORAGE_CONNECTION_STRING` | Azure Storage Account connection string |
| `STORAGE_ACCOUNT_NAME` | Azure Storage Account name |
| `STORAGE_ACCOUNT_KEY` | Azure Storage Account key |
| `SERVICE_BUS_CONNECTION_STRING` | Azure Service Bus connection string |
| `WEB_PUBSUB_CONNECTION_STRING` | Azure Web PubSub connection string |
| `KEY_VAULT_URL` | Azure Key Vault URL |
| `APPINSIGHTS_INSTRUMENTATIONKEY` | Application Insights key |

View current settings:

```bash
az functionapp config appsettings list \
  --name portfolio-dev-func-se9pa3 \
  --resource-group portfolio-dev-rg \
  --query "[].{name:name}" -o table
```

### CORS Configuration

CORS is managed at the Azure level. To add an allowed origin:

```bash
az functionapp cors add \
  --name portfolio-dev-func-se9pa3 \
  --resource-group portfolio-dev-rg \
  --allowed-origins "https://your-frontend-domain.azurewebsites.net"
```

View current CORS settings:

```bash
az functionapp cors show \
  --name portfolio-dev-func-se9pa3 \
  --resource-group portfolio-dev-rg
```

## Local Development

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure `local.settings.json`:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "SQL_CONNECTION_STRING": "<your-sql-connection-string>",
       "JWT_SECRET": "<your-jwt-secret>"
     }
   }
   ```

3. Start local development server:
   ```bash
   func start
   ```

4. The API will be available at `http://localhost:7071/api`

## Architecture

```
React Frontend (App Service)
    │
    ▼
Azure Functions (HTTP Triggers)
    │
    ├── Azure SQL Database (Users, Profiles, Connections, Messages)
    ├── Azure Blob Storage (File uploads)
    ├── Service Bus Queue (Async message processing)
    │       │
    │       ▼
    │   Queue Trigger Function (ProcessMessage)
    │       │
    │       ▼
    │   Web PubSub (Real-time notifications)
    │       │
    └───────▼
        React Frontend (WebSocket connection)
```
