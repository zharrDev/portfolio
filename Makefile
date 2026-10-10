# ============================================================================
# Dzhar.dev — developer tasks
# ============================================================================

SHELL := /bin/bash
BACKEND  := backend
FRONTEND := frontend

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

# --- Environment ------------------------------------------------------------
.PHONY: env
env: ## Create .env from .env.example when missing
	@test -f .env || (cp .env.example .env && echo "created .env (edit it before running)")

# --- Frontend ---------------------------------------------------------------
.PHONY: install
install: ## Install frontend dependencies
	cd $(FRONTEND) && npm install

.PHONY: dev-frontend
dev-frontend: ## Run the Vite dev server
	cd $(FRONTEND) && npm run dev

.PHONY: typecheck
typecheck: ## Type-check the frontend
	cd $(FRONTEND) && npm run typecheck

.PHONY: build-frontend
build-frontend: ## Build the frontend to frontend/dist
	cd $(FRONTEND) && npm run build

# --- Backend ----------------------------------------------------------------
.PHONY: tidy
tidy: ## Tidy Go modules
	cd $(BACKEND) && go mod tidy

.PHONY: build-backend
build-backend: ## Build the Go API and migrate binaries
	cd $(BACKEND) && go build -o bin/api ./cmd/api && go build -o bin/migrate ./cmd/migrate

.PHONY: run-backend
run-backend: ## Run the Go API locally
	cd $(BACKEND) && go run ./cmd/api

.PHONY: test
test: ## Run Go unit tests
	cd $(BACKEND) && go test ./...

.PHONY: vet
vet: ## Run go vet
	cd $(BACKEND) && go vet ./...

.PHONY: fmt
fmt: ## Format Go sources
	cd $(BACKEND) && gofmt -w ./cmd ./internal ./migrations

.PHONY: migrate
migrate: ## Apply database migrations
	cd $(BACKEND) && go run ./cmd/migrate

# --- Docker -----------------------------------------------------------------
.PHONY: up
up: ## Start PostgreSQL + API with Docker Compose
	docker compose up --build -d

.PHONY: down
down: ## Stop the Docker Compose stack
	docker compose down

.PHONY: logs
logs: ## Follow the API logs
	docker compose logs -f api

.PHONY: reset-db
reset-db: ## Destroy database and uploads volumes (destructive)
	docker compose down -v

# --- Verification -----------------------------------------------------------
.PHONY: check
check: typecheck test vet ## Run all checks
	@echo "checks complete"
