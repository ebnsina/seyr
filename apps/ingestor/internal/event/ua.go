package event

import (
	"strings"

	"github.com/mileusna/useragent"
)

// Device buckets we store.
const (
	DeviceDesktop = "desktop"
	DeviceMobile  = "mobile"
	DeviceTablet  = "tablet"
)

// DeviceInfo is the device data derived from a User-Agent. The UA itself is
// discarded after this.
type DeviceInfo struct {
	Browser        string
	BrowserVersion string
	OS             string
	OSVersion      string
	Device         string
}

func majorVersion(v string) string {
	major, _, _ := strings.Cut(v, ".")
	return major
}

// ParseUserAgent parses a UA string into stored device columns.
func ParseUserAgent(ua string) DeviceInfo {
	r := useragent.Parse(ua)
	device := DeviceDesktop
	switch {
	case r.Tablet:
		device = DeviceTablet
	case r.Mobile:
		device = DeviceMobile
	}
	return DeviceInfo{
		Browser:        r.Name,
		BrowserVersion: majorVersion(r.Version),
		OS:             r.OS,
		OSVersion:      r.OSVersion,
		Device:         device,
	}
}
