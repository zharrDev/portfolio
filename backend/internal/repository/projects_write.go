package repository

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5"

	"github.com/zharrDev/portfolio/backend/internal/model"
)

// ProjectInput carries the writable fields of a project, including its
// technology names and gallery images.
type ProjectInput struct {
	Project      model.Project
	Technologies []string
	Images       []model.ProjectImage
}

// CreateProject inserts a project together with its technologies and images.
func (r *Repository) CreateProject(ctx context.Context, in ProjectInput) (model.Project, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return in.Project, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	p := in.Project
	err = tx.QueryRow(ctx, `
		INSERT INTO projects (
			slug, title, short_description, description, category, repository_url, live_demo_url,
			readme_url, cover_image, status, is_featured, published, problem, goals, main_features,
			challenges, learnings, architecture, year, language, stars, forks, source, sort_order,
			title_en, short_description_en, description_en, problem_en, goals_en,
			main_features_en, challenges_en, learnings_en
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,
			$25,$26,$27,$28,$29,$30,$31,$32,
			CASE WHEN $12 THEN now() ELSE NULL END)
		RETURNING id, created_at, updated_at, published_at`,
		p.Slug, p.Title, p.ShortDescription, p.Description, p.Category, p.RepositoryURL, p.LiveDemoURL,
		p.ReadmeURL, p.CoverImage, p.Status, p.IsFeatured, p.Published, p.Problem, p.Goals, p.MainFeatures,
		p.Challenges, p.Learnings, p.Architecture, p.Year, p.Language, p.Stars, p.Forks, defaultSource(p.Source),
		p.SortOrder,
		p.TitleEN, p.ShortDescriptionEN, p.DescriptionEN, p.ProblemEN, p.GoalsEN,
		p.MainFeaturesEN, p.ChallengesEN, p.LearningsEN,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt, &p.PublishedAt)
	if err != nil {
		return p, err
	}

	if err := syncTechnologies(ctx, tx, p.ID, in.Technologies); err != nil {
		return p, err
	}
	if err := replaceImages(ctx, tx, p.ID, in.Images); err != nil {
		return p, err
	}
	if err := tx.Commit(ctx); err != nil {
		return p, err
	}
	return r.GetProjectBySlug(ctx, p.Slug)
}

// UpdateProject updates a project and replaces its relations.
func (r *Repository) UpdateProject(ctx context.Context, in ProjectInput) (model.Project, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return in.Project, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	p := in.Project
	tag, err := tx.Exec(ctx, `
		UPDATE projects SET
			slug=$2, title=$3, short_description=$4, description=$5, category=$6, repository_url=$7,
			live_demo_url=$8, readme_url=$9, cover_image=$10, status=$11, is_featured=$12, published=$13,
			problem=$14, goals=$15, main_features=$16, challenges=$17, learnings=$18, architecture=$19,
			year=$20, language=$21, stars=$22, forks=$23, sort_order=$24,
			title_en=$25, short_description_en=$26, description_en=$27, problem_en=$28,
			goals_en=$29, main_features_en=$30, challenges_en=$31, learnings_en=$32,
			published_at = CASE WHEN $13 THEN COALESCE(published_at, now()) ELSE NULL END,
			updated_at = now()
		WHERE id=$1`,
		p.ID, p.Slug, p.Title, p.ShortDescription, p.Description, p.Category, p.RepositoryURL,
		p.LiveDemoURL, p.ReadmeURL, p.CoverImage, p.Status, p.IsFeatured, p.Published,
		p.Problem, p.Goals, p.MainFeatures, p.Challenges, p.Learnings, p.Architecture,
		p.Year, p.Language, p.Stars, p.Forks, p.SortOrder,
		p.TitleEN, p.ShortDescriptionEN, p.DescriptionEN, p.ProblemEN,
		p.GoalsEN, p.MainFeaturesEN, p.ChallengesEN, p.LearningsEN,
	)
	if err != nil {
		return p, err
	}
	if tag.RowsAffected() == 0 {
		return p, ErrNotFound
	}

	if err := syncTechnologies(ctx, tx, p.ID, in.Technologies); err != nil {
		return p, err
	}
	if err := replaceImages(ctx, tx, p.ID, in.Images); err != nil {
		return p, err
	}
	if err := tx.Commit(ctx); err != nil {
		return p, err
	}
	return r.GetProjectBySlug(ctx, p.Slug)
}

// DeleteProject removes a project (relations cascade).
func (r *Repository) DeleteProject(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM projects WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// CountGitHubProjects returns how many projects originate from GitHub.
func (r *Repository) CountGitHubProjects(ctx context.Context) (int, error) {
	var count int
	err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM projects WHERE source = 'github'`).Scan(&count)
	return count, err
}

// UpsertGitHubProject creates or updates a project imported from GitHub,
// keyed on its slug, without touching hand-written narrative fields.
func (r *Repository) UpsertGitHubProject(ctx context.Context, p model.Project) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO projects (
			slug, title, short_description, repository_url, live_demo_url,
			status, published, year, language, stars, forks, github_updated_at, source, sort_order
		) VALUES ($1,$2,$3,$4,$5,'in_progress',false,$6,$7,$8,$9,$10,'github',
			COALESCE((SELECT MAX(sort_order) + 1 FROM projects), 1))
		ON CONFLICT (slug) DO UPDATE SET
			title = EXCLUDED.title,
			short_description = EXCLUDED.short_description,
			repository_url = EXCLUDED.repository_url,
			live_demo_url = COALESCE(EXCLUDED.live_demo_url, projects.live_demo_url),
			language = EXCLUDED.language,
			stars = EXCLUDED.stars,
			forks = EXCLUDED.forks,
			github_updated_at = EXCLUDED.github_updated_at,
			updated_at = now()`,
		p.Slug, p.Title, p.ShortDescription, p.RepositoryURL, p.LiveDemoURL,
		p.Year, p.Language, p.Stars, p.Forks, p.GitHubUpdatedAt,
	)
	return err
}

func defaultSource(source string) string {
	if source == "github" {
		return "github"
	}
	return "manual"
}

// syncTechnologies replaces a project's technology tags, upserting each name.
func syncTechnologies(ctx context.Context, tx pgx.Tx, projectID int64, names []string) error {
	if _, err := tx.Exec(ctx, `DELETE FROM project_technologies WHERE project_id = $1`, projectID); err != nil {
		return err
	}
	seen := map[string]bool{}
	for _, raw := range names {
		name := strings.TrimSpace(raw)
		if name == "" || seen[strings.ToLower(name)] {
			continue
		}
		seen[strings.ToLower(name)] = true

		var techID int64
		if err := tx.QueryRow(ctx, `
			INSERT INTO technologies (name) VALUES ($1)
			ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
			RETURNING id`, name).Scan(&techID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO project_technologies (project_id, technology_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
			projectID, techID); err != nil {
			return err
		}
	}
	return nil
}

// replaceImages replaces the gallery images of a project.
func replaceImages(ctx context.Context, tx pgx.Tx, projectID int64, images []model.ProjectImage) error {
	if _, err := tx.Exec(ctx, `DELETE FROM project_images WHERE project_id = $1`, projectID); err != nil {
		return err
	}
	order := 0
	for _, img := range images {
		if strings.TrimSpace(img.ImageURL) == "" {
			continue
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO project_images (project_id, image_url, caption, sort_order) VALUES ($1,$2,$3,$4)`,
			projectID, strings.TrimSpace(img.ImageURL), img.Caption, order); err != nil {
			return err
		}
		order++
	}
	return nil
}
