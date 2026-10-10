package service

import (
	"reflect"
	"strings"
)

// LocaleID and LocaleEN are the two locales the site ships with. Indonesian is
// the source language and the fallback: an untranslated field simply stays as
// it is stored.
const (
	LocaleID = "id"
	LocaleEN = "en"
)

// Locales lists every supported locale, in display order.
var Locales = []string{LocaleID, LocaleEN}

// NormalizeLocale maps any incoming value (query param, header) onto a locale
// we actually support. Unknown values fall back to Indonesian rather than
// erroring, so a stale bookmark never breaks a page.
func NormalizeLocale(raw string) string {
	value := strings.ToLower(strings.TrimSpace(raw))
	if value == "" {
		return LocaleID
	}
	// Accept regional variants such as "en-US" or "en_US".
	base := value
	for i, r := range value {
		if r == '-' || r == '_' {
			base = value[:i]
			break
		}
	}
	for _, locale := range Locales {
		if base == locale {
			return locale
		}
	}
	return LocaleID
}

// Localise applies the requested locale to a record or a listing in place.
//
// It copies `<field>EN` over `<field>` on every struct it reaches, but only
// for the English locale and only where the English value is actually filled
// in — an untranslated field keeps its Indonesian text instead of going blank.
//
// The swap happens on the value the handler is about to serialise, so the
// stored data is never mutated and a later Indonesian request is unaffected.
func Localise(locale string, v any) {
	if locale != LocaleEN || v == nil {
		return
	}
	applyLocalise(locale, reflect.ValueOf(v))
}

func applyLocalise(locale string, rv reflect.Value) {
	if !rv.IsValid() {
		return
	}

	// Unwrap slices and arrays (list endpoints).
	if rv.Kind() == reflect.Slice || rv.Kind() == reflect.Array {
		// A []byte is data, not a list of entities.
		if rv.Kind() == reflect.Slice && rv.Type().Elem().Kind() == reflect.Uint8 {
			return
		}
		for i := 0; i < rv.Len(); i++ {
			applyLocalise(locale, rv.Index(i))
		}
		return
	}

	if rv.Kind() == reflect.Ptr {
		if rv.IsNil() {
			return
		}
		applyLocalise(locale, rv.Elem())
		return
	}

	if rv.Kind() != reflect.Struct {
		return
	}

	applyLocaliseStruct(locale, rv)
}

func applyLocaliseStruct(locale string, rv reflect.Value) {
	rt := rv.Type()
	for i := 0; i < rt.NumField(); i++ {
		field := rt.Field(i)
		if !field.IsExported() {
			continue
		}

		// Recurse into embedded/nested structs so a wrapper type works too.
		if field.Tag.Get("i18n") == "" {
			if field.Type.Kind() == reflect.Struct {
				applyLocalise(locale, rv.Field(i))
			}
			continue
		}

		alt := rv.FieldByName(field.Tag.Get("i18n"))
		if !alt.IsValid() || alt.Kind() != reflect.Ptr || alt.IsNil() {
			continue
		}
		translated := alt.Elem()
		if translated.Kind() != reflect.String || translated.String() == "" {
			continue
		}

		base := rv.Field(i)
		switch base.Kind() {
		case reflect.String:
			base.SetString(translated.String())
		case reflect.Ptr:
			if base.IsNil() {
				base.Set(reflect.New(base.Type().Elem()))
			}
			if base.Elem().Kind() == reflect.String {
				base.Elem().SetString(translated.String())
			}
		}
	}
}
