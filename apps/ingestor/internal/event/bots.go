package event

import (
	"regexp"
	"strings"
)

// botPattern matches crawler/automation/AI-scraper User-Agents (including ones
// that spoof a "Mozilla/" prefix, like GPTBot/ClaudeBot/Applebot). Generic
// tokens (bot/crawl/spider) catch the long tail of named crawlers.
var botPattern = regexp.MustCompile(`(?i)bot|crawl|spider|slurp|mediapartners|` +
	`bingpreview|facebookexternalhit|whatsapp|telegram|discord|slack|embedly|` +
	`quora link preview|pinterest|skypeuripreview|` +
	// AI / LLM scrapers
	`gptbot|oai-searchbot|chatgpt|claudebot|claude-web|anthropic|ccbot|` +
	`perplexity|google-extended|bytespider|amazonbot|applebot|` +
	// SEO / monitoring crawlers
	`ahrefs|semrush|mj12|dotbot|petalbot|dataforseo|screaming frog|` +
	`lighthouse|gtmetrix|pingdom|uptimerobot|statuscake|headless|phantomjs|` +
	`puppeteer|playwright|selenium|` +
	// HTTP libraries / tools
	`wget|curl|python-requests|python-urllib|aiohttp|httpx|go-http-client|java/|` +
	`okhttp|axios|node-fetch|got\b|guzzlehttp|libwww-perl|apache-httpclient|` +
	`scrapy|dart:io|ruby|powershell`)

// IsBot reports whether a request looks like a bot and should not be counted.
// Two layers: (1) anything that doesn't present as a real browser (no UA, or no
// "Mozilla/" prefix — which every mainstream browser sends) is treated as
// automation; (2) the pattern catches crawlers that spoof a browser prefix.
func IsBot(userAgent string) bool {
	if userAgent == "" {
		return true
	}
	if !strings.HasPrefix(userAgent, "Mozilla/") {
		return true
	}
	return botPattern.MatchString(userAgent)
}
