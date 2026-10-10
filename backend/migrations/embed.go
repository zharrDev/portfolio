// Package migrations embeds the SQL migration files so they ship inside the
// binary and can be applied at startup.
package migrations

import "embed"

// FS holds every migration file, applied in filename order.
//
//go:embed *.sql
var FS embed.FS
