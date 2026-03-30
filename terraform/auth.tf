# Store AD B2C configuration in Key Vault

resource "azurerm_key_vault_secret" "ad_b2c_tenant_name" {
  count        = var.ad_b2c_tenant_name != "" ? 1 : 0
  name         = "ad-b2c-tenant-name"
  value        = var.ad_b2c_tenant_name
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_key_vault_access_policy.deployer
  ]
}

resource "azurerm_key_vault_secret" "ad_b2c_client_id" {
  count        = var.ad_b2c_client_id != "" ? 1 : 0
  name         = "ad-b2c-client-id"
  value        = var.ad_b2c_client_id
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_key_vault_access_policy.deployer
  ]
}

resource "azurerm_key_vault_secret" "ad_b2c_client_secret" {
  count        = var.ad_b2c_client_secret != "" ? 1 : 0
  name         = "ad-b2c-client-secret"
  value        = var.ad_b2c_client_secret
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [
    azurerm_key_vault_access_policy.deployer
  ]
}

# Output AD B2C configuration
output "ad_b2c_authority" {
  description = "Azure AD B2C authority URL"
  value       = var.ad_b2c_tenant_name != "" ? "https://${var.ad_b2c_tenant_name}.b2clogin.com/${var.ad_b2c_domain}/${var.ad_b2c_sign_up_sign_in_policy}" : "Not configured"
}

output "ad_b2c_redirect_uri" {
  description = "Redirect URI for AD B2C (configure in Azure Portal)"
  value       = "https://${azurerm_storage_account.main.primary_web_endpoint}"
}
