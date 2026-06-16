package event

import (
	"net/http"
	"time"
)

// RequestContext carries the per-request inputs the pipeline derives from.
type RequestContext struct {
	Header    http.Header
	UserAgent string
	Salt      string
	SiteID    uint64
	Now       time.Time
}

// BuildRow turns a validated beacon + request into a ClickHouse-ready row. All
// PII (IP, raw UA) is consumed here to derive the visitor hash, geo, and device,
// then dropped — none of it reaches the returned Row.
func BuildRow(b *Beacon, ctx RequestContext) Row {
	parsed := ParseURL(b.U)
	ip := ClientIP(ctx.Header)
	device := ParseUserAgent(ctx.UserAgent)
	geo := ResolveGeo(ctx.Header)
	keys, values := NormalizeProps(b.M)

	now := ctx.Now
	if now.IsZero() {
		now = time.Now()
	}

	// Daily-rotating, non-durable visitor identity. Domain is included so the
	// same person on two tracked sites never shares a hash.
	visitorID := hash64(ctx.Salt + "|" + ip + "|" + ctx.UserAgent + "|" + b.D)

	return Row{
		SiteID:    ctx.SiteID,
		Timestamp: now.UTC(),
		Name:      b.N,
		VisitorID: visitorID,
		// MVP: one session per visitor per day. A 30-min inactivity window is a
		// later refinement (see plan phase 6).
		SessionID:      visitorID,
		Hostname:       parsed.Hostname,
		Pathname:       parsed.Pathname,
		Referrer:       b.R,
		ReferrerSource: ClassifyReferrer(b.R, parsed.Hostname),
		UTMSource:      parsed.UTMSource,
		UTMMedium:      parsed.UTMMedium,
		UTMCampaign:    parsed.UTMCampaign,
		CountryCode:    geo.CountryCode,
		Region:         geo.Region,
		City:           geo.City,
		Browser:        device.Browser,
		BrowserVersion: device.BrowserVersion,
		OS:             device.OS,
		OSVersion:      device.OSVersion,
		Device:         device.Device,
		PropKeys:       keys,
		PropValues:     values,
	}
}
