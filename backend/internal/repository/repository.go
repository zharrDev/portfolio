// Package repository implements data access against PostgreSQL using
// parameterised queries only.
package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/zharrDev/portfolio/backend/internal/model"
)

// ErrNotFound is returned when a requested row does not exist.
var ErrNotFound = errors.New("not found")

// Repository is the aggregate data-access facade.
type Repository struct {
	pool *pgxpool.Pool
}

// New creates a Repository over the given pool.
func New(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// Ping verifies database connectivity.
func (r *Repository) Ping(ctx context.Context) error {
	return r.pool.Ping(ctx)
}

func mapErr(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

const profileColumns = `id, full_name, nickname, brand, headline, subheadline, bio, about,
	avatar_url, location, email, phone, university, major, previous_school, previous_major,
	current_focus, availability, updated_at`

func scanProfile(row pgx.Row) (model.Profile, error) {
	var p model.Profile
	err := row.Scan(
		&p.ID, &p.FullName, &p.Nickname, &p.Brand, &p.Headline, &p.Subheadline, &p.Bio, &p.About,
		&p.AvatarURL, &p.Location, &p.Email, &p.Phone, &p.University, &p.Major, &p.PreviousSchool,
		&p.PreviousMajor, &p.CurrentFocus, &p.Availability, &p.UpdatedAt,
	)
	return p, err
}

// GetProfile returns the first profile row.
func (r *Repository) GetProfile(ctx context.Context) (model.Profile, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+profileColumns+` FROM profiles ORDER BY id LIMIT 1`)
	p, err := scanProfile(row)
	return p, mapErr(err)
}

// UpdateProfile writes the mutable profile fields.
func (r *Repository) UpdateProfile(ctx context.Context, p model.Profile) (model.Profile, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE profiles SET
			full_name = $2, nickname = $3, brand = $4, headline = $5, subheadline = $6,
			bio = $7, about = $8, avatar_url = $9, location = $10, email = $11, phone = $12,
			university = $13, major = $14, previous_school = $15, previous_major = $16,
			current_focus = $17, availability = $18, updated_at = now()
		WHERE id = $1
		RETURNING `+profileColumns,
		p.ID, p.FullName, p.Nickname, p.Brand, p.Headline, p.Subheadline, p.Bio, p.About,
		p.AvatarURL, p.Location, p.Email, p.Phone, p.University, p.Major, p.PreviousSchool,
		p.PreviousMajor, p.CurrentFocus, p.Availability,
	)
	updated, err := scanProfile(row)
	return updated, mapErr(err)
}

/* ------------------------------------------------------------------ */
/* Education                                                           */
/* ------------------------------------------------------------------ */

// ListEducations returns education entries ordered by sort_order then recency.
func (r *Repository) ListEducations(ctx context.Context) ([]model.Education, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, institution, degree, major, start_year, end_year, description, sort_order, created_at, updated_at
		FROM educations ORDER BY sort_order ASC, end_year DESC NULLS FIRST, id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]model.Education, 0)
	for rows.Next() {
		var e model.Education
		if err := rows.Scan(&e.ID, &e.Institution, &e.Degree, &e.Major, &e.StartYear, &e.EndYear,
			&e.Description, &e.SortOrder, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, rows.Err()
}

// CreateEducation inserts a new education row.
func (r *Repository) CreateEducation(ctx context.Context, e model.Education) (model.Education, error) {
	err := r.pool.QueryRow(ctx, `
		INSERT INTO educations (institution, degree, major, start_year, end_year, description, sort_order)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING id, created_at, updated_at`,
		e.Institution, e.Degree, e.Major, e.StartYear, e.EndYear, e.Description, e.SortOrder,
	).Scan(&e.ID, &e.CreatedAt, &e.UpdatedAt)
	return e, err
}

// UpdateEducation updates an existing education row.
func (r *Repository) UpdateEducation(ctx context.Context, e model.Education) (model.Education, error) {
	err := r.pool.QueryRow(ctx, `
		UPDATE educations SET institution=$2, degree=$3, major=$4, start_year=$5, end_year=$6,
			description=$7, sort_order=$8, updated_at=now()
		WHERE id=$1
		RETURNING created_at, updated_at`,
		e.ID, e.Institution, e.Degree, e.Major, e.StartYear, e.EndYear, e.Description, e.SortOrder,
	).Scan(&e.CreatedAt, &e.UpdatedAt)
	return e, mapErr(err)
}

// DeleteEducation removes an education row.
func (r *Repository) DeleteEducation(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM educations WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

/* ------------------------------------------------------------------ */
/* Skills                                                              */
/* ------------------------------------------------------------------ */

// ListSkills returns skills ordered by category then sort_order.
func (r *Repository) ListSkills(ctx context.Context) ([]model.Skill, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, category, note, sort_order, created_at, updated_at
		FROM skills ORDER BY category ASC, sort_order ASC, name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]model.Skill, 0)
	for rows.Next() {
		var s model.Skill
		if err := rows.Scan(&s.ID, &s.Name, &s.Category, &s.Note, &s.SortOrder, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, rows.Err()
}

// CreateSkill inserts a new skill.
func (r *Repository) CreateSkill(ctx context.Context, s model.Skill) (model.Skill, error) {
	err := r.pool.QueryRow(ctx, `
		INSERT INTO skills (name, category, note, sort_order) VALUES ($1,$2,$3,$4)
		RETURNING id, created_at, updated_at`,
		s.Name, s.Category, s.Note, s.SortOrder,
	).Scan(&s.ID, &s.CreatedAt, &s.UpdatedAt)
	return s, err
}

// UpdateSkill updates a skill row.
func (r *Repository) UpdateSkill(ctx context.Context, s model.Skill) (model.Skill, error) {
	err := r.pool.QueryRow(ctx, `
		UPDATE skills SET name=$2, category=$3, note=$4, sort_order=$5, updated_at=now()
		WHERE id=$1 RETURNING created_at, updated_at`,
		s.ID, s.Name, s.Category, s.Note, s.SortOrder,
	).Scan(&s.CreatedAt, &s.UpdatedAt)
	return s, mapErr(err)
}

// DeleteSkill removes a skill.
func (r *Repository) DeleteSkill(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM skills WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

// ProjectFilter narrows a project listing.
type ProjectFilter struct {
	Search        string
	Language      string
	Category      string
	Status        string
	Featured      bool
	PublishedOnly bool
	Sort          string
	Limit         int
	Offset        int
}

const projectColumns = `id, slug, title, short_description, description, category, repository_url,
	live_demo_url, readme_url, cover_image, status, is_featured, published, problem, goals,
	main_features, challenges, learnings, architecture, year, language, stars, forks,
	github_updated_at, source, sort_order, published_at, created_at, updated_at`

func scanProject(row pgx.Row) (model.Project, error) {
	var p model.Project
	err := row.Scan(
		&p.ID, &p.Slug, &p.Title, &p.ShortDescription, &p.Description, &p.Category, &p.RepositoryURL,
		&p.LiveDemoURL, &p.ReadmeURL, &p.CoverImage, &p.Status, &p.IsFeatured, &p.Published,
		&p.Problem, &p.Goals, &p.MainFeatures, &p.Challenges, &p.Learnings, &p.Architecture,
		&p.Year, &p.Language, &p.Stars, &p.Forks, &p.GitHubUpdatedAt, &p.Source, &p.SortOrder,
		&p.PublishedAt, &p.CreatedAt, &p.UpdatedAt,
	)
	p.Technologies = []model.Technology{}
	p.Images = []model.ProjectImage{}
	return p, err
}

// ListProjects returns projects matching the filter, with technologies and
// images attached. The query is fully parameterised.
func (r *Repository) ListProjects(ctx context.Context, f ProjectFilter) ([]model.Project, error) {
	clauses := []string{"1 = 1"}
	args := []any{}

	if f.PublishedOnly {
		clauses = append(clauses, "published = true")
	}
	if f.Featured {
		clauses = append(clauses, "is_featured = true")
	}
	if f.Language != "" {
		args = append(args, f.Language)
		clauses = append(clauses, fmt.Sprintf("language = $%d", len(args)))
	}
	if f.Category != "" {
		args = append(args, f.Category)
		clauses = append(clauses, fmt.Sprintf("category = $%d", len(args)))
	}
	if f.Status != "" {
		args = append(args, f.Status)
		clauses = append(clauses, fmt.Sprintf("status = $%d", len(args)))
	}
	if s := strings.TrimSpace(f.Search); s != "" {
		args = append(args, "%"+strings.ToLower(s)+"%")
		idx := len(args)
		clauses = append(clauses, fmt.Sprintf(
			"(lower(title) LIKE $%d OR lower(short_description) LIKE $%d OR lower(COALESCE(description,'')) LIKE $%d)",
			idx, idx, idx))
	}

	order := "sort_order ASC, year DESC NULLS LAST, id DESC"
	switch f.Sort {
	case "oldest":
		order = "year ASC NULLS LAST, id ASC"
	case "title":
		order = "title ASC"
	case "featured":
		order = "is_featured DESC, sort_order ASC, year DESC"
	case "recent":
		order = "COALESCE(published_at, created_at) DESC"
	}

	limit := f.Limit
	if limit <= 0 || limit > 200 {
		limit = 100
	}
	args = append(args, limit)
	limitIdx := len(args)
	args = append(args, f.Offset)
	offsetIdx := len(args)

	query := fmt.Sprintf(`SELECT %s FROM projects WHERE %s ORDER BY %s LIMIT $%d OFFSET $%d`,
		projectColumns, strings.Join(clauses, " AND "), order, limitIdx, offsetIdx)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	projects := make([]model.Project, 0)
	ids := make([]int64, 0)
	for rows.Next() {
		p, err := scanProject(rows)
		if err != nil {
			return nil, err
		}
		projects = append(projects, p)
		ids = append(ids, p.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if err := r.attachRelations(ctx, projects, ids); err != nil {
		return nil, err
	}
	return projects, nil
}

// GetProjectBySlug fetches one project (public view) with its relations.
func (r *Repository) GetProjectBySlug(ctx context.Context, slug string) (model.Project, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+projectColumns+` FROM projects WHERE slug = $1`, slug)
	p, err := scanProject(row)
	if err != nil {
		return p, mapErr(err)
	}
	items := []model.Project{p}
	if err := r.attachRelations(ctx, items, []int64{p.ID}); err != nil {
		return p, mapErr(err)
	}
	return items[0], nil
}

func (r *Repository) attachRelations(ctx context.Context, projects []model.Project, ids []int64) error {
	if len(ids) == 0 {
		return nil
	}

	techRows, err := r.pool.Query(ctx, `
		SELECT pt.project_id, t.id, t.name
		FROM project_technologies pt
		JOIN technologies t ON t.id = pt.technology_id
		WHERE pt.project_id = ANY($1)
		ORDER BY t.name`, ids)
	if err != nil {
		return err
	}
	defer techRows.Close()

	techByProject := map[int64][]model.Technology{}
	for techRows.Next() {
		var projectID int64
		var t model.Technology
		if err := techRows.Scan(&projectID, &t.ID, &t.Name); err != nil {
			return err
		}
		techByProject[projectID] = append(techByProject[projectID], t)
	}
	if err := techRows.Err(); err != nil {
		return err
	}

	imageRows, err := r.pool.Query(ctx, `
		SELECT id, project_id, image_url, caption, sort_order
		FROM project_images WHERE project_id = ANY($1)
		ORDER BY sort_order ASC, id ASC`, ids)
	if err != nil {
		return err
	}
	defer imageRows.Close()

	imagesByProject := map[int64][]model.ProjectImage{}
	for imageRows.Next() {
		var img model.ProjectImage
		if err := imageRows.Scan(&img.ID, &img.ProjectID, &img.ImageURL, &img.Caption, &img.SortOrder); err != nil {
			return err
		}
		imagesByProject[img.ProjectID] = append(imagesByProject[img.ProjectID], img)
	}
	if err := imageRows.Err(); err != nil {
		return err
	}

	for i := range projects {
		if list, ok := techByProject[projects[i].ID]; ok {
			projects[i].Technologies = list
		}
		if list, ok := imagesByProject[projects[i].ID]; ok {
			projects[i].Images = list
		}
	}
	return nil
}
