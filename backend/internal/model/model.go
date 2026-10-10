// Package model contains the domain entities shared across layers.
//
// JSON tags intentionally match the TypeScript types in frontend/src/types.
package model

import "time"

// Profile is the single owner profile record.
//
// Fields tagged `i18n` name the optional English counterpart. When a request
// asks for the English locale, the service copies the English value over the
// base field, but only when the English cell is actually filled in.
type Profile struct {
	ID             int64     `json:"id"`
	FullName       string    `json:"full_name"`
	Nickname       string    `json:"nickname"`
	Brand          string    `json:"brand"`
	Headline       string    `json:"headline" i18n:"HeadlineEN"`
	HeadlineEN     *string   `json:"headline_en"`
	Subheadline    *string   `json:"subheadline" i18n:"SubheadlineEN"`
	SubheadlineEN  *string   `json:"subheadline_en"`
	Bio            *string   `json:"bio" i18n:"BioEN"`
	BioEN          *string   `json:"bio_en"`
	About          *string   `json:"about" i18n:"AboutEN"`
	AboutEN        *string   `json:"about_en"`
	AvatarURL      *string   `json:"avatar_url"`
	Location       *string   `json:"location"`
	Email          *string   `json:"email"`
	Phone          *string   `json:"phone"`
	University     *string   `json:"university"`
	Major          *string   `json:"major"`
	PreviousSchool *string   `json:"previous_school"`
	PreviousMajor  *string   `json:"previous_major"`
	CurrentFocus   *string   `json:"current_focus" i18n:"CurrentFocusEN"`
	CurrentFocusEN *string   `json:"current_focus_en"`
	Availability   *string   `json:"availability" i18n:"AvailabilityEN"`
	AvailabilityEN *string   `json:"availability_en"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Education is a single education history entry.
type Education struct {
	ID            int64     `json:"id"`
	Institution   string    `json:"institution"`
	Degree        *string   `json:"degree" i18n:"DegreeEN"`
	DegreeEN      *string   `json:"degree_en"`
	Major         *string   `json:"major" i18n:"MajorEN"`
	MajorEN       *string   `json:"major_en"`
	StartYear     *int      `json:"start_year"`
	EndYear       *int      `json:"end_year"`
	Description   *string   `json:"description" i18n:"DescriptionEN"`
	DescriptionEN *string   `json:"description_en"`
	SortOrder     int       `json:"sort_order"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Skill belongs to one category and is shown as a chip in the UI.
type Skill struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name" i18n:"NameEN"`
	NameEN    *string   `json:"name_en"`
	Category  string    `json:"category"`
	Note      *string   `json:"note" i18n:"NoteEN"`
	NoteEN    *string   `json:"note_en"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Technology is a many-to-many tag attached to projects.
type Technology struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

// ProjectImage is a gallery screenshot belonging to a project.
type ProjectImage struct {
	ID        int64   `json:"id"`
	ProjectID int64   `json:"project_id"`
	ImageURL  string  `json:"image_url"`
	Caption   *string `json:"caption"`
	SortOrder int     `json:"sort_order"`
}

// Project is the central portfolio entity.
type Project struct {
	ID                 int64          `json:"id"`
	Slug               string         `json:"slug"`
	Title              string         `json:"title" i18n:"TitleEN"`
	TitleEN            *string        `json:"title_en"`
	ShortDescription   string         `json:"short_description" i18n:"ShortDescriptionEN"`
	ShortDescriptionEN *string        `json:"short_description_en"`
	Description        *string        `json:"description" i18n:"DescriptionEN"`
	DescriptionEN      *string        `json:"description_en"`
	Category           *string        `json:"category"`
	RepositoryURL      *string        `json:"repository_url"`
	LiveDemoURL        *string        `json:"live_demo_url"`
	ReadmeURL          *string        `json:"readme_url"`
	CoverImage         *string        `json:"cover_image"`
	Status             string         `json:"status"`
	IsFeatured         bool           `json:"is_featured"`
	Published          bool           `json:"published"`
	Problem            *string        `json:"problem" i18n:"ProblemEN"`
	ProblemEN          *string        `json:"problem_en"`
	Goals              *string        `json:"goals" i18n:"GoalsEN"`
	GoalsEN            *string        `json:"goals_en"`
	MainFeatures       *string        `json:"main_features" i18n:"MainFeaturesEN"`
	MainFeaturesEN     *string        `json:"main_features_en"`
	Challenges         *string        `json:"challenges" i18n:"ChallengesEN"`
	ChallengesEN       *string        `json:"challenges_en"`
	Learnings          *string        `json:"learnings" i18n:"LearningsEN"`
	LearningsEN        *string        `json:"learnings_en"`
	Architecture       *string        `json:"architecture"`
	Year               *int           `json:"year"`
	Language           *string        `json:"language"`
	Stars              *int           `json:"stars"`
	Forks              *int           `json:"forks"`
	GitHubUpdatedAt    *time.Time     `json:"github_updated_at"`
	Source             string         `json:"source"`
	SortOrder          int            `json:"sort_order"`
	Technologies       []Technology   `json:"technologies"`
	Images             []ProjectImage `json:"images"`
	PublishedAt        *time.Time     `json:"published_at"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
}

// Experience is a work/organisation entry.
type Experience struct {
	ID            int64     `json:"id"`
	Organization  string    `json:"organization"`
	Role          string    `json:"role" i18n:"RoleEN"`
	RoleEN        *string   `json:"role_en"`
	Type          *string   `json:"type"`
	StartDate     *string   `json:"start_date"`
	EndDate       *string   `json:"end_date"`
	Description   *string   `json:"description" i18n:"DescriptionEN"`
	DescriptionEN *string   `json:"description_en"`
	SortOrder     int       `json:"sort_order"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Certificate is a certificate/course/achievement entry.
type Certificate struct {
	ID            int64     `json:"id"`
	Name          string    `json:"name" i18n:"NameEN"`
	NameEN        *string   `json:"name_en"`
	Issuer        *string   `json:"issuer"`
	IssuedDate    *string   `json:"issued_date"`
	CredentialURL *string   `json:"credential_url"`
	SortOrder     int       `json:"sort_order"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// SocialLink is a footer link.
type SocialLink struct {
	ID        int64   `json:"id"`
	Label     string  `json:"label"`
	URL       string  `json:"url"`
	Icon      *string `json:"icon"`
	SortOrder int     `json:"sort_order"`
}

// ContactMessage is a message submitted through the public contact form.
type ContactMessage struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Subject   string    `json:"subject"`
	Message   string    `json:"message"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// SiteSetting is a key/value configuration row editable via the admin.
type SiteSetting struct {
	ID    int64  `json:"id"`
	Key   string `json:"key"`
	Value string `json:"value"`
}

// DashboardStats powers the admin overview.
type DashboardStats struct {
	ProjectsTotal     int              `json:"projects_total"`
	ProjectsFeatured  int              `json:"projects_featured"`
	ProjectsPublished int              `json:"projects_published"`
	MessagesTotal     int              `json:"messages_total"`
	MessagesUnread    int              `json:"messages_unread"`
	SkillsTotal       int              `json:"skills_total"`
	EducationsTotal   int              `json:"educations_total"`
	CertificatesTotal int              `json:"certificates_total"`
	ExperiencesTotal  int              `json:"experiences_total"`
	GitHubReposTotal  int              `json:"github_repos_total"`
	LastGitHubSync    *time.Time       `json:"last_github_sync"`
	RecentMessages    []ContactMessage `json:"recent_messages"`
}

// GithubRepository is repository metadata fetched from (or cached from) GitHub.
type GithubRepository struct {
	ID              int64      `json:"-"`
	Owner           string     `json:"-"`
	Name            string     `json:"name"`
	FullName        string     `json:"full_name"`
	Description     *string    `json:"description"`
	HTMLURL         string     `json:"html_url"`
	Homepage        *string    `json:"homepage"`
	Language        *string    `json:"language"`
	Topics          []string   `json:"topics"`
	StargazersCount int        `json:"stargazers_count"`
	ForksCount      int        `json:"forks_count"`
	UpdatedAt       *time.Time `json:"updated_at"`
	PushedAt        *time.Time `json:"pushed_at"`
	Archived        bool       `json:"archived"`
	Fork            bool       `json:"fork"`
	IsImported      bool       `json:"is_imported"`
}
