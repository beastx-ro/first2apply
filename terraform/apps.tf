provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "prod" {
  name     = "f2a-prod"
  location = "East US"
}

resource "azurerm_static_site" "prod_webapp" {
  name                = "first2apply-webapp"
  resource_group_name = azurerm_resource_group.prod.name
  location            = azurerm_resource_group.prod.location

  # GitHub repository details
  repository_url   = "https://github.com/beastx-ro/first2apply"
  branch           = "master"
  repository_token = var.github_token # GitHub personal access token

  # Build settings for Next.js
  build {
    app_location    = "/"
    output_location = ".next" # Default Next.js build output
    api_location    = ""      # Leave empty if no Azure Functions are used
  }

  # Environment variables
  identity {
    type = "SystemAssigned"
  }

  environment_variables = {
    SUPABASE_URL         = var.supabase_url
    SUPABASE_SERVICE_KEY = var.supabase_service_key
  }
}
