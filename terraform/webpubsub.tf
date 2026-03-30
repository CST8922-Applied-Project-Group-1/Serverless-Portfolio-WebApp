# Azure Web PubSub
resource "azurerm_web_pubsub" "main" {
  name                = "${var.project_name}-${var.environment}-pubsub-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.webpubsub_sku
  capacity            = var.webpubsub_capacity

  public_network_access_enabled = true

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# Web PubSub Hub
resource "azurerm_web_pubsub_hub" "notifications" {
  name          = "notifications"
  web_pubsub_id = azurerm_web_pubsub.main.id

  event_handler {
    url_template       = "https://${azurerm_linux_function_app.main.default_hostname}/runtime/webhooks/webpubsub"
    user_event_pattern = "*"
    system_events      = ["connect", "connected", "disconnected"]
  }

  anonymous_connections_enabled = false

  depends_on = [
    azurerm_linux_function_app.main
  ]
}
