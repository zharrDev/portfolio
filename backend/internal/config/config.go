// Package config loads and validates environment configuration.
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config is the fully-resolved runtime configuration.
type Config struct {
	Env            string
	Port           string
	BaseURL        string
	FrontendOrigin string

	DatabaseURL string

	GitHubUsername string
	GitHubToken    string
	GitHubCacheTTL time.Duration
	GitHubTimeout  time.Duration

	UploadDir   string
	MaxUploadMB int64

	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	SMTPFrom     string
	ContactTo    string

	ContactRateLimitPerMin int
}

// Load reads configuration from the environment, applying sane defaults and
// falling back to discrete POSTGRES_* fields when DATABASE_URL is not set.
func Load() (*Config, error) {
	cfg := &Config{
		Env:            env("APP_ENV", "development"),
		Port:           env("APP_PORT", "8080"),
		BaseURL:        env("APP_BASE_URL", "http://localhost:8080"),
		FrontendOrigin: env("FRONTEND_ORIGIN", "http://localhost:5173"),

		DatabaseURL: databaseURL(),

		GitHubUsername: env("GITHUB_USERNAME", "zharrDev"),
		GitHubToken:    env("GITHUB_TOKEN", ""),
		GitHubCacheTTL: time.Duration(envInt("GITHUB_CACHE_TTL_MINUTES", 30)) * time.Minute,
		GitHubTimeout:  time.Duration(envInt("GITHUB_REQUEST_TIMEOUT_SECONDS", 10)) * time.Second,

		UploadDir:   env("UPLOAD_DIR", "./uploads"),
		MaxUploadMB: int64(envInt("MAX_UPLOAD_MB", 5)),

		SMTPHost:     env("SMTP_HOST", ""),
		SMTPPort:     envInt("SMTP_PORT", 587),
		SMTPUsername: env("SMTP_USERNAME", ""),
		SMTPPassword: env("SMTP_PASSWORD", ""),
		SMTPFrom:     env("SMTP_FROM", "no-reply@dzhar.dev"),
		ContactTo:    env("CONTACT_NOTIFY_TO", ""),

		ContactRateLimitPerMin: envInt("CONTACT_RATE_LIMIT_PER_MIN", 5),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("database configuration missing: set DATABASE_URL or POSTGRES_* variables")
	}
	return cfg, nil
}

func databaseURL() string {
	if value := os.Getenv("DATABASE_URL"); value != "" {
		return value
	}
	user := env("POSTGRES_USER", "dzhar")
	password := env("POSTGRES_PASSWORD", "dzhar")
	host := env("POSTGRES_HOST", "localhost")
	port := env("POSTGRES_PORT", "5432")
	name := env("POSTGRES_DB", "dzhar_dev")
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, password, host, port, name)
}

// IsProduction reports whether the app runs in production mode.
func (c *Config) IsProduction() bool {
	return strings.EqualFold(c.Env, "production")
}

// EmailEnabled reports whether SMTP is configured for contact notifications.
func (c *Config) EmailEnabled() bool {
	return c.SMTPHost != ""
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func envInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil {
			return parsed
		}
	}
	return fallback
}
