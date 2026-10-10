package service

import (
	"fmt"
	"net/smtp"
	"strings"

	"github.com/zharrDev/portfolio/backend/internal/config"
)

// Mailer sends optional contact notifications over SMTP.
//
// When SMTP_HOST is not configured the mailer is disabled and every Send is a
// no-op — contact messages are always stored in PostgreSQL regardless.
type Mailer struct {
	host     string
	port     int
	username string
	password string
	from     string
	enabled  bool
}

// NewMailer builds a mailer from configuration.
func NewMailer(cfg *config.Config) *Mailer {
	return &Mailer{
		host:     cfg.SMTPHost,
		port:     cfg.SMTPPort,
		username: cfg.SMTPUsername,
		password: cfg.SMTPPassword,
		from:     cfg.SMTPFrom,
		enabled:  cfg.EmailEnabled(),
	}
}

// Enabled reports whether SMTP is configured.
func (m *Mailer) Enabled() bool { return m.enabled }

// BuildMessage renders a simple RFC 5322 message with sanitised headers.
func (m *Mailer) BuildMessage(to, subject, body string) []byte {
	var builder strings.Builder
	builder.WriteString("From: " + sanitizeHeader(m.from) + "\r\n")
	builder.WriteString("To: " + sanitizeHeader(to) + "\r\n")
	builder.WriteString("Subject: " + sanitizeHeader(subject) + "\r\n")
	builder.WriteString("MIME-Version: 1.0\r\n")
	builder.WriteString("Content-Type: text/plain; charset=\"utf-8\"\r\n")
	builder.WriteString("\r\n")
	builder.WriteString(body)
	return []byte(builder.String())
}

// Send delivers a message. It is a no-op when the mailer is disabled.
func (m *Mailer) Send(to, subject, body string) error {
	if !m.enabled {
		return nil
	}
	if strings.TrimSpace(to) == "" {
		return fmt.Errorf("mailer: recipient is empty")
	}

	address := fmt.Sprintf("%s:%d", m.host, m.port)

	var auth smtp.Auth
	if m.username != "" {
		auth = smtp.PlainAuth("", m.username, m.password, m.host)
	}

	return smtp.SendMail(address, auth, m.from, []string{to}, m.BuildMessage(to, subject, body))
}

// sanitizeHeader strips CR/LF so user-supplied values cannot inject headers.
func sanitizeHeader(value string) string {
	replacer := strings.NewReplacer("\r", " ", "\n", " ", "\t", " ")
	return strings.TrimSpace(replacer.Replace(value))
}
