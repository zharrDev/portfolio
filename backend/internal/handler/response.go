// Package handler exposes the REST API over the service layer.
package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/zharrDev/portfolio/backend/internal/repository"
	"github.com/zharrDev/portfolio/backend/internal/service"
)

// Envelope is the consistent success response shape: {"data": ...}.
type Envelope struct {
	Data any `json:"data"`
}

type errorBody struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Details map[string]string `json:"details,omitempty"`
}

type errorEnvelope struct {
	Error errorBody `json:"error"`
}

// writeJSON writes a success envelope with the given status.
func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if data == nil {
		_, _ = w.Write([]byte(`{"data":null}`))
		return
	}
	_ = json.NewEncoder(w).Encode(Envelope{Data: data})
}

// writeError writes a structured error envelope.
func writeError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(errorEnvelope{Error: errorBody{Code: code, Message: message}})
}

// writeValidation writes a 422 with per-field details.
func writeValidation(w http.ResponseWriter, v *service.ValidationError) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusUnprocessableEntity)
	_ = json.NewEncoder(w).Encode(errorEnvelope{Error: errorBody{
		Code:    "validation_error",
		Message: "Data yang dikirim tidak valid.",
		Details: v.Fields,
	}})
}

// handleError maps a service/repository error onto an HTTP response without
// ever leaking internal details.
func handleError(w http.ResponseWriter, logger *slog.Logger, err error) {
	if v, ok := service.IsValidationError(err); ok {
		writeValidation(w, v)
		return
	}
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not_found", "Data yang diminta tidak ditemukan.")
		return
	}

	logger.Error("request failed", "error", err.Error())
	writeError(w, http.StatusInternalServerError, "internal_error", "Terjadi kesalahan pada server.")
}

// decodeJSON decodes a request body with a size cap.
func decodeJSON(w http.ResponseWriter, r *http.Request, target any) error {
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	return decoder.Decode(target)
}
