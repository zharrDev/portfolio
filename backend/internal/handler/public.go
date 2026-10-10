package handler

import (
	"errors"
	"net/http"

	"github.com/zharrDev/portfolio/backend/internal/middleware"
	"github.com/zharrDev/portfolio/backend/internal/repository"
	"github.com/zharrDev/portfolio/backend/internal/service"
)

// GetProfile returns the owner profile.
func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	profile, err := h.repo.GetProfile(r.Context())
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, profile)
}

// ListEducation returns education entries.
func (h *Handler) ListEducation(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.ListEducations(r.Context())
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

// ListSkills returns skills grouped implicitly by category field.
func (h *Handler) ListSkills(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.ListSkills(r.Context())
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

// ListExperience returns experience entries.
func (h *Handler) ListExperience(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.ListExperiences(r.Context())
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

// ListCertificates returns certificate entries.
func (h *Handler) ListCertificates(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.ListCertificates(r.Context())
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

// ListSocialLinks returns footer social links.
func (h *Handler) ListSocialLinks(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.ListSocialLinks(r.Context())
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

// ListSettings returns public site settings.
func (h *Handler) ListSettings(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.ListSettings(r.Context())
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

// ListProjects returns published projects with search/filter/sort support.
func (h *Handler) ListProjects(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.PublicProjects(r.Context(), filterFromQuery(r))
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

// GetProject returns a single published project by slug.
func (h *Handler) GetProject(w http.ResponseWriter, r *http.Request) {
	slug := urlParam(r, "slug")
	project, err := h.repo.GetProjectBySlug(r.Context(), slug)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "not_found", "Proyek tidak ditemukan.")
			return
		}
		handleError(w, h.logger, err)
		return
	}
	if !project.Published {
		writeError(w, http.StatusNotFound, "not_found", "Proyek tidak ditemukan.")
		return
	}
	writeJSON(w, http.StatusOK, project)
}

// ListGitHubRepositories returns cached repository metadata with fallback.
func (h *Handler) ListGitHubRepositories(w http.ResponseWriter, r *http.Request) {
	repos, _, err := h.svc.Repositories(r.Context())
	if err != nil {
		if _, unavailable := err.(*service.ErrGitHubUnavailable); unavailable {
			writeError(w, http.StatusServiceUnavailable, "github_unavailable",
				"Data GitHub sedang tidak tersedia. Silakan coba beberapa saat lagi.")
			return
		}
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, repos)
}

type contactRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Message string `json:"message"`
	Website string `json:"website"`
}

// CreateContact validates and stores a contact message.
func (h *Handler) CreateContact(w http.ResponseWriter, r *http.Request) {
	var payload contactRequest
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}

	input, err := service.ValidateContact(service.ContactInput{
		Name:    payload.Name,
		Email:   payload.Email,
		Subject: payload.Subject,
		Message: payload.Message,
		Website: payload.Website,
		IPHash:  service.HashIP(middleware.ClientIP(r)),
	})
	if err != nil {
		if v, ok := service.IsValidationError(err); ok {
			writeValidation(w, v)
			return
		}
		handleError(w, h.logger, err)
		return
	}

	id, err := h.svc.CreateContact(r.Context(), input)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]int64{"id": id})
}

// Health reports service liveness.
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	if err := h.repo.Ping(r.Context()); err != nil {
		writeError(w, http.StatusServiceUnavailable, "db_unavailable", "Database tidak dapat dijangkau.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
