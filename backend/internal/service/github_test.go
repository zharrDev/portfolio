package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestFetchRepositoriesSuccess(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("User-Agent"); got == "" {
			t.Error("expected a User-Agent header")
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`[
			{
				"name": "LedgerFlow",
				"full_name": "zharrDev/LedgerFlow",
				"description": "Accounting platform",
				"html_url": "https://github.com/zharrDev/LedgerFlow",
				"homepage": "https://example.com",
				"language": "TypeScript",
				"topics": ["accounting"],
				"stargazers_count": 3,
				"forks_count": 1,
				"updated_at": "2026-09-27T02:51:56Z",
				"pushed_at": "2026-09-27T02:51:52Z",
				"archived": false,
				"fork": false
			}
		]`))
	}))
	defer server.Close()

	client := NewGitHubClient("zharrDev", "", 5*time.Second)
	client.baseURL = server.URL

	repos, err := client.FetchRepositories(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(repos) != 1 {
		t.Fatalf("expected 1 repository, got %d", len(repos))
	}
	repo := repos[0]
	if repo.FullName != "zharrDev/LedgerFlow" {
		t.Errorf("unexpected full name %q", repo.FullName)
	}
	if repo.StargazersCount != 3 {
		t.Errorf("expected 3 stars, got %d", repo.StargazersCount)
	}
	if repo.UpdatedAt == nil || repo.UpdatedAt.Year() != 2026 {
		t.Errorf("expected parsed updated_at, got %v", repo.UpdatedAt)
	}
}

func TestFetchRepositoriesRateLimited(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		_, _ = w.Write([]byte(`{"message":"API rate limit exceeded"}`))
	}))
	defer server.Close()

	client := NewGitHubClient("zharrDev", "", 5*time.Second)
	client.baseURL = server.URL

	_, err := client.FetchRepositories(context.Background())
	if err == nil {
		t.Fatal("expected an error when rate limited")
	}
	unavailable, ok := err.(*ErrGitHubUnavailable)
	if !ok {
		t.Fatalf("expected *ErrGitHubUnavailable, got %T", err)
	}
	if unavailable.Status != http.StatusForbidden {
		t.Errorf("expected status 403 recorded, got %d", unavailable.Status)
	}
}

func TestFetchRepositoriesUnavailable(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	client := NewGitHubClient("zharrDev", "", 5*time.Second)
	client.baseURL = server.URL

	if _, err := client.FetchRepositories(context.Background()); err == nil {
		t.Fatal("expected an error on server failure")
	}
}

func TestFetchRepositoriesInvalidJSON(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{not json`))
	}))
	defer server.Close()

	client := NewGitHubClient("zharrDev", "", 5*time.Second)
	client.baseURL = server.URL

	if _, err := client.FetchRepositories(context.Background()); err == nil {
		t.Fatal("expected an error on malformed JSON")
	}
}

func TestFetchRepositoriesTimeout(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		time.Sleep(120 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`[]`))
	}))
	defer server.Close()

	client := NewGitHubClient("zharrDev", "", 20*time.Millisecond)
	client.baseURL = server.URL

	if _, err := client.FetchRepositories(context.Background()); err == nil {
		t.Fatal("expected a timeout error")
	}
}
