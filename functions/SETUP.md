# Setup Instructions

## Prerequisites

### 1. Install Azure Functions Core Tools

Azure Functions Core Tools is required to run and deploy functions locally.

**macOS (using Homebrew):**
```bash
brew tap azure/functions
brew install azure-functions-core-tools@4
```

**macOS (using npm - global install):**
```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

**Windows (using Chocolatey):**
```bash
choco install azure-functions-core-tools-4
```

**Windows (using npm - global install):**
```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

**Linux (Ubuntu/Debian):**
```bash
curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
sudo mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/repos/microsoft-ubuntu-$(lsb_release -cs)-prod $(lsb_release -cs) main" > /etc/apt/sources.list.d/dotnetdev.list'
sudo apt-get update
sudo apt-get install azure-functions-core-tools-4
```

Verify installation:
```bash
func --version
```

### 2. Install Node.js Dependencies

```bash
cd functions
npm install
```

### 3. Configure Local Settings

Update `local.settings.json` with your Azure credentials:

```bash
# Get connection strings from Terraform
cd ../terraform
terraform output -json > ../functions/terraform-outputs.json
cd ../functions
```

Then manually update `local.settings.json` with the connection strings from the Terraform outputs.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start local development server:**
   ```bash
   func start
   # or
   npm start
   ```

3. **Test a function:**
   ```bash
   # In another terminal
   curl http://localhost:7071/api/profile/1
   ```

## Deploy to Azure

```bash
# Get function app name
FUNCTION_APP_NAME=$(cd ../terraform && terraform output -raw function_app_name)

# Deploy
func azure functionapp publish $FUNCTION_APP_NAME
```

## Troubleshooting

### "func: command not found"
Azure Functions Core Tools is not installed. Follow the installation instructions above.

### npm install errors
Make sure you're using Node.js 18 or later:
```bash
node --version
```

### Local development connection errors
Update `local.settings.json` with valid connection strings from your Azure resources.

### CORS errors during testing
Add your local development URL to CORS settings in the deployed function app.
