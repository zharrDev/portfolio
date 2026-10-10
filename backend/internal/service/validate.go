// Package service holds business logic, validation, and external integrations.
package service

import (
	"fmt"
	"net/mail"
	"net/url"
	"regexp"
	"strings"
	"unicode/utf8"
)

// ValidationError carries per-field messages so handlers can return a helpful
// JSON body without leaking internal details.
type ValidationError struct {
	Fields map[string]string
}

func (e *ValidationError) Error() string {
	return "validasi gagal"
}

// NewValidationError builds a ValidationError from a field map.
func NewValidationError(fields map[string]string) *ValidationError {
	return &ValidationError{Fields: fields}
}

type validator struct {
	errs map[string]string
}

func newValidator() *validator {
	return &validator{errs: map[string]string{}}
}

func (v *validator) add(field, message string) {
	if _, exists := v.errs[field]; !exists {
		v.errs[field] = message
	}
}

func (v *validator) required(field, value string) {
	if strings.TrimSpace(value) == "" {
		v.add(field, fmt.Sprintf("%s wajib diisi.", field))
	}
}

func (v *validator) maxLen(field, value string, max int) {
	if utf8.RuneCountInString(value) > max {
		v.add(field, fmt.Sprintf("%s maksimal %d karakter.", field, max))
	}
}

func (v *validator) email(field, value string) {
	if strings.TrimSpace(value) == "" {
		return
	}
	if _, err := mail.ParseAddress(value); err != nil {
		v.add(field, "Format email tidak valid.")
	}
}

func (v *validator) optionalURL(field, value string) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return
	}
	parsed, err := url.Parse(trimmed)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" {
		v.add(field, "URL harus diawali http:// atau https:// dan berisi host yang valid.")
	}
}

func (v *validator) oneOf(field, value string, allowed []string) {
	if value == "" {
		return
	}
	for _, candidate := range allowed {
		if value == candidate {
			return
		}
	}
	v.add(field, fmt.Sprintf("%s tidak dikenali.", field))
}

func (v *validator) done() error {
	if len(v.errs) == 0 {
		return nil
	}
	return NewValidationError(v.errs)
}

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

// Slugify converts arbitrary text into a URL-friendly slug.
func Slugify(value string) string {
	lower := strings.ToLower(strings.TrimSpace(value))
	var b strings.Builder
	lastDash := false
	for _, r := range lower {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			lastDash = false
		default:
			if !lastDash && b.Len() > 0 {
				b.WriteRune('-')
				lastDash = true
			}
		}
	}
	return strings.Trim(b.String(), "-")
}

// IsValidSlug reports whether a slug satisfies the URL pattern.
func IsValidSlug(slug string) bool {
	return slugPattern.MatchString(slug)
}

// ptr returns a pointer to a trimmed string, or nil when empty.
func ptr(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

// deref reads a *string as a trimmed string.
func deref(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func ptrInt(value *int) *int {
	if value == nil {
		return nil
	}
	if *value == 0 {
		return nil
	}
	return value
}
