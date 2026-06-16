package event

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

// Validate checks a decoded beacon against the same rules as the zod schema on
// the TypeScript side. It returns an error describing the first problem found.
func (b *Beacon) Validate() error {
	b.N = strings.TrimSpace(b.N)
	if b.N == "" || len(b.N) > MaxEventNameLen {
		return fmt.Errorf("invalid event name")
	}
	b.U = strings.TrimSpace(b.U)
	if len(b.U) == 0 || len(b.U) > MaxURLLength {
		return fmt.Errorf("invalid url length")
	}
	if u, err := url.Parse(b.U); err != nil || !u.IsAbs() {
		return fmt.Errorf("url must be absolute")
	}
	b.D = strings.TrimSpace(b.D)
	if b.D == "" || len(b.D) > MaxDomainLength {
		return fmt.Errorf("invalid domain")
	}
	b.R = strings.TrimSpace(b.R)
	if len(b.R) > MaxURLLength {
		b.R = b.R[:MaxURLLength]
	}
	return nil
}

// NormalizeProps flattens custom props into bounded, stringified parallel arrays
// (the shape ClickHouse stores). Over-limit keys/values are dropped, not fatal.
func NormalizeProps(m map[string]any) (keys, values []string) {
	keys = []string{}
	values = []string{}
	for k, raw := range m {
		if len(keys) >= MaxProps {
			break
		}
		if len(k) > MaxPropKeyLength {
			k = k[:MaxPropKeyLength]
		}
		if k == "" {
			continue
		}
		v := stringifyProp(raw)
		if len(v) > MaxPropValueLen {
			v = v[:MaxPropValueLen]
		}
		keys = append(keys, k)
		values = append(values, v)
	}
	return keys, values
}

func stringifyProp(v any) string {
	switch t := v.(type) {
	case string:
		return t
	case bool:
		return strconv.FormatBool(t)
	case float64: // JSON numbers decode to float64
		return strconv.FormatFloat(t, 'f', -1, 64)
	default:
		return fmt.Sprintf("%v", t)
	}
}
