// Package event defines the beacon wire format, the derived ClickHouse row, and
// the pure pipeline that turns one into the other. It mirrors the contract in
// @seyr/shared (the TypeScript side) — keep the two in sync.
package event

import "time"

// Limits enforced on custom-event properties and field lengths at ingest time.
const (
	MaxProps         = 30
	MaxPropKeyLength = 100
	MaxPropValueLen  = 2000
	MaxEventNameLen  = 120
	MaxURLLength     = 2000
	MaxDomainLength  = 253
)

// Beacon is the terse JSON the tracker sends. Short keys keep the payload tiny:
//
//	n = event name        u = page URL (absolute)
//	d = registered domain r = referrer (absolute)
//	w = viewport width    m = custom props
type Beacon struct {
	N string         `json:"n"`
	U string         `json:"u"`
	D string         `json:"d"`
	R string         `json:"r"`
	W int            `json:"w"`
	M map[string]any `json:"m"`
}

// Row is a fully-derived event ready to insert into ClickHouse. IP and raw UA
// are intentionally absent: they are consumed transiently and never stored.
type Row struct {
	SiteID         uint64
	Timestamp      time.Time
	Name           string
	VisitorID      uint64
	SessionID      uint64
	Hostname       string
	Pathname       string
	Referrer       string
	ReferrerSource string
	UTMSource      string
	UTMMedium      string
	UTMCampaign    string
	CountryCode    string
	Region         string
	City           string
	Browser        string
	BrowserVersion string
	OS             string
	OSVersion      string
	Device         string
	PropKeys       []string
	PropValues     []string
}
