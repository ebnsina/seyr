package event

import (
	"crypto/sha256"
	"encoding/binary"
)

// hash64 returns a deterministic 64-bit hash of the input, suitable for a
// ClickHouse UInt64 column (first 8 bytes of SHA-256, big-endian).
func hash64(input string) uint64 {
	sum := sha256.Sum256([]byte(input))
	return binary.BigEndian.Uint64(sum[:8])
}
