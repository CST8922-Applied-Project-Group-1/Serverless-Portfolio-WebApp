# Azure AD B2C Tenant (Note: Must be created manually first)
# Reference: https://docs.microsoft.com/en-us/azure/active-directory-b2c/tutorial-create-tenant

# For this configuration to work, you need to:
# 1. Create an Azure AD B2C tenant manually in Azure Portal
# 2. Register an application in the tenant
# 3. Update the variables below with your tenant details

variable "ad_b2c_tenant_name" {
  description = "Azure AD B2C tenant name (e.g., yourportfolio)"
  type        = string
  default     = ""
}

variable "ad_b2c_domain" {
  description = "Azure AD B2C domain (e.g., yourportfolio.onmicrosoft.com)"
  type        = string
  default     = ""
}

variable "ad_b2c_client_id" {
  description = "Azure AD B2C Application (client) ID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "ad_b2c_client_secret" {
  description = "Azure AD B2C client secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "ad_b2c_sign_up_sign_in_policy" {
  description = "Azure AD B2C Sign up and sign in user flow name"
  type        = string
  default     = "B2C_1_signupsignin"
}
