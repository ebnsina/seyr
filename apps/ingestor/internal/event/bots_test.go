package event

import "testing"

func TestIsBot_RealBrowsersPass(t *testing.T) {
	humans := []string{
		// Desktop Chrome
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		// iPhone Safari
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
		// Firefox
		"Mozilla/5.0 (Windows NT 10.0; rv:121.0) Gecko/20100101 Firefox/121.0",
		// Edge
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
		// Android Chrome
		"Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
	}
	for _, ua := range humans {
		if IsBot(ua) {
			t.Errorf("real browser flagged as bot: %q", ua)
		}
	}
}

func TestIsBot_BotsCaught(t *testing.T) {
	bots := []string{
		"",
		"curl/8.4.0",
		"python-requests/2.31.0",
		"node-fetch/1.0",
		"Go-http-client/2.0",
		"Scrapy/2.11 (+https://scrapy.org)",
		"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
		"Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
		"Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)",
		"Mozilla/5.0 (compatible; ClaudeBot/1.0; +https://www.anthropic.com)",
		"Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
		"Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)",
		"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
		"Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)",
		"facebookexternalhit/1.1",
	}
	for _, ua := range bots {
		if !IsBot(ua) {
			t.Errorf("bot NOT caught: %q", ua)
		}
	}
}
