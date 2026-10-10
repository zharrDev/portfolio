package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/zharrDev/portfolio/backend/internal/config"
	"github.com/zharrDev/portfolio/backend/internal/middleware"
)

// NewRouter builds the full HTTP route tree.
//
// Routes are grouped under /api/v1 into a public tree and an admin tree. The
// admin tree is intentionally not behind authentication: this is a personal
// portfolio project and, per the project brief, no login page is provided.
// See docs/api.md for the note on enabling auth before public deployment.
func NewRouter(h *Handler, cfg *config.Config) http.Handler {
	router := chi.NewRouter()

	contactLimiter := middleware.NewRateLimiter(cfg.ContactRateLimitPerMin)

	router.Use(middleware.RequestIDMiddleware)
	router.Use(middleware.Recoverer(h.logger))
	router.Use(middleware.Logger(h.logger))
	router.Use(middleware.SecurityHeaders)
	router.Use(middleware.CORS(cfg.FrontendOrigin))

	router.Get("/healthz", h.Health)

	router.Route("/api/v1", func(api chi.Router) {
		api.Get("/profile", h.GetProfile)
		api.Get("/education", h.ListEducation)
		api.Get("/skills", h.ListSkills)
		api.Get("/experience", h.ListExperience)
		api.Get("/certificates", h.ListCertificates)
		api.Get("/social-links", h.ListSocialLinks)
		api.Get("/settings", h.ListSettings)
		api.Get("/projects", h.ListProjects)
		api.Get("/projects/{slug}", h.GetProject)
		api.Get("/github/repositories", h.ListGitHubRepositories)

		api.With(contactLimiter.Middleware).Post("/contact", h.CreateContact)

		api.Route("/admin", func(admin chi.Router) {
			admin.Get("/dashboard", h.Dashboard)

			admin.Get("/profile", h.AdminGetProfile)
			admin.Put("/profile", h.UpdateProfile)

			admin.Route("/projects", func(r chi.Router) {
				r.Get("/", h.AdminListProjects)
				r.Post("/", h.AdminCreateProject)
				r.Put("/{id}", h.AdminUpdateProject)
				r.Delete("/{id}", h.AdminDeleteProject)
			})

			admin.Route("/skills", func(r chi.Router) {
				r.Get("/", h.AdminListSkills)
				r.Post("/", h.AdminCreateSkill)
				r.Put("/{id}", h.AdminUpdateSkill)
				r.Delete("/{id}", h.AdminDeleteSkill)
			})

			admin.Route("/education", func(r chi.Router) {
				r.Get("/", h.AdminListEducation)
				r.Post("/", h.AdminCreateEducation)
				r.Put("/{id}", h.AdminUpdateEducation)
				r.Delete("/{id}", h.AdminDeleteEducation)
			})

			admin.Route("/experience", func(r chi.Router) {
				r.Get("/", h.AdminListExperience)
				r.Post("/", h.AdminCreateExperience)
				r.Put("/{id}", h.AdminUpdateExperience)
				r.Delete("/{id}", h.AdminDeleteExperience)
			})

			admin.Route("/certificates", func(r chi.Router) {
				r.Get("/", h.AdminListCertificates)
				r.Post("/", h.AdminCreateCertificate)
				r.Put("/{id}", h.AdminUpdateCertificate)
				r.Delete("/{id}", h.AdminDeleteCertificate)
			})

			admin.Route("/social-links", func(r chi.Router) {
				r.Get("/", h.AdminListSocialLinks)
				r.Post("/", h.AdminCreateSocialLink)
				r.Put("/{id}", h.AdminUpdateSocialLink)
				r.Delete("/{id}", h.AdminDeleteSocialLink)
			})

			admin.Route("/settings", func(r chi.Router) {
				r.Get("/", h.AdminListSettings)
				r.Put("/{id}", h.AdminUpdateSetting)
			})

			admin.Get("/messages", h.AdminListMessages)
			admin.Patch("/messages/{id}", h.AdminUpdateMessage)
			admin.Delete("/messages/{id}", h.AdminDeleteMessage)

			admin.Post("/github/sync", h.SyncGitHub)
		})
	})

	router.NotFound(func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotFound, "not_found", "Endpoint tidak ditemukan.")
	})
	router.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Metode HTTP tidak diizinkan.")
	})

	return router
}
