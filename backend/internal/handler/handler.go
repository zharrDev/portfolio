package handler

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/zharrDev/portfolio/backend/internal/config"
	"github.com/zharrDev/portfolio/backend/internal/repository"
	"github.com/zharrDev/portfolio/backend/internal/service"
)

// Handler holds the dependencies shared by all HTTP handlers.
type Handler struct {
	svc    *service.Service
	repo   *repository.Repository
	cfg    *config.Config
	logger *slog.Logger
}

// New creates a Handler.
func New(svc *service.Service, cfg *config.Config, logger *slog.Logger) *Handler {
	return &Handler{
		svc:    svc,
		repo:   svc.Repository(),
		cfg:    cfg,
		logger: logger,
	}
}

// intQuery reads an integer query parameter with a default.
func intQuery(r *http.Request, key string, fallback int) int {
	raw := r.URL.Query().Get(key)
	if raw == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return parsed
}

// urlParam reads a chi URL parameter.
func urlParam(r *http.Request, key string) string {
	return chi.URLParam(r, key)
}

// idParam parses the {id} path parameter.
func idParam(w http.ResponseWriter, r *http.Request) (int64, bool) {
	raw := urlParam(r, "id")
	parsed, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || parsed <= 0 {
		writeError(w, http.StatusBadRequest, "invalid_id", "ID pada URL tidak valid.")
		return 0, false
	}
	return parsed, true
}

// filterFromQuery builds a project filter from query parameters.
func filterFromQuery(r *http.Request) repository.ProjectFilter {
	query := r.URL.Query()
	return repository.ProjectFilter{
		Search:   query.Get("search"),
		Language: query.Get("language"),
		Category: query.Get("category"),
		Status:   query.Get("status"),
		Featured: query.Get("featured") == "true",
		Sort:     query.Get("sort"),
		Limit:    intQuery(r, "per_page", 100),
		Offset:   (intQuery(r, "page", 1) - 1) * intQuery(r, "per_page", 100),
	}
}
