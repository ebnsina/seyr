package event

import (
	"crypto/sha256"
	"encoding/hex"
	"time"
)

// SaltManager derives a daily-rotating salt from a server secret plus the UTC
// date. The salt rotates every 24h (a visitor cannot be linked across days) yet
// is stable within a day even across restarts (no fragmented visitors mid-day).
//
// Privacy trade-off: deriving from a secret means past days are reconstructable
// if the secret leaks. For stronger guarantees, swap for a random salt persisted
// in a shared store (e.g. Redis) rotated on a cron — the interface is unchanged.
type SaltManager struct {
	secret string
}

// NewSaltManager creates a SaltManager bound to the given secret.
func NewSaltManager(secret string) *SaltManager {
	return &SaltManager{secret: secret}
}

// Current returns the salt for the given moment (UTC day).
func (s *SaltManager) Current(now time.Time) string {
	day := now.UTC().Format("2006-01-02")
	sum := sha256.Sum256([]byte(s.secret + "|" + day))
	return hex.EncodeToString(sum[:])
}
