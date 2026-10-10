package middleware

import (
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func discardLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func TestRateLimiterBlocksAfterLimit(t *testing.T) {
	limiter := NewRateLimiter(3)
	for i := 0; i < 3; i++ {
		if !limiter.Allow("1.2.3.4") {
			t.Fatalf("request %d should be allowed", i+1)
		}
	}
	if limiter.Allow("1.2.3.4") {
		t.Fatal("fourth request should be blocked")
	}
	// A different client is unaffected.
	if !limiter.Allow("5.6.7.8") {
		t.Fatal("a different client should be allowed")
	}
}

func TestRateLimiterMiddlewareReturns429(t *testing.T) {
	limiter := NewRateLimiter(1)
	handler := limiter.Middleware(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	first := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/contact", nil)
	req.RemoteAddr = "10.0.0.1:1234"
	handler.ServeHTTP(first, req)
	if first.Code != http.StatusOK {
		t.Fatalf("first request should pass, got %d", first.Code)
	}

	second := httptest.NewRecorder()
	handler.ServeHTTP(second, req)
	if second.Code != http.StatusTooManyRequests {
		t.Fatalf("second request should be rate limited, got %d", second.Code)
	}
	if second.Header().Get("Retry-After") == "" {
		t.Fatal("expected a Retry-After header")
	}
}

func TestClientIPPrefersForwardedHeader(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "10.0.0.1:5555"
	req.Header.Set("X-Forwarded-For", "203.0.113.9, 10.0.0.1")

	if got := ClientIP(req); got != "203.0.113.9" {
		t.Fatalf("expected forwarded ip, got %q", got)
	}
}

func TestClientIPFallsBackToRemoteAddr(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "192.0.2.7:4433"

	if got := ClientIP(req); got != "192.0.2.7" {
		t.Fatalf("expected remote host, got %q", got)
	}
}

func TestRecovererConvertsPanicTo500(t *testing.T) {
	logger := discardLogger()
	handler := Recoverer(logger)(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		panic("boom")
	}))

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rec.Code)
	}
	if body := rec.Body.String(); body == "" {
		t.Fatal("expected a JSON error body")
	}
}
