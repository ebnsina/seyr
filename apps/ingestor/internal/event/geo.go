package event

import (
	"net/http"
	"strings"
)

// GeoInfo is derived from the client IP by a fronting CDN/proxy and passed as a
// header — so we read the header and never touch the raw IP for geo. region/city
// via a MaxMind GeoLite2 reader is a drop-in addition here.
type GeoInfo struct {
	CountryCode string // ISO-3166 alpha-2, or "" if unknown
	Region      string
	City        string
}

var countryHeaders = []string{
	"Cf-Ipcountry",             // Cloudflare
	"X-Vercel-Ip-Country",      // Vercel
	"X-Country-Code",           //
	"Fastly-Geoip-Countrycode", // Fastly
}

// ResolveGeo extracts geo data from request headers.
func ResolveGeo(h http.Header) GeoInfo {
	country := ""
	for _, key := range countryHeaders {
		v := h.Get(key)
		if len(v) == 2 && v != "XX" {
			country = strings.ToUpper(v)
			break
		}
	}
	return GeoInfo{
		CountryCode: country,
		Region:      h.Get("X-Vercel-Ip-Country-Region"),
		City:        h.Get("X-Vercel-Ip-City"),
	}
}

// ClientIP extracts the client IP from common proxy headers. Used transiently
// for the visitor hash only; never stored.
func ClientIP(h http.Header) string {
	if fwd := h.Get("X-Forwarded-For"); fwd != "" {
		first, _, _ := strings.Cut(fwd, ",")
		return strings.TrimSpace(first)
	}
	if ip := h.Get("Cf-Connecting-Ip"); ip != "" {
		return ip
	}
	if ip := h.Get("X-Real-Ip"); ip != "" {
		return ip
	}
	return "0.0.0.0"
}
