// Command migrate applies the embedded SQL migrations and exits.
//
// It is handy for CI or a one-off deployment step:
//
//	go run ./cmd/migrate
package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/zharrDev/portfolio/backend/internal/config"
	"github.com/zharrDev/portfolio/backend/internal/database"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	cfg, err := config.Load()
	if err != nil {
		logger.Error("config", "error", err.Error())
		os.Exit(1)
	}

	ctx := context.Background()
	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("connect", "error", err.Error())
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Migrate(ctx); err != nil {
		logger.Error("migrate", "error", err.Error())
		os.Exit(1)
	}
	logger.Info("migrations applied successfully")
}
