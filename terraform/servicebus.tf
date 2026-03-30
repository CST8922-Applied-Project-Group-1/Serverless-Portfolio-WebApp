# Azure Service Bus Namespace
resource "azurerm_servicebus_namespace" "main" {
  name                = "${var.project_name}-${var.environment}-sb-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.service_bus_sku

  tags = var.tags
}

# Service Bus Queue for processing messages
resource "azurerm_servicebus_queue" "messages_queue" {
  name         = "messages-queue"
  namespace_id = azurerm_servicebus_namespace.main.id

  enable_partitioning = true
  max_size_in_megabytes = 1024
}

# Service Bus Queue for notifications
resource "azurerm_servicebus_queue" "notifications_queue" {
  name         = "notifications-queue"
  namespace_id = azurerm_servicebus_namespace.main.id

  enable_partitioning = true
  max_size_in_megabytes = 1024
}

# Service Bus Topic for broadcasts
resource "azurerm_servicebus_topic" "events" {
  name         = "events-topic"
  namespace_id = azurerm_servicebus_namespace.main.id

  enable_partitioning = true
  max_size_in_megabytes = 1024
}

# Service Bus Subscription for the events topic
resource "azurerm_servicebus_subscription" "events_subscription" {
  name               = "events-subscription"
  topic_id           = azurerm_servicebus_topic.events.id
  max_delivery_count = 10
}
