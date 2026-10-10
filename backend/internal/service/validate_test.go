package service

import (
	"strings"
	"testing"

	"github.com/zharrDev/portfolio/backend/internal/model"
)

func TestSlugify(t *testing.T) {
	cases := map[string]string{
		"LedgerFlow":            "ledgerflow",
		"PrintKu App":           "printku-app",
		"  Hello,  World!  ":    "hello-world",
		"TaskFlow-TS":           "taskflow-ts",
		"Banking System (Java)": "banking-system-java",
		"":                      "",
		"---":                   "",
	}
	for input, want := range cases {
		if got := Slugify(input); got != want {
			t.Errorf("Slugify(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestIsValidSlug(t *testing.T) {
	valid := []string{"ledgerflow", "printku-app", "a1-b2"}
	invalid := []string{"LedgerFlow", "print ku", "-lead", "lead-", "a--b", "a_b"}

	for _, slug := range valid {
		if !IsValidSlug(slug) {
			t.Errorf("IsValidSlug(%q) = false, want true", slug)
		}
	}
	for _, slug := range invalid {
		if IsValidSlug(slug) {
			t.Errorf("IsValidSlug(%q) = true, want false", slug)
		}
	}
}

func TestValidateContact(t *testing.T) {
	valid := ContactInput{
		Name:    "Budi",
		Email:   "budi@example.com",
		Subject: "Kolaborasi",
		Message: "Halo, saya ingin berdiskusi tentang proyek.",
	}
	if _, err := ValidateContact(valid); err != nil {
		t.Fatalf("expected valid contact to pass, got %v", err)
	}

	t.Run("honeypot is rejected", func(t *testing.T) {
		bad := valid
		bad.Website = "http://spam.example"
		if _, err := ValidateContact(bad); err == nil {
			t.Fatal("expected honeypot submission to be rejected")
		}
	})

	t.Run("invalid email is rejected", func(t *testing.T) {
		bad := valid
		bad.Email = "not-an-email"
		_, err := ValidateContact(bad)
		if err == nil {
			t.Fatal("expected invalid email to be rejected")
		}
		if _, ok := IsValidationError(err); !ok {
			t.Fatalf("expected ValidationError, got %T", err)
		}
	})

	t.Run("short message is rejected", func(t *testing.T) {
		bad := valid
		bad.Message = "hai"
		if _, err := ValidateContact(bad); err == nil {
			t.Fatal("expected short message to be rejected")
		}
	})

	t.Run("overlong subject is rejected", func(t *testing.T) {
		bad := valid
		bad.Subject = strings.Repeat("a", 151)
		if _, err := ValidateContact(bad); err == nil {
			t.Fatal("expected overlong subject to be rejected")
		}
	})

	t.Run("values are trimmed", func(t *testing.T) {
		spaced := valid
		spaced.Name = "  Budi  "
		out, err := ValidateContact(spaced)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.Name != "Budi" {
			t.Fatalf("expected trimmed name, got %q", out.Name)
		}
	})
}

func TestValidateProject(t *testing.T) {
	base := ProjectInput{
		Project: model.Project{
			Title:            "LedgerFlow",
			ShortDescription: "Aplikasi akuntansi berbasis web.",
			Status:           "completed",
		},
	}

	t.Run("slug is derived from the title", func(t *testing.T) {
		out, err := ValidateProject(base)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if out.Project.Slug != "ledgerflow" {
			t.Fatalf("expected derived slug, got %q", out.Project.Slug)
		}
	})

	t.Run("invalid status is rejected", func(t *testing.T) {
		bad := base
		bad.Project.Status = "done"
		if _, err := ValidateProject(bad); err == nil {
			t.Fatal("expected invalid status to be rejected")
		}
	})

	t.Run("javascript URL is rejected", func(t *testing.T) {
		bad := base
		repo := "javascript:alert(1)"
		bad.Project.RepositoryURL = &repo
		if _, err := ValidateProject(bad); err == nil {
			t.Fatal("expected non-http URL to be rejected")
		}
	})

	t.Run("missing title is rejected", func(t *testing.T) {
		bad := base
		bad.Project.Title = "   "
		if _, err := ValidateProject(bad); err == nil {
			t.Fatal("expected missing title to be rejected")
		}
	})

	t.Run("out of range year is rejected", func(t *testing.T) {
		bad := base
		year := 1200
		bad.Project.Year = &year
		if _, err := ValidateProject(bad); err == nil {
			t.Fatal("expected out-of-range year to be rejected")
		}
	})
}

func TestValidateEducation(t *testing.T) {
	t.Run("end year before start year is rejected", func(t *testing.T) {
		start, end := 2025, 2024
		edu := model.Education{Institution: "Universitas Nasional Pasim", StartYear: &start, EndYear: &end}
		if _, err := ValidateEducation(edu); err == nil {
			t.Fatal("expected reversed years to be rejected")
		}
	})

	t.Run("valid education passes", func(t *testing.T) {
		start, end := 2020, 2024
		edu := model.Education{Institution: "SMKS Swadaya", StartYear: &start, EndYear: &end}
		if _, err := ValidateEducation(edu); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
	})
}

func TestHashIP(t *testing.T) {
	if HashIP("") != "" {
		t.Fatal("expected empty hash for empty ip")
	}
	first := HashIP("203.0.113.5")
	second := HashIP("203.0.113.5")
	if first != second {
		t.Fatal("expected hashing to be deterministic")
	}
	if len(first) != 32 {
		t.Fatalf("expected 32-char hash, got %d", len(first))
	}
	if strings.Contains(first, "203.0.113.5") {
		t.Fatal("expected hash not to contain the raw ip")
	}
}
