package event

import (
	"net/http"
	"strings"
	"testing"
)

const chromeUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
	"(KHTML, like Gecko) Chrome/120 Safari/537.36"

func testBeacon() *Beacon {
	return &Beacon{
		N: "pageview",
		U: "https://example.com/pricing?utm_source=hn",
		D: "example.com",
		R: "https://news.ycombinator.com/",
	}
}

func testCtx(salt string) RequestContext {
	h := http.Header{}
	h.Set("X-Forwarded-For", "203.0.113.7")
	h.Set("Cf-Ipcountry", "DE")
	return RequestContext{Header: h, UserAgent: chromeUA, Salt: salt, SiteID: 42}
}

func TestBuildRow_DerivedColumns(t *testing.T) {
	row := BuildRow(testBeacon(), testCtx("day-1"))
	checks := map[string]struct{ got, want string }{
		"hostname":   {row.Hostname, "example.com"},
		"pathname":   {row.Pathname, "/pricing"},
		"referrer":   {row.ReferrerSource, "Hacker News"},
		"utm_source": {row.UTMSource, "hn"},
		"country":    {row.CountryCode, "DE"},
		"browser":    {row.Browser, "Chrome"},
		"device":     {row.Device, DeviceDesktop},
	}
	for name, c := range checks {
		if c.got != c.want {
			t.Errorf("%s = %q, want %q", name, c.got, c.want)
		}
	}
	if row.SiteID != 42 {
		t.Errorf("site_id = %d, want 42", row.SiteID)
	}
}

func TestBuildRow_NoPII(t *testing.T) {
	row := BuildRow(testBeacon(), testCtx("day-1"))
	// The IP and raw UA must never survive onto the stored row.
	fields := strings.Join([]string{
		row.Hostname, row.Pathname, row.Referrer, row.ReferrerSource,
		row.Browser, row.BrowserVersion, row.OS, row.OSVersion, row.Device,
		row.CountryCode, row.Region, row.City,
	}, " ")
	if strings.Contains(fields, "203.0.113.7") {
		t.Error("stored row contains the client IP")
	}
	if strings.Contains(fields, "Mozilla") {
		t.Error("stored row contains the raw User-Agent")
	}
}

func TestBuildRow_VisitorHashRotates(t *testing.T) {
	a := BuildRow(testBeacon(), testCtx("day-1"))
	b := BuildRow(testBeacon(), testCtx("day-1"))
	c := BuildRow(testBeacon(), testCtx("day-2"))
	if a.VisitorID != b.VisitorID {
		t.Error("same salt should produce a stable visitor hash")
	}
	if a.VisitorID == c.VisitorID {
		t.Error("different salt (day) should produce a different visitor hash")
	}
	if a.VisitorID == 0 {
		t.Error("visitor hash should be non-zero")
	}
}

func TestIsBot(t *testing.T) {
	if !IsBot("") {
		t.Error("empty UA should be treated as a bot")
	}
	if !IsBot("Googlebot/2.1 (+http://www.google.com/bot.html)") {
		t.Error("Googlebot should be detected")
	}
	if IsBot(chromeUA) {
		t.Error("Chrome should not be a bot")
	}
}
