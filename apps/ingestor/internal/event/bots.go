package event

import "regexp"

// botPattern matches common crawler/automation User-Agents. This is a pragmatic
// MVP filter (a superset of the obvious offenders); higher-fidelity bot
// detection is a later refinement — see the plan's polish phase.
var botPattern = regexp.MustCompile(`(?i)bot|crawl|spider|slurp|mediapartners|` +
	`bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|` +
	`headless|phantomjs|puppeteer|playwright|selenium|` +
	`wget|curl|python-requests|python-urllib|go-http-client|java/|okhttp|axios|` +
	`apache-httpclient|libwww-perl|lighthouse|gtmetrix|pingdom|uptimerobot`)

// IsBot reports whether a request looks like a bot and should not be counted.
// An empty UA is treated as a bot (almost always automation).
func IsBot(userAgent string) bool {
	if userAgent == "" {
		return true
	}
	return botPattern.MatchString(userAgent)
}
