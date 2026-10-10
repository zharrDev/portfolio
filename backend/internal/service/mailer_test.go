package service

import (
	"bufio"
	"net"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/zharrDev/portfolio/backend/internal/config"
)

func TestMailerDisabledSkipsSend(t *testing.T) {
	mailer := NewMailer(&config.Config{})
	if mailer.Enabled() {
		t.Fatal("mailer should be disabled when SMTP_HOST is empty")
	}
	if err := mailer.Send("someone@example.com", "subject", "body"); err != nil {
		t.Fatalf("disabled mailer should be a no-op, got %v", err)
	}
}

func TestMailerHeadersAreSanitised(t *testing.T) {
	mailer := NewMailer(&config.Config{SMTPHost: "smtp.example.com", SMTPFrom: "no-reply@dzhar.dev"})
	if !mailer.Enabled() {
		t.Fatal("mailer should be enabled when SMTP_HOST is set")
	}

	message := string(mailer.BuildMessage("a@b.com", "Hello\r\nBcc: evil@example.com", "body"))

	// The security property is that CRLF cannot introduce a new header line:
	// the injected text must stay on the Subject line instead of becoming its
	// own header.
	if strings.Contains(message, "\r\nBcc:") || strings.Contains(message, "\nBcc:") {
		t.Fatal("header injection was not stripped")
	}
	for _, line := range strings.Split(message, "\r\n") {
		if strings.HasPrefix(line, "Bcc:") {
			failing := line
			t.Fatalf("injected header line present: %q", failing)
		}
	}
	if !strings.Contains(message, "Subject: Hello") {
		t.Fatal("expected the sanitised subject on the Subject line")
	}
	if !strings.Contains(message, "Content-Type: text/plain") {
		t.Fatal("expected a plain-text content type")
	}
	if !strings.HasSuffix(message, "body") {
		t.Fatal("expected the body to be appended after a blank line")
	}
}

func TestMailerRejectsEmptyRecipient(t *testing.T) {
	mailer := NewMailer(&config.Config{SMTPHost: "smtp.example.com", SMTPFrom: "no-reply@dzhar.dev"})
	if err := mailer.Send("  ", "subject", "body"); err == nil {
		t.Fatal("expected an error for an empty recipient")
	}
}

func TestMailerSendsOverSMTP(t *testing.T) {
	received := make(chan string, 1)

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	defer listener.Close()

	go func() {
		conn, err := listener.Accept()
		if err != nil {
			return
		}
		defer conn.Close()

		reader := bufio.NewReader(conn)
		write := func(line string) { _, _ = conn.Write([]byte(line + "\r\n")) }

		write("220 test.local ESMTP")
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				return
			}
			command := strings.ToUpper(strings.TrimSpace(line))
			switch {
			case strings.HasPrefix(command, "EHLO"), strings.HasPrefix(command, "HELO"):
				write("250-test.local")
				write("250 OK")
			case strings.HasPrefix(command, "MAIL FROM"), strings.HasPrefix(command, "RCPT TO"):
				write("250 OK")
			case strings.HasPrefix(command, "DATA"):
				write("354 End data with <CR><LF>.<CR><LF>")
				var body strings.Builder
				for {
					dataLine, err := reader.ReadString('\n')
					if err != nil {
						return
					}
					if strings.TrimSpace(dataLine) == "." {
						break
					}
					body.WriteString(dataLine)
				}
				received <- body.String()
				write("250 OK: queued")
			case strings.HasPrefix(command, "QUIT"):
				write("221 Bye")
				return
			default:
				write("250 OK")
			}
		}
	}()

	host, portStr, _ := net.SplitHostPort(listener.Addr().String())
	port, err := strconv.Atoi(portStr)
	if err != nil {
		t.Fatalf("parse port: %v", err)
	}

	// PlainAuth only permits unencrypted connections to localhost, which is
	// exactly the case here.
	mailer := NewMailer(&config.Config{
		SMTPHost: host,
		SMTPPort: port,
		SMTPFrom: "no-reply@dzhar.dev",
	})

	if err := mailer.Send("owner@dzhar.dev", "[Dzhar.dev] Test", "halo dunia"); err != nil {
		t.Fatalf("send failed: %v", err)
	}

	select {
	case body := <-received:
		if !strings.Contains(body, "halo dunia") {
			t.Fatalf("message body missing, got %q", body)
		}
		if !strings.Contains(body, "To: owner@dzhar.dev") {
			t.Fatalf("recipient header missing, got %q", body)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("timed out waiting for the SMTP message")
	}
}
