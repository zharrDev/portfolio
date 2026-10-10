package repository

import (
	"context"
	"time"

	"github.com/zharrDev/portfolio/backend/internal/model"
)

/* ------------------------------------------------------------------ */
/* Experience                                                          */
/* ------------------------------------------------------------------ */

func (r *Repository) ListExperiences(ctx context.Context) ([]model.Experience, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, organization, role, role_en, type,
		       to_char(start_date, 'YYYY-MM-DD'), to_char(end_date, 'YYYY-MM-DD'),
		       description, description_en, sort_order, created_at, updated_at
		FROM experiences ORDER BY sort_order ASC, start_date DESC NULLS LAST, id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]model.Experience, 0)
	for rows.Next() {
		var e model.Experience
		if err := rows.Scan(&e.ID, &e.Organization, &e.Role, &e.RoleEN, &e.Type, &e.StartDate, &e.EndDate,
			&e.Description, &e.DescriptionEN, &e.SortOrder, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, rows.Err()
}

func (r *Repository) CreateExperience(ctx context.Context, e model.Experience) (model.Experience, error) {
	err := r.pool.QueryRow(ctx, `
		INSERT INTO experiences (organization, role, role_en, type, start_date, end_date, description, description_en, sort_order)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, created_at, updated_at`,
		e.Organization, e.Role, e.RoleEN, e.Type, e.StartDate, e.EndDate,
		e.Description, e.DescriptionEN, e.SortOrder,
	).Scan(&e.ID, &e.CreatedAt, &e.UpdatedAt)
	return e, err
}

func (r *Repository) UpdateExperience(ctx context.Context, e model.Experience) (model.Experience, error) {
	err := r.pool.QueryRow(ctx, `
		UPDATE experiences SET organization=$2, role=$3, role_en=$4, type=$5, start_date=$6, end_date=$7,
			description=$8, description_en=$9, sort_order=$10, updated_at=now()
		WHERE id=$1 RETURNING created_at, updated_at`,
		e.ID, e.Organization, e.Role, e.RoleEN, e.Type, e.StartDate, e.EndDate,
		e.Description, e.DescriptionEN, e.SortOrder,
	).Scan(&e.CreatedAt, &e.UpdatedAt)
	return e, mapErr(err)
}

func (r *Repository) DeleteExperience(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM experiences WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

/* ------------------------------------------------------------------ */
/* Certificates                                                        */
/* ------------------------------------------------------------------ */

func (r *Repository) ListCertificates(ctx context.Context) ([]model.Certificate, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, name_en, issuer, to_char(issued_date, 'YYYY-MM-DD'), credential_url,
		       sort_order, created_at, updated_at
		FROM certificates ORDER BY sort_order ASC, issued_date DESC NULLS LAST, id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]model.Certificate, 0)
	for rows.Next() {
		var c model.Certificate
		if err := rows.Scan(&c.ID, &c.Name, &c.NameEN, &c.Issuer, &c.IssuedDate, &c.CredentialURL,
			&c.SortOrder, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, rows.Err()
}

func (r *Repository) CreateCertificate(ctx context.Context, c model.Certificate) (model.Certificate, error) {
	err := r.pool.QueryRow(ctx, `
		INSERT INTO certificates (name, name_en, issuer, issued_date, credential_url, sort_order)
		VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, created_at, updated_at`,
		c.Name, c.NameEN, c.Issuer, c.IssuedDate, c.CredentialURL, c.SortOrder,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)
	return c, err
}

func (r *Repository) UpdateCertificate(ctx context.Context, c model.Certificate) (model.Certificate, error) {
	err := r.pool.QueryRow(ctx, `
		UPDATE certificates SET name=$2, name_en=$3, issuer=$4, issued_date=$5, credential_url=$6, sort_order=$7, updated_at=now()
		WHERE id=$1 RETURNING created_at, updated_at`,
		c.ID, c.Name, c.NameEN, c.Issuer, c.IssuedDate, c.CredentialURL, c.SortOrder,
	).Scan(&c.CreatedAt, &c.UpdatedAt)
	return c, mapErr(err)
}

func (r *Repository) DeleteCertificate(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM certificates WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

/* ------------------------------------------------------------------ */
/* Social links                                                        */
/* ------------------------------------------------------------------ */

func (r *Repository) ListSocialLinks(ctx context.Context) ([]model.SocialLink, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, label, url, icon, sort_order FROM social_links ORDER BY sort_order ASC, id ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]model.SocialLink, 0)
	for rows.Next() {
		var s model.SocialLink
		if err := rows.Scan(&s.ID, &s.Label, &s.URL, &s.Icon, &s.SortOrder); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, rows.Err()
}

func (r *Repository) CreateSocialLink(ctx context.Context, s model.SocialLink) (model.SocialLink, error) {
	err := r.pool.QueryRow(ctx, `
		INSERT INTO social_links (label, url, icon, sort_order) VALUES ($1,$2,$3,$4) RETURNING id`,
		s.Label, s.URL, s.Icon, s.SortOrder).Scan(&s.ID)
	return s, err
}

func (r *Repository) UpdateSocialLink(ctx context.Context, s model.SocialLink) (model.SocialLink, error) {
	tag, err := r.pool.Exec(ctx, `
		UPDATE social_links SET label=$2, url=$3, icon=$4, sort_order=$5 WHERE id=$1`,
		s.ID, s.Label, s.URL, s.Icon, s.SortOrder)
	if err != nil {
		return s, err
	}
	if tag.RowsAffected() == 0 {
		return s, ErrNotFound
	}
	return s, nil
}

func (r *Repository) DeleteSocialLink(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM social_links WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

/* ------------------------------------------------------------------ */
/* Contact messages                                                    */
/* ------------------------------------------------------------------ */

func (r *Repository) CreateMessage(ctx context.Context, m model.ContactMessage, ipHash string) (int64, error) {
	var id int64
	err := r.pool.QueryRow(ctx, `
		INSERT INTO contact_messages (name, email, subject, message, ip_hash)
		VALUES ($1,$2,$3,$4,$5) RETURNING id`,
		m.Name, m.Email, m.Subject, m.Message, ipHash).Scan(&id)
	return id, err
}

func (r *Repository) ListMessages(ctx context.Context, limit, offset int) ([]model.ContactMessage, error) {
	if limit <= 0 || limit > 500 {
		limit = 100
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id, name, email, subject, message, is_read, created_at
		FROM contact_messages ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]model.ContactMessage, 0)
	for rows.Next() {
		var m model.ContactMessage
		if err := rows.Scan(&m.ID, &m.Name, &m.Email, &m.Subject, &m.Message, &m.IsRead, &m.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, rows.Err()
}

func (r *Repository) SetMessageRead(ctx context.Context, id int64, isRead bool) (model.ContactMessage, error) {
	var m model.ContactMessage
	err := r.pool.QueryRow(ctx, `
		UPDATE contact_messages SET is_read=$2 WHERE id=$1
		RETURNING id, name, email, subject, message, is_read, created_at`, id, isRead,
	).Scan(&m.ID, &m.Name, &m.Email, &m.Subject, &m.Message, &m.IsRead, &m.CreatedAt)
	return m, mapErr(err)
}

func (r *Repository) DeleteMessage(ctx context.Context, id int64) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM contact_messages WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

/* ------------------------------------------------------------------ */
/* Site settings                                                       */
/* ------------------------------------------------------------------ */

func (r *Repository) ListSettings(ctx context.Context) ([]model.SiteSetting, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, key, value FROM site_settings ORDER BY key ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]model.SiteSetting, 0)
	for rows.Next() {
		var s model.SiteSetting
		if err := rows.Scan(&s.ID, &s.Key, &s.Value); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, rows.Err()
}

func (r *Repository) UpdateSetting(ctx context.Context, id int64, value string) (model.SiteSetting, error) {
	var s model.SiteSetting
	err := r.pool.QueryRow(ctx, `
		UPDATE site_settings SET value=$2 WHERE id=$1 RETURNING id, key, value`, id, value,
	).Scan(&s.ID, &s.Key, &s.Value)
	return s, mapErr(err)
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

func (r *Repository) DashboardStats(ctx context.Context) (model.DashboardStats, error) {
	var stats model.DashboardStats

	err := r.pool.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM projects),
			(SELECT COUNT(*) FROM projects WHERE is_featured),
			(SELECT COUNT(*) FROM projects WHERE published),
			(SELECT COUNT(*) FROM contact_messages),
			(SELECT COUNT(*) FROM contact_messages WHERE NOT is_read),
			(SELECT COUNT(*) FROM skills),
			(SELECT COUNT(*) FROM educations),
			(SELECT COUNT(*) FROM certificates),
			(SELECT COUNT(*) FROM experiences),
			(SELECT COUNT(*) FROM github_repos)
	`).Scan(
		&stats.ProjectsTotal, &stats.ProjectsFeatured, &stats.ProjectsPublished,
		&stats.MessagesTotal, &stats.MessagesUnread, &stats.SkillsTotal,
		&stats.EducationsTotal, &stats.CertificatesTotal, &stats.ExperiencesTotal,
		&stats.GitHubReposTotal,
	)
	if err != nil {
		return stats, err
	}

	var lastSync *time.Time
	if err := r.pool.QueryRow(ctx, `SELECT MAX(created_at) FROM github_sync_logs WHERE status = 'success'`).Scan(&lastSync); err == nil {
		stats.LastGitHubSync = lastSync
	}

	messages, err := r.ListMessages(ctx, 5, 0)
	if err != nil {
		return stats, err
	}
	stats.RecentMessages = messages
	return stats, nil
}

/* ------------------------------------------------------------------ */
/* GitHub cache                                                        */
/* ------------------------------------------------------------------ */

// ReplaceGitHubRepos swaps the cached repository snapshot in one transaction.
func (r *Repository) ReplaceGitHubRepos(ctx context.Context, repos []model.GithubRepository, owner string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, `DELETE FROM github_repos WHERE owner = $1`, owner); err != nil {
		return err
	}

	for _, repo := range repos {
		if _, err := tx.Exec(ctx, `
			INSERT INTO github_repos (
				owner, name, full_name, description, html_url, homepage, language, topics,
				stargazers_count, forks_count, updated_at, pushed_at, archived, is_fork, synced_at
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now())
			ON CONFLICT (full_name) DO UPDATE SET
				owner=EXCLUDED.owner, description=EXCLUDED.description, html_url=EXCLUDED.html_url,
				homepage=EXCLUDED.homepage, language=EXCLUDED.language, topics=EXCLUDED.topics,
				stargazers_count=EXCLUDED.stargazers_count, forks_count=EXCLUDED.forks_count,
				updated_at=EXCLUDED.updated_at, pushed_at=EXCLUDED.pushed_at,
				archived=EXCLUDED.archived, is_fork=EXCLUDED.is_fork, synced_at=now()`,
			repo.Owner, repo.Name, repo.FullName, repo.Description, repo.HTMLURL, repo.Homepage,
			repo.Language, repo.Topics, repo.StargazersCount, repo.ForksCount,
			repo.UpdatedAt, repo.PushedAt, repo.Archived, repo.Fork,
		); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ListGitHubRepos returns the cached snapshot, annotated with whether each
// repository is already represented as a project in the portfolio.
func (r *Repository) ListGitHubRepos(ctx context.Context, owner string) ([]model.GithubRepository, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, owner, name, full_name, description, html_url, homepage, language, topics,
		       stargazers_count, forks_count, updated_at, pushed_at, archived, is_fork,
		       EXISTS (SELECT 1 FROM projects p WHERE p.repository_url = github_repos.html_url) AS is_imported
		FROM github_repos WHERE owner = $1 ORDER BY pushed_at DESC NULLS LAST, full_name ASC`, owner)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]model.GithubRepository, 0)
	for rows.Next() {
		var repo model.GithubRepository
		if err := rows.Scan(&repo.ID, &repo.Owner, &repo.Name, &repo.FullName, &repo.Description,
			&repo.HTMLURL, &repo.Homepage, &repo.Language, &repo.Topics, &repo.StargazersCount,
			&repo.ForksCount, &repo.UpdatedAt, &repo.PushedAt, &repo.Archived, &repo.Fork,
			&repo.IsImported); err != nil {
			return nil, err
		}
		list = append(list, repo)
	}
	return list, rows.Err()
}

// LogGitHubSync records a synchronisation attempt for the dashboard.
func (r *Repository) LogGitHubSync(ctx context.Context, status, message string, repos int) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO github_sync_logs (status, message, repos_found) VALUES ($1,$2,$3)`,
		status, message, repos)
	return err
}
