package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/zharrDev/portfolio/backend/internal/model"
)

// ErrGitHubUnavailable indicates the GitHub API could not be reached, was rate
// limited, or returned an unexpected status.
type ErrGitHubUnavailable struct {
	Status int
	Reason string
}

func (e *ErrGitHubUnavailable) Error() string {
	return fmt.Sprintf("github api tidak tersedia: %s", e.Reason)
}

// GitHubClient fetches public repository metadata.
//
// The token (optional) stays server-side and is never sent to the browser.
type GitHubClient struct {
	username string
	token    string
	client   *http.Client
	baseURL  string
}

// NewGitHubClient constructs a client with a bounded HTTP timeout.
func NewGitHubClient(username, token string, timeout time.Duration) *GitHubClient {
	return &GitHubClient{
		username: username,
		token:    token,
		baseURL:  "https://api.github.com",
		client: &http.Client{
			Timeout: timeout,
		},
	}
}

type githubRepoDTO struct {
	Name            string   `json:"name"`
	FullName        string   `json:"full_name"`
	Description     *string  `json:"description"`
	HTMLURL         string   `json:"html_url"`
	Homepage        *string  `json:"homepage"`
	Language        *string  `json:"language"`
	Topics          []string `json:"topics"`
	StargazersCount int      `json:"stargazers_count"`
	ForksCount      int      `json:"forks_count"`
	UpdatedAt       string   `json:"updated_at"`
	PushedAt        string   `json:"pushed_at"`
	Archived        bool     `json:"archived"`
	Fork            bool     `json:"fork"`
}

// FetchRepositories lists public repositories for the configured username.
func (c *GitHubClient) FetchRepositories(ctx context.Context) ([]model.GithubRepository, error) {
	endpoint := fmt.Sprintf("%s/users/%s/repos?per_page=100&sort=pushed&type=owner",
		c.baseURL, url.PathEscape(c.username))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "dzhar-dev-portfolio")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, &ErrGitHubUnavailable{Reason: "request gagal: " + err.Error()}
	}
	defer resp.Body.Close()

	switch {
	case resp.StatusCode == http.StatusOK:
		// continue
	case resp.StatusCode == http.StatusForbidden || resp.StatusCode == http.StatusTooManyRequests:
		return nil, &ErrGitHubUnavailable{
			Status: resp.StatusCode,
			Reason: "rate limit (" + strconv.Itoa(resp.StatusCode) + ")",
		}
	default:
		return nil, &ErrGitHubUnavailable{
			Status: resp.StatusCode,
			Reason: "status " + strconv.Itoa(resp.StatusCode),
		}
	}

	var payload []githubRepoDTO
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, &ErrGitHubUnavailable{Reason: "respons tidak valid"}
	}

	repos := make([]model.GithubRepository, 0, len(payload))
	for _, dto := range payload {
		repos = append(repos, model.GithubRepository{
			Owner:           c.username,
			Name:            dto.Name,
			FullName:        dto.FullName,
			Description:     dto.Description,
			HTMLURL:         dto.HTMLURL,
			Homepage:        dto.Homepage,
			Language:        dto.Language,
			Topics:          dto.Topics,
			StargazersCount: dto.StargazersCount,
			ForksCount:      dto.ForksCount,
			UpdatedAt:       parseTime(dto.UpdatedAt),
			PushedAt:        parseTime(dto.PushedAt),
			Archived:        dto.Archived,
			Fork:            dto.Fork,
		})
	}
	return repos, nil
}

func parseTime(value string) *time.Time {
	if value == "" {
		return nil
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return nil
	}
	return &parsed
}
