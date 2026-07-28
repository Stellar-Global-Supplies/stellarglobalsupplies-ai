terraform {
  required_version = ">= 1.5"
  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.3"
    }
  }

  # Store state in Terraform Cloud or S3 — configure as needed
  # backend "s3" {
  #   bucket = "your-tfstate-bucket"
  #   key    = "gemini-clone/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "render" {
  api_key  = var.render_api_key
  owner_id = var.render_owner_id
}

# ── Variables ────────────────────────────────────────────────
variable "render_api_key"    { type = string; sensitive = true }
variable "render_owner_id"   { type = string }
variable "database_url"      { type = string; sensitive = true }
variable "groq_api_key"      { type = string; sensitive = true }
variable "brave_api_key"     { type = string; sensitive = true }
variable "ent_database_url"  { type = string; sensitive = true; default = "" }
variable "admin_key"         { type = string; sensitive = true }
variable "image_tag"         { type = string; default = "latest" }

locals {
  repo  = "https://github.com/YOUR_ORG/gemini-clone"
  branch = "main"
}

# ── Backend service ──────────────────────────────────────────
resource "render_web_service" "backend" {
  name   = "gemini-clone-api"
  plan   = "starter"
  region = "oregon"

  runtime_source = {
    docker = {
      repo_url    = local.repo
      branch      = local.branch
      dockerfile_path = "./backend/Dockerfile"
      context     = "./backend"
      auto_deploy = true
    }
  }

  start_command = "node src/index.js"

  env_vars = {
    NODE_ENV        = { value = "production" }
    PORT            = { value = "4000" }
    DATABASE_URL    = { value = var.database_url }
    JWT_SECRET      = { generate_value = true }
    JWT_EXPIRES_IN  = { value = "7d" }
    GROQ_API_KEY    = { value = var.groq_api_key }
    BRAVE_API_KEY   = { value = var.brave_api_key }
    ENT_DATABASE_URL = { value = var.ent_database_url }
    ADMIN_KEY       = { value = var.admin_key }
    FRONTEND_URL    = { value = "https://${render_web_service.frontend.url}" }
  }

  health_check_path = "/health"
}

# ── Frontend service ─────────────────────────────────────────
resource "render_web_service" "frontend" {
  name   = "gemini-clone-ui"
  plan   = "starter"
  region = "oregon"

  runtime_source = {
    docker = {
      repo_url    = local.repo
      branch      = local.branch
      dockerfile_path = "./frontend/Dockerfile"
      context     = "./frontend"
      auto_deploy = true
    }
  }

  env_vars = {
    VITE_API_URL = { value = "https://${render_web_service.backend.url}/api" }
  }
}

# ── Outputs ──────────────────────────────────────────────────
output "frontend_url" { value = "https://${render_web_service.frontend.url}" }
output "backend_url"  { value = "https://${render_web_service.backend.url}" }
output "backend_service_id" { value = render_web_service.backend.id }
output "frontend_service_id" { value = render_web_service.frontend.id }
