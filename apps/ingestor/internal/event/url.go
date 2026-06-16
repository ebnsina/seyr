package event

import (
	"net/url"
	"strings"
)

// ParsedURL holds the stored components extracted from a page URL.
type ParsedURL struct {
	Hostname    string
	Pathname    string
	UTMSource   string
	UTMMedium   string
	UTMCampaign string
}

func stripWWW(host string) string {
	return strings.TrimPrefix(host, "www.")
}

func normalizePath(p string) string {
	if len(p) > 1 {
		p = strings.TrimSuffix(p, "/")
	}
	if p == "" {
		return "/"
	}
	return p
}

func clampParam(v string) string {
	if len(v) > 200 {
		return v[:200]
	}
	return v
}

// ParseURL breaks an absolute page URL into stored components plus UTM tags.
func ParseURL(raw string) ParsedURL {
	u, err := url.Parse(raw)
	if err != nil || !u.IsAbs() {
		return ParsedURL{Pathname: "/"}
	}
	q := u.Query()
	return ParsedURL{
		Hostname:    stripWWW(u.Hostname()),
		Pathname:    normalizePath(u.Path),
		UTMSource:   clampParam(q.Get("utm_source")),
		UTMMedium:   clampParam(q.Get("utm_medium")),
		UTMCampaign: clampParam(q.Get("utm_campaign")),
	}
}

// knownSources maps a referrer host substring to a friendly source name.
var knownSources = []struct{ needle, name string }{
	{"google.", "Google"}, {"bing.", "Bing"}, {"duckduckgo.", "DuckDuckGo"},
	{"yahoo.", "Yahoo"}, {"yandex.", "Yandex"}, {"baidu.", "Baidu"},
	{"t.co", "Twitter"}, {"twitter.", "Twitter"}, {"x.com", "Twitter"},
	{"facebook.", "Facebook"}, {"instagram.", "Instagram"},
	{"linkedin.", "LinkedIn"}, {"lnkd.in", "LinkedIn"}, {"reddit.", "Reddit"},
	{"youtube.", "YouTube"}, {"github.", "GitHub"},
	{"news.ycombinator.com", "Hacker News"}, {"producthunt.", "Product Hunt"},
}

// ClassifyReferrer turns a referrer URL into a friendly source name, or the bare
// host for unknown sources. Empty and self-referrals collapse to "Direct".
func ClassifyReferrer(referrer, currentHostname string) string {
	if referrer == "" {
		return "Direct"
	}
	u, err := url.Parse(referrer)
	if err != nil {
		return "Direct"
	}
	host := stripWWW(u.Hostname())
	if host == "" || host == stripWWW(currentHostname) {
		return "Direct"
	}
	for _, s := range knownSources {
		if host == s.needle || strings.Contains(host, s.needle) {
			return s.name
		}
	}
	return host
}
