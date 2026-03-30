# General Variables
variable "project_name" {
  description = "The name of the project, used as a prefix for resource names"
  type        = string
  default     = "portfolio"
}

variable "environment" {
  description = "The deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "The Azure region where resources will be deployed (allowed: eastus2, southcentralus, canadacentral, westus3, westus)"
  type        = string
  default     = "westus3"
}

variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
  default     = ""
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default = {
    Project     = "Portfolio"
    ManagedBy   = "Terraform"
  }
}

# Storage Account Variables
variable "storage_account_tier" {
  description = "The tier of the storage account"
  type        = string
  default     = "Standard"
}

variable "storage_account_replication_type" {
  description = "The replication type for the storage account"
  type        = string
  default     = "LRS"
}

# Azure SQL Database Variables
variable "sql_admin_username" {
  description = "The administrator username for the SQL Server"
  type        = string
  default     = "sqladmin"
}

variable "sql_admin_password" {
  description = "The administrator password for the SQL Server"
  type        = string
  sensitive   = true
}

variable "sql_database_sku" {
  description = "The SKU name for the SQL Database"
  type        = string
  default     = "Basic"
}

variable "sql_database_max_size_gb" {
  description = "The maximum size of the database in gigabytes"
  type        = number
  default     = 2
}

# Function App Variables
variable "function_app_runtime" {
  description = "The runtime stack for the Function App"
  type        = string
  default     = "node"
}

variable "function_app_runtime_version" {
  description = "The version of the runtime stack"
  type        = string
  default     = "18"
}

variable "function_app_service_plan_sku" {
  description = "The SKU for the App Service Plan (Y1 for consumption, EP1/EP2/EP3 for premium)"
  type        = string
  default     = "Y1"
}

# Service Bus Variables
variable "service_bus_sku" {
  description = "The SKU for the Service Bus namespace"
  type        = string
  default     = "Standard"
}

# Key Vault Variables
variable "key_vault_sku" {
  description = "The SKU for the Key Vault"
  type        = string
  default     = "standard"
}

variable "key_vault_enabled_for_deployment" {
  description = "Enable Azure Virtual Machines to retrieve certificates from Key Vault"
  type        = bool
  default     = true
}

variable "key_vault_enabled_for_disk_encryption" {
  description = "Enable Azure Disk Encryption to retrieve secrets from Key Vault"
  type        = bool
  default     = true
}

variable "key_vault_enabled_for_template_deployment" {
  description = "Enable Azure Resource Manager to retrieve secrets from Key Vault"
  type        = bool
  default     = true
}

# Web PubSub Variables
variable "webpubsub_sku" {
  description = "The SKU for the Web PubSub service"
  type        = string
  default     = "Free_F1"
}

variable "webpubsub_capacity" {
  description = "The capacity (units) for the Web PubSub service"
  type        = number
  default     = 1
}

# Application Insights Variables
variable "application_insights_type" {
  description = "The type of Application Insights to create"
  type        = string
  default     = "web"
}

# Static Web App Variables
variable "static_web_app_sku_tier" {
  description = "The SKU tier for Static Web Apps"
  type        = string
  default     = "Free"
}

variable "static_web_app_sku_size" {
  description = "The SKU size for Static Web Apps"
  type        = string
  default     = "Free"
}
