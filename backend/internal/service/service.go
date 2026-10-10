package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/zharrDev/portfolio/backend/internal/config"
	"github.com/zharrDev/portfolio/backend/internal/model"
	"github.com/zharrDev/portfolio/backend/internal/repository"
)

// Service implements business rules on top of the repository layer.
type Service struct {
	repo   *repository.Repository
	github *GitHubClient
	mailer *Mailer
	cfg    *config.Config
	logger *slog.Logger

	cacheMu    sync.RWMutex
	cacheUntil time.Time
}

// New wires the service dependencies.
func New(repo *repository.Repository, cfg *config.Config, logger *slog.Logger) *Service {
	return &Service{
		repo:   repo,
		github: NewGitHubClient(cfg.GitHubUsername, cfg.GitHubToken, cfg.GitHubTimeout),
		mailer: NewMailer(cfg),
		cfg:    cfg,
		logger: logger,
	}
}

// Repository exposes the underlying repository for read-only handlers.
func (s *Service) Repository() *repository.Repository { return s.repo }

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

// ContactInput is the validated contact form payload.
type ContactInput struct {
	Name    string
	Email   string
	Subject string
	Message string
	Website string // honeypot — must be empty
	IPHash  string
}

// ValidateContact validates and normalises a contact submission.
func ValidateContact(in ContactInput) (ContactInput, error) {
	v := newValidator()
	if strings.TrimSpace(in.Website) != "" {
		// Honeypot tripped: report as invalid without telling the bot why.
		v.add("form", "Pengiriman ditolak.")
	}
	v.required("name", in.Name)
	v.maxLen("name", in.Name, 100)
	if utf8Len(in.Name) < 2 {
		v.add("name", "Nama minimal 2 karakter.")
	}
	v.required("email", in.Email)
	v.email("email", in.Email)
	v.maxLen("email", in.Email, 200)
	v.required("subject", in.Subject)
	v.maxLen("subject", in.Subject, 150)
	v.required("message", in.Message)
	if utf8Len(in.Message) < 10 {
		v.add("message", "Pesan minimal 10 karakter.")
	}
	v.maxLen("message", in.Message, 5000)

	if err := v.done(); err != nil {
		return in, err
	}

	in.Name = strings.TrimSpace(in.Name)
	in.Email = strings.TrimSpace(in.Email)
	in.Subject = strings.TrimSpace(in.Subject)
	in.Message = strings.TrimSpace(in.Message)
	return in, nil
}

// CreateContact stores a validated contact message. When SMTP is configured a
// notification email is sent asynchronously; a mail failure never fails the
// request, because the message is already persisted.
func (s *Service) CreateContact(ctx context.Context, in ContactInput) (int64, error) {
	message := model.ContactMessage{
		Name:    in.Name,
		Email:   in.Email,
		Subject: in.Subject,
		Message: in.Message,
	}
	id, err := s.repo.CreateMessage(ctx, message, in.IPHash)
	if err != nil {
		return 0, err
	}

	s.notifyByEmail(in)
	return id, nil
}

// notifyByEmail sends the optional contact notification in the background.
func (s *Service) notifyByEmail(in ContactInput) {
	if !s.mailer.Enabled() || s.cfg.ContactTo == "" {
		return
	}
	body := fmt.Sprintf(
		"Pesan baru dari formulir kontak Dzhar.dev\n\nNama    : %s\nEmail   : %s\nSubjek  : %s\n\n%s\n",
		in.Name, in.Email, in.Subject, in.Message,
	)
	go func() {
		if err := s.mailer.Send(s.cfg.ContactTo, "[Dzhar.dev] "+in.Subject, body); err != nil {
			s.logger.Warn("contact notification email failed", "error", err.Error())
		}
	}()
}

// HashIP produces a non-reversible identifier used only for abuse tracking.
func HashIP(ip string) string {
	if ip == "" {
		return ""
	}
	sum := sha256.Sum256([]byte(ip + "|dzhar.dev"))
	return hex.EncodeToString(sum[:])[:32]
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

// ProjectInput is the admin payload for creating/updating a project.
type ProjectInput struct {
	Project      model.Project
	Technologies []string
	Images       []model.ProjectImage
}

// ValidateProject checks a project payload and normalises the slug.
func ValidateProject(in ProjectInput) (ProjectInput, error) {
	v := newValidator()
	p := in.Project

	v.required("title", p.Title)
	v.maxLen("title", p.Title, 200)
	v.required("short_description", p.ShortDescription)
	v.maxLen("short_description", p.ShortDescription, 400)

	if strings.TrimSpace(p.Slug) == "" {
		p.Slug = Slugify(p.Title)
	}
	if !IsValidSlug(p.Slug) {
		v.add("slug", "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.")
	}

	v.oneOf("status", p.Status, []string{"completed", "in_progress", "prototype", "archived", "planned"})
	if p.Status == "" {
		p.Status = "in_progress"
	}

	v.optionalURL("repository_url", deref(p.RepositoryURL))
	v.optionalURL("live_demo_url", deref(p.LiveDemoURL))
	v.optionalURL("readme_url", deref(p.ReadmeURL))
	v.optionalURL("cover_image", deref(p.CoverImage))

	if p.Year != nil && (*p.Year < 1990 || *p.Year > 2100) {
		v.add("year", "Tahun tidak masuk akal.")
	}
	if p.Stars != nil && *p.Stars < 0 {
		v.add("stars", "Jumlah bintang tidak boleh negatif.")
	}
	if p.Forks != nil && *p.Forks < 0 {
		v.add("forks", "Jumlah fork tidak boleh negatif.")
	}

	for i, img := range in.Images {
		v.optionalURL("images", img.ImageURL)
		if i > 30 {
			v.add("images", "Maksimal 30 gambar per proyek.")
			break
		}
	}

	if err := v.done(); err != nil {
		return in, err
	}

	p.Title = strings.TrimSpace(p.Title)
	p.ShortDescription = strings.TrimSpace(p.ShortDescription)
	in.Project = p
	return in, nil
}

// PublicProjects lists published projects for the public site.
func (s *Service) PublicProjects(ctx context.Context, filter repository.ProjectFilter) ([]model.Project, error) {
	filter.PublishedOnly = true
	return s.repo.ListProjects(ctx, filter)
}

// AdminProjects lists every project regardless of publication state.
func (s *Service) AdminProjects(ctx context.Context, filter repository.ProjectFilter) ([]model.Project, error) {
	return s.repo.ListProjects(ctx, filter)
}

// CreateProject validates and persists a project.
func (s *Service) CreateProject(ctx context.Context, in ProjectInput) (model.Project, error) {
	clean, err := ValidateProject(in)
	if err != nil {
		return model.Project{}, err
	}
	return s.repo.CreateProject(ctx, repository.ProjectInput{
		Project:      clean.Project,
		Technologies: clean.Technologies,
		Images:       clean.Images,
	})
}

// UpdateProject validates and updates a project.
func (s *Service) UpdateProject(ctx context.Context, in ProjectInput) (model.Project, error) {
	clean, err := ValidateProject(in)
	if err != nil {
		return model.Project{}, err
	}
	return s.repo.UpdateProject(ctx, repository.ProjectInput{
		Project:      clean.Project,
		Technologies: clean.Technologies,
		Images:       clean.Images,
	})
}

/* ------------------------------------------------------------------ */
/* Skills                                                             */
/* ------------------------------------------------------------------ */

// ValidateSkill checks a skill payload.
func ValidateSkill(sk model.Skill) (model.Skill, error) {
	v := newValidator()
	v.required("name", sk.Name)
	v.maxLen("name", sk.Name, 80)
	v.required("category", sk.Category)
	v.oneOf("category", sk.Category, []string{
		"programming_languages", "frontend", "backend", "database", "tools", "operating_systems", "other",
	})
	if err := v.done(); err != nil {
		return sk, err
	}
	sk.Name = strings.TrimSpace(sk.Name)
	return sk, nil
}

/* ------------------------------------------------------------------ */
/* Education                                                           */
/* ------------------------------------------------------------------ */

// ValidateEducation checks an education payload.
func ValidateEducation(e model.Education) (model.Education, error) {
	v := newValidator()
	v.required("institution", e.Institution)
	v.maxLen("institution", e.Institution, 200)
	if e.StartYear != nil && (*e.StartYear < 1950 || *e.StartYear > 2100) {
		v.add("start_year", "Tahun mulai tidak masuk akal.")
	}
	if e.EndYear != nil && (*e.EndYear < 1950 || *e.EndYear > 2100) {
		v.add("end_year", "Tahun selesai tidak masuk akal.")
	}
	if e.StartYear != nil && e.EndYear != nil && *e.EndYear < *e.StartYear {
		v.add("end_year", "Tahun selesai tidak boleh sebelum tahun mulai.")
	}
	if err := v.done(); err != nil {
		return e, err
	}
	e.Institution = strings.TrimSpace(e.Institution)
	return e, nil
}

/* ------------------------------------------------------------------ */
/* Experience & certificates                                           */
/* ------------------------------------------------------------------ */

// ValidateExperience checks an experience payload.
func ValidateExperience(e model.Experience) (model.Experience, error) {
	v := newValidator()
	v.required("organization", e.Organization)
	v.required("role", e.Role)
	v.maxLen("organization", e.Organization, 200)
	v.maxLen("role", e.Role, 200)
	if err := v.done(); err != nil {
		return e, err
	}
	return e, nil
}

// ValidateCertificate checks a certificate payload.
func ValidateCertificate(c model.Certificate) (model.Certificate, error) {
	v := newValidator()
	v.required("name", c.Name)
	v.maxLen("name", c.Name, 250)
	v.optionalURL("credential_url", deref(c.CredentialURL))
	if err := v.done(); err != nil {
		return c, err
	}
	return c, nil
}

// ValidateSocialLink checks a social link payload.
func ValidateSocialLink(l model.SocialLink) (model.SocialLink, error) {
	v := newValidator()
	v.required("label", l.Label)
	v.required("url", l.URL)
	v.optionalURL("url", l.URL)
	if err := v.done(); err != nil {
		return l, err
	}
	return l, nil
}

/* ------------------------------------------------------------------ */
/* GitHub                                                              */
/* ------------------------------------------------------------------ */

// Repositories returns the cached GitHub snapshot, refreshing it when the TTL
// has elapsed. If the GitHub API fails, the cached database rows are returned
// as a fallback so the project showcase keeps working.
func (s *Service) Repositories(ctx context.Context) ([]model.GithubRepository, bool, error) {
	s.cacheMu.RLock()
	fresh := time.Now().Before(s.cacheUntil)
	s.cacheMu.RUnlock()

	if !fresh {
		if err := s.refreshGitHub(ctx, false); err != nil {
			// Fall back to whatever is cached in PostgreSQL.
			cached, listErr := s.repo.ListGitHubRepos(ctx, s.cfg.GitHubUsername)
			if listErr != nil {
				return nil, false, listErr
			}
			if len(cached) > 0 {
				return cached, true, nil
			}
			return nil, false, err
		}
	}

	repos, err := s.repo.ListGitHubRepos(ctx, s.cfg.GitHubUsername)
	return repos, false, err
}

// SyncGitHub forces a refresh of the cached repository snapshot.
func (s *Service) SyncGitHub(ctx context.Context) (imported int, updated int, total int, err error) {
	if err := s.refreshGitHub(ctx, true); err != nil {
		return 0, 0, 0, err
	}

	repos, listErr := s.repo.ListGitHubRepos(ctx, s.cfg.GitHubUsername)
	if listErr != nil {
		return 0, 0, 0, listErr
	}

	for _, repo := range repos {
		if repo.Fork || repo.Archived {
			continue
		}
		var year *int
		if repo.PushedAt != nil {
			y := repo.PushedAt.Year()
			year = &y
		}
		project := model.Project{
			Slug:             Slugify(repo.Name),
			Title:            repo.Name,
			ShortDescription: deref(repo.Description),
			RepositoryURL:    ptr(repo.HTMLURL),
			LiveDemoURL:      repo.Homepage,
			Year:             year,
			Language:         repo.Language,
			Stars:            intPtr(repo.StargazersCount),
			Forks:            intPtr(repo.ForksCount),
			GitHubUpdatedAt:  repo.UpdatedAt,
			Source:           "github",
		}
		if project.ShortDescription == "" {
			project.ShortDescription = "Repository publik tanpa deskripsi."
		}
		if err := s.repo.UpsertGitHubProject(ctx, project); err != nil {
			return imported, updated, len(repos), err
		}
	}

	imported, err = s.repo.CountGitHubProjects(ctx)
	if err != nil {
		return 0, 0, len(repos), err
	}
	return imported, 0, len(repos), nil
}

func (s *Service) refreshGitHub(ctx context.Context, force bool) error {
	s.cacheMu.RLock()
	fresh := time.Now().Before(s.cacheUntil)
	s.cacheMu.RUnlock()
	if !force && fresh {
		return nil
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, s.cfg.GitHubTimeout+2*time.Second)
	defer cancel()

	repos, err := s.github.FetchRepositories(timeoutCtx)
	if err != nil {
		_ = s.repo.LogGitHubSync(context.Background(), "error", err.Error(), 0)
		return err
	}

	if err := s.repo.ReplaceGitHubRepos(timeoutCtx, repos, s.cfg.GitHubUsername); err != nil {
		_ = s.repo.LogGitHubSync(context.Background(), "error", err.Error(), len(repos))
		return err
	}
	_ = s.repo.LogGitHubSync(context.Background(), "success",
		"sinkronisasi berhasil", len(repos))

	s.cacheMu.Lock()
	s.cacheUntil = time.Now().Add(s.cfg.GitHubCacheTTL)
	s.cacheMu.Unlock()
	return nil
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// ErrNotFound re-exported so handlers can map it without importing repository.
var ErrNotFound = repository.ErrNotFound

// IsValidationError reports whether an error is a validation failure.
func IsValidationError(err error) (*ValidationError, bool) {
	var v *ValidationError
	if errors.As(err, &v) {
		return v, true
	}
	return nil, false
}

func utf8Len(value string) int {
	return len([]rune(strings.TrimSpace(value)))
}

func intPtr(value int) *int {
	if value == 0 {
		return nil
	}
	return &value
}
