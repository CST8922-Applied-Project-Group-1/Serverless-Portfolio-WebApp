# Terraform Backend Infrastructure for Portfolio Website

This directory contains Terraform configuration files to deploy the complete Azure backend infrastructure for the serverless portfolio website.

## Architecture Overview

The infrastructure includes the following Azure services:

- **Azure Resource Group**: Container for all resources
- **Azure Storage Account**: Static website hosting and blob storage for files/images
- **Azure SQL Database**: Relational database for profiles, connections, and messages
- **Azure Functions**: Serverless compute for HTTP and queue-triggered APIs
- **Azure Service Bus**: Message queuing and pub/sub messaging
- **Azure Key Vault**: Secure secrets management
- **Azure Web PubSub**: Real-time bidirectional communication
- **Application Insights**: Application monitoring and telemetry
- **Log Analytics Workspace**: Centralized logging

## Prerequisites

Before deploying this infrastructure, ensure you have:

1. **Azure CLI** installed and configured
   ```bash
   az --version
   az login
   ```

2. **Terraform** installed (version >= 1.0)
   ```bash
   terraform version
   ```

3. **Azure Subscription** with appropriate permissions to create resources

4. **Service Principal** (optional, for CI/CD)
   ```bash
   az ad sp create-for-rbac --name "terraform-sp" --role="Contributor" --scopes="/subscriptions/YOUR_SUBSCRIPTION_ID"
   ```

## File Structure

```
terraform/
├── providers.tf              # Terraform and provider configuration
├── variables.tf              # Input variable definitions
├── main.tf                   # Core resources (RG, Storage, App Insights)
├── sql.tf                    # Azure SQL Database configuration
├── functions.tf              # Azure Functions configuration
├── servicebus.tf             # Azure Service Bus configuration
├── keyvault.tf               # Azure Key Vault configuration
├── webpubsub.tf              # Azure Web PubSub configuration
├── outputs.tf                # Output values
├── terraform.tfvars.example  # Example variables file
└── README.md                 # This file
```

## Deployment Steps

### 1. Configure Variables

Copy the example variables file and customize it:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and update the values:

- **sql_admin_password**: Set a strong password for SQL Server (REQUIRED)
- **project_name**: Change if you want a different prefix
- **location**: Change to your preferred Azure region
- **environment**: Set to `dev`, `staging`, or `prod`

### 2. Initialize Terraform

Initialize the Terraform working directory:

```bash
terraform init
```

This will download the required provider plugins.

### 3. Review the Plan

Preview the changes Terraform will make:

```bash
terraform plan
```

Review the output to ensure all resources will be created correctly.

### 4. Apply the Configuration

Deploy the infrastructure:

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

The deployment typically takes 5-10 minutes to complete.

### 5. View Outputs

After successful deployment, view the important output values:

```bash
terraform output
```

To view sensitive outputs:

```bash
terraform output -json
```

## Important Outputs

After deployment, you'll have access to these key outputs:

| Output | Description |
|--------|-------------|
| `function_app_url` | The URL of your Azure Function App |
| `static_website_url` | The URL of your static website |
| `sql_server_fqdn` | The fully qualified domain name of your SQL Server |
| `key_vault_uri` | The URI of your Key Vault |
| `web_pubsub_hostname` | The hostname of your Web PubSub service |

## Configuration Options

### Environment-Specific Deployments

You can maintain separate `.tfvars` files for different environments:

```bash
# Development
terraform apply -var-file="terraform.dev.tfvars"

# Staging
terraform apply -var-file="terraform.staging.tfvars"

# Production
terraform apply -var-file="terraform.prod.tfvars"
```

### SKU and Pricing Tiers

The default configuration uses cost-effective SKUs suitable for development:

- **Function App**: Consumption Plan (Y1) - Pay per execution
- **SQL Database**: Basic - $5/month
- **Service Bus**: Standard - $0.05/million operations
- **Web PubSub**: Free tier (F1)
- **Storage**: Standard LRS

For production, consider upgrading:

```hcl
# terraform.prod.tfvars
function_app_service_plan_sku = "EP1"  # Premium Elastic
sql_database_sku = "S1"                # Standard tier
service_bus_sku = "Premium"
webpubsub_sku = "Standard_S1"
storage_account_replication_type = "GRS"  # Geo-redundant
```

## Security Considerations

### 1. SQL Password Management

**Never commit** `terraform.tfvars` with actual passwords to version control. Add it to `.gitignore`:

```bash
echo "terraform.tfvars" >> .gitignore
```

For production, use Azure Key Vault or environment variables:

```bash
export TF_VAR_sql_admin_password="YourSecurePassword"
terraform apply
```

### 2. Network Security

The default configuration allows access from Azure services. For production:

- Restrict SQL firewall rules to specific IPs
- Enable private endpoints for Storage and SQL
- Configure VNET integration for Function App

### 3. Key Vault Access

The Function App has a system-assigned managed identity with read access to Key Vault secrets.

## Post-Deployment Steps

### 1. Initialize SQL Database

Connect to the SQL Database and create the required schema:

```bash
# Get connection details
terraform output sql_server_fqdn
terraform output sql_connection_string

# Connect using Azure Data Studio or SQL Server Management Studio
```

Create tables for profiles, connections, and messages.

### 2. Deploy Function App Code

Deploy your Azure Functions code:

```bash
cd ../functions  # Your functions directory
func azure functionapp publish $(terraform -chdir=../terraform output -raw function_app_name)
```

### 3. Upload Static Website

Upload your React build to the storage account:

```bash
cd ..
npm run build

# Get storage account name
STORAGE_ACCOUNT=$(terraform -chdir=terraform output -raw storage_account_name)

# Upload to $web container
az storage blob upload-batch \
  --account-name $STORAGE_ACCOUNT \
  --destination '$web' \
  --source ./build
```

### 4. Configure CORS

If needed, update CORS settings for your Function App:

```bash
az functionapp cors add \
  --name $(terraform -chdir=terraform output -raw function_app_name) \
  --resource-group $(terraform -chdir=terraform output -raw resource_group_name) \
  --allowed-origins "https://your-domain.com"
```

## Monitoring and Maintenance

### View Application Insights

Access Application Insights in the Azure Portal to view:

- Request telemetry
- Failed requests
- Performance metrics
- Custom events

### Check Function App Logs

Stream logs from your Function App:

```bash
func azure functionapp logstream $(terraform -chdir=terraform output -raw function_app_name)
```

### Backup and Recovery

- SQL Database has automatic backups (7-35 days retention)
- Storage Account should have soft delete enabled
- Consider Point-in-Time Restore for SQL
- Use Azure Backup for critical data

## Updating Infrastructure

To update the infrastructure:

1. Modify the Terraform files
2. Run `terraform plan` to preview changes
3. Run `terraform apply` to apply changes

Terraform will only modify what's changed.

## Destroying Infrastructure

To remove all resources:

```bash
terraform destroy
```

**Warning**: This will delete all resources including databases and storage. Ensure you have backups!

## Cost Estimation

Estimated monthly costs for default configuration (development):

- Function App (Consumption): ~$0-20/month (depending on usage)
- SQL Database (Basic): ~$5/month
- Storage Account: ~$1-5/month
- Service Bus (Standard): ~$10/month
- Web PubSub (Free): $0/month
- Application Insights: ~$2-5/month (first 5GB free)

**Total**: ~$18-45/month

Production costs will vary based on scale and SKU choices.

## Troubleshooting

### Common Issues

1. **Key Vault Access Denied**
   - Ensure your Azure CLI user has permissions
   - Check Key Vault access policies

2. **SQL Connection Failed**
   - Verify firewall rules
   - Check if your IP is allowed

3. **Function App Deployment Failed**
   - Check App Service Plan SKU compatibility
   - Verify storage account is accessible

4. **Terraform State Lock**
   ```bash
   terraform force-unlock <LOCK_ID>
   ```

### Getting Help

- Check Azure Portal for resource status
- View Activity Log for deployment errors
- Review Application Insights for runtime errors
- Check Terraform state: `terraform show`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Infrastructure

on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        
      - name: Terraform Init
        run: terraform init
        working-directory: ./terraform
        
      - name: Terraform Apply
        run: terraform apply -auto-approve
        working-directory: ./terraform
        env:
          ARM_CLIENT_ID: ${{ secrets.ARM_CLIENT_ID }}
          ARM_CLIENT_SECRET: ${{ secrets.ARM_CLIENT_SECRET }}
          ARM_SUBSCRIPTION_ID: ${{ secrets.ARM_SUBSCRIPTION_ID }}
          ARM_TENANT_ID: ${{ secrets.ARM_TENANT_ID }}
          TF_VAR_sql_admin_password: ${{ secrets.SQL_ADMIN_PASSWORD }}
```

## Additional Resources

- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [Azure SQL Database Documentation](https://docs.microsoft.com/en-us/azure/azure-sql/)
- [Terraform Azure Provider Documentation](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure Web PubSub Documentation](https://docs.microsoft.com/en-us/azure/azure-web-pubsub/)

## License

This infrastructure code is part of the Portfolio Website project.

## Support

For issues or questions, please open an issue in the project repository.
