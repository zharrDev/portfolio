package service

import (
	"testing"

	"github.com/zharrDev/portfolio/backend/internal/model"
)

func strPtr(value string) *string { return &value }

func TestNormalizeLocale(t *testing.T) {
	cases := map[string]string{
		"":       LocaleID,
		"id":     LocaleID,
		"ID":     LocaleID,
		"id-ID":  LocaleID,
		"en":     LocaleEN,
		"EN":     LocaleEN,
		"en-US":  LocaleEN,
		"en_US":  LocaleEN,
		"  en  ": LocaleEN,
		"fr":     LocaleID,
		"de-DE":  LocaleID,
		"banana": LocaleID,
	}
	for input, want := range cases {
		if got := NormalizeLocale(input); got != want {
			t.Errorf("NormalizeLocale(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestLocaliseSwapsEnglishFields(t *testing.T) {
	p := model.Profile{
		Headline:      "Backend & Web Developer",
		HeadlineEN:    strPtr("Backend & Web Developer"),
		Subheadline:   strPtr("Akuntan yang suka ngoding"),
		SubheadlineEN: strPtr("An accountant who codes"),
		About:         strPtr("Saya belajar dengan membangun proyek."),
		AboutEN:       strPtr("I learn by building projects."),
		// BioEN deliberately left nil — must fall back to Indonesian.
		Bio: strPtr("Teks bio berbahasa Indonesia."),
	}

	Localise(LocaleEN, &p)

	if p.Headline != "Backend & Web Developer" {
		t.Errorf("headline = %q, want the English value", p.Headline)
	}
	if p.Subheadline == nil || *p.Subheadline != "An accountant who codes" {
		t.Errorf("subheadline = %v, want the English value", p.Subheadline)
	}
	if p.About == nil || *p.About != "I learn by building projects." {
		t.Errorf("about = %v, want the English value", p.About)
	}
	if p.Bio == nil || *p.Bio != "Teks bio berbahasa Indonesia." {
		t.Errorf("bio fell back incorrectly: %v", p.Bio)
	}
}

func TestLocaliseLeavesIndonesianUntouched(t *testing.T) {
	p := model.Profile{
		Headline:   "Backend & Web Developer",
		HeadlineEN: strPtr("Backend & Web Developer"),
	}

	Localise(LocaleID, &p)

	if p.Headline != "Backend & Web Developer" {
		t.Errorf("Indonesian locale must not swap fields, got %q", p.Headline)
	}

	// An unknown locale must behave like the default, not panic.
	Localise("fr", &p)
	if p.Headline != "Backend & Web Developer" {
		t.Errorf("unknown locale must not swap fields, got %q", p.Headline)
	}
}

func TestLocaliseKeepsSourceDataIntact(t *testing.T) {
	// Handlers serialise a copy; the stored Indonesian text must survive so a
	// later Indonesian request still sees it.
	original := model.Project{
		Title:              "LedgerFlow",
		TitleEN:            strPtr("LedgerFlow"),
		ShortDescription:   "Aplikasi web akuntansi.",
		ShortDescriptionEN: strPtr("A web accounting application."),
	}

	copyOf := original
	Localise(LocaleEN, &copyOf)

	if copyOf.ShortDescription != "A web accounting application." {
		t.Errorf("copy should be English, got %q", copyOf.ShortDescription)
	}
	if original.ShortDescription != "Aplikasi web akuntansi." {
		t.Errorf("source data was mutated: %q", original.ShortDescription)
	}
}

func TestLocaliseWorksOnSlices(t *testing.T) {
	skills := []model.Skill{
		{Name: "Midtrans (Sandbox)", Note: strPtr("Gerbang pembayaran sandbox"), NoteEN: strPtr("Sandbox payment gateway")},
		{Name: "PostgreSQL", Note: nil},
	}

	Localise(LocaleEN, skills)

	if skills[0].Note == nil || *skills[0].Note != "Sandbox payment gateway" {
		t.Errorf("slice element was not localised: %v", skills[0].Note)
	}
	if skills[1].Note != nil {
		t.Errorf("nil English value must stay nil, got %v", skills[1].Note)
	}
	if skills[1].Name != "PostgreSQL" {
		t.Errorf("untouched field changed: %q", skills[1].Name)
	}
}

func TestLocaliseHandlesEmptyAndNil(t *testing.T) {
	// Nil values must be no-ops rather than panics.
	Localise(LocaleEN, nil)
	Localise(LocaleEN, (*model.Project)(nil))
	Localise(LocaleEN, []model.Experience{})
	Localise(LocaleEN, model.Certificate{Name: "Tanpa Terjemahan"})

	var empty string
	c := model.Certificate{Name: "Sertifikat", NameEN: &empty}
	Localise(LocaleEN, &c)
	if c.Name != "Sertifikat" {
		t.Errorf("empty English string must fall back, got %q", c.Name)
	}
}

func TestLocaliseCoversEveryTranslatedEntity(t *testing.T) {
	// One case per entity that carries an i18n tag, so adding a new translated
	// field without covering it here is a deliberate choice.
	projects := []model.Project{{
		Title: "Judul", TitleEN: strPtr("Title"),
		Problem: strPtr("Masalah"), ProblemEN: strPtr("Problem"),
		Goals: strPtr("Tujuan"), GoalsEN: strPtr("Goals"),
		MainFeatures: strPtr("Fitur"), MainFeaturesEN: strPtr("Features"),
		Challenges: strPtr("Tantangan"), ChallengesEN: strPtr("Challenges"),
		Learnings: strPtr("Pelajaran"), LearningsEN: strPtr("Learnings"),
		Description: strPtr("Deskripsi"), DescriptionEN: strPtr("Description"),
	}}
	Localise(LocaleEN, projects)
	p := projects[0]
	if p.Title != "Title" {
		t.Errorf("project.title = %q, want the English value", p.Title)
	}
	for field, got := range map[string]string{
		"problem":       *p.Problem,
		"goals":         *p.Goals,
		"main_features": *p.MainFeatures,
		"challenges":    *p.Challenges,
		"learnings":     *p.Learnings,
		"description":   *p.Description,
	} {
		if got == "" {
			t.Errorf("project.%s was not localised", field)
		}
	}

	educations := []model.Education{{
		Institution: "Kampus", Degree: strPtr("S1"), DegreeEN: strPtr("Bachelor"),
		Major: strPtr("Akuntansi"), MajorEN: strPtr("Accounting"),
		Description: strPtr("Deskripsi"), DescriptionEN: strPtr("Description"),
	}}
	Localise(LocaleEN, educations)
	e := educations[0]
	if *e.Degree != "Bachelor" || *e.Major != "Accounting" || *e.Description != "Description" {
		t.Errorf("education not localised: %+v", e)
	}

	experiences := []model.Experience{{
		Organization: "Org", Role: "Staf", RoleEN: strPtr("Staff"),
		Description: strPtr("Tugas"), DescriptionEN: strPtr("Duties"),
	}}
	Localise(LocaleEN, experiences)
	x := experiences[0]
	if x.Role != "Staff" || *x.Description != "Duties" {
		t.Errorf("experience not localised: %+v", x)
	}
}
