# Troubleshooting Production Deployment

## Current Status

✅ Infrastructure deployed
✅ Functions deployed  
✅ App settings configured
⚠️ Functions returning 500 errors

## Issue: 500 Internal Server Error

All endpoints are returning `500 Internal Server Error` with empty response bodies.

### Confirmed Working:
- Function App is running (state: Running)
- Service Bus trigger is polling (visible in logs)
- All app settings are present (JWT_SECRET, SQL_CONNECTION_STRING, etc.)
- Functions are deployed and enabled
- Authentication level is correct (anonymous for Login/Register)

### Possible Causes:

1. **Node.js Module Loading Issue**
   - Azure Functions may not have all node_modules properly bundled
   - Solution: Ensure `package.json` is at the root level and `npm install` runs during deployment

2. **Environment Variable Access**
   - In Azure, environment variables might need to be accessed differently
   - Local: `process.env.SQL_CONNECTION_STRING`
   - Azure: Should be the same, but timing might differ

3. **Database Connection Timeout**
   - First connection to SQL from Azure may take longer
   - May need to increase timeout or add retry logic

4. **Cold Start Issues**
   - Consumption plan has cold start delays
   - First invocation can take 20-30 seconds

## Recommended Troubleshooting Steps

### 1. Check Live Logs in Azure Portal

**Go to Azure Portal:**
1. Navigate to `portfolio-dev-func-se9pa3` Function App
2. Click **"Log stream"** in the left menu under **Monitoring**
3. Select **"App Insights Logs"** or **"Filesystem Logs"**
4. Try calling an endpoint and watch for errors in real-time

### 2. Check Application Insights

**In Azure Portal:**
1. Go to **Application Insights** (`portfolio-dev-ai-se9pa3`)
2. Click **"Failures"** to see all 500 errors
3. Click **"Logs"** and run this query:

```kusto
traces
| where timestamp > ago(1h)
| where severityLevel >= 3  // Errors and above
| order by timestamp desc
| project timestamp, message, severityLevel, customDimensions
```

### 3. Enable Detailed Application Logging

```bash
az functionapp config appsettings set \
  --name portfolio-dev-func-se9pa3 \
  --resource-group portfolio-dev-rg \
  --settings \
    "FUNCTIONS_WORKER_RUNTIME_VERSION=18" \
    "AzureFunctionsJobHost__logging__logLevel__Default=Information" \
    "AzureFunctionsJobHost__logging__logLevel__Function=Information"
```

### 4. Test Specific Function with Admin Key

Get the master key and test with it:

```bash
# Get master key (in Azure Portal > Function App > App keys)
# Then test:
curl -X POST "https://portfolio-dev-func-se9pa3.azurewebsites.net/api/auth/login?code=YOUR_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 5. Check Function Code Deployment

Verify the code was deployed correctly:

```bash
# Check if index.js exists
az rest --method get \
  --uri "https://portfolio-dev-func-se9pa3.scm.azurewebsites.net/api/vfs/site/wwwroot/Login/index.js" \
  --resource "https://management.azure.com/"
```

### 6. Restart Function App

```bash
az functionapp restart \
  --name portfolio-dev-func-se9pa3 \
  --resource-group portfolio-dev-rg
```

## Quick Fixes to Try

### Fix 1: Add Node Modules to Deployment

Ensure `node_modules` are included in the deployment package. Add to `.funcignore`:

```
# Comment out or remove this line if it exists:
# node_modules
```

### Fix 2: Verify Database Connectivity

Test SQL connection from Azure:

```bash
az sql db show-connection-string \
  --client ado.net \
  --server portfolio-dev-sql-se9pa3 \
  --name portfolio-dev-sqldb
```

### Fix 3: Check Firewall Rules

Ensure Azure services can access the database:

```bash
az sql server firewall-rule list \
  --server portfolio-dev-sql-se9pa3 \
  --resource-group portfolio-dev-rg \
  --output table
```

### Fix 4: Redeploy with Build

Force a clean build and redeploy:

```bash
cd /Users/taofeekat/Code/Serverless-Portfolio-WebApp/functions
rm -rf node_modules package-lock.json
npm install
npm audit fix
func azure functionapp publish portfolio-dev-func-se9pa3 --build remote
```

## Expected Behavior

When working correctly, you should see:

**Login Request:**
```bash
curl -X POST https://portfolio-dev-func-se9pa3.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUz...",
  "user": {
    "userId": 1,
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

## Next Steps

1. **Immediate**: Check Azure Portal Log Stream for real-time error messages
2. **Short-term**: Review Application Insights for detailed error traces  
3. **If errors persist**: Redeploy with `--build remote` flag to ensure proper build

---

**Note**: Local testing worked perfectly, so the issue is environment-specific to Azure. The most likely cause is module loading or first-time database connection from Azure's network.
