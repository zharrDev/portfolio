package handler

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/zharrDev/portfolio/backend/internal/config"
)

func newTestRouter() http.Handler {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	cfg := &config.Config{Env: "test", FrontendOrigin: "http://localhost:5173", ContactRateLimitPerMin: 5}
	// The repository is only touched by entity handlers, so a nil service is
	// safe for routing/response-shape assertions.
	h := &Handler{svc: nil, repo: nil, cfg: cfg, logger: logger}
	return NewRouter(h, cfg)
}

func TestUnknownRouteReturnsJSON404(t *testing.T) {
	router := newTestRouter()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/does-not-exist", nil)

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json; charset=utf-8" {
		t.Fatalf("expected JSON content type, got %q", ct)
	}
	var body errorEnvelope
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("response was not valid JSON: %v", err)
	}
	if body.Error.Code != "not_found" {
		t.Fatalf("expected not_found code, got %q", body.Error.Code)
	}
}

func TestMethodNotAllowedReturnsJSON405(t *testing.T) {
	router := newTestRouter()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/profile", nil)

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rec.Code)
	}
	var body errorEnvelope
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("response was not valid JSON: %v", err)
	}
	if body.Error.Code != "method_not_allowed" {
		t.Fatalf("expected method_not_allowed code, got %q", body.Error.Code)
	}
}

func TestSecurityHeadersAreSet(t *testing.T) {
	router := newTestRouter()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)

	router.ServeHTTP(rec, req)

	for _, header := range []string{"X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy"} {
		if rec.Header().Get(header) == "" {
			t.Errorf("expected header %s to be set", header)
		}
	}
}

func TestCORSPreflight(t *testing.T) {
	router := newTestRouter()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodOptions, "/api/v1/contact", nil)
	req.Header.Set("Origin", "http://localhost:5173")

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204 for preflight, got %d", rec.Code)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Fatalf("expected allowed origin header, got %q", got)
	}
}
