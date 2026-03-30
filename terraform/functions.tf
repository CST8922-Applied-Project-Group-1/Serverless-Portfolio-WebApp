# App Service Plan for Function App
resource "azurerm_service_plan" "main" {
  name                = "${var.project_name}-${var.environment}-asp-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = var.function_app_service_plan_sku

  tags = var.tags
}

# Storage Account for Function App
resource "azurerm_storage_account" "function_storage" {
  name                     = "${var.project_name}${var.environment}fn${random_string.suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = var.tags
}

# Linux Function App
resource "azurerm_linux_function_app" "main" {
  name                       = "${var.project_name}-${var.environment}-func-${random_string.suffix.result}"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  service_plan_id            = azurerm_service_plan.main.id
  storage_account_name       = azurerm_storage_account.function_storage.name
  storage_account_access_key = azurerm_storage_account.function_storage.primary_access_key

  site_config {
    application_stack {
      node_version = var.function_app_runtime_version
    }

    cors {
      allowed_origins = ["*"]
      support_credentials = false
    }

    application_insights_key               = azurerm_application_insights.main.instrumentation_key
    application_insights_connection_string = azurerm_application_insights.main.connection_string
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"       = var.function_app_runtime
    "WEBSITE_NODE_DEFAULT_VERSION"   = "~${var.function_app_runtime_version}"
    "AzureWebJobsStorage"            = azurerm_storage_account.function_storage.primary_connection_string
    "WEBSITE_CONTENTAZUREFILECONNECTIONSTRING" = azurerm_storage_account.function_storage.primary_connection_string
    "WEBSITE_CONTENTSHARE"           = "${var.project_name}-${var.environment}-func"
    
    # Database Connection
    "SQL_CONNECTION_STRING"          = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.main.name};Persist Security Info=False;User ID=${var.sql_admin_username};Password=${var.sql_admin_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
    
    # Storage Connection
    "STORAGE_CONNECTION_STRING"      = azurerm_storage_account.main.primary_connection_string
    "STORAGE_ACCOUNT_NAME"           = azurerm_storage_account.main.name
    "STORAGE_ACCOUNT_KEY"            = azurerm_storage_account.main.primary_access_key
    
    # Service Bus Connection
    "SERVICE_BUS_CONNECTION_STRING"  = azurerm_servicebus_namespace.main.default_primary_connection_string
    
    # Key Vault Reference
    "KEY_VAULT_URL"                  = azurerm_key_vault.main.vault_uri
    
    # Web PubSub Connection
    "WEB_PUBSUB_CONNECTION_STRING"   = azurerm_web_pubsub.main.primary_connection_string
    
    # Application Insights
    "APPINSIGHTS_INSTRUMENTATIONKEY" = azurerm_application_insights.main.instrumentation_key
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.main.connection_string
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}
