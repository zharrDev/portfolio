package handler

import (
	"net/http"

	"github.com/zharrDev/portfolio/backend/internal/model"
	"github.com/zharrDev/portfolio/backend/internal/service"
)

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

// Dashboard returns aggregate statistics for the admin overview.
func (h *Handler) Dashboard(w http.ResponseWriter, r *http.Request) {
	stats, err := h.repo.DashboardStats(r.Context())
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

// AdminGetProfile returns the profile for editing.
func (h *Handler) AdminGetProfile(w http.ResponseWriter, r *http.Request) {
	h.GetProfile(w, r)
}

// UpdateProfile writes the mutable profile fields.
func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	var payload model.Profile
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}

	current, err := h.repo.GetProfile(r.Context())
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	payload.ID = current.ID
	if payload.FullName == "" {
		payload.FullName = current.FullName
	}

	updated, err := h.repo.UpdateProfile(r.Context(), payload)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

type projectPayload struct {
	Slug             string   `json:"slug"`
	Title            string   `json:"title"`
	ShortDescription string   `json:"short_description"`
	Description      *string  `json:"description"`
	Category         *string  `json:"category"`
	RepositoryURL    *string  `json:"repository_url"`
	LiveDemoURL      *string  `json:"live_demo_url"`
	ReadmeURL        *string  `json:"readme_url"`
	CoverImage       *string  `json:"cover_image"`
	Status           string   `json:"status"`
	IsFeatured       bool     `json:"is_featured"`
	Published        bool     `json:"published"`
	Problem          *string  `json:"problem"`
	Goals            *string  `json:"goals"`
	MainFeatures     *string  `json:"main_features"`
	Challenges       *string  `json:"challenges"`
	Learnings        *string  `json:"learnings"`
	Architecture     *string  `json:"architecture"`
	Year             *int     `json:"year"`
	Language         *string  `json:"language"`
	SortOrder        int      `json:"sort_order"`
	Technologies     []string `json:"technologies"`
	Images           []struct {
		ImageURL string  `json:"image_url"`
		Caption  *string `json:"caption"`
	} `json:"images"`
}

func toProjectInput(payload projectPayload, id int64) service.ProjectInput {
	project := model.Project{
		ID:               id,
		Slug:             payload.Slug,
		Title:            payload.Title,
		ShortDescription: payload.ShortDescription,
		Description:      payload.Description,
		Category:         payload.Category,
		RepositoryURL:    payload.RepositoryURL,
		LiveDemoURL:      payload.LiveDemoURL,
		ReadmeURL:        payload.ReadmeURL,
		CoverImage:       payload.CoverImage,
		Status:           payload.Status,
		IsFeatured:       payload.IsFeatured,
		Published:        payload.Published,
		Problem:          payload.Problem,
		Goals:            payload.Goals,
		MainFeatures:     payload.MainFeatures,
		Challenges:       payload.Challenges,
		Learnings:        payload.Learnings,
		Architecture:     payload.Architecture,
		Year:             payload.Year,
		Language:         payload.Language,
		SortOrder:        payload.SortOrder,
		Source:           "manual",
	}

	images := make([]model.ProjectImage, 0, len(payload.Images))
	for _, img := range payload.Images {
		images = append(images, model.ProjectImage{ImageURL: img.ImageURL, Caption: img.Caption})
	}

	return service.ProjectInput{Project: project, Technologies: payload.Technologies, Images: images}
}

// AdminListProjects lists every project, including drafts.
func (h *Handler) AdminListProjects(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.AdminProjects(r.Context(), filterFromQuery(r))
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

// AdminCreateProject creates a project.
func (h *Handler) AdminCreateProject(w http.ResponseWriter, r *http.Request) {
	var payload projectPayload
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	created, err := h.svc.CreateProject(r.Context(), toProjectInput(payload, 0))
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// AdminUpdateProject updates a project.
func (h *Handler) AdminUpdateProject(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	var payload projectPayload
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	updated, err := h.svc.UpdateProject(r.Context(), toProjectInput(payload, id))
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

// AdminDeleteProject removes a project.
func (h *Handler) AdminDeleteProject(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	if err := h.repo.DeleteProject(r.Context(), id); err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

/* ------------------------------------------------------------------ */
/* Skills                                                              */
/* ------------------------------------------------------------------ */

func (h *Handler) AdminListSkills(w http.ResponseWriter, r *http.Request) { h.ListSkills(w, r) }

// AdminCreateSkill creates a skill.
func (h *Handler) AdminCreateSkill(w http.ResponseWriter, r *http.Request) {
	var payload model.Skill
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	clean, err := service.ValidateSkill(payload)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	created, err := h.repo.CreateSkill(r.Context(), clean)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// AdminUpdateSkill updates a skill.
func (h *Handler) AdminUpdateSkill(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	var payload model.Skill
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	payload.ID = id
	clean, err := service.ValidateSkill(payload)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	updated, err := h.repo.UpdateSkill(r.Context(), clean)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

// AdminDeleteSkill removes a skill.
func (h *Handler) AdminDeleteSkill(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	if err := h.repo.DeleteSkill(r.Context(), id); err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

/* ------------------------------------------------------------------ */
/* Education                                                           */
/* ------------------------------------------------------------------ */

func (h *Handler) AdminListEducation(w http.ResponseWriter, r *http.Request) { h.ListEducation(w, r) }

// AdminCreateEducation creates an education entry.
func (h *Handler) AdminCreateEducation(w http.ResponseWriter, r *http.Request) {
	var payload model.Education
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	clean, err := service.ValidateEducation(payload)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	created, err := h.repo.CreateEducation(r.Context(), clean)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// AdminUpdateEducation updates an education entry.
func (h *Handler) AdminUpdateEducation(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	var payload model.Education
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	payload.ID = id
	clean, err := service.ValidateEducation(payload)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	updated, err := h.repo.UpdateEducation(r.Context(), clean)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

// AdminDeleteEducation removes an education entry.
func (h *Handler) AdminDeleteEducation(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	if err := h.repo.DeleteEducation(r.Context(), id); err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

/* ------------------------------------------------------------------ */
/* Experience                                                          */
/* ------------------------------------------------------------------ */

func (h *Handler) AdminListExperience(w http.ResponseWriter, r *http.Request) { h.ListExperience(w, r) }

// AdminCreateExperience creates an experience entry.
func (h *Handler) AdminCreateExperience(w http.ResponseWriter, r *http.Request) {
	var payload model.Experience
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	clean, err := service.ValidateExperience(payload)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	created, err := h.repo.CreateExperience(r.Context(), clean)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// AdminUpdateExperience updates an experience entry.
func (h *Handler) AdminUpdateExperience(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	var payload model.Experience
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	payload.ID = id
	clean, err := service.ValidateExperience(payload)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	updated, err := h.repo.UpdateExperience(r.Context(), clean)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

// AdminDeleteExperience removes an experience entry.
func (h *Handler) AdminDeleteExperience(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	if err := h.repo.DeleteExperience(r.Context(), id); err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

/* ------------------------------------------------------------------ */
/* Certificates                                                        */
/* ------------------------------------------------------------------ */

func (h *Handler) AdminListCertificates(w http.ResponseWriter, r *http.Request) {
	h.ListCertificates(w, r)
}

// AdminCreateCertificate creates a certificate entry.
func (h *Handler) AdminCreateCertificate(w http.ResponseWriter, r *http.Request) {
	var payload model.Certificate
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	clean, err := service.ValidateCertificate(payload)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	created, err := h.repo.CreateCertificate(r.Context(), clean)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// AdminUpdateCertificate updates a certificate entry.
func (h *Handler) AdminUpdateCertificate(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	var payload model.Certificate
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	payload.ID = id
	clean, err := service.ValidateCertificate(payload)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	updated, err := h.repo.UpdateCertificate(r.Context(), clean)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

// AdminDeleteCertificate removes a certificate entry.
func (h *Handler) AdminDeleteCertificate(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	if err := h.repo.DeleteCertificate(r.Context(), id); err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

/* ------------------------------------------------------------------ */
/* Social links                                                        */
/* ------------------------------------------------------------------ */

func (h *Handler) AdminListSocialLinks(w http.ResponseWriter, r *http.Request) {
	h.ListSocialLinks(w, r)
}

// AdminCreateSocialLink creates a social link.
func (h *Handler) AdminCreateSocialLink(w http.ResponseWriter, r *http.Request) {
	var payload model.SocialLink
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	clean, err := service.ValidateSocialLink(payload)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	created, err := h.repo.CreateSocialLink(r.Context(), clean)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// AdminUpdateSocialLink updates a social link.
func (h *Handler) AdminUpdateSocialLink(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	var payload model.SocialLink
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	payload.ID = id
	clean, err := service.ValidateSocialLink(payload)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	updated, err := h.repo.UpdateSocialLink(r.Context(), clean)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

// AdminDeleteSocialLink removes a social link.
func (h *Handler) AdminDeleteSocialLink(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	if err := h.repo.DeleteSocialLink(r.Context(), id); err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

func (h *Handler) AdminListSettings(w http.ResponseWriter, r *http.Request) { h.ListSettings(w, r) }

// AdminUpdateSetting updates a single setting value.
func (h *Handler) AdminUpdateSetting(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	var payload struct {
		Value string `json:"value"`
	}
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	updated, err := h.repo.UpdateSetting(r.Context(), id, payload.Value)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

// AdminListMessages lists contact messages.
func (h *Handler) AdminListMessages(w http.ResponseWriter, r *http.Request) {
	limit := intQuery(r, "per_page", 100)
	offset := (intQuery(r, "page", 1) - 1) * limit
	items, err := h.repo.ListMessages(r.Context(), limit, offset)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

// AdminUpdateMessage marks a message as read/unread.
func (h *Handler) AdminUpdateMessage(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	var payload struct {
		IsRead bool `json:"is_read"`
	}
	if err := decodeJSON(w, r, &payload); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_body", "Body permintaan tidak valid.")
		return
	}
	updated, err := h.repo.SetMessageRead(r.Context(), id, payload.IsRead)
	if err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

// AdminDeleteMessage deletes a message.
func (h *Handler) AdminDeleteMessage(w http.ResponseWriter, r *http.Request) {
	id, ok := idParam(w, r)
	if !ok {
		return
	}
	if err := h.repo.DeleteMessage(r.Context(), id); err != nil {
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}

/* ------------------------------------------------------------------ */
/* GitHub sync                                                         */
/* ------------------------------------------------------------------ */

// SyncGitHub forces a refresh of cached GitHub repository metadata.
func (h *Handler) SyncGitHub(w http.ResponseWriter, r *http.Request) {
	imported, updated, total, err := h.svc.SyncGitHub(r.Context())
	if err != nil {
		if _, unavailable := err.(*service.ErrGitHubUnavailable); unavailable {
			writeError(w, http.StatusServiceUnavailable, "github_unavailable",
				"GitHub API sedang tidak tersedia atau rate limit tercapai. Data cache tetap dipakai.")
			return
		}
		handleError(w, h.logger, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]int{
		"imported": imported,
		"updated":  updated,
		"total":    total,
	})
}
