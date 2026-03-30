# Portfolio Azure Functions

This directory contains Azure Functions for the Portfolio Website backend.

## Functions Overview

### HTTP Trigger Functions

1. **GetProfile** - `GET /api/profile/{userId}`
   - Retrieves user profile from SQL Database
   - Returns profile information including name, email, bio, and skills

2. **CreateProfile** - `POST /api/profile`
   - Creates a new user profile
   - Stores data in SQL Database
   - Request body: `{ name, email, bio, skills[] }`

3. **SendMessage** - `POST /api/messages`
   - Sends a message between users
   - Stores in SQL Database
   - Triggers Service Bus queue for async processing
   - Request body: `{ fromUserId, toUserId, content }`

4. **GetConnections** - `GET /api/connections/{userId}`
   - Retrieves user's connections
   - Returns list of connected users with their details

5. **UploadFile** - `POST /api/upload`
   - Uploads files to Azure Blob Storage
   - Supports image uploads to the `images` container
   - Returns public URL of uploaded file

6. **NegotiateWebPubSub** - `GET/POST /api/negotiate`
   - Returns Web PubSub connection URL
   - Used by clients to establish WebSocket connection
   - Requires `x-user-id` header

### Queue Trigger Functions

7. **ProcessMessage** - Service Bus Queue Trigger
   - Triggered when message is added to `messages-queue`
   - Sends real-time notification via Web PubSub
   - Notifies recipient of new message

## Local Development

### Prerequisites

- Node.js 18 or later
- Azure Functions Core Tools
- Azure Storage Emulator (Azurite) or Azure Storage Account

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure local settings:
   - Copy `local.settings.json` and update with your Azure credentials
   - Get connection strings from Terraform outputs:
     ```bash
     cd ../terraform
     terraform output -json
     ```

3. Start local development server:
   ```bash
   npm start
   # or
   func start
   ```

4. Test functions locally:
   ```bash
   # Get Profile
   curl http://localhost:7071/api/profile/1
   
   # Create Profile
   curl -X POST http://localhost:7071/api/profile \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","email":"john@example.com","bio":"Developer","skills":["JavaScript","React"]}'
   
   # Send Message
   curl -X POST http://localhost:7071/api/messages \
     -H "Content-Type: application/json" \
     -d '{"fromUserId":1,"toUserId":2,"content":"Hello!"}'
   ```

## Deployment

### Deploy to Azure

1. Build the project:
   ```bash
   npm install --production
   ```

2. Deploy using Azure Functions Core Tools:
   ```bash
   func azure functionapp publish <YOUR_FUNCTION_APP_NAME>
   ```

   Or get the function app name from Terraform:
   ```bash
   FUNCTION_APP_NAME=$(cd ../terraform && terraform output -raw function_app_name)
   func azure functionapp publish $FUNCTION_APP_NAME
   ```

3. Verify deployment:
   ```bash
   FUNCTION_APP_URL=$(cd ../terraform && terraform output -raw function_app_url)
   curl $FUNCTION_APP_URL/api/profile/1
   ```

### Deploy using Azure CLI

```bash
# Get function app name from Terraform
FUNCTION_APP_NAME=$(cd ../terraform && terraform output -raw function_app_name)

# Create deployment package
zip -r function-app.zip . -x "*.git*" "node_modules/*" ".vscode/*"

# Deploy
az functionapp deployment source config-zip \
  --name $FUNCTION_APP_NAME \
  --resource-group portfolio-dev-rg \
  --src function-app.zip
```

## Database Schema

Create these tables in your Azure SQL Database:

```sql
-- Profiles Table
CREATE TABLE Profiles (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    Bio NVARCHAR(MAX),
    Skills NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Connections Table
CREATE TABLE Connections (
    ConnectionId INT PRIMARY KEY IDENTITY(1,1),
    UserId1 INT NOT NULL,
    UserId2 INT NOT NULL,
    ConnectedAt DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(50) DEFAULT 'pending',
    FOREIGN KEY (UserId1) REFERENCES Profiles(UserId),
    FOREIGN KEY (UserId2) REFERENCES Profiles(UserId)
);

-- Messages Table
CREATE TABLE Messages (
    MessageId INT PRIMARY KEY IDENTITY(1,1),
    FromUserId INT NOT NULL,
    ToUserId INT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    SentAt DATETIME DEFAULT GETDATE(),
    IsRead BIT DEFAULT 0,
    FOREIGN KEY (FromUserId) REFERENCES Profiles(UserId),
    FOREIGN KEY (ToUserId) REFERENCES Profiles(UserId)
);

-- Indexes for performance
CREATE INDEX IX_Messages_ToUserId ON Messages(ToUserId);
CREATE INDEX IX_Messages_FromUserId ON Messages(FromUserId);
CREATE INDEX IX_Connections_UserId1 ON Connections(UserId1);
CREATE INDEX IX_Connections_UserId2 ON Connections(UserId2);
```

## Environment Variables

All connection strings are automatically configured when deployed via Terraform:

- `SQL_CONNECTION_STRING` - Azure SQL Database
- `STORAGE_CONNECTION_STRING` - Azure Storage Account
- `SERVICE_BUS_CONNECTION_STRING` - Azure Service Bus
- `WEB_PUBSUB_CONNECTION_STRING` - Azure Web PubSub
- `APPINSIGHTS_INSTRUMENTATIONKEY` - Application Insights

## Architecture

```
Client (React App)
    ↓
Azure Functions (HTTP Triggers)
    ↓
├── Azure SQL Database (Data Storage)
├── Azure Storage (File Storage)
├── Service Bus Queue (Async Processing)
│       ↓
│   Queue Trigger Function
│       ↓
│   Web PubSub (Real-time Notifications)
│       ↓
└── Client (WebSocket Connection)
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
Use tools like Postman or Thunder Client to test the endpoints.

### Load Testing
Use Azure Load Testing or Apache JMeter for performance testing.

## Monitoring

- **Application Insights**: Automatic telemetry collection
- **Log Stream**: `func azure functionapp logstream <FUNCTION_APP_NAME>`
- **Metrics**: View in Azure Portal under Function App → Monitoring

## Security

- All functions use function-level authentication
- CORS is configured to allow all origins (update for production)
- SQL injection protection via parameterized queries
- Connection strings stored in Azure Key Vault (referenced via Terraform)

## Troubleshooting

### Common Issues

1. **SQL Connection Timeout**
   - Ensure firewall rules allow Function App IP
   - Check connection string format

2. **Service Bus Permissions**
   - Verify Service Bus connection string has correct permissions
   - Check queue names match configuration

3. **Storage Access Denied**
   - Verify storage account key is correct
   - Check container exists and has correct access level

4. **Web PubSub Connection Failed**
   - Verify Web PubSub connection string
   - Check hub name matches configuration

## Next Steps

1. Deploy the functions to Azure
2. Set up the SQL database schema
3. Test all endpoints
4. Configure CORS for your frontend domain
5. Set up CI/CD pipeline with GitHub Actions
6. Add authentication with Azure AD B2C
7. Implement rate limiting
8. Add comprehensive error handling
9. Set up monitoring alerts

## Resources

- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [Azure SQL Database](https://docs.microsoft.com/en-us/azure/azure-sql/)
- [Azure Service Bus](https://docs.microsoft.com/en-us/azure/service-bus-messaging/)
- [Azure Web PubSub](https://docs.microsoft.com/en-us/azure/azure-web-pubsub/)
